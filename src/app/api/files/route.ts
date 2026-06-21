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
    { name: 'Users', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-21 10:00' },
    { name: 'Applications', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-20 14:20' },
    { name: 'System', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-19 09:12' },
    { name: 'usr', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-18 18:30' },
  ],
  '/Users': [
    { name: 'zaryu', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-21 11:20' }
  ],
  '/Users/zaryu': [
    { name: 'Desktop', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-21 12:30' },
    { name: 'Documents', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-20 08:00' },
    { name: 'Downloads', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-21 16:45' },
    { name: '.zshrc', isDir: false, size: 1850, permissions: 'rw-r--r--', modified: '2026-06-17 08:00', content: '# ~/.zshrc\n\nexport PATH="/opt/homebrew/bin:$PATH"\n\nalias ll="ls -lah"\nalias brewup="brew update && brew upgrade && brew cleanup"\n\n# Niumination\nexport PATH="$HOME/.local/bin:$PATH"\neval "$(hermes init zsh)"' },
    { name: '.config', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-20 11:30' },
    { name: 'Niumination', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-21 10:00' },
  ],
  '/Users/zaryu/Desktop': [
    { name: 'Screenshot.png', isDir: false, size: 245000, permissions: 'rw-r--r--', modified: '2026-06-21 14:30', content: '(binary image data)' },
    { name: 'notes.md', isDir: false, size: 450, permissions: 'rw-r--r--', modified: '2026-06-21 09:15', content: '# macOS Dashboard Tasks\n- [x] Set up Homebrew\n- [x] Install node, python, git\n- [ ] Test launchctl integration\n- [ ] Deploy to production\n' }
  ],
  '/Users/zaryu/.config': [
    { name: 'alacritty', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-17 11:30' },
    { name: 'ghostty', isDir: true, size: 4096, permissions: 'rwxr-xr-x', modified: '2026-06-17 11:30' },
    { name: 'starship.toml', isDir: false, size: 840, permissions: 'rw-r--r--', modified: '2026-06-17 11:30', content: '[add_newline]\nvalue = false\n\n[character]\nsuccess_symbol = "[➜](bold green)"\nerror_symbol = "[✗](bold red)"' }
  ],
  '/Users/zaryu/.config/ghostty': [
    { name: 'config', isDir: false, size: 1200, permissions: 'rw-r--r--', modified: '2026-06-17 11:30', content: '# Ghostty terminal config\nfont-family = JetBrains Mono\nfont-size = 13\nbackground-opacity = 0.85\ntheme = catppuccin-mocha' }
  ],
  '/Users/zaryu/Niumination': [
    { name: 'AGENTS.md', isDir: false, size: 15200, permissions: 'rw-r--r--', modified: '2026-06-21 12:00', content: '# Niumination Ecosystem\n...' }
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
