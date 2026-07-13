'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Terminal, Activity, MessageSquare, Send, RefreshCw, Clock, Radio, FileText } from 'lucide-react';

interface HermesStatus {
  running: boolean;
  pid?: number;
  uptime?: number;
  detection?: string;
  connectedPlatforms?: string[];
  recentActivity?: ActivityEntry[];
  message?: string;
}

interface ActivityEntry {
  type: string;
  text: string;
  timestamp: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  type: string;
}

const SUB_TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'logs', label: 'Raw Logs', icon: FileText },
];

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function HermesConsole() {
  const [status, setStatus] = useState<HermesStatus>({ running: false });
  const [loading, setLoading] = useState(true);
  const [activeSubtab, setActiveSubtab] = useState('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [rawLogs, setRawLogs] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/agents/hermes');
      const data = await res.json();
      setStatus(data);
      if (data.recentActivity) {
        const chatMsgs = data.recentActivity.map((a: ActivityEntry) => ({
          role: a.type === 'inbound' ? 'user' as const : a.type === 'response' ? 'assistant' as const : 'system' as const,
          content: a.text,
          timestamp: a.timestamp,
          type: a.type,
        }));
        setMessages(prev => {
          const existing = new Set(prev.map(m => `${m.timestamp}-${m.content.slice(0, 20)}`));
          const newMsgs = chatMsgs.filter((m: ChatMessage) => !existing.has(`${m.timestamp}-${m.content.slice(0, 20)}`));
          return [...newMsgs, ...prev].slice(-50);
        });
      }
    } catch {
      setStatus({ running: false });
    }
    setLoading(false);
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/agents/hermes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logs', lines: 50 }),
      });
      const data = await res.json();
      if (data.success) setRawLogs(data.raw || []);
    } catch {}
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const userMsg: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toLocaleTimeString(),
      type: 'outgoing',
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/agents/hermes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', message: userMsg.content }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: data.success ? 'system' : 'assistant',
        content: data.success
          ? '✓ Message sent to Hermes via Telegram. Check Telegram for response.'
          : `✗ Delivery failed: ${data.error || 'unknown error'}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'status',
      }]);
      if (data.success) {
        setTimeout(fetchLogs, 2000);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${e.message}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'error',
      }]);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-6">
      {/* Status card */}
      <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${status.running ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
              <Bot className={`w-5 h-5 ${status.running ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-white">Hermes Gateway</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${status.running ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className={`text-[10px] font-mono ${status.running ? 'text-emerald-400' : 'text-red-400'}`}>
                  {status.running
                    ? `PID ${status.pid} · ${status.uptime ? formatUptime(status.uptime) : ''}${status.connectedPlatforms?.length ? ` · ${status.connectedPlatforms.join(', ')}` : ''}`
                    : (status.message || 'Not running')}
                </span>
              </div>
            </div>
          </div>
          {status.running && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
              <Radio className={`w-3 h-3 ${status.connectedPlatforms?.length ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>Detected via process</span>
            </div>
          )}
        </div>
      </div>

      {!status.running ? (
        <div className="bg-arch-card border border-arch-border rounded-3xl p-8 text-center backdrop-blur-xl">
          <Bot className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold font-mono text-slate-400 mb-1">Gateway Offline</h3>
          <p className="text-sm font-mono text-slate-500 max-w-md mx-auto">
            Hermes gateway is not running. It starts automatically at boot via launchd.
          </p>
        </div>
      ) : (
        <>
          {/* Sub-tabs */}
          <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
            {SUB_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubtab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveSubtab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
            <button onClick={checkStatus} className="ml-2 p-2 hover:bg-white/10 rounded-xl transition-all">
              <RefreshCw className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Chat */}
          {activeSubtab === 'chat' && (
            <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl flex flex-col h-[500px]">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
                <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                  <span>Send via Telegram</span>
                </h3>
                <button onClick={() => setMessages([])} className="text-[10px] text-slate-500 hover:text-white transition-colors">Clear</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
                <div className="text-[10px] font-mono text-slate-600 text-center p-3 bg-white/5 rounded-xl">
                  Messages are sent to your Telegram DM via the bot. Hermes processes them through the gateway. Responses appear in the Activity tab after processing.
                </div>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white'
                        : msg.type === 'status'
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                        : msg.type === 'error'
                        ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                        : 'bg-[#06080D] border border-white/10 text-slate-300'
                    }`}>
                      <div className="text-xs font-mono whitespace-pre-wrap break-words">{msg.content}</div>
                      <div className="text-[10px] text-slate-500 mt-1 font-mono text-right">{msg.timestamp}</div>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-500 rounded-2xl p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message for Hermes..."
                  disabled={sending}
                  className="flex-1 bg-[#06080D] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
                />
                <button onClick={handleSend} disabled={!input.trim() || sending}
                  className="bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-90 active:scale-95 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Activity */}
          {activeSubtab === 'activity' && (
            <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl h-[500px] flex flex-col">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
                <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-violet-400" />
                  <span>Gateway Activity</span>
                </h3>
                <button onClick={checkStatus} className="text-[10px] text-slate-500 hover:text-white transition-colors">Refresh</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1">
                {messages.filter(m => m.type !== 'outgoing' && m.type !== 'status').length === 0 ? (
                  <div className="text-center py-8 text-slate-600 font-mono text-xs">No activity yet</div>
                ) : (
                  messages.filter(m => m.type !== 'outgoing' && m.type !== 'status').map((msg, i) => (
                    <div key={i} className="bg-[#06080D] border border-white/5 rounded-xl p-2.5">
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          msg.type === 'inbound' ? 'bg-sky-400' :
                          msg.type === 'response' ? 'bg-emerald-400' :
                          msg.type === 'error' ? 'bg-red-400' : 'bg-slate-400'
                        }`} />
                        <span className="text-slate-500 uppercase">{msg.type}</span>
                        <span className="ml-auto text-slate-600">{msg.timestamp}</span>
                      </div>
                      <div className="text-xs text-slate-300 font-mono mt-1">{msg.content}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Raw Logs */}
          {activeSubtab === 'logs' && (
            <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl h-[500px] flex flex-col">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3 shrink-0">
                <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-violet-400" />
                  <span>Gateway Log</span>
                </h3>
                <button onClick={fetchLogs} className="text-[10px] text-slate-500 hover:text-white transition-colors">Refresh</button>
              </div>
              <div className="flex-1 bg-[#06080D] border border-white/10 rounded-2xl p-4 font-mono text-[10px] text-slate-400 overflow-y-auto whitespace-pre-wrap">
                {rawLogs.map((line, i) => (
                  <div key={i} className="hover:text-slate-300 transition-colors">{line}</div>
                ))}
                {rawLogs.length === 0 && <span className="text-slate-600">No log entries loaded</span>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
