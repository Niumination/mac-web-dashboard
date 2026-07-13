'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Monitor, Layers, User, RefreshCw, Send, Eye, CheckCircle, Clock } from 'lucide-react';

interface HerdrAgent {
  agent?: string;
  name?: string;
  label?: string;
  agent_status: string;
  cwd: string;
  pane_id: string;
  tab_id: string;
  workspace_id: string;
  agent_session?: { value: string };
  focused?: boolean;
}

interface HerdrTab {
  tab_id: string;
  label: string;
  number: number;
  agent_status: string;
  focused: boolean;
  pane_count: number;
  workspace_id: string;
}

interface HerdrWorkspace {
  workspace_id: string;
  label: string;
  number: number;
  focused: boolean;
  tab_count: number;
  pane_count: number;
  agent_status: string;
  active_tab_id: string;
}

export default function HerdrManager() {
  const [agents, setAgents] = useState<HerdrAgent[]>([]);
  const [tabs, setTabs] = useState<HerdrTab[]>([]);
  const [workspaces, setWorkspaces] = useState<HerdrWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [agentOutput, setAgentOutput] = useState('');
  const [sendText, setSendText] = useState('');
  const [sendResult, setSendResult] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/agents/herdr?resource=snapshot');
      const d = await res.json();
      if (d.success) {
        setAgents(d.snapshot.agents || []);
        setTabs(d.snapshot.tabs || []);
        setWorkspaces(d.snapshot.workspaces || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const readAgent = async (target: string) => {
    setSelectedTarget(target);
    setAgentOutput('Loading...');
    try {
      const res = await fetch('/api/agents/herdr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'agent-read', target }),
      });
      const d = await res.json();
      setAgentOutput(d.success ? d.output : d.error || 'Failed');
    } catch {
      setAgentOutput('Request failed');
    }
  };

  const sendToAgent = async () => {
    if (!selectedTarget || !sendText.trim()) return;
    setSendResult('Sending...');
    try {
      const res = await fetch('/api/agents/herdr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'agent-send', target: selectedTarget, text: sendText }),
      });
      const d = await res.json();
      setSendResult(d.success ? 'Sent successfully' : d.error || 'Failed');
      setSendText('');
    } catch {
      setSendResult('Request failed');
    }
  };

  const getAgentName = (a: HerdrAgent) => a.name || a.label || a.agent || 'unknown';

  const iconMap: Record<string, React.ReactNode> = {
    opencode: <Terminal className="w-4 h-4 text-cyan-400" />,
  };

  const statusColor = (s: string) => {
    if (s === 'working') return 'text-emerald-400';
    if (s === 'idle') return 'text-yellow-400';
    return 'text-slate-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-arch-card border border-arch-border rounded-3xl p-4">
          <div className="text-[10px] font-mono text-slate-500">Agents</div>
          <div className="text-2xl font-extrabold font-mono text-white mt-1">{agents.length}</div>
        </div>
        <div className="bg-arch-card border border-arch-border rounded-3xl p-4">
          <div className="text-[10px] font-mono text-slate-500">Working</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">{agents.filter(a => a.agent_status === 'working').length}</div>
        </div>
        <div className="bg-arch-card border border-arch-border rounded-3xl p-4">
          <div className="text-[10px] font-mono text-slate-500">Idle</div>
          <div className="text-2xl font-extrabold font-mono text-yellow-400 mt-1">{agents.filter(a => a.agent_status === 'idle').length}</div>
        </div>
        <div className="bg-arch-card border border-arch-border rounded-3xl p-4">
          <div className="text-[10px] font-mono text-slate-500">Tabs</div>
          <div className="text-2xl font-extrabold font-mono text-white mt-1">{tabs.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-arch-card border border-arch-border rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold font-mono text-slate-400 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-violet-400" />
              <span>Agents</span>
            </h3>
            <button onClick={fetchData} className="p-1 hover:bg-white/10 rounded-lg transition-all">
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>

          <div className="space-y-2">
            {agents.map((a, i) => {
              const name = getAgentName(a);
              const key = a.pane_id || `agent-${i}`;
              return (
                <div
                  key={key}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                    selectedTarget === key
                      ? 'bg-violet-500/10 border-violet-500/30'
                      : 'bg-[#06080D] border-white/5 hover:border-white/20'
                  }`}
                  onClick={() => readAgent(key)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {iconMap[name] || <User className="w-4 h-4 text-slate-400" />}
                    <div className="min-w-0">
                      <div className="text-xs font-bold font-mono text-white truncate">{name}</div>
                      <div className="text-[9px] font-mono text-slate-600 truncate">{a.cwd}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.agent_session && (
                      <span className="text-[9px] font-mono text-slate-600">ses</span>
                    )}
                    <span className={`text-[10px] font-mono ${statusColor(a.agent_status)}`}>
                      {a.agent_status === 'working' ? '●' : '○'} {a.agent_status}
                    </span>
                  </div>
                </div>
              );
            })}
            {agents.length === 0 && (
              <div className="text-[10px] font-mono text-slate-600 text-center py-4">No agents detected</div>
            )}
          </div>
        </div>

        <div className="bg-arch-card border border-arch-border rounded-3xl p-5">
          <h3 className="text-xs font-bold font-mono text-slate-400 flex items-center gap-2 mb-3">
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            <span>Workspace: Tabs</span>
          </h3>
          <div className="space-y-1">
            {workspaces.map(w => (
              <div key={w.workspace_id} className="mb-3">
                <div className="text-[10px] font-mono text-slate-500 mb-1">
                  {w.label} ({w.tab_count} tabs, {w.pane_count} panes)
                  {w.focused && <span className="text-emerald-400 ml-1">◀</span>}
                </div>
                <div className="space-y-0.5 ml-2">
                  {tabs.filter(t => t.workspace_id === w.workspace_id).map(t => (
                    <div key={t.tab_id} className="flex items-center gap-2 text-[10px] font-mono">
                      <span className={`w-1.5 h-1.5 rounded-full ${t.agent_status === 'working' ? 'bg-emerald-400' : t.agent_status === 'idle' ? 'bg-yellow-400' : 'bg-slate-600'}`} />
                      <span className={t.focused ? 'text-white' : 'text-slate-500'}>
                        {t.label}
                      </span>
                      {t.focused && <span className="text-emerald-400 text-[8px]">active</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-arch-card border border-arch-border rounded-3xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold font-mono text-slate-400 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-violet-400" />
              <span>Agent Output</span>
            </h3>
            <span className="text-[9px] font-mono text-slate-600">{selectedTarget || 'none selected'}</span>
          </div>
          <div className="bg-[#06080D] border border-white/10 rounded-2xl p-3 font-mono text-[10px] text-slate-400 max-h-48 overflow-y-auto whitespace-pre-wrap">
            {agentOutput || <span className="text-slate-600">Click an agent to read output</span>}
          </div>
        </div>

        <div className="bg-arch-card border border-arch-border rounded-3xl p-5">
          <h3 className="text-xs font-bold font-mono text-slate-400 flex items-center gap-2 mb-2">
            <Send className="w-3.5 h-3.5 text-violet-400" />
            <span>Send Command</span>
          </h3>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={sendText}
              onChange={e => setSendText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendToAgent()}
              placeholder="Type a command..."
              disabled={!selectedTarget}
              className="flex-1 bg-[#06080D] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
            />
            <button
              onClick={sendToAgent}
              disabled={!selectedTarget || !sendText.trim()}
              className="px-3 py-2 bg-violet-600/50 hover:bg-violet-600/70 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-all"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          {sendResult && (
            <div className="text-[10px] font-mono text-slate-500">{sendResult}</div>
          )}
        </div>
      </div>
    </div>
  );
}
