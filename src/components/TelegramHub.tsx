'use client';

import React, { useState, useEffect } from 'react';
import { Send, ExternalLink, MessageSquare, Inbox, Loader, CheckCircle, AlertCircle, ArrowUpRight, Bot } from 'lucide-react';

interface LogEntry {
  type: string;
  text: string;
  timestamp: string;
}

export default function TelegramHub() {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logLoading, setLogLoading] = useState(true);

  const fetchLogs = async () => {
    setLogLoading(true);
    try {
      const res = await fetch('/api/agents/hermes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logs', lines: 30 }),
      });
      const data = await res.json();
      if (data.success) {
        const inbox = (data.logs || [])
          .filter((e: LogEntry) => e.type === 'inbound' || e.type === 'response' || e.type === 'outbound');
        setLogs(inbox);
      }
    } catch {}
    setLogLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    setSendResult('');
    try {
      const res = await fetch('/api/agents/hermes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', message: message.trim() }),
      });
      const data = await res.json();
      setSendResult(data.success ? 'sent' : 'failed');
      if (data.success) setMessage('');
    } catch {
      setSendResult('failed');
    }
    setSending(false);
    setTimeout(() => setSendResult(''), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openTelegram = () => {
    window.open('https://web.telegram.org/k/', '_blank', 'noopener,noreferrer');
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-arch-card to-[#111827] border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
            <Send className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-mono text-white">Telegram Hub</h2>
            <p className="text-slate-400 text-sm mt-1 font-mono">
              Launch Telegram Web, quick send via Hermes bot, and recent message inbox
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel 1: Launch Telegram Web */}
        <div className="lg:col-span-1 bg-gradient-to-br from-[#1a1f2e] to-[#111827] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-sky-500/10">
              <ExternalLink className="w-5 h-5 text-sky-400" />
            </div>
            <h3 className="text-lg font-mono font-semibold text-white">Telegram Web</h3>
          </div>

          <p className="text-slate-400 text-sm mb-6 font-mono">
            Buka <span className="text-sky-400">web.telegram.org/k/</span> di tab baru untuk chat, grup, dan channel penuh.
          </p>

          <button
            onClick={openTelegram}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-500 text-white font-semibold font-mono text-lg hover:from-sky-500 hover:to-blue-400 transition-all duration-200 shadow-lg shadow-sky-500/20 active:scale-[0.98]"
          >
            <Send className="w-5 h-5" />
            Launch Telegram
            <ArrowUpRight className="w-5 h-5" />
          </button>

          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 font-mono">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            web.telegram.org — opened in new tab
          </div>
        </div>

        {/* Panel 2: Quick Send */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#1a1f2e] to-[#111827] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-violet-500/10">
              <Bot className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-mono font-semibold text-white">Quick Send via Hermes</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Kirim pesan ke Telegram via Hermes bot
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message to send via Hermes..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !message.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 text-white font-medium text-sm font-mono hover:from-violet-500 hover:to-indigo-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-violet-500/20"
            >
              {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>

          {sendResult === 'sent' && (
            <div className="mt-3 flex items-center gap-2 text-emerald-400 text-xs font-mono">
              <CheckCircle className="w-3.5 h-3.5" />
              Message sent via Hermes bot
            </div>
          )}
          {sendResult === 'failed' && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-xs font-mono">
              <AlertCircle className="w-3.5 h-3.5" />
              Failed to send — check Hermes gateway
            </div>
          )}
        </div>
      </div>

      {/* Panel 3: Recent Inbox */}
      <div className="bg-gradient-to-br from-[#1a1f2e] to-[#111827] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10">
              <Inbox className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-mono font-semibold text-white">Recent Inbox</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              {logs.length} messages
            </span>
          </div>
          <button
            onClick={fetchLogs}
            className="text-xs text-slate-400 hover:text-white font-mono transition-colors"
          >
            ↻ Refresh
          </button>
        </div>

        {logLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-5 h-5 text-slate-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-mono text-sm">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
            No messages yet
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {logs.map((entry, i) => {
              const isInbound = entry.type === 'inbound';
              const isResponse = entry.type === 'response';
              const isOutbound = entry.type === 'outbound';
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    isInbound
                      ? 'bg-emerald-500/5 border-emerald-500/10'
                      : isResponse
                      ? 'bg-blue-500/5 border-blue-500/10'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${
                    isInbound ? 'bg-emerald-500/10' : isResponse ? 'bg-blue-500/10' : 'bg-white/5'
                  }`}>
                    {isInbound ? (
                      <MessageSquare className={`w-3.5 h-3.5 ${isInbound ? 'text-emerald-400' : ''}`} />
                    ) : isResponse ? (
                      <Bot className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-mono font-medium text-slate-300">
                        {isInbound ? 'Inbound' : isResponse ? 'Response' : isOutbound ? 'Outbound' : entry.type}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">{formatTime(entry.timestamp)}</span>
                    </div>
                    <p className="text-sm font-mono text-slate-400 truncate">{entry.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
