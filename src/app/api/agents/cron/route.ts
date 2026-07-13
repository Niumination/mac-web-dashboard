import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const HERMES_CMD = '/Users/zaryu/.hermes-portable/venv/bin/hermes';
const HERMES_HOME = '/Volumes/HermesAgent/HermesAgentUSB/data';
const ENV = { ...process.env, HERMES_HOME, PATH: `/Users/zaryu/.hermes-portable/venv/bin:${process.env.PATH || ''}` };

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  repeat: string;
  nextRun: string;
  deliver: string;
  script: string;
  status: string;
  lastRun?: string;
}

function parseCronOutput(stdout: string): CronJob[] {
  const jobs: CronJob[] = [];
  const lines = stdout.split('\n');
  let current: Partial<CronJob> = {};

  for (const line of lines) {
    const idMatch = line.match(/^  ([a-f0-9]+) \[(.+)\]$/);
    if (idMatch) {
      if (current.id) jobs.push(current as CronJob);
      current = { id: idMatch[1], status: idMatch[2] };
      continue;
    }
    if (!current.id) continue;
    const nameMatch = line.match(/Name:\s+(.+)/);
    if (nameMatch) { current.name = nameMatch[1].trim(); continue; }
    const schedMatch = line.match(/Schedule:\s+(.+)/);
    if (schedMatch) { current.schedule = schedMatch[1].trim(); continue; }
    const repeatMatch = line.match(/Repeat:\s+(.+)/);
    if (repeatMatch) { current.repeat = repeatMatch[1].trim(); continue; }
    const nextMatch = line.match(/Next run:\s+(.+)/);
    if (nextMatch) { current.nextRun = nextMatch[1].trim(); continue; }
    const deliverMatch = line.match(/Deliver:\s+(.+)/);
    if (deliverMatch) { current.deliver = deliverMatch[1].trim(); continue; }
    const scriptMatch = line.match(/Script:\s+(.+)/);
    if (scriptMatch) { current.script = scriptMatch[1].trim(); continue; }
    const lastMatch = line.match(/Last run:\s+(.+?)(?:\s+(ok|failed))?$/);
    if (lastMatch) { current.lastRun = lastMatch[1].trim(); continue; }
  }
  if (current.id) jobs.push(current as CronJob);
  return jobs;
}

export async function GET() {
  try {
    const { stdout } = await execAsync(`${HERMES_CMD} cron list`, { env: ENV, timeout: 15000 });
    const jobs = parseCronOutput(stdout);
    return NextResponse.json({ success: true, jobs });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, stderr: e.stderr }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action;

  if (!action) return NextResponse.json({ error: 'action required' }, { status: 400 });

  try {
    let cmd = `${HERMES_CMD} cron`;

    switch (action) {
      case 'create': {
        if (!body.name || !body.schedule || !body.script) {
          return NextResponse.json({ error: 'name, schedule, and script required' }, { status: 400 });
        }
        cmd += ` create "${body.name}" "${body.schedule}" --script "${body.script}"`;
        if (body.deliver) cmd += ` --deliver "${body.deliver}"`;
        if (body.args) cmd += ` -- "${body.args}"`;
        break;
      }
      case 'pause':
        if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        cmd += ` pause ${body.id}`;
        break;
      case 'resume':
        if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        cmd += ` resume ${body.id}`;
        break;
      case 'delete':
        if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        cmd += ` delete ${body.id}`;
        break;
      case 'run':
        if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        cmd += ` run ${body.id}`;
        break;
      case 'status':
        cmd += ' status';
        break;
      default:
        return NextResponse.json({ error: `unknown action: ${action}` }, { status: 400 });
    }

    const { stdout, stderr } = await execAsync(cmd, { env: ENV, timeout: 30000 });
    return NextResponse.json({ success: true, output: stdout, error: stderr || undefined });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message, stderr: e.stderr }, { status: 500 });
  }
}
