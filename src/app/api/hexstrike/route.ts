import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);
const HEXSTRIKE_PORT = 8888;
const HEXSTRIKE_URL = `http://127.0.0.1:${HEXSTRIKE_PORT}`;
const HEXSTRIKE_DIR = path.join(process.cwd(), 'hexstrike');
const MANAGE_SCRIPT = path.join(HEXSTRIKE_DIR, 'manage.sh');

// In-memory process state
let hexstrikePid: number | null = null;
let lastCheck = 0;

async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${HEXSTRIKE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function getPidFromFile(): Promise<number | null> {
  try {
    const { stdout } = await execAsync(`cat ${HEXSTRIKE_DIR}/hexstrike.pid 2>/dev/null || echo ""`);
    const pid = parseInt(stdout.trim());
    if (pid && !isNaN(pid)) {
      try { process.kill(pid, 0); return pid; } catch { return null; }
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action') || 'status';

  if (action === 'status') {
    const now = Date.now();
    if (now - lastCheck > 3000) {
      hexstrikePid = await getPidFromFile();
      lastCheck = now;
    }
    const alive = hexstrikePid !== null;
    const healthy = alive ? await checkHealth() : false;
    return NextResponse.json({ running: alive, healthy, pid: hexstrikePid });
  }

  if (action === 'health') {
    const healthy = await checkHealth();
    return NextResponse.json({ healthy });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action || 'status';

  if (action === 'start') {
    const already = await getPidFromFile();
    if (already) {
      return NextResponse.json({ success: true, message: 'already running', pid: already });
    }
    try {
      await execAsync(`"${MANAGE_SCRIPT}" start`, { timeout: 10000 });
      hexstrikePid = await getPidFromFile();
      return NextResponse.json({ success: true, message: 'started', pid: hexstrikePid });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  if (action === 'stop') {
    try {
      await execAsync(`"${MANAGE_SCRIPT}" stop`, { timeout: 8000 });
      hexstrikePid = null;
      return NextResponse.json({ success: true, message: 'stopped' });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  if (action === 'proxy') {
    const endpoint = body.endpoint || '';
    const method = (body.method || 'GET').toUpperCase();
    const data = body.data || {};

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint required' }, { status: 400 });
    }

    try {
      const url = `${HEXSTRIKE_URL}/${endpoint.replace(/^\//, '')}`;
      const opts: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(300000),
      };
      if (method === 'POST' || method === 'PUT') {
        opts.body = JSON.stringify(data);
      }
      const res = await fetch(url, opts);
      let json: any;
      try { json = await res.json(); } catch { json = { raw: await res.text() }; }
      return NextResponse.json(json);
    } catch (e: any) {
      return NextResponse.json({ error: e.message, success: false }, { status: 502 });
    }
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
