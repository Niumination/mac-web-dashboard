'use client';

import React, { useState } from 'react';
import { Bot, Cpu, Globe, Terminal as TerminalIcon, Code, Send, Sparkles, ChevronRight, AlertCircle } from 'lucide-react';

const ROUTES: Record<string, { agents: string[]; description: string }> = {
  code: { agents: ['claude', 'codex', 'opencode'], description: 'Write, review, or debug code' },
  chat: { agents: ['hermes'], description: 'General chat, research, creative tasks' },
  query: { agents: ['ollama'], description: 'Quick factual queries, local inference' },
  full: { agents: ['ollama', 'hermes', 'claude'], description: 'Multi-agent — compare responses' },
  security: { agents: ['claude', 'codex'], description: 'Security audit, vulnerability analysis' },
};

const INTENT_KEYWORDS: [RegExp, string][] = [
  [/code|write|implement|function|bug|debug|refactor|test|api|endpoint/i, 'code'],
  [/security|vuln|exploit|pentest|audit|CVE/i, 'security'],
  [/search|find|what is|who|when|where|fact|research/i, 'query'],
  [/chat|hello|halo|help|think|brainstorm|idea/i, 'chat'],
];

function detectIntent(prompt: string): string {
  for (const [regex, route] of INTENT_KEYWORDS) {
    if (regex.test(prompt)) return route;
  }
  return 'full';
}

const AGENT_ICONS: Record<string, React.ElementType> = {
  ollama: Cpu, hermes: Bot, claude: TerminalIcon, codex: Code, opencode: Globe,
};

const AGENT_COLORS: Record<string, string> = {
  ollama: 'from-emerald-600 to-teal-500', hermes: 'from-violet-600 to-indigo-500',
  claude: 'from-orange-600 to-amber-500', codex: 'from-sky-600 to-blue-500',
  opencode: 'from-cyan-600 to-blue-500',
};

export default function SmartRouter() {
  const [prompt, setPrompt] = useState('');
  const [detectedRoute, setDetectedRoute] = useState('full');
  const [results, setResults] = useState<Record<string, { success: boolean; output: string }> | null>(null);
  const [running, setRunning] = useState(false);
  const [customAgents, setCustomAgents] = useState<string[]>([]);
  const [useCustom, setUseCustom] = useState(false);

  const handleDetect = () => {
    if (!prompt.trim()) return;
    const intent = detectIntent(prompt);
    setDetectedRoute(intent);
    setUseCustom(false);
  };

  const handleRun = async () => {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setResults(null);

    if (!useCustom) handleDetect();
    const agents = useCustom && customAgents.length > 0 ? customAgents : ROUTES[detectedRoute]?.agents || ['ollama'];

    try {
      const res = await fetch('/api/agents/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, agents }),
      });
      const data = await res.json();
      setResults(data.results || {});
    } catch (e: any) {
      setResults({ _error: { success: false, output: e.message } });
    }
    setRunning(false);
  };

  const toggleAgent = (id: string) => {
    setCustomAgents(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev]
    );
  };

  const currentRoute = useCustom ? null : ROUTES[detectedRoute];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-3xl p-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-xs font-mono text-violet-300">
          <Sparkles className="w-4 h-4" />
          <span>Smart Router — intent detection determines the best agent(s) for your task</span>
        </div>
      </div>

      <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
        <textarea
          value={prompt}
          onChange={e => { setPrompt(e.target.value); if (results) setResults(null); }}
          placeholder="What do you want to do? e.g. 'write a python script to sort files' or 'what is the capital of Indonesia?'"
          rows={3}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleDetect(); } }}
          className="w-full bg-[#06080D] border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-all resize-none"
        />

        <div className="flex items-center gap-2 mt-3">
          <button onClick={handleDetect} disabled={!prompt.trim()}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 active:scale-95 disabled:opacity-50 text-slate-300 px-3 py-1.5 rounded-xl text-[10px] font-mono transition-all"
          >
            <Sparkles className="w-3 h-3" />
            <span>Detect Intent</span>
          </button>
          <button onClick={handleRun} disabled={!prompt.trim() || running}
            className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-90 active:scale-95 disabled:opacity-50 text-white px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-lg shadow-violet-500/20"
          >
            <Send className="w-3 h-3" />
            <span>{running ? 'Running...' : 'Execute'}</span>
          </button>
        </div>

        {/* Route info */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Route:</span>
          {useCustom ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {customAgents.map(a => (
                <span key={a} className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-violet-500/20 text-violet-300 border border-violet-500/30">{a}</span>
              ))}
              <button onClick={() => setUseCustom(false)} className="text-[10px] text-slate-500 hover:text-white ml-1">Use auto</button>
            </div>
          ) : currentRoute ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 capitalize">{detectedRoute}</span>
              {currentRoute.agents.map(a => (
                <span key={a} className="text-[10px] font-mono text-slate-400">{a}</span>
              ))}
              <span className="text-[10px] text-slate-600">· {currentRoute.description}</span>
              <button onClick={() => { setUseCustom(true); setCustomAgents(currentRoute.agents); }} className="text-[10px] text-slate-500 hover:text-white ml-1">Edit</button>
            </div>
          ) : null}
        </div>
      </div>

      {useCustom && (
        <div className="bg-arch-card border border-arch-border rounded-3xl p-4 backdrop-blur-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase mb-2">Custom Agent Selection</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(AGENT_ICONS).map(([id, Icon]) => (
              <button key={id} onClick={() => toggleAgent(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-mono transition-all ${
                  customAgents.includes(id)
                    ? `bg-gradient-to-r ${AGENT_COLORS[id]} text-white`
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{id}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {results && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(results).map(([agentId, result]) => {
            const Icon = AGENT_ICONS[agentId] || Bot;
            const color = AGENT_COLORS[agentId] || 'from-slate-600 to-slate-500';
            return (
              <div key={agentId} className="bg-arch-card border border-arch-border rounded-3xl p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${color}`}>
                    <Icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-xs font-bold font-mono text-white capitalize">{agentId}</span>
                  {result.success
                    ? <span className="text-[10px] text-emerald-400 ml-auto">✓</span>
                    : <AlertCircle className="w-3 h-3 text-red-400 ml-auto" />
                  }
                </div>
                <div className="bg-[#06080D] border border-white/10 rounded-xl p-3 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {result.output?.slice(0, 2000) || (result.success ? '(empty)' : 'Error')}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
