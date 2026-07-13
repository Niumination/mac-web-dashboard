import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

const MCP_SERVERS = [
  { id: 'time', name: 'MCP Server Time', pattern: 'mcp-server-time' },
  { id: 'github', name: 'MCP GitHub', pattern: 'server-github' },
  { id: 'filesystem', name: 'MCP Filesystem', pattern: 'mcp-server-filesystem' },
  { id: 'postgres', name: 'MCP PostgreSQL', pattern: 'mcp-server-postgres' },
  { id: 'sqlite', name: 'MCP SQLite', pattern: 'mcp-server-sqlite' },
  { id: 'ponytail', name: 'MCP Ponytail', pattern: 'ponytail-mcp' },
  { id: 'notebooklm', name: 'MCP NotebookLM', pattern: 'notebooklm-mcp' },
];

const MCP_STDERR_LOG = '/Volumes/HermesAgent/HermesAgentUSB/data/logs/mcp-stderr.log';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results = [];

  for (const server of MCP_SERVERS) {
    try {
      const { stdout } = await execAsync(
        `ps aux | grep "${server.pattern}" | grep -v grep | awk '{print $2","$9}' | head -1`
      );
      const parts = stdout.trim().split(',');
      const pid = parseInt(parts[0]);
      let running = false, uptime = 0;

      if (pid && !isNaN(pid)) {
        try {
          process.kill(pid, 0);
          running = true;
          const { stdout: et } = await execAsync(`ps -o etime= -p ${pid} 2>/dev/null | tr -d ' '`);
          uptime = parseUptime(et.trim());
        } catch {}
      }

      results.push({ id: server.id, name: server.name, running, pid: running ? pid : null, uptime });
    } catch {
      results.push({ id: server.id, name: server.name, running: false, pid: null, uptime: 0 });
    }
  }

  let logTail: string[] = [];
  try {
    if (fs.existsSync(MCP_STDERR_LOG)) {
      const { stdout } = await execAsync(`tail -30 "${MCP_STDERR_LOG}" 2>/dev/null`);
      logTail = stdout.trim().split('\n').filter(Boolean);
    }
  } catch {}

  return NextResponse.json({ success: true, servers: results, logPath: MCP_STDERR_LOG, logTail });
}

function parseUptime(etime: string): number {
  if (!etime) return 0;
  const parts = etime.split('-');
  let days = 0, time = parts.length > 1 ? parts[1] : parts[0];
  if (parts.length > 1) days = parseInt(parts[0]) || 0;
  const tParts = time.split(':');
  return days * 86400 + (parseInt(tParts[0]) || 0) * 3600 + (parseInt(tParts[1]) || 0) * 60 + (parseInt(tParts[2]) || 0);
}
