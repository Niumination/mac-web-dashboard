import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * SSE endpoint — pushes system metrics every 3 seconds.
 * Client accumulates the last N points for chart rendering.
 */
export async function GET() {
  // Prevent build hang — detect Next.js build context
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE) {
    return new Response('OK', { status: 200 });
  }

  let cancelled = false;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const push = async () => {
        if (cancelled) return;

        try {
          const data = await collectMetrics();
          const payload = `data: ${JSON.stringify({ success: true, data })}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err: any) {
          const payload = `data: ${JSON.stringify({ success: false, error: err.message })}\n\n`;
          controller.enqueue(encoder.encode(payload));
        }

        if (!cancelled) setTimeout(push, 3000);
      };

      push();
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Connection: 'keep-alive',
    },
  });
}

/** Collect a lightweight snapshot of system metrics */
async function collectMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = Math.round((usedMem / totalMem) * 100);
  const loadAvg = os.loadavg();
  const cpuCores = os.cpus().length;
  const cpuPercent = Math.min(100, Math.round((loadAvg[0] / cpuCores) * 100));

  // Try to get real CPU temp via powermetrics (macOS only)
  let cpuTemp = 42;
  try {
    if (os.type() === 'Darwin') {
      const { stdout } = await execAsync(
        "pmset -g therm 2>/dev/null | grep -o '[0-9]\\+' | head -1"
      ).catch(() => ({ stdout: '' }));
      if (stdout.trim()) cpuTemp = parseInt(stdout.trim());
    }
  } catch {
    // fallback
  }

  return {
    timestamp: Date.now(),
    cpu: {
      percent: cpuPercent,
      load: loadAvg.map((n: number) => Math.round(n * 100) / 100),
      cores: cpuCores,
      temp: cpuTemp,
    },
    memory: {
      percent: memUsagePercent,
      used: formatBytes(usedMem),
      total: formatBytes(totalMem),
      free: formatBytes(freeMem),
    },
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 GB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
