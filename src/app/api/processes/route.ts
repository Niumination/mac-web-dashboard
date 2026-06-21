import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    let processes = [];

    try {
      // Fetch actual processes
      const { stdout } = await execAsync('ps -aux --sort=-pcpu | head -n 25');
      const lines = stdout.trim().split('\n').slice(1); // skip header

      processes = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        const user = parts[0];
        const pid = parts[1];
        const cpu = parseFloat(parts[2]);
        const mem = parseFloat(parts[3]);
        const command = parts.slice(10).join(' ');

        return {
          pid,
          user,
          cpu,
          mem,
          command: command.length > 60 ? command.substring(0, 60) + '...' : command
        };
      });
    } catch (e) {
      // Mock processes for non-Arch / Vercel
      processes = [
        { pid: '1', user: 'root', cpu: 0.1, mem: 0.2, command: '/usr/lib/systemd/systemd --switched-root --system' },
        { pid: '842', user: 'root', cpu: 2.4, mem: 1.5, command: '/usr/bin/dockerd -H fd://' },
        { pid: '1102', user: 'arch', cpu: 14.2, mem: 8.4, command: '/usr/lib/Xorg -nolisten tcp -auth /run/sddm/xauth' },
        { pid: '1420', user: 'arch', cpu: 8.7, mem: 12.1, command: 'alacritty --config-file ~/.config/alacritty/alacritty.toml' },
        { pid: '1554', user: 'arch', cpu: 4.1, mem: 6.3, command: 'nvim ~/.config/i3/config' },
        { pid: '1890', user: 'arch', cpu: 22.5, mem: 28.4, command: '/usr/lib/firefox/firefox' },
        { pid: '2011', user: 'arch', cpu: 1.0, mem: 2.1, command: 'polybar main -c ~/.config/polybar/config.ini' },
      ];
    }

    return NextResponse.json({
      success: true,
      data: processes
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pid = searchParams.get('pid');

    if (!pid) {
      return NextResponse.json({ success: false, error: 'PID is required' }, { status: 400 });
    }

    try {
      await execAsync(`kill -9 ${pid}`);
      return NextResponse.json({ success: true, message: `Process ${pid} killed.` });
    } catch (e: any) {
      return NextResponse.json({ success: true, message: `[Simulated] Process ${pid} killed.` });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
