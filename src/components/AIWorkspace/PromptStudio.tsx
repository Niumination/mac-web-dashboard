'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Code, Cpu, Globe, Terminal as TerminalIcon, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const AGENT_OPTIONS = [
  { id: 'ollama', label: 'Ollama', icon: Cpu, color: 'from-emerald-600 to-teal-500' },
  { id: 'hermes', label: 'Hermes (Telegram)', icon: Bot, color: 'from-violet-600 to-indigo-500' },
  { id: 'claude', label: 'Claude Code', icon: TerminalIcon, color: 'from-orange-600 to-amber-500' },
  { id: 'codex', label: 'OpenAI Codex', icon: Code, color: 'from-sky-600 to-blue-500' },
  { id: 'opencode', label: 'OpenCode', icon: Globe, color: 'from-cyan-600 to-blue-500' },
];

export default function PromptStudio() {
  const [prompt, setPrompt] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['ollama']);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, { success: boolean; output: string }> | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const toggleAgent = (id: string) => {
    setSelectedAgents(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev]
    );
  };

  const handleRun = async () => {
    if (!prompt.trim() || running || selectedAgents.length === 0) return;
    setRunning(true);
    setResults(null);

    try {
      const res = await fetch('/api/agents/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, agents: selectedAgents }),
      });
      const data = await res.json();
      setResults(data.results || {});
    } catch (e: any) {
      setResults({ _error: { success: false, output: e.message } });
    }
    setRunning(false);
  };

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [results]);

  return (
    <div className="space-y-6">
      <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
        <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2 mb-3">
          <Send className="w-3.5 h-3.5 text-violet-400" />
          <span>Prompt</span>
        </h3>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter your prompt..."
          rows={4}
          className="w-full bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-all resize-none"
        />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Target:</span>
          {AGENT_OPTIONS.map(agent => (
            <button key={agent.id} onClick={() => toggleAgent(agent.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all ${
                selectedAgents.includes(agent.id)
                  ? `bg-gradient-to-r ${agent.color} text-white shadow-md`
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
              }`}
            >
              <agent.icon className="w-3 h-3" />
              <span>{agent.label}</span>
            </button>
          ))}
          <div className="ml-auto">
            <button onClick={handleRun} disabled={!prompt.trim() || running || selectedAgents.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-90 active:scale-95 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-500/20"
            >
              {running ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>{running ? 'Running...' : `Run on ${selectedAgents.length} agent${selectedAgents.length > 1 ? 's' : ''}`}</span>
            </button>
          </div>
        </div>
      </div>

      {results && (
        <div ref={outputRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(results).map(([agentId, result]) => {
            const agent = AGENT_OPTIONS.find(a => a.id === agentId);
            const Icon = agent?.icon || Bot;
            const color = agent?.color || 'from-slate-600 to-slate-500';
            return (
              <div key={agentId} className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl flex flex-col">
                <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-bold font-mono text-white">{agent?.label || agentId}</span>
                  {result.success
                    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 ml-auto" />
                    : <AlertCircle className="w-3.5 h-3.5 text-red-400 ml-auto" />
                  }
                </div>
                <div className="flex-1 bg-[#06080D] border border-white/10 rounded-2xl p-3 font-mono text-xs text-slate-300 overflow-y-auto max-h-60 whitespace-pre-wrap">
                  {result.output || (result.success ? '(empty response)' : 'Error')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
