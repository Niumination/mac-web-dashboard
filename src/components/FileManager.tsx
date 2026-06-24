import React, { useState, useEffect } from 'react';
import { Folder, FileText, ArrowUp, Plus, Trash2, Edit3, Shield, Archive, Download, Upload, MoreVertical, RefreshCw, Check, X } from 'lucide-react';
import { CodeEditor } from './CodeEditor';

interface FileManagerProps {
  currentPath: string;
  setCurrentPath: (path: string) => void;
}

interface FileItem {
  name: string;
  isDir: boolean;
  size: number;
  permissions: string;
  modified: string;
}

export const FileManager: React.FC<FileManagerProps> = ({ currentPath, setCurrentPath }) => {
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modals & Active actions
  const [activeEditorFile, setActiveEditorFile] = useState<{ path: string; content: string } | null>(null);
  const [createModal, setCreateModal] = useState<'file' | 'dir' | null>(null);
  const [newItemName, setNewItemName] = useState('');
  
  // Chmod Modal
  const [chmodItem, setChmodItem] = useState<FileItem | null>(null);
  const [newPerms, setNewPerms] = useState('755');

  // Archive Modal
  const [archiveItem, setArchiveItem] = useState<FileItem | null>(null);
  const [archiveFormat, setArchiveFormat] = useState<'zip' | 'tar.gz'>('tar.gz');

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  const fetchFiles = async (path: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      const data = await res.json();
      if (data.success) {
        if (data.isFile) {
          // It's a file, open editor
          setActiveEditorFile({ path: data.currentPath, content: data.content });
        } else {
          setItems(data.data || []);
          setCurrentPath(data.currentPath);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleOpenItem = (item: FileItem) => {
    const target = currentPath.endsWith('/') ? `${currentPath}${item.name}` : `${currentPath}/${item.name}`;
    if (item.isDir) {
      setCurrentPath(target);
    } else {
      fetchFiles(target);
    }
  };

  const handleNavigateUp = () => {
    if (currentPath === '/' || currentPath === '') return;
    let parent = currentPath.substring(0, currentPath.lastIndexOf('/'));
    if (!parent) parent = '/';
    setCurrentPath(parent);
  };

  const handleCreate = async () => {
    if (!newItemName) return;
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          targetPath: currentPath,
          name: newItemName,
          isDir: createModal === 'dir'
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchFiles(currentPath);
        setCreateModal(null);
        setNewItemName('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (itemName: string) => {
    if (!confirm(`Are you sure you want to delete ${itemName}?`)) return;
    const target = currentPath.endsWith('/') ? `${currentPath}${itemName}` : `${currentPath}/${itemName}`;
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', targetPath: target })
      });
      const data = await res.json();
      if (data.success) fetchFiles(currentPath);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveFile = async (path: string, content: string) => {
    try {
      await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', targetPath: path, content })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleExecuteChmod = async () => {
    if (!chmodItem) return;
    const target = currentPath.endsWith('/') ? `${currentPath}${chmodItem.name}` : `${currentPath}/${chmodItem.name}`;
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chmod', targetPath: target, permissions: newPerms })
      });
      const data = await res.json();
      if (data.success) {
        fetchFiles(currentPath);
        setChmodItem(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExecuteArchive = async () => {
    if (!archiveItem) return;
    const target = currentPath.endsWith('/') ? `${currentPath}${archiveItem.name}` : `${currentPath}/${archiveItem.name}`;
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', targetPath: target, format: archiveFormat })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchFiles(currentPath);
        setArchiveItem(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      
      {/* File Manager Control Header */}
      <div className="bg-arch-card border border-arch-border rounded-3xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        
        {/* Navigation Breadcrumbs & Input */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleNavigateUp}
            disabled={currentPath === '/'}
            className="p-3 bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-50 disabled:hover:bg-white/5 rounded-2xl text-white transition-all border border-white/10"
            title="Up directory"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          
          <div className="flex-1 md:w-80 bg-[#06080D] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
            <span className="font-mono text-arch-cyan font-bold">path:</span>
            <input
              type="text"
              value={currentPath}
              onChange={(e) => setCurrentPath(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchFiles(currentPath)}
              className="bg-transparent font-mono text-sm text-white focus:outline-none w-full"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => setCreateModal('file')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/15 active:scale-95 text-white px-4 py-3 rounded-2xl text-sm font-mono font-medium transition-all border border-white/10"
          >
            <Plus className="w-4 h-4 text-arch-cyan" />
            <span>New File</span>
          </button>
          
          <button
            onClick={() => setCreateModal('dir')}
            className="flex items-center gap-2 bg-gradient-to-r from-arch-cyan to-arch-blue hover:opacity-90 active:scale-95 text-white px-4 py-3 rounded-2xl text-sm font-mono font-bold transition-all shadow-lg shadow-arch-cyan/20"
          >
            <Folder className="w-4 h-4" />
            <span>New Folder</span>
          </button>
        </div>

      </div>

      {/* FILE & FOLDER LIST */}
      <div className="bg-arch-card border border-arch-border rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
        
        {/* Header Column */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10 font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div className="col-span-6">Name</div>
          <div className="col-span-2 text-right">Size</div>
          <div className="col-span-2 text-center">Permissions</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="p-12 text-center font-mono text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-arch-cyan" />
            <span>Accessing macOS Filesystem...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="p-12 text-center font-mono text-slate-500">
            No items inside this directory.
          </div>
        )}

        {/* Items */}
        {!loading && (
          <div className="divide-y divide-white/5">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-all duration-150 font-mono text-sm"
              >
                {/* Name */}
                <div
                  onClick={() => handleOpenItem(item)}
                  className="col-span-6 flex items-center gap-3 cursor-pointer text-slate-200 hover:text-arch-cyan transition-colors"
                >
                  {item.isDir ? (
                    <Folder className="w-5 h-5 text-arch-cyan flex-shrink-0" />
                  ) : (
                    <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                  <span className="truncate font-medium">{item.name}</span>
                </div>

                {/* Size */}
                <div className="col-span-2 text-right text-xs text-slate-400">
                  {item.isDir ? '--' : formatFileSize(item.size)}
                </div>

                {/* Permissions Badge */}
                <div className="col-span-2 text-center">
                  <span
                    onClick={() => { setChmodItem(item); setNewPerms('755'); }}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-white/5 text-slate-300 border border-white/10 cursor-pointer hover:border-arch-cyan hover:text-arch-cyan transition-all"
                    title="Click to modify chmod"
                  >
                    <Shield className="w-3 h-3 text-slate-400" />
                    <span>{item.permissions}</span>
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  {!item.isDir && (
                    <button
                      onClick={() => handleOpenItem(item)}
                      className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                      title="Edit file"
                    >
                      <Edit3 className="w-4 h-4 text-arch-cyan" />
                    </button>
                  )}

                  <button
                    onClick={() => { setArchiveItem(item); }}
                    className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                    title="Archive / Compress"
                  >
                    <Archive className="w-4 h-4 text-amber-400" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.name)}
                    className="p-2 hover:bg-rose-500/20 rounded-xl text-slate-400 hover:text-rose-400 transition-all"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* CODE EDITOR MODAL */}
      {activeEditorFile && (
        <CodeEditor
          filePath={activeEditorFile.path}
          initialContent={activeEditorFile.content}
          onSave={handleSaveFile}
          onClose={() => { setActiveEditorFile(null); fetchFiles(currentPath); }}
        />
      )}

      {/* CREATE MODAL */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/70 animate-fadeIn">
          <div className="w-full max-w-md bg-arch-dark border border-arch-border rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-mono text-lg font-bold text-white">
                Create New {createModal === 'dir' ? 'Folder' : 'File'}
              </h3>
              <button onClick={() => setCreateModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-2">Item Name</label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={createModal === 'dir' ? 'e.g. projects' : 'e.g. notes.md'}
                className="w-full bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-arch-cyan"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCreateModal(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-arch-cyan to-arch-blue text-white font-mono text-xs font-bold shadow-lg shadow-arch-cyan/20"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHMOD MODAL */}
      {chmodItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/70 animate-fadeIn">
          <div className="w-full max-w-md bg-arch-dark border border-arch-border rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-mono text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-arch-cyan" />
                <span>Modify Chmod</span>
              </h3>
              <button onClick={() => setChmodItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono mb-4">
                Target: <strong className="text-white">{chmodItem.name}</strong>
              </p>
              <label className="text-xs font-mono text-slate-400 block mb-2">Octal Permissions</label>
              <input
                type="text"
                value={newPerms}
                onChange={(e) => setNewPerms(e.target.value)}
                placeholder="755"
                className="w-full bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-arch-cyan"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setChmodItem(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteChmod}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-arch-cyan to-arch-blue text-white font-mono text-xs font-bold shadow-lg shadow-arch-cyan/20"
              >
                Apply (chmod)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE MODAL */}
      {archiveItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/70 animate-fadeIn">
          <div className="w-full max-w-md bg-arch-dark border border-arch-border rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-mono text-lg font-bold text-white flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-400" />
                <span>Create Archive</span>
              </h3>
              <button onClick={() => setArchiveItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono mb-4">
                Target: <strong className="text-white">{archiveItem.name}</strong>
              </p>
              <label className="text-xs font-mono text-slate-400 block mb-2">Compression Format</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setArchiveFormat('tar.gz')}
                  className={`p-3 rounded-xl font-mono text-xs border transition-all ${
                    archiveFormat === 'tar.gz' ? 'bg-arch-cyan/20 border-arch-cyan text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  .tar.gz (Tape Archive)
                </button>
                <button
                  onClick={() => setArchiveFormat('zip')}
                  className={`p-3 rounded-xl font-mono text-xs border transition-all ${
                    archiveFormat === 'zip' ? 'bg-arch-cyan/20 border-arch-cyan text-white' : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  .zip
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setArchiveItem(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteArchive}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-arch-cyan to-arch-blue text-white font-mono text-xs font-bold shadow-lg shadow-arch-cyan/20"
              >
                Compress Now
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
