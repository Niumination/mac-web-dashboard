import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // pmset -g batt → battery percentage, charging status, time remaining
    const { stdout: battRaw } = await execAsync('pmset -g batt 2>/dev/null').catch(() => ({ stdout: '' }));
    // system_profiler SPPowerDataType → cycle count, condition, max capacity
    const { stdout: profilerRaw } = await execAsync(
      'system_profiler SPPowerDataType 2>/dev/null'
    ).catch(() => ({ stdout: '' }));

    const battery = parseBattery(battRaw);
    const health = parseHealth(profilerRaw);

    return NextResponse.json({
      success: true,
      data: { ...battery, ...health },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function parseBattery(raw: string) {
  // Output: "Now drawing from 'Battery Power' -InternalBattery-0 (id=...)  75%; discharging; 2:43 remaining"
  const result = {
    percentage: 0,
    charging: false,
    timeRemaining: '—',
    powerSource: 'Unknown',
  };

  // Check if there's a battery
  if (!raw || !raw.includes('InternalBattery')) {
    return result;
  }

  // Get power source line
  const lines = raw.split('\n').filter(l => l.includes('InternalBattery'));
  if (lines.length === 0) return result;

  const line = lines[0];

  // Percentage
  const pctMatch = line.match(/(\d+)%/);
  if (pctMatch) result.percentage = parseInt(pctMatch[1]);

  // Charging status
  result.charging = line.includes('charging') || line.includes('AC Power');
  result.powerSource = line.includes('AC Power') ? 'AC Power' : 'Battery';

  // Time remaining
  if (line.includes('(no estimate)')) {
    result.timeRemaining = 'Calculating…';
  } else {
    const timeMatch = line.match(/(\d+):(\d+)/);
    if (timeMatch) {
      const hrs = parseInt(timeMatch[1]);
      const mins = parseInt(timeMatch[2]);
      result.timeRemaining = `${hrs}h ${mins}m`;
    }
  }

  return result;
}

function parseHealth(raw: string) {
  const result = {
    cycleCount: 0,
    condition: 'Unknown',
    maxCapacity: 0,
    designCapacity: 0,
    healthPercent: 100,
  };

  if (!raw) return result;

  const cycleMatch = raw.match(/Cycle Count:\s*(\d+)/);
  if (cycleMatch) result.cycleCount = parseInt(cycleMatch[1]);

  const condMatch = raw.match(/Condition:\s*(.+)/);
  if (condMatch) result.condition = condMatch[1].trim();

  const maxMatch = raw.match(/Maximum Capacity:\s*(\d+)/);
  if (maxMatch) result.maxCapacity = parseInt(maxMatch[1]);

  const designMatch = raw.match(/Design Capacity:\s*(\d+)/);
  if (designMatch) result.designCapacity = parseInt(designMatch[1]);

  if (result.designCapacity > 0) {
    result.healthPercent = Math.round((result.maxCapacity / result.designCapacity) * 100);
  }

  return result;
}
