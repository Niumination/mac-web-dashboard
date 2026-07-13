'use client';

import React, { useState, useEffect } from 'react';
import { Database, ChevronRight, MessageSquare, Clock, Cpu, X, FileText } from 'lucide-react';

interface SessionSummary {
  id: string;
  fileName: string;
  timestamp: string;
  reason?: string;
  model?: string;
  messageCount: number;
  size: number;
}

export default function SessionBrowser() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  useEffect(() => {
    fetch('/api/agents/sessions')
      .then(r => r.json())
      .then(d => { if (d.success) setSessions(d.sessions); })
      .finally(() => setLoading(false));
  }, []);

  const viewSession = async (id: string) => {
    try {
      const res = await fetch(`/api/agents/sessions?id=${encodeURIComponent(id)}`);
      const d = await res.json();
      if (d.success) setSelectedSession(d.session);
    } catch {}
  };

  const msgs = selectedSession?.request?.body?.messages || [];
  const model = selectedSession?.request?.body?.model || '';

  return (
    <div className="space-y-4">
      {selectedSession ? (
        <div>
          <button onClick={() => setSelectedSession(null)}
            className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-white transition-colors mb-3"
          >
            <X className="w-3 h-3" />
            <span>Back to list</span>
          </button>
          <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
              <MessageSquare className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold font-mono text-white">{model || 'Session'}</span>
              <span className="text-[10px] font-mono text-slate-500 ml-auto">{msgs.length} messages</span>
            </div>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {msgs.map((m: any, i: number) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white'
                      : m.role === 'system'
                      ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                      : 'bg-[#06080D] border border-white/10 text-slate-300'
                  }`}>
                    <div className="text-[10px] font-mono opacity-60 mb-1 uppercase">{m.role}</div>
                    <div className="text-xs font-mono whitespace-pre-wrap break-words">
                      {m.content?.slice(0, 500) || '(tool call or empty)'}
                    </div>
                    {m.tool_calls && (
                      <div className="text-[10px] text-sky-400 mt-1">🔧 {m.tool_calls.length} tool call(s)</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {selectedSession.reason && (
              <div className="mt-3 text-[10px] font-mono text-slate-500 bg-[#06080D] rounded-xl p-2">
                Ended: {selectedSession.reason}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
          <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2 mb-3">
            <Database className="w-3.5 h-3.5 text-violet-400" />
            <span>Sessions ({sessions.length})</span>
          </h3>
          {loading ? (
            <div className="text-center py-8 text-slate-600 font-mono text-xs">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-slate-600 font-mono text-xs">No sessions found</div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {sessions.map(s => (
                <button key={s.id} onClick={() => viewSession(s.id)}
                  className="w-full text-left bg-[#06080D] border border-white/10 rounded-xl p-3 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-mono text-white">{s.model || 'Unknown model'}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(s.timestamp).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{s.messageCount} msgs</span>
                    {s.reason && <span className="text-slate-600">{s.reason}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
