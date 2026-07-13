export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

interface AgentInfo {
  id: string;
  name: string;
  type: 'server' | 'cli' | 'app' | 'launchd';
  status: 'running' | 'stopped' | 'installed';
  version?: string;
  port?: number;
  pid?: number | null;
  path?: string;
  meta?: Record<string, any>;
}

async function checkPort(port: number): Promise<{ listening: boolean; pid?: number }> {
  try {
    const { stdout } = await execAsync(`lsof -i :${port} -P -n 2>/dev/null | grep LISTEN | awk '{print $2}' | head -1`);
    const pid = parseInt(stdout.trim());
    if (pid && !isNaN(pid)) {
      return { listening: true, pid };
    }
    return { listening: false };
  } catch {
    return { listening: false };
  }
}

async function which(cmd: string): Promise<{ found: boolean; path?: string }> {
  try {
    const { stdout } = await execAsync(`which ${cmd} 2>/dev/null`);
    const p = stdout.trim();
    return { found: !!p, path: p || undefined };
  } catch {
    return { found: false };
  }
}

async function findProcess(pattern: string): Promise<{ pid: number; uptime: number } | null> {
  try {
    const { stdout } = await execAsync(`ps aux | grep "${pattern}" | grep -v grep | awk '{print $2","$9}' | head -1`);
    const parts = stdout.trim().split(',');
    const pid = parseInt(parts[0]);
    if (pid && !isNaN(pid)) {
      try { process.kill(pid, 0); return { pid, uptime: Date.now() }; } catch {}
    }
    return null;
  } catch {
    return null;
  }
}

async function getVersion(cmd: string, flag = '--version'): Promise<string | undefined> {
  try {
    const { stdout } = await execAsync(`${cmd} ${flag} 2>/dev/null | head -1`);
    return stdout.trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function GET() {
  const agents: AgentInfo[] = [];

  // Ollama
  const ollamaPort = await checkPort(11434);
  const ollamaWhich = await which('ollama');
  const ollamaVersion = ollamaWhich.found ? await getVersion('ollama', '--version') : undefined;
  agents.push({
    id: 'ollama',
    name: 'Ollama',
    type: 'server',
    status: ollamaPort.listening ? 'running' : ollamaWhich.found ? 'stopped' : 'installed',
    version: ollamaVersion,
    port: 11434,
    pid: ollamaPort.pid,
    path: ollamaWhich.path,
  });

  // Hermes Gateway — detect via process (not port — it's a Telegram bot gateway)
  const hermesProc = await findProcess('hermes_cli.main gateway');
  const hermesWhich = await which('hermes');
  let hermesVersion: string | undefined;
  if (hermesWhich.found) {
    try {
      const { stdout } = await execAsync(`${hermesWhich.path} --version 2>/dev/null || ${hermesWhich.path} version 2>/dev/null || echo ""`);
      hermesVersion = stdout.trim() || undefined;
    } catch {}
  }
  agents.push({
    id: 'hermes',
    name: 'Hermes Agent',
    type: 'server',
    status: hermesProc ? 'running' : hermesWhich.found ? 'stopped' : 'installed',
    version: hermesVersion,
    pid: hermesProc?.pid,
    path: hermesWhich.path,
    meta: hermesProc ? { detection: 'process', uptime: hermesProc.uptime } : undefined,
  });

  // Hermes Dashboard (port 9119) — separate web UI, usually not running
  const hermesDashPort = await checkPort(9119);
  agents.push({
    id: 'hermes-dashboard',
    name: 'Hermes Dashboard',
    type: 'server',
    status: hermesDashPort.listening ? 'running' : 'stopped',
    port: 9119,
    pid: hermesDashPort.pid,
  });

  // Claude Code
  const claudeWhich = await which('claude');
  const claudeVersion = claudeWhich.found ? await getVersion('claude', '--version') : undefined;
  agents.push({
    id: 'claude',
    name: 'Claude Code',
    type: 'cli',
    status: claudeWhich.found ? 'installed' : 'stopped',
    version: claudeVersion,
    path: claudeWhich.path,
  });

  // Codex
  const codexWhich = await which('codex');
  const codexVersion = codexWhich.found ? await getVersion('codex', '--version') : undefined;
  agents.push({
    id: 'codex',
    name: 'OpenAI Codex',
    type: 'cli',
    status: codexWhich.found ? 'installed' : 'stopped',
    version: codexVersion,
    path: codexWhich.path,
  });

  // OpenCode
  const opencodeWhich = await which('opencode');
  const opencodeVersion = opencodeWhich.found ? await getVersion('opencode', '--version') : undefined;
  agents.push({
    id: 'opencode',
    name: 'OpenCode',
    type: 'cli',
    status: opencodeWhich.found ? 'installed' : 'stopped',
    version: opencodeVersion,
    path: opencodeWhich.path,
  });

  // Cursor Agent
  const cursorWhich = await which('cursor-agent');
  agents.push({
    id: 'cursor-agent',
    name: 'Cursor Agent',
    type: 'cli',
    status: cursorWhich.found ? 'installed' : 'stopped',
    path: cursorWhich.path,
  });

  // Mimo
  const mimoWhich = await which('mimo');
  const mimoVersion = mimoWhich.found ? await getVersion('mimo', '--version') : undefined;
  agents.push({
    id: 'mimo',
    name: 'Mimo AI',
    type: 'cli',
    status: mimoWhich.found ? 'installed' : 'stopped',
    version: mimoVersion,
    path: mimoWhich.path,
  });

  // Agent Browser
  const agentBrowserWhich = await which('agent-browser');
  const agentBrowserVersion = agentBrowserWhich.found ? await getVersion('agent-browser', '--version') : undefined;
  agents.push({
    id: 'agent-browser',
    name: 'Agent Browser',
    type: 'cli',
    status: agentBrowserWhich.found ? 'installed' : 'stopped',
    version: agentBrowserVersion,
    path: agentBrowserWhich.path,
  });

  // Launchd services
  try {
    const { stdout } = await execAsync('launchctl list 2>/dev/null | grep -i "ollama\\|hermes"');
    const lines = stdout.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        const pidStr = parts[0];
        const svcName = parts[2];
        if (svcName.includes('ollama')) {
          const existing = agents.find(a => a.id === 'ollama');
          if (existing && pidStr !== '-') {
            existing.status = 'running';
            existing.pid = parseInt(pidStr);
          }
        }
        if (svcName.includes('hermes')) {
          const existing = agents.find(a => a.id === 'hermes');
          if (existing) {
            existing.status = pidStr !== '-' ? 'running' : 'stopped';
            existing.pid = pidStr !== '-' ? parseInt(pidStr) : null;
          }
        }
      }
    }
  } catch {}

  return NextResponse.json({ success: true, agents, os: { hostname: os.hostname(), platform: os.platform(), arch: os.arch() } });
}
