'use client';

import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, Trash2, Save, ExternalLink, Check, X } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  description: string;
  agents: string[];
  projects: string[];
  created: string;
  updated: string;
}

const AGENT_OPTIONS = [
  { id: 'ollama', label: 'Ollama' },
  { id: 'hermes', label: 'Hermes Agent' },
  { id: 'hermes-dashboard', label: 'Hermes Dashboard' },
  { id: 'claude', label: 'Claude Code' },
  { id: 'codex', label: 'OpenAI Codex' },
  { id: 'opencode', label: 'OpenCode' },
  { id: 'cursor-agent', label: 'Cursor Agent' },
  { id: 'mimo', label: 'Mimo AI' },
  { id: 'agent-browser', label: 'Agent Browser' },
];

export default function WorkspaceManager() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAgents, setFormAgents] = useState<string[]>([]);

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/agents/workspace');
      const data = await res.json();
      if (data.success) setWorkspaces(data.workspaces);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    try {
      const res = await fetch('/api/agents/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: formName,
          description: formDesc,
          agents: formAgents,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWorkspaces(prev => [...prev, data.workspace]);
        setShowCreate(false);
        resetForm();
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch('/api/agents/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (data.success) setWorkspaces(prev => prev.filter(w => w.id !== id));
    } catch {}
  };

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormAgents([]);
  };

  const toggleAgent = (agentId: string) => {
    setFormAgents(prev =>
      prev.includes(agentId) ? prev.filter(a => a !== agentId) : [...prev, agentId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-violet-400" />
          <span>Workspaces ({workspaces.length})</span>
        </h3>
        <button onClick={() => { setShowCreate(true); resetForm(); }}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-90 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Workspace</span>
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/70 animate-fadeIn">
          <div className="bg-arch-dark border border-white/10 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-mono text-white">Create Workspace</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-white/10 rounded-lg transition-all">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Name</label>
                <input value={formName} onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Security Audit, Web Dev, Daily Ops"
                  className="w-full bg-[#06080D] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                <input value={formDesc} onChange={e => setFormDesc(e.target.value)}
                  placeholder="What is this workspace for?"
                  className="w-full bg-[#06080D] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">Agents</label>
                <div className="flex flex-wrap gap-2">
                  {AGENT_OPTIONS.filter(a => a.id !== 'hermes-dashboard').map(agent => (
                    <button key={agent.id} onClick={() => toggleAgent(agent.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                        formAgents.includes(agent.id)
                          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                      }`}
                    >
                      {formAgents.includes(agent.id) && <Check className="w-3 h-3 inline mr-1" />}
                      {agent.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreate(false)}
                className="bg-white/10 hover:bg-white/15 active:scale-95 text-slate-300 px-4 py-2 rounded-xl text-xs font-medium transition-all border border-white/10"
              >
                Cancel
              </button>
              <button onClick={handleCreate} disabled={!formName.trim()}
                className="bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-90 active:scale-95 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-500/20 flex items-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workspace list */}
      {workspaces.length === 0 && !loading ? (
        <div className="bg-arch-card border border-arch-border rounded-3xl p-8 text-center backdrop-blur-xl">
          <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold font-mono text-slate-400 mb-1">No Workspaces Yet</h3>
          <p className="text-sm font-mono text-slate-500">Create a workspace to group your AI agents by project or workflow.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map(ws => (
            <div key={ws.id} className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl hover:border-white/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-500">
                    <FolderKanban className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white">{ws.name}</h3>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">{ws.description}</div>
                  </div>
                </div>
                <button onClick={() => handleDelete(ws.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {ws.agents.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {ws.agents.map(a => {
                    const opt = AGENT_OPTIONS.find(o => o.id === a);
                    return (
                      <span key={a} className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/5 text-slate-400 border border-white/10">
                        {opt?.label || a}
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 text-[10px] font-mono text-slate-600">
                Created {new Date(ws.created).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
