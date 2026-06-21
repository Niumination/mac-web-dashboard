import React, { useState } from 'react';
import { Save, X, Terminal, Check, Copy } from 'lucide-react';

interface CodeEditorProps {
  filePath: string;
  initialContent: string;
  onSave: (path: string, content: string) => Promise<void>;
  onClose: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ filePath, initialContent, onSave, onClose }) => {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(filePath, content);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/70 animate-fadeIn">
      <div className="w-full max-w-5xl bg-arch-dark border border-arch-border rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
        
        {/* Editor Top Bar */}
        <div className="px-6 py-4 bg-arch-card border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-arch-cyan" />
            <div>
              <h3 className="font-mono text-sm font-bold text-white">{filePath}</h3>
              <p className="text-[10px] font-mono text-slate-400">Dotfiles & Core Configuration Editor</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-arch-cyan to-arch-blue hover:opacity-90 active:scale-95 text-white font-mono text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-arch-cyan/20"
            >
              {saving ? (
                <span>Saving...</span>
              ) : saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Config</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Text Area (Monaco-like Style) */}
        <div className="flex-1 relative flex bg-[#06080D]">
          {/* Line Numbers */}
          <div className="w-12 py-4 bg-[#090C12] border-r border-white/5 font-mono text-xs text-slate-600 select-none text-right pr-3 space-y-1">
            {content.split('\n').map((_, idx) => (
              <div key={idx}>{idx + 1}</div>
            ))}
          </div>

          {/* Actual Input Area */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 p-4 bg-transparent font-mono text-xs text-slate-200 focus:outline-none resize-none leading-relaxed tracking-wide"
            spellCheck={false}
          />
        </div>

        {/* Editor Bottom Bar */}
        <div className="px-6 py-2.5 bg-arch-card border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-4">
            <span>Spaces: 2</span>
            <span>UTF-8</span>
            <span>Arch Linux Native Access</span>
          </div>
          <div>
            <span>{content.split('\n').length} lines</span>
          </div>
        </div>

      </div>
    </div>
  );
};
