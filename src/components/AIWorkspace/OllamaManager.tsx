'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Cpu, Download, Trash2, Send, MessageSquare, RefreshCw, Terminal } from 'lucide-react';

interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  modified_at: string;
  details?: { parameter_size?: string; quantization_level?: string };
}

interface OllamaStatus {
  running: boolean;
  pid?: number;
  models?: { models: OllamaModel[] };
  active?: { models: { name: string; size: number }[] };
}

function formatBytes(bytes: number): string {
  if (bytes < 1_000_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
}

export default function OllamaManager() {
  const [status, setStatus] = useState<OllamaStatus>({ running: false });
  const [loading, setLoading] = useState(true);
  const [pullModel, setPullModel] = useState('');
  const [pulling, setPulling] = useState(false);
  const [pullOutput, setPullOutput] = useState('');
  const [chatModel, setChatModel] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatting, setChatting] = useState(false);
  const [chatOutput, setChatOutput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/agents/ollama');
      const data = await res.json();
      setStatus(data);
      if (data.models?.models?.length > 0 && !chatModel) {
        setChatModel(data.models.models[0].name);
      }
    } catch {
      setStatus({ running: false });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handlePull = async () => {
    if (!pullModel.trim()) return;
    setPulling(true);
    setPullOutput(`Pulling ${pullModel}...`);
    try {
      const res = await fetch('/api/agents/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull', model: pullModel }),
      });
      const data = await res.json();
      setPullOutput(data.output || data.error || 'Done');
      await fetchStatus();
    } catch (e: any) {
      setPullOutput(`Error: ${e.message}`);
    }
    setPulling(false);
  };

  const handleDelete = async (model: string) => {
    try {
      await fetch('/api/agents/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', model }),
      });
      await fetchStatus();
    } catch {}
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !chatModel || chatting) return;
    setChatting(true);
    setChatOutput(prev => prev + `\n\n>>> ${chatInput}\n`);
    const input = chatInput;
    setChatInput('');

    try {
      const res = await fetch('/api/agents/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'proxy',
          endpoint: 'api/generate',
          data: { model: chatModel, prompt: input, stream: false },
        }),
      });
      const data = await res.json();
      setChatOutput(prev => prev + `${data.response || JSON.stringify(data, null, 2)}\n`);
    } catch (e: any) {
      setChatOutput(prev => prev + `Error: ${e.message}\n`);
    }
    setChatting(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatOutput]);

  return (
    <div className="space-y-6">
      {/* Status card */}
      <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${status.running ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <Cpu className={`w-5 h-5 ${status.running ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white">Ollama</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${status.running ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className={`text-[10px] font-mono ${status.running ? 'text-emerald-400' : 'text-red-400'}`}>
                  {status.running ? `Running on port 11434${status.pid ? ` (PID ${status.pid})` : ''}` : 'Not running'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={fetchStatus} className="bg-white/10 hover:bg-white/15 active:scale-95 p-2 rounded-xl transition-all border border-white/10">
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {!status.running ? (
        <div className="bg-arch-card border border-arch-border rounded-3xl p-8 text-center backdrop-blur-xl">
          <Cpu className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold font-mono text-slate-400 mb-1">Ollama Offline</h3>
          <p className="text-sm font-mono text-slate-500">Ollama is not running. Start it from the Applications folder or via terminal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Model list + pull */}
          <div className="lg:col-span-1 space-y-4">
            {/* Pull model */}
            <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
              <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2 mb-3">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pull Model</span>
              </h3>
              <div className="flex items-center gap-2">
                <input
                  value={pullModel}
                  onChange={e => setPullModel(e.target.value)}
                  placeholder="e.g. llama3.2:3b"
                  disabled={pulling}
                  className="flex-1 bg-[#06080D] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                />
                <button onClick={handlePull} disabled={!pullModel.trim() || pulling}
                  className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 active:scale-95 disabled:opacity-50 text-white p-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
              {pullOutput && (
                <div className="mt-2 bg-[#06080D] border border-white/10 rounded-xl p-2 text-[10px] font-mono text-slate-400 max-h-20 overflow-y-auto whitespace-pre-wrap">
                  {pullOutput}
                </div>
              )}
            </div>

            {/* Model list */}
            <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
              <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2 mb-3">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Models</span>
              </h3>
              {(!status.models?.models || status.models.models.length === 0) ? (
                <div className="text-[10px] font-mono text-slate-600 text-center py-4">No models pulled yet</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {status.models.models.map(model => (
                    <div key={model.digest} className="bg-[#06080D] border border-white/10 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold font-mono text-white">{model.name.replace(':latest', '')}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {formatBytes(model.size)}
                            {model.details?.parameter_size ? ` · ${model.details.parameter_size}` : ''}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setChatModel(model.name)}
                            className={`p-1.5 rounded-lg transition-all ${
                              chatModel === model.name
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'text-slate-500 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDelete(model.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2 bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl flex flex-col h-[500px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
              <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Chat with</span>
                <select value={chatModel} onChange={e => setChatModel(e.target.value)}
                  className="bg-[#06080D] border border-white/10 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none"
                >
                  {(status.models?.models ?? []).map(m => (
                    <option key={m.digest} value={m.name}>{m.name.replace(':latest', '')}</option>
                  ))}
                  {(!status.models?.models?.length) && <option value="">No models</option>}
                </select>
              </h3>
              <button onClick={() => setChatOutput('')} className="text-[10px] text-slate-500 hover:text-white transition-colors">Clear</button>
            </div>

            <div className="flex-1 overflow-y-auto mb-3 pr-1">
              <div ref={chatEndRef} className="font-mono text-xs text-slate-300 whitespace-pre-wrap">
                {chatOutput || <span className="text-slate-600">Select a model and send a message...</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                placeholder="Type a message..."
                disabled={chatting || !chatModel}
                className="flex-1 bg-[#06080D] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
              />
              <button onClick={handleChat} disabled={!chatInput.trim() || chatting || !chatModel}
                className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 active:scale-95 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
