import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

const AGENT_LOG = '/Volumes/HermesAgent/HermesAgentUSB/data/logs/agent.log';
const GATEWAY_LOG = '/Volumes/HermesAgent/HermesAgentUSB/data/logs/gateway.log';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result: {
    today: number; thisWeek: number; total: number;
    responseTimes: number[]; errors: number;
    hourly: number[]; daily: Record<string, number>;
  } = { today: 0, thisWeek: 0, total: 0, responseTimes: [], errors: 0, hourly: Array(24).fill(0), daily: {} };

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);

  // Parse gateway log for activity
  try {
    if (fs.existsSync(GATEWAY_LOG)) {
      const { stdout } = await execAsync(`wc -l < "${GATEWAY_LOG}"`);
      result.total = parseInt(stdout.trim()) || 0;

      const { stdout: todayLines } = await execAsync(
        `grep -c "${todayStr}" "${GATEWAY_LOG}" 2>/dev/null || echo 0`
      );
      result.today = parseInt(todayLines.trim()) || 0;

      // Hourly distribution from today
      for (let h = 0; h < 24; h++) {
        const hh = h.toString().padStart(2, '0');
        const { stdout: count } = await execAsync(
          `grep "${todayStr} ${hh}:" "${GATEWAY_LOG}" 2>/dev/null | wc -l`
        );
        result.hourly[h] = parseInt(count.trim()) || 0;
      }

      // Daily counts for this week
      for (let d = 6; d >= 0; d--) {
        const date = new Date(now.getTime() - d * 86400000).toISOString().slice(0, 10);
        const { stdout: count } = await execAsync(
          `grep -c "${date}" "${GATEWAY_LOG}" 2>/dev/null || echo 0`
        );
        result.daily[date] = parseInt(count.trim()) || 0;
      }

      // Response time samples (from "response ready:" lines with "time=")
      const { stdout: respLines } = await execAsync(
        `grep "response ready:" "${GATEWAY_LOG}" 2>/dev/null | grep -oP 'time=[0-9.]+s' | sed 's/time=//;s/s//' | tail -20`
      );
      result.responseTimes = respLines.trim().split('\n').filter(Boolean).map(parseFloat);

      // Error count
      const { stdout: errCount } = await execAsync(
        `grep -c -i "error\\|failed\\|fail" "${GATEWAY_LOG}" 2>/dev/null || echo 0`
      );
      result.errors = parseInt(errCount.trim()) || 0;
    }
  } catch {}

  return NextResponse.json({ success: true, ...result });
}
