import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runHerdr(args: string): Promise<string> {
  const { stdout } = await execAsync(`herdr ${args} 2>/dev/null`);
  return stdout.trim();
}

export async function GET(req: NextRequest) {
  const resource = req.nextUrl.searchParams.get('resource') || 'snapshot';

  try {
    if (resource === 'snapshot') {
      const raw = await runHerdr('api snapshot');
      const parsed = JSON.parse(raw);
      return NextResponse.json({ success: true, snapshot: parsed.result.snapshot });
    }

    if (resource === 'agents') {
      const raw = await runHerdr('agent list');
      const parsed = JSON.parse(raw);
      return NextResponse.json({ success: true, agents: parsed.result.agents });
    }

    if (resource === 'sessions') {
      const raw = await runHerdr('session list --json');
      const parsed = JSON.parse(raw);
      return NextResponse.json({ success: true, sessions: parsed.sessions });
    }

    if (resource === 'workspaces') {
      const raw = await runHerdr('workspace list');
      return NextResponse.json({ success: true, workspaces: raw });
    }

    if (resource === 'status') {
      const raw = await runHerdr('status');
      const lines = raw.split('\n').filter(Boolean);
      const status: Record<string, string> = {};
      for (const line of lines) {
        const parts = line.split(':');
        if (parts.length >= 2) {
          const key = parts[0].trim().replace(/\s+/g, '_');
          const val = parts.slice(1).join(':').trim();
          status[key] = val;
        }
      }
      return NextResponse.json({ success: true, status });
    }

    return NextResponse.json({ success: false, error: 'unknown resource' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action || '';

  try {
    if (action === 'agent-send') {
      const target = body.target || '';
      const text = body.text || '';
      if (!target || !text) return NextResponse.json({ error: 'target and text required' }, { status: 400 });
      const stdout = await runHerdr(`agent send ${target} '${text.replace(/'/g, "'\\''")}'`);
      return NextResponse.json({ success: true, output: stdout });
    }

    if (action === 'agent-read') {
      const target = body.target || '';
      if (!target) return NextResponse.json({ error: 'target required' }, { status: 400 });
      const stdout = await runHerdr(`agent read ${target} --format text`);
      return NextResponse.json({ success: true, output: stdout });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
