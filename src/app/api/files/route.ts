import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const renameAsync = promisify(fs.rename);
const mkdirAsync = promisify(fs.mkdir);
const rmAsync = promisify(fs.rm);
const execAsync = promisify(exec);

// Direktori yang di-block untuk keamanan
const BLOCKED_PREFIXES = [
  '/etc',
  '/private',
  '/System',
  '/usr/lib',
  '/usr/include',
  '/usr/share',
  '/var/db',
  '/var/log',
  '/var/run',
  '/cores',
  '/dev',
  '/Volumes/HermesAgent',
];

function isBlocked(p: string): boolean {
  const resolved = path.resolve(p);
  return BLOCKED_PREFIXES.some(prefix => resolved === prefix || resolved.startsWith(prefix + '/')) ||
         resolved === '/etc' || resolved.startsWith('/etc/');
}

function sanitizePath(p: string): string {
  // Cegah path traversal
  const resolved = path.resolve(p);
  // Hanya izinkan akses ke /Users/, /tmp/, /Applications, /usr/local, /opt
  const allowedPrefixes = ['/Users', '/tmp', '/Applications', '/usr/local', '/opt/homebrew', '/Library'];
  const isAllowed = allowedPrefixes.some(prefix => resolved === prefix || resolved.startsWith(prefix + '/'));
  if (!isAllowed && resolved !== '/') {
    return '/Users/' + (process.env.USER || 'zaryu');
  }
  return resolved;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let targetPath = searchParams.get('path') || process.env.HOME || '/Users/zaryu';
    targetPath = sanitizePath(targetPath);

    if (isBlocked(targetPath)) {
      return NextResponse.json(
        { success: false, error: 'Access denied: this directory is blocked for security.' },
        { status: 403 }
      );
    }

    if (!fs.existsSync(targetPath)) {
      return NextResponse.json(
        { success: false, error: `Path does not exist: ${targetPath}` },
        { status: 404 }
      );
    }

    const stats = await statAsync(targetPath);

    if (stats.isDirectory()) {
      const items = await readdirAsync(targetPath);
      const fileList: any[] = [];

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
        } catch {
          // Skip unreadable items
        }
      }

      // Sort: directories first, then files, alphabetical
      fileList.sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      return NextResponse.json({ success: true, data: fileList, currentPath: targetPath });
    } else {
      // Read file content
      const content = await readFileAsync(targetPath, 'utf-8');
      return NextResponse.json({ success: true, isFile: true, content, currentPath: targetPath });
    }

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, targetPath, newName, content, permissions } = body;

    if (!targetPath) {
      return NextResponse.json({ success: false, error: 'targetPath is required' }, { status: 400 });
    }

    let normalized = sanitizePath(targetPath);

    if (isBlocked(normalized)) {
      return NextResponse.json(
        { success: false, error: 'Access denied: this location is blocked for security.' },
        { status: 403 }
      );
    }

    const parentDir = path.dirname(normalized);
    const itemName = path.basename(normalized);

    if (action === 'save') {
      if (!fs.existsSync(parentDir)) {
        return NextResponse.json({ success: false, error: 'Parent directory does not exist.' }, { status: 404 });
      }
      await writeFileAsync(normalized, content, 'utf-8');
      return NextResponse.json({ success: true, message: 'File saved successfully.' });
    }

    if (action === 'create') {
      const { isDir, name } = body;
      const newPath = path.join(normalized, name);

      if (!fs.existsSync(normalized)) {
        return NextResponse.json({ success: false, error: 'Target directory does not exist.' }, { status: 404 });
      }

      if (isDir) {
        await mkdirAsync(newPath, { recursive: true });
      } else {
        await writeFileAsync(newPath, '# New file\n', 'utf-8');
      }
      return NextResponse.json({ success: true, message: `${isDir ? 'Folder' : 'File'} created successfully.` });
    }

    if (action === 'delete') {
      if (!fs.existsSync(normalized)) {
        return NextResponse.json({ success: false, error: 'Item does not exist.' }, { status: 404 });
      }
      const stats = await statAsync(normalized);
      if (stats.isDirectory()) {
        await rmAsync(normalized, { recursive: true, force: true });
      } else {
        await unlinkAsync(normalized);
      }
      return NextResponse.json({ success: true, message: 'Item deleted successfully.' });
    }

    if (action === 'rename') {
      if (!fs.existsSync(normalized)) {
        return NextResponse.json({ success: false, error: 'Item does not exist.' }, { status: 404 });
      }
      const newPath = path.join(parentDir, newName);
      await renameAsync(normalized, newPath);
      return NextResponse.json({ success: true, message: 'Renamed successfully.' });
    }

    if (action === 'chmod') {
      if (!fs.existsSync(normalized)) {
        return NextResponse.json({ success: false, error: 'Item does not exist.' }, { status: 404 });
      }
      await execAsync(`chmod ${permissions} "${normalized}"`);
      return NextResponse.json({ success: true, message: `Permissions changed to ${permissions}.` });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function formatPerms(mode: number): string {
  const read = 4, write = 2, execute = 1;
  const owner = (mode >> 6) & 7;
  const group = (mode >> 3) & 7;
  const others = mode & 7;

  const toStr = (val: number) =>
    ((val & read) ? 'r' : '-') +
    ((val & write) ? 'w' : '-') +
    ((val & execute) ? 'x' : '-');

  return ((mode & 0o40000) ? 'd' : '-') + toStr(owner) + toStr(group) + toStr(others);
}
