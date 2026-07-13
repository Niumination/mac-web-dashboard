import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const OLLAMA_URL = 'http://127.0.0.1:11434';

async function checkPort(): Promise<{ alive: boolean; pid?: number }> {
  try {
    const { stdout } = await execAsync(`lsof -i :11434 -P -n 2>/dev/null | grep LISTEN | awk '{print $2}' | head -1`);
    const pid = parseInt(stdout.trim());
    if (pid && !isNaN(pid)) {
      try { process.kill(pid, 0); return { alive: true, pid }; } catch {}
    }
    return { alive: false };
  } catch {
    return { alive: false };
  }
}

async function proxy(endpoint: string, method: string, body?: any) {
  const url = `${OLLAMA_URL}/${endpoint.replace(/^\//, '')}`;
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(120000),
  };
  if (body && (method === 'POST' || method === 'PUT')) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return { data: await res.json(), status: res.status };
  }
  return { data: { raw: await res.text() }, status: res.status };
}

export async function GET() {
  const portStatus = await checkPort();
  if (!portStatus.alive) {
    return NextResponse.json({ success: true, running: false, message: 'Ollama not running on port 11434' });
  }
  try {
    const tags = await proxy('api/tags', 'GET');
    const ps = await proxy('api/ps', 'GET');
    return NextResponse.json({
      success: true,
      running: true,
      pid: portStatus.pid,
      models: tags.data,
      active: ps.data,
    });
  } catch (e: any) {
    return NextResponse.json({ success: true, running: true, error: e.message });
  }
}

export async function POST(req: NextRequest) {
  const portStatus = await checkPort();
  if (!portStatus.alive) {
    return NextResponse.json({ success: false, error: 'Ollama not running' }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action || 'proxy';

  if (action === 'proxy') {
    const endpoint = body.endpoint || 'api/generate';
    const method = (body.method || 'POST').toUpperCase();
    try {
      const result = await proxy(endpoint, method, body.data);
      return NextResponse.json({ success: result.status < 500, ...result.data }, { status: result.status });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 502 });
    }
  }

  if (action === 'pull') {
    const model = body.model;
    if (!model) return NextResponse.json({ error: 'model required' }, { status: 400 });
    try {
      const { stdout, stderr } = await execAsync(`ollama pull ${model} 2>&1`, { timeout: 600000 });
      return NextResponse.json({ success: true, output: stdout || stderr });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  if (action === 'delete') {
    const model = body.model;
    if (!model) return NextResponse.json({ error: 'model required' }, { status: 400 });
    try {
      const { stdout, stderr } = await execAsync(`ollama rm ${model} 2>&1`, { timeout: 30000 });
      return NextResponse.json({ success: true, output: stdout || stderr });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
