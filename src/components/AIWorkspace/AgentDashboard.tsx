'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Cpu, Terminal, Globe, Puzzle, Rocket, Activity, ChevronRight, BrainCircuit, RefreshCw } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: 'server' | 'cli' | 'app' | 'launchd';
  status: 'running' | 'stopped' | 'installed';
  version?: string;
  port?: number;
  pid?: number | null;
  path?: string;
}

const AGENT_ICONS: Record<string, React.ElementType> = {
  ollama: Cpu,
  hermes: Bot,
  'hermes-dashboard': Bot,
  claude: Terminal,
  codex: Terminal,
  opencode: Terminal,
  'cursor-agent': Terminal,
  mimo: Rocket,
  'agent-browser': Globe,
};

const AGENT_COLORS: Record<string, string> = {
  ollama: 'from-emerald-600 to-teal-500',
  hermes: 'from-violet-600 to-indigo-500',
  'hermes-dashboard': 'from-violet-600 to-indigo-500',
  claude: 'from-orange-600 to-amber-500',
  codex: 'from-sky-600 to-blue-500',
  opencode: 'from-cyan-600 to-blue-500',
  'cursor-agent': 'from-rose-600 to-pink-500',
  mimo: 'from-purple-600 to-fuchsia-500',
  'agent-browser': 'from-yellow-600 to-amber-500',
};

export default function AgentDashboard() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (data.success) setAgents(data.agents);
      else setError(data.error || 'Failed to fetch');
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 15000);
    return () => clearInterval(interval);
  }, []);

  const runningCount = agents.filter(a => a.status === 'running').length;
  const installedCount = agents.filter(a => a.status === 'installed').length;
  const totalCount = agents.length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Agents</div>
          <div className="text-3xl font-extrabold font-mono text-white mt-1">{totalCount}</div>
        </div>
        <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Running</div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">{runningCount}</div>
        </div>
        <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Available</div>
          <div className="text-3xl font-extrabold font-mono text-violet-400 mt-1">{installedCount}</div>
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => {
          const Icon = AGENT_ICONS[agent.id] || BrainCircuit;
          const color = AGENT_COLORS[agent.id] || 'from-slate-600 to-slate-500';
          return (
            <div key={agent.id} className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl hover:border-white/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} bg-opacity-20`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white">{agent.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        agent.status === 'running' ? 'bg-emerald-400' :
                        agent.status === 'stopped' ? 'bg-red-400' :
                        'bg-amber-400'
                      }`} />
                      <span className={`text-[10px] font-mono ${
                        agent.status === 'running' ? 'text-emerald-400' :
                        agent.status === 'stopped' ? 'text-red-400' :
                        'text-amber-400'
                      }`}>
                        {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-500 uppercase px-2 py-1 bg-white/5 rounded-lg">{agent.type}</span>
              </div>

              <div className="mt-4 space-y-1.5 text-[11px] font-mono text-slate-400">
                {agent.version && (
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span>v{agent.version}</span>
                  </div>
                )}
                {agent.port && (
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span>Port {agent.port}</span>
                  </div>
                )}
                {agent.pid && (
                  <div className="flex items-center gap-2">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span>PID {agent.pid}</span>
                  </div>
                )}
                {agent.path && (
                  <div className="flex items-center gap-2 truncate">
                    <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                    <span className="truncate">{agent.path}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {loading && agents.length === 0 && (
        <div className="text-center py-12 text-slate-500 font-mono text-sm">Scanning for agents...</div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-4 text-red-400 font-mono text-xs">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <button onClick={fetchAgents}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 active:scale-95 text-slate-300 px-5 py-2.5 rounded-xl text-sm font-mono transition-all border border-white/10"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>
    </div>
  );
}
