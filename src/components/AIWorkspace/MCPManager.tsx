'use client';

import React, { useState, useEffect } from 'react';
import { Server, CheckCircle, XCircle, RefreshCw, Clock, FileText } from 'lucide-react';

interface MCPServer {
  id: string;
  name: string;
  running: boolean;
  pid: number | null;
  uptime: number;
}

export default function MCPManager() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [logTail, setLogTail] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/agents/mcp');
      const d = await res.json();
      if (d.success) {
        setServers(d.servers);
        setLogTail(d.logTail || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const runningCount = servers.filter(s => s.running).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-arch-card border border-arch-border rounded-3xl p-4 backdrop-blur-xl">
          <div className="text-[10px] font-mono text-slate-500">MCP Servers</div>
          <div className="text-2xl font-extrabold font-mono text-white mt-1">{servers.length}</div>
        </div>
        <div className="bg-arch-card border border-arch-border rounded-3xl p-4 backdrop-blur-xl">
          <div className="text-[10px] font-mono text-slate-500">Running</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">{runningCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {servers.map(server => (
          <div key={server.id} className="bg-arch-card border border-arch-border rounded-3xl p-4 backdrop-blur-xl hover:border-white/20 transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold font-mono text-white">{server.name}</span>
              </div>
              {server.running
                ? <CheckCircle className="w-4 h-4 text-emerald-400" />
                : <XCircle className="w-4 h-4 text-slate-500" />
              }
            </div>
            <div className="space-y-1 text-[10px] font-mono">
              <div className="flex items-center gap-2 text-slate-500">
                <span>Status:</span>
                <span className={server.running ? 'text-emerald-400' : 'text-slate-500'}>{server.running ? 'Running' : 'Stopped'}</span>
              </div>
              {server.pid && (
                <div className="text-slate-500">PID: <span className="text-slate-300">{server.pid}</span></div>
              )}
              {server.uptime > 0 && (
                <div className="text-slate-500">Uptime: <span className="text-slate-300">{formatUptime(server.uptime)}</span></div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-violet-400" />
            <span>MCP Log (last 30 lines)</span>
          </h3>
          <button onClick={fetchStatus} className="p-1 hover:bg-white/10 rounded-lg transition-all">
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
        <div className="bg-[#06080D] border border-white/10 rounded-2xl p-3 font-mono text-[10px] text-slate-400 max-h-40 overflow-y-auto whitespace-pre-wrap">
          {logTail.length === 0
            ? <span className="text-slate-600">No log entries</span>
            : logTail.map((line, i) => <div key={i}>{line}</div>)
          }
        </div>
      </div>
    </div>
  );
}

function formatUptime(s: number): string {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}
