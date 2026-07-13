import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

const HERMES_LOG = '/Volumes/HermesAgent/HermesAgentUSB/data/logs/gateway.log';
const HERMES_ENV = '/Volumes/HermesAgent/HermesAgentUSB/data/.env';

async function findGatewayProcess() {
  try {
    const { stdout } = await execAsync(`ps aux | grep "hermes_cli.main gateway" | grep -v grep | awk '{print $2","$9}' | head -1`);
    const parts = stdout.trim().split(',');
    const pid = parseInt(parts[0]);
    if (pid && !isNaN(pid)) {
      try { process.kill(pid, 0); return { pid, started: Date.now() }; } catch {}
    }
    return null;
  } catch { return null; }
}

function parseEnv(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    env[key] = val;
  }
  return env;
}

function getEnvValue(key: string): string | null {
  try {
    if (fs.existsSync(HERMES_ENV)) {
      return parseEnv(fs.readFileSync(HERMES_ENV, 'utf-8'))[key] || null;
    }
  } catch {}
  return null;
}

let chatTracking: { sentAt: number; message: string; found: boolean } | null = null;

export async function GET() {
  const proc = await findGatewayProcess();
  if (!proc) {
    return NextResponse.json({ success: true, running: false, message: 'Hermes gateway process not found', detection: 'process' });
  }
  let uptime = 0;
  try {
    const { stdout } = await execAsync(`ps -o etime= -p ${proc.pid} 2>/dev/null | tr -d ' '`);
    uptime = parseUptime(stdout.trim());
  } catch {}

  const recentLogs = await getGatewayLog(30);
  const parsedEntries = recentLogs.map(l => parseLogEntry(l)).filter(Boolean);
  const hasTelegram = parsedEntries.some(e => e?.type === 'status' && e.text.includes('telegram'));

  return NextResponse.json({
    success: true, running: true, pid: proc.pid, uptime, detection: 'process',
    connectedPlatforms: hasTelegram ? ['telegram'] : [],
    recentActivity: parsedEntries.slice(-10), logPath: HERMES_LOG,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action || '';

  if (action === 'send') {
    const message = body.message || '';
    if (!message.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 });
    const result = await sendTelegramMessage(message);
    return NextResponse.json(result);
  }

  if (action === 'chat') {
    const message = body.message || '';
    if (!message.trim()) return NextResponse.json({ error: 'message required' }, { status: 400 });
    chatTracking = { sentAt: Date.now(), message, found: false };

    const sendResult = await sendTelegramMessage(message);
    if (!sendResult.success) {
      chatTracking = null;
      return NextResponse.json({ success: false, error: sendResult.error || 'send failed' });
    }

    const response = await pollForResponse(message, 30, 3000);
    chatTracking = null;
    return NextResponse.json({ success: true, response });
  }

  if (action === 'chat-poll') {
    if (!chatTracking) return NextResponse.json({ success: true, status: 'idle' });
    const response = await pollForResponse(chatTracking.message, 5, 1000);
    if (response) {
      chatTracking.found = true;
      chatTracking = null;
      return NextResponse.json({ success: true, status: 'done', response });
    }
    return NextResponse.json({ success: true, status: 'waiting' });
  }

  if (action === 'logs') {
    const lines = Math.min(Math.max(body.lines || 50, 10), 200);
    const logLines = await getGatewayLog(lines);
    const parsed = logLines.map(l => parseLogEntry(l)).filter(Boolean);
    return NextResponse.json({ success: true, logs: parsed, raw: logLines.slice(-20) });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}

async function getGatewayLog(lines: number = 50): Promise<string[]> {
  try {
    if (!fs.existsSync(HERMES_LOG)) return [];
    const { stdout } = await execAsync(`tail -${lines} "${HERMES_LOG}" 2>/dev/null`);
    return stdout.trim().split('\n').filter(Boolean);
  } catch { return []; }
}

async function sendTelegramMessage(message: string) {
  const botToken = getEnvValue('TELEGRAM_BOT_TOKEN');
  const chatId = getEnvValue('TELEGRAM_ALLOWED_USERS') || '2077300493';
  if (!botToken) return { success: false, error: 'TELEGRAM_BOT_TOKEN not found' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return data.ok ? { success: true } : { success: false, error: data.description || 'Telegram API error' };
  } catch (e: any) { return { success: false, error: e.message }; }
}

async function pollForResponse(sentMessage: string, maxAttempts: number, intervalMs: number): Promise<string | null> {
  const sentLower = sentMessage.toLowerCase().slice(0, 50);
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, intervalMs));
    const logs = await getGatewayLog(50);
    for (const line of logs) {
      if (line.includes('response ready:') && logs.some(l => l.includes(sentLower) && l.includes('inbound message'))) {
        const match = line.match(/response=(\d+)/);
        if (match) return `Response generated (${match[1]} chars) — check Telegram`;
      }
    }
  }
  return null;
}

function parseLogEntry(line: string) {
  const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d+)\s+(\w+)\s+(\S+):\s+(.+)$/);
  if (!match) return null;
  const timestamp = match[1], level = match[2], logger = match[3], msg = match[4];
  if (msg.includes('inbound message:')) {
    const chatMatch = msg.match(/msg='(.*?)'$/);
    return { type: 'inbound', text: chatMatch ? chatMatch[1] : msg, timestamp };
  }
  if (msg.includes('response ready:')) return { type: 'response', text: msg.slice(0, 120), timestamp };
  if (msg.includes('Sending response')) return { type: 'outbound', text: msg, timestamp };
  if (msg.includes('Gateway running') || msg.includes('connected')) return { type: 'status', text: msg, timestamp };
  if (msg.toLowerCase().includes('error') || msg.toLowerCase().includes('fail')) return { type: 'error', text: msg, timestamp };
  return null;
}

function parseUptime(etime: string): number {
  if (!etime) return 0;
  const parts = etime.split('-');
  let days = 0, time = parts.length > 1 ? parts[1] : parts[0];
  if (parts.length > 1) days = parseInt(parts[0]) || 0;
  const tParts = time.split(':');
  return days * 86400 + (parseInt(tParts[0]) || 0) * 3600 + (parseInt(tParts[1]) || 0) * 60 + (parseInt(tParts[2]) || 0);
}
