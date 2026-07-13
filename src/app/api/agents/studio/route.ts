import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

const HERMES_ENV = '/Volumes/HermesAgent/HermesAgentUSB/data/.env';
const OLLAMA_URL = 'http://127.0.0.1:11434';

function getEnvValue(key: string): string | null {
  try {
    if (fs.existsSync(HERMES_ENV)) {
      for (const line of fs.readFileSync(HERMES_ENV, 'utf-8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
        const idx = trimmed.indexOf('=');
        if (trimmed.slice(0, idx).trim() === key) {
          let val = trimmed.slice(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
          return val;
        }
      }
    }
  } catch {}
  return null;
}

async function queryOllama(prompt: string, model: string): Promise<{ success: boolean; output: string }> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false }),
      signal: AbortSignal.timeout(120000),
    });
    const data = await res.json();
    return { success: true, output: data.response || JSON.stringify(data) };
  } catch (e: any) {
    return { success: false, output: `Error: ${e.message}` };
  }
}

async function queryTelegram(prompt: string): Promise<{ success: boolean; output: string }> {
  const botToken = getEnvValue('TELEGRAM_BOT_TOKEN');
  const chatId = getEnvValue('TELEGRAM_ALLOWED_USERS') || '2077300493';
  if (!botToken) return { success: false, output: 'TELEGRAM_BOT_TOKEN not configured' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: prompt, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    return data.ok
      ? { success: true, output: 'Message sent to Telegram. Hermes will respond via the gateway.' }
      : { success: false, output: `Telegram API error: ${data.description}` };
  } catch (e: any) {
    return { success: false, output: `Error: ${e.message}` };
  }
}

async function queryCLI(agentId: string, prompt: string): Promise<{ success: boolean; output: string }> {
  const cmds: Record<string, string> = {
    claude: '/usr/local/bin/claude',
    codex: '/usr/local/bin/codex',
    opencode: '/usr/local/bin/opencode',
  };
  const cmd = cmds[agentId as string];
  if (!cmd) return { success: false, output: `Unknown agent: ${agentId}` };
  try {
    const { stdout, stderr } = await execAsync(`echo "${prompt.replace(/"/g, '\\"')}" | ${cmd} -p - 2>/dev/null`, { timeout: 60000 });
    return { success: true, output: stdout || stderr || '(no output)' };
  } catch (e: any) {
    return { success: false, output: e.message || String(e) };
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt = body.prompt || '';
  const agents: string[] = body.agents || ['ollama'];
  const ollamaModel = body.ollamaModel || 'llama3.2:3b';

  if (!prompt.trim()) return NextResponse.json({ error: 'prompt required' }, { status: 400 });

  const results: Record<string, { success: boolean; output: string; error?: string }> = {};
  const promises: Promise<void>[] = [];

  for (const agent of agents) {
    promises.push((async () => {
      switch (agent) {
        case 'ollama': {
          const r = await queryOllama(prompt, ollamaModel);
          results[agent] = r;
          break;
        }
        case 'hermes': {
          const r = await queryTelegram(prompt);
          results[agent] = r;
          break;
        }
        case 'claude':
        case 'codex':
        case 'opencode': {
          const r = await queryCLI(agent, prompt);
          results[agent] = r;
          break;
        }
        default:
          results[agent] = { success: false, output: `Unknown agent: ${agent}` };
      }
    })());
  }

  await Promise.allSettled(promises);

  return NextResponse.json({ success: true, prompt, agents, ollamaModel, results });
}
