import { NextResponse } from 'next/server';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Cache untuk brew data — refresh tiap 5 menit
let brewCache = { formulae: 0, casks: 0, outdated: 0 };
let brewCacheTime = 0;
const BREW_CACHE_TTL = 300_000; // 5 menit

async function getBrewData() {
  const now = Date.now();
  if (now - brewCacheTime < BREW_CACHE_TTL) return brewCache;
  
  try {
    const [formulaOut, caskOut, outdatedOut] = await Promise.all([
      execAsync('brew list --formula 2>/dev/null | wc -l'),
      execAsync('brew list --cask 2>/dev/null | wc -l'),
      execAsync('brew outdated 2>/dev/null | wc -l'),
    ]);
    brewCache = {
      formulae: parseInt(formulaOut.stdout.trim()) || 0,
      casks: parseInt(caskOut.stdout.trim()) || 0,
      outdated: parseInt(outdatedOut.stdout.trim()) || 0,
    };
    brewCacheTime = now;
  } catch {
    brewCache = { formulae: 0, casks: 0, outdated: 0 };
  }
  return brewCache;
}

export async function GET() {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = Math.round((usedMem / totalMem) * 100);
    const loadAvg = os.loadavg();
    const cpuCores = os.cpus().length;
    const cpuModel = os.cpus()[0]?.model || 'Apple Silicon';
    const uptime = os.uptime();
    const isMac = os.type() === 'Darwin';

    // Parallel: df + brew
    let diskTotal = '256 GB', diskUsed = '128 GB', diskPercent = '50%';
    let brew = { brewFormulae: 0, brewCasks: 0, brewOutdated: 0 };

    if (isMac) {
      const [diskResult, brewData] = await Promise.all([
        execAsync('df -h / | awk \'NR==2 {print $2, $3, $5}\'').catch(() => ({ stdout: '' })),
        getBrewData(),
      ]);
      const parts = diskResult.stdout.trim().split(/\s+/);
      if (parts.length >= 3) {
        diskTotal = parts[0];
        diskUsed = parts[1];
        diskPercent = parts[2];
      }
      brew = {
        brewFormulae: brewData.formulae,
        brewCasks: brewData.casks,
        brewOutdated: brewData.outdated,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        os: {
          name: isMac ? 'macOS (Darwin)' : 'Generic Unix',
          kernel: os.release(),
          hostname: os.hostname(),
          uptime: formatUptime(uptime),
        },
        cpu: {
          model: cpuModel,
          cores: cpuCores,
          loadAverage: loadAvg.map(n => n.toFixed(2)),
          speedPercent: Math.min(100, Math.round((loadAvg[0] / cpuCores) * 100)),
        },
        memory: {
          total: formatBytes(totalMem),
          used: formatBytes(usedMem),
          free: formatBytes(freeMem),
          percentage: memUsagePercent,
        },
        disk: {
          total: diskTotal,
          used: diskUsed,
          percentage: parseInt(diskPercent.replace('%', '')) || 50,
        },
        packages: brew,
        temperatures: { cpu: 42.0, gpu: 38.0 },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 GB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24));
  const hrs = Math.floor((seconds % (3600 * 24)) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hrs > 0) parts.push(`${hrs}h`);
  parts.push(`${mins}m`);
  return parts.join(' ') || 'Just now';
}
