import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

const WORKSPACE_DIR = path.join(process.env.HOME || '/Users/zaryu', '.niumination/workspaces');

interface Workspace {
  id: string;
  name: string;
  description: string;
  agents: string[];
  projects: string[];
  created: string;
  updated: string;
}

function ensureDir() {
  if (!fs.existsSync(WORKSPACE_DIR)) {
    fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
  }
}

export async function GET() {
  ensureDir();
  try {
    const files = fs.readdirSync(WORKSPACE_DIR).filter(f => f.endsWith('.json'));
    const workspaces: Workspace[] = files.map(f => {
      const p = path.join(WORKSPACE_DIR, f);
      try {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      } catch {
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({ success: true, workspaces });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  ensureDir();
  const body = await req.json().catch(() => ({}));
  const action = body.action || 'save';

  if (action === 'save' || action === 'create') {
    const ws: Partial<Workspace> = {
      name: body.name || 'Untitled Workspace',
      description: body.description || '',
      agents: body.agents || [],
      projects: body.projects || [],
    };

    if (!ws.name) return NextResponse.json({ error: 'name required' }, { status: 400 });

    const now = new Date().toISOString();
    const existing = body.id ? findWorkspace(body.id) : undefined;

    const workspace: Workspace = {
      id: existing?.id || `ws-${Date.now()}`,
      name: ws.name,
      description: ws.description || '',
      agents: ws.agents || [],
      projects: ws.projects || [],
      created: existing?.created || now,
      updated: now,
    };

    const filePath = path.join(WORKSPACE_DIR, `${workspace.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(workspace, null, 2));

    return NextResponse.json({ success: true, workspace });
  }

  if (action === 'delete') {
    const id = body.id;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const filePath = path.join(WORKSPACE_DIR, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return NextResponse.json({ success: true, message: 'deleted' });
    }
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const filePath = path.join(WORKSPACE_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return NextResponse.json({ success: true, message: 'deleted' });
  }
  return NextResponse.json({ error: 'not found' }, { status: 404 });
}

function findWorkspace(id: string): Workspace | undefined {
  const filePath = path.join(WORKSPACE_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {}
  }
  return undefined;
}
