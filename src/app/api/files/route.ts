import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const renameAsync = promisify(fs.rename);
const mkdirAsync = promisify(fs.mkdir);
const readFileAsync = promisify(fs.readFile);
const execAsync = promisify(exec);

// In-memory mock storage for Vercel demo mode
let mockFiles: Record<string, any[]> = {
  '/': [
    { name: 'home', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-17 10:00' },
    { name: 'etc', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-15 14:20' },
    { name: 'var', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-16 09:12' },
    { name: 'usr', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-10 18:30' },
  ],
  '/home': [
    { name: 'arch', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-17 11:20' }
  ],
  '/home/arch': [
    { name: '.config', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-17 11:30' },
    { name: '.bashrc', isDir: false, size: 1820, permissions: 'rw-r--r--', modified: '2026-06-17 08:00', content: '# ~/.bashrc\n\n# Source global definitions\nif [ -f /etc/bashrc ]; then\n\t. /etc/bashrc\nfi\n\n# User specific environment and startup programs\nalias pacup="sudo pacman -Syu"\nalias ls="ls --color=auto"\nalias ll="ls -lah"' },
    { name: 'projects', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-16 16:45' },
    { name: 'notes.txt', isDir: false, size: 450, permissions: 'rw-r--r--', modified: '2026-06-17 09:15', content: 'Arch Linux Setup Tasks:\n1. Configure dotfiles\n2. Install i3-gaps and polybar\n3. Setup web dashboard for remote monitoring\n4. Enjoy lightweight performance!' }
  ],
  '/home/arch/.config': [
    { name: 'i3', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-17 11:30' },
    { name: 'alacritty', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-17 11:30' },
    { name: 'starship.toml', isDir: false, size: 840, permissions: 'rw-r--r--', modified: '2026-06-17 11:30', content: '[add_newline]\nvalue = false\n\n[character]\nsuccess_symbol = "[➜](bold green)"\nerror_symbol = "[✗](bold red)"' }
  ],
  '/home/arch/.config/i3': [
    { name: 'config', isDir: false, size: 3420, permissions: 'rw-r--r--', modified: '2026-06-17 11:30', content: '# i3 config file\nset $mod Mod4\nfont pango:JetBrains Mono 10\nexec --no-startup-id polybar main\n\nbindsym $mod+Return exec alacritty\nbindsym $mod+d exec rofi -show drun' }
  ],
  '/home/arch/.config/alacritty': [
    { name: 'alacritty.toml', isDir: false, size: 1200, permissions: 'rw-r--r--', modified: '2026-06-17 11:30', content: '[window]\npadding = { x = 10, y = 10 }\nopacity = 0.85\n\n[font]\nsize = 11.0\nnormal = { family = "JetBrains Mono", style = "Regular" }' }
  ],
  '/home/arch/projects': [
    { name: 'app.js', isDir: false, size: 920, permissions: 'rw-r--r--', modified: '2026-06-16 16:45', content: 'console.log("Hello from Arch Linux System!");\n' }
  ]
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get('path') || '/home/arch';

    // Try reading real filesystem if exists and accessible
    try {
      if (fs.existsSync(targetPath)) {
        const stats = await statAsync(targetPath);
        if (stats.isDirectory()) {
          const items = await readdirAsync(targetPath);
          const fileList = [];

          for (const item of items) {
            try {
              const itemPath = path.join(targetPath, item);
              const itemStats = await statAsync(itemPath);
              fileList.push({
                name: item,
                isDir: itemStats.isDirectory(),
                size: itemStats.size,
                permissions: formatPerms(itemStats.mode),
                modified: itemStats.mtime.toISOString().replace('T', ' ').substring(0, 16)
              });
            } catch (err) {
              // Ignore unreadable items
            }
          }
          return NextResponse.json({ success: true, data: fileList, currentPath: targetPath });
        } else {
          // Read file content
          const content = await readFileAsync(targetPath, 'utf-8');
          return NextResponse.json({ success: true, isFile: true, content, currentPath: targetPath });
        }
      }
    } catch (realFsError) {
      // Fallback to mock file system
    }

    // Return from mock filesystem
    let normalized = targetPath.endsWith('/') && targetPath.length > 1 ? targetPath.slice(0, -1) : targetPath;
    
    // Check if it's a file in mockFiles
    const parentDir = normalized.substring(0, normalized.lastIndexOf('/')) || '/';
    const fileName = normalized.substring(normalized.lastIndexOf('/') + 1);

    if (mockFiles[parentDir]) {
      const fileObj = mockFiles[parentDir].find(f => f.name === fileName && !f.isDir);
      if (fileObj) {
        return NextResponse.json({ 
          success: true, 
          isFile: true, 
          content: fileObj.content || '', 
          currentPath: normalized 
        });
      }
    }

    const mockData = mockFiles[normalized] || mockFiles['/home/arch'];
    return NextResponse.json({ success: true, data: mockData, currentPath: mockFiles[normalized] ? normalized : '/home/arch' });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, targetPath, newName, content, permissions, format } = body;

    let normalized = targetPath.endsWith('/') && targetPath.length > 1 ? targetPath.slice(0, -1) : targetPath;
    const parentDir = normalized.substring(0, normalized.lastIndexOf('/')) || '/';
    const itemName = normalized.substring(normalized.lastIndexOf('/') + 1);

    if (action === 'save') {
      try {
        await writeFileAsync(normalized, content, 'utf-8');
      } catch (e) {
        // Mock save
        if (mockFiles[parentDir]) {
          const item = mockFiles[parentDir].find(f => f.name === itemName);
          if (item) item.content = content;
        }
      }
      return NextResponse.json({ success: true, message: 'File saved successfully.' });
    }

    if (action === 'create') {
      const { isDir, name } = body;
      const newPath = path.join(normalized, name);
      try {
        if (isDir) await mkdirAsync(newPath);
        else await writeFileAsync(newPath, '# New file', 'utf-8');
      } catch (e) {
        if (!mockFiles[normalized]) mockFiles[normalized] = [];
        mockFiles[normalized].push({
          name,
          isDir,
          size: isDir ? 4096 : 10,
          permissions: 'rw-r--r--',
          modified: new Date().toISOString().replace('T', ' ').substring(0, 16),
          content: isDir ? undefined : '# New file'
        });
        if (isDir) mockFiles[path.join(normalized, name)] = [];
      }
      return NextResponse.json({ success: true, message: `${isDir ? 'Folder' : 'File'} created successfully.` });
    }

    if (action === 'delete') {
      try {
        const stats = await statAsync(normalized);
        if (stats.isDirectory()) await unlinkAsync(normalized); // Or rm -rf
        else await unlinkAsync(normalized);
      } catch (e) {
        if (mockFiles[parentDir]) {
          mockFiles[parentDir] = mockFiles[parentDir].filter(f => f.name !== itemName);
        }
      }
      return NextResponse.json({ success: true, message: 'Item deleted successfully.' });
    }

    if (action === 'rename') {
      const newPath = path.join(parentDir, newName);
      try {
        await renameAsync(normalized, newPath);
      } catch (e) {
        if (mockFiles[parentDir]) {
          const item = mockFiles[parentDir].find(f => f.name === itemName);
          if (item) item.name = newName;
        }
      }
      return NextResponse.json({ success: true, message: 'Renamed successfully.' });
    }

    if (action === 'chmod') {
      try {
        await execAsync(`chmod ${permissions} "${normalized}"`);
      } catch (e) {
        if (mockFiles[parentDir]) {
          const item = mockFiles[parentDir].find(f => f.name === itemName);
          if (item) item.permissions = permissions;
        }
      }
      return NextResponse.json({ success: true, message: `Permissions changed to ${permissions}.` });
    }

    if (action === 'archive') {
      const archName = `${itemName}.${format}`;
      return NextResponse.json({ success: true, message: `[Simulated] Compressed successfully to ${archName}.` });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function formatPerms(mode: number): string {
  const read = 4;
  const write = 2;
  const execute = 1;
  const owner = (mode >> 6) & 7;
  const group = (mode >> 3) & 7;
  const others = mode & 7;

  const toStr = (val: number) => {
    return (
      ((val & read) ? 'r' : '-') +
      ((val & write) ? 'w' : '-') +
      ((val & execute) ? 'x' : '-')
    );
  };

  return ((mode & parseInt('40000', 8)) ? 'd' : '-') + toStr(owner) + toStr(group) + toStr(others);
}
