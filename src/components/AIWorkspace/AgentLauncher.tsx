'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Rocket, XCircle, Play, Square, Trash2, RefreshCw, ExternalLink } from 'lucide-react';

interface AgentProcess {
  id: string;
  agent: string;
  pid: number;
  started: number;
}

const LAUNCHABLE_AGENTS = [
  { id: 'claude', label: 'Claude Code', cmd: '/usr/local/bin/claude', color: 'from-orange-600 to-amber-500' },
  { id: 'codex', label: 'OpenAI Codex', cmd: '/usr/local/bin/codex', color: 'from-sky-600 to-blue-500' },
  { id: 'opencode', label: 'OpenCode', cmd: '/usr/local/bin/opencode', color: 'from-cyan-600 to-blue-500' },
  { id: 'cursor-agent', label: 'Cursor Agent', cmd: '~/.local/bin/cursor-agent', color: 'from-rose-600 to-pink-500' },
  { id: 'mimo', label: 'Mimo AI', cmd: '/usr/local/bin/mimo', color: 'from-purple-600 to-fuchsia-500' },
  { id: 'agent-browser', label: 'Agent Browser', cmd: '/usr/local/bin/agent-browser', color: 'from-yellow-600 to-amber-500' },
  { id: 'hermes', label: 'Hermes CLI', cmd: '~/.hermes-portable/venv/bin/hermes', color: 'from-violet-600 to-indigo-500' },
];

export default function AgentLauncher() {
  const [processes, setProcesses] = useState<AgentProcess[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [log, setLog] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const fetchProcesses = async () => {
    try {
      const res = await fetch('/api/agents/launch');
      const data = await res.json();
      if (data.success) setProcesses(data.processes);
    } catch {}
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const handleLaunch = async (agentId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', agent: agentId }),
      });
      const data = await res.json();
      if (data.success) {
        setLog(prev => prev + `[${new Date().toLocaleTimeString()}] Launched ${agentId} (PID ${data.pid})\n`);
        setActiveSession(data.sessionId);
        await fetchProcesses();
      } else {
        setLog(prev => prev + `[${new Date().toLocaleTimeString()}] Error: ${data.error}\n`);
      }
    } catch (e: any) {
      setLog(prev => prev + `[${new Date().toLocaleTimeString()}] Error: ${e.message}\n`);
    }
    setLoading(false);
  };

  const handleKill = async (pid: number) => {
    try {
      const res = await fetch('/api/agents/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'kill', pid }),
      });
      const data = await res.json();
      if (data.success) {
        setLog(prev => prev + `[${new Date().toLocaleTimeString()}] Killed PID ${pid}\n`);
        await fetchProcesses();
      }
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* Launchpad */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {LAUNCHABLE_AGENTS.map(agent => (
          <button
            key={agent.id}
            onClick={() => handleLaunch(agent.id)}
            disabled={loading}
            className="bg-arch-card border border-arch-border rounded-2xl p-4 hover:border-white/20 active:scale-95 transition-all text-center group disabled:opacity-50"
          >
            <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center mb-2`}>
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div className="text-[11px] font-bold font-mono text-white truncate">{agent.label}</div>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">{agent.cmd.split('/').pop()}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Running processes */}
        <div className="lg:col-span-1 bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
          <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2 mb-3">
            <Rocket className="w-3.5 h-3.5 text-sky-400" />
            <span>Running Processes ({processes.length})</span>
            <button onClick={fetchProcesses} className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-all">
              <RefreshCw className="w-3 h-3 text-slate-500" />
            </button>
          </h3>
          {processes.length === 0 ? (
            <div className="text-[10px] font-mono text-slate-600 text-center py-6">No agents running</div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {processes.map(p => {
                const agent = LAUNCHABLE_AGENTS.find(a => a.id === p.agent);
                return (
                  <div key={p.id} className="bg-[#06080D] border border-white/10 rounded-xl p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold font-mono text-white">{agent?.label || p.agent}</div>
                        <div className="text-[10px] font-mono text-slate-500">PID {p.pid} · {Math.floor((Date.now() - p.started) / 1000)}s ago</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleKill(p.pid)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Square className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Log */}
        <div className="lg:col-span-2 bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl flex flex-col h-[400px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
            <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              <span>Agent Log</span>
            </h3>
            <button onClick={() => setLog('')} className="text-[10px] text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
          <div ref={logRef} className="flex-1 bg-[#06080D] border border-white/10 rounded-2xl p-4 font-mono text-xs text-slate-400 overflow-y-auto whitespace-pre-wrap">
            {log || <span className="text-slate-600">Click an agent card to launch...<br/>Note: CLI agents run in the background. Use Terminal.app for interactive sessions.</span>}
          </div>
          <div className="mt-3 text-[10px] font-mono text-slate-600 flex items-center gap-2">
            <ExternalLink className="w-3 h-3" />
            <span>For interactive sessions, launch agents directly in Terminal.app</span>
          </div>
        </div>
      </div>
    </div>
  );
}
