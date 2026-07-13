import { NextRequest, NextResponse } from 'next/server';
import { spawn, ChildProcess } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

const AGENT_COMMANDS: Record<string, { cmd: string; cwd?: string }> = {
  claude: { cmd: '/usr/local/bin/claude' },
  codex: { cmd: '/usr/local/bin/codex' },
  opencode: { cmd: '/usr/local/bin/opencode' },
  'cursor-agent': { cmd: path.join(process.env.HOME || '/Users/zaryu', '.local/bin/cursor-agent') },
  mimo: { cmd: '/usr/local/bin/mimo' },
  'agent-browser': { cmd: '/usr/local/bin/agent-browser' },
  hermes: { cmd: path.join(process.env.HOME || '/Users/zaryu', '.hermes-portable/venv/bin/hermes') },
};

// In-memory process tracker
const runningProcesses = new Map<string, { pid: number; startTime: number }>();
let processCounter = 0;

export async function GET() {
  // Refresh process list — check if PIDs are still alive
  const active: { id: string; agent: string; pid: number; started: number }[] = [];
  for (const [sessionId, info] of Array.from(runningProcesses.entries())) {
    try {
      process.kill(info.pid, 0);
      active.push({ id: sessionId, agent: sessionId.split('-')[0], pid: info.pid, started: info.startTime });
    } catch {
      runningProcesses.delete(sessionId);
    }
  }
  return NextResponse.json({ success: true, processes: active });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action;

  if (action === 'run') {
    const agentId = body.agent as string;
    const args = body.args || [];
    const agentConfig = AGENT_COMMANDS[agentId];

    if (!agentConfig) {
      return NextResponse.json({ success: false, error: `Unknown agent: ${agentId}` }, { status: 400 });
    }

    const sessionId = `${agentId}-${++processCounter}-${Date.now()}`;

    const proc = spawn(agentConfig.cmd, args, {
      cwd: agentConfig.cwd || process.cwd(),
      env: { ...process.env, TERM: 'xterm-256color' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    runningProcesses.set(sessionId, { pid: proc.pid!, startTime: Date.now() });

    proc.on('exit', () => {
      runningProcesses.delete(sessionId);
    });

    return NextResponse.json({
      success: true,
      sessionId,
      pid: proc.pid,
      agent: agentId,
    });
  }

  if (action === 'kill') {
    const pid = body.pid as number;
    if (!pid) return NextResponse.json({ error: 'pid required' }, { status: 400 });
    try {
      process.kill(pid, 'SIGTERM');
      setTimeout(() => {
        try { process.kill(pid, 'SIGKILL'); } catch {}
      }, 5000);
      return NextResponse.json({ success: true, message: `Killed PID ${pid}` });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
