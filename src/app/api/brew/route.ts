import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET — daftar outdated packages */
export async function GET() {
  try {
    const { stdout } = await execAsync(
      'brew outdated --formule --cask 2>/dev/null || brew outdated 2>/dev/null'
    ).catch(() => ({ stdout: '' }));

    const lines = stdout.trim().split('\n').filter(Boolean);
    const packages = lines.map((line) => {
      // Format: "name (old -> new)" or just "name"
      const match = line.match(/^(\S+)\s*\(?(\d+[\.\d]*\S*)\s*->\s*(\d+[\.\d]*\S*)\)?/);
      if (match) {
        return { name: match[1], from: match[2], to: match[3] };
      }
      return { name: line.trim(), from: '', to: '' };
    });

    return NextResponse.json({ success: true, data: packages, count: packages.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/** POST — jalankan brew update + upgrade, streaming output */
export async function POST() {
  let cancelled = false;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (text: string, type: string = 'stdout') => {
        if (!cancelled) {
          const payload = `data: ${JSON.stringify({ type, text })}\n\n`;
          try { controller.enqueue(encoder.encode(payload)); } catch { /* ignore */ }
        }
      };

      const run = async () => {
        send('🚀 Starting Homebrew upgrade pipeline...\n', 'info');
        send('$ brew update && brew upgrade\n\n', 'cmd');

        // Write a temporary script to capture output line by line
        const scriptPath = path.join('/tmp', `brew-upgrade-${Date.now()}.sh`);
        const script = `#!/bin/bash
set -o pipefail
{
  echo ":: Running brew update..."
  brew update 2>&1
  echo ""
  echo ":: Running brew upgrade..."
  brew upgrade 2>&1
  echo ""
  echo ":: Running brew cleanup..."
  brew cleanup 2>&1
  echo ""
  echo "✅ All operations completed."
} | while IFS= read -r line; do
  echo "OUT:$line"
done
`;
        try {
          fs.writeFileSync(scriptPath, script, 'utf-8');
          fs.chmodSync(scriptPath, 0o755);

          const child = exec(`bash "${scriptPath}"`, { timeout: 300000 }); // 5 menit timeout

          child.stdout?.on('data', (chunk: string) => {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
              if (line.startsWith('OUT:')) {
                send(line.slice(4) + '\n', 'stdout');
              } else if (line.trim()) {
                send(line + '\n', 'stdout');
              }
            }
          });

          child.stderr?.on('data', (chunk: string) => {
            send(chunk.toString(), 'stderr');
          });

          await new Promise<void>((resolve, reject) => {
            child.on('close', (code) => {
              send(`\n🏁 Process exited with code ${code}\n`, code === 0 ? 'success' : 'error');
              resolve();
            });
            child.on('error', reject);
          });
        } catch (err: any) {
          send(`\n❌ Error: ${err.message}\n`, 'error');
        } finally {
          // Cleanup script
          try { fs.unlinkSync(scriptPath); } catch { /* ignore */ }
        }

        try { controller.close(); } catch { /* ignore */ }
      };

      run();
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
