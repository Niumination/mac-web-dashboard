import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const SESSIONS_DIR = '/Volumes/HermesAgent/HermesAgentUSB/data/sessions';

interface SessionSummary {
  id: string;
  fileName: string;
  timestamp: string;
  reason?: string;
  model?: string;
  messageCount: number;
  size: number;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50'), 200);

  if (!fs.existsSync(SESSIONS_DIR)) {
    return NextResponse.json({ success: false, error: 'Sessions directory not found' }, { status: 404 });
  }

  if (id) {
    const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.includes(id));
    if (files.length === 0) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }
    try {
      const content = JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, files[0]), 'utf-8'));
      return NextResponse.json({ success: true, session: content });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  }

  try {
    const files = fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit);

    const sessions = files.map(f => {
      const fp = path.join(SESSIONS_DIR, f);
      try {
        const stat = fs.statSync(fp);
        const raw = fs.readFileSync(fp, 'utf-8');
        const data = JSON.parse(raw);
        const msgs = data.request?.body?.messages || [];
        return {
          id: data.session_id || f.replace('.json', ''),
          fileName: f,
          timestamp: data.timestamp || stat.mtime.toISOString(),
          reason: data.reason,
          model: data.request?.body?.model,
          messageCount: msgs.length,
          size: stat.size,
        };
      } catch {
        return null;
      }
    }).filter(Boolean) as SessionSummary[];

    return NextResponse.json({ success: true, sessions, total: files.length });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
