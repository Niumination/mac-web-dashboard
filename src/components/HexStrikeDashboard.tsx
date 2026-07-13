'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Play, Square, Terminal, Activity, Globe, AlertTriangle, FileText, ChevronRight } from 'lucide-react';

interface ServerStatus {
  running: boolean;
  healthy: boolean;
  pid: number | null;
}

interface ResultEntry {
  id: number;
  command: string;
  output: string;
  timestamp: string;
  tool: string;
}

const TOOLS = [
  { id: 'nmap', label: 'Nmap Scan', args: 'target,scan_type:-sV,ports' },
  { id: 'ping', label: 'Ping', args: 'target' },
  { id: 'whois', label: 'Whois', args: 'target' },
  { id: 'dig', label: 'DNS Lookup (dig)', args: 'target,type:A' },
  { id: 'nslookup', label: 'DNS Lookup', args: 'target' },
  { id: 'curl', label: 'cURL', args: 'url' },
  { id: 'traceroute', label: 'Traceroute', args: 'target' },
  { id: 'netstat', label: 'Netstat', args: '' },
  { id: 'lsof', label: 'Open Ports (lsof)', args: '' },
  { id: 'system_profiler', label: 'System Profiler', args: 'detail:SPHardwareDataType' },
];

export const HexStrikeDashboard: React.FC = () => {
  const [status, setStatus] = useState<ServerStatus>({ running: false, healthy: false, pid: null });
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [activeSubtab, setActiveSubtab] = useState<'console' | 'dashboard'>('console');
  const [selectedTool, setSelectedTool] = useState(TOOLS[0]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [results, setResults] = useState<ResultEntry[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);
  const [serverLog, setServerLog] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/hexstrike?action=status');
      const data = await res.json();
      setStatus(data);
    } catch {}
  };

  useEffect(() => {
    checkStatus();
    pollRef.current = setInterval(checkStatus, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await fetch('/api/hexstrike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      const data = await res.json();
      if (data.success) {
        setServerLog(prev => prev + `[${new Date().toLocaleTimeString()}] Server started (PID ${data.pid})\n`);
      } else {
        setServerLog(prev => prev + `[${new Date().toLocaleTimeString()}] Error: ${data.error}\n`);
      }
      await checkStatus();
    } catch (e: any) {
      setServerLog(prev => prev + `[${new Date().toLocaleTimeString()}] Error: ${e.message}\n`);
    }
    setStarting(false);
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      const res = await fetch('/api/hexstrike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
      const data = await res.json();
      if (data.success) {
        setServerLog(prev => prev + `[${new Date().toLocaleTimeString()}] Server stopped\n`);
      }
      await checkStatus();
    } catch (e: any) {
      setServerLog(prev => prev + `[${new Date().toLocaleTimeString()}] Error: ${e.message}\n`);
    }
    setStopping(false);
  };

  const handleRunCommand = async () => {
    const tool = selectedTool;
    const parts: string[] = [];

    if (tool.id === 'nmap') {
      const target = paramValues['target'] || '';
      const scanType = paramValues['scan_type'] || '-sV';
      const ports = paramValues['ports'] || '';
      parts.push(`nmap ${scanType} ${ports ? `-p ${ports}` : ''} ${target}`);
    } else if (tool.id === 'ping') {
      parts.push(`ping -c 4 ${paramValues['target'] || ''}`);
    } else if (tool.id === 'whois') {
      parts.push(`whois ${paramValues['target'] || ''}`);
    } else if (tool.id === 'dig') {
      parts.push(`dig ${paramValues['target'] || ''} ${paramValues['type'] || 'A'}`);
    } else if (tool.id === 'nslookup') {
      parts.push(`nslookup ${paramValues['target'] || ''}`);
    } else if (tool.id === 'curl') {
      parts.push(`curl -sI ${paramValues['url'] || ''}`);
    } else if (tool.id === 'traceroute') {
      parts.push(`traceroute ${paramValues['target'] || ''}`);
    } else if (tool.id === 'netstat') {
      parts.push('netstat -an | head -50');
    } else if (tool.id === 'lsof') {
      parts.push('lsof -i -P -n | head -50');
    } else if (tool.id === 'system_profiler') {
      const detail = paramValues['detail'] || 'SPHardwareDataType';
      parts.push(`system_profiler ${detail} 2>/dev/null | head -60`);
    }

    const cmd = parts.join(' ');
    if (!cmd.trim()) return;

    setRunning(true);
    setOutput(`$ ${cmd}\n\nRunning...\n`);

    try {
      const res = await fetch('/api/hexstrike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'proxy',
          endpoint: 'api/command',
          method: 'POST',
          data: { command: cmd, use_cache: false },
        }),
      });
      const data = await res.json();

      let outputText = '';
      if (data.success) {
        outputText = data.stdout || JSON.stringify(data, null, 2);
      } else if (data.stdout) {
        outputText = data.stdout;
      } else {
        outputText = JSON.stringify(data, null, 2);
      }

      const full = `$ ${cmd}\n\n${outputText}\n\n─── Exit code: ${data.exit_code ?? '?'} ───\n`;
      setOutput(full);

      setResults(prev => [{
        id: Date.now(),
        command: cmd,
        output: outputText.slice(0, 500),
        timestamp: new Date().toLocaleTimeString(),
        tool: tool.label,
      }, ...prev].slice(0, 50));
    } catch (e: any) {
      setOutput(`$ ${cmd}\n\nError: ${e.message}\n`);
    }
    setRunning(false);
  };

  const parseArgs = (argsStr: string) => {
    return argsStr.split(',').filter(Boolean).map(a => {
      const [key, def] = a.split(':');
      return { key, default: def || '' };
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-arch-card to-[#111827] border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
              <span>HexStrike Security</span>
              <span className={`w-2.5 h-2.5 rounded-full ${status.running ? 'bg-emerald-400 animate-ping' : 'bg-red-500/50'} `} />
            </h2>
            <p className="text-slate-400 text-sm mt-1 font-mono">
              {status.running
                ? `Server active (PID ${status.pid})${status.healthy ? ' · Health OK' : ' · Degraded'}`
                : 'Server offline — click Start to launch'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!status.running ? (
            <button onClick={handleStart} disabled={starting}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:opacity-90 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-500/20"
            >
              <Play className={`w-4 h-4 ${starting ? 'animate-pulse' : ''}`} />
              <span>{starting ? 'Starting...' : 'Start Server'}</span>
            </button>
          ) : (
            <button onClick={handleStop} disabled={stopping}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10"
            >
              <Square className="w-4 h-4" />
              <span>{stopping ? 'Stopping...' : 'Stop Server'}</span>
            </button>
          )}
          <button onClick={checkStatus}
            className="bg-white/10 hover:bg-white/15 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm transition-all border border-white/10"
          >
            <Activity className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
        {[
          { id: 'console', label: 'Tool Console', icon: Terminal },
          { id: 'dashboard', label: 'Server Log', icon: Activity },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubtab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveSubtab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Console Tab */}
      {activeSubtab === 'console' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tool selector */}
          <div className="lg:col-span-1 bg-arch-card border border-arch-border rounded-3xl p-4 backdrop-blur-xl">
            <h3 className="text-sm font-bold font-mono text-white mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-red-400" />
              <span>Tools</span>
            </h3>
            <div className="space-y-1">
              {TOOLS.map(tool => (
                <button key={tool.id} onClick={() => { setSelectedTool(tool); setParamValues({}); }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 ${
                    selectedTool.id === tool.id
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ChevronRight className={`w-3 h-3 ${selectedTool.id === tool.id ? 'text-red-400' : 'text-transparent'}`} />
                  <span>{tool.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Console */}
          <div className="lg:col-span-3 space-y-4">
            {/* Parameter inputs */}
            <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
              <h3 className="text-sm font-bold font-mono text-white mb-3">{selectedTool.label}</h3>
              <div className="flex flex-wrap gap-3">
                {parseArgs(selectedTool.args).map(({ key, default: def }) => (
                  <div key={key} className="flex-1 min-w-[150px]">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">{key}</label>
                    <input value={paramValues[key] || def || ''} onChange={e => setParamValues(p => ({...p, [key]: e.target.value}))}
                      placeholder={def || `Enter ${key}...`}
                      className="w-full bg-[#06080D] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-all"
                    />
                  </div>
                ))}
                {!selectedTool.args && (
                  <p className="text-xs text-slate-500 font-mono">No parameters needed — click Run</p>
                )}
              </div>
              <button onClick={handleRunCommand} disabled={running || !status.running}
                className="mt-4 flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:opacity-90 active:scale-95 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-500/20"
              >
                <Terminal className="w-4 h-4" />
                <span>{running ? 'Running...' : 'Run'}</span>
              </button>
            </div>

            {/* Output */}
            <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-red-400" />
                  <span>Output</span>
                </h3>
                {output && <button onClick={() => setOutput('')}
                  className="text-[10px] text-slate-500 hover:text-white transition-colors">Clear</button>}
              </div>
              <div ref={outputRef}
                className="bg-[#06080D] border border-white/10 rounded-2xl p-4 font-mono text-xs text-slate-300 h-80 overflow-y-auto whitespace-pre-wrap"
              >
                {output || <span className="text-slate-600">Select a tool and click Run to execute...</span>}
              </div>
            </div>

            {/* Results history */}
            {results.length > 0 && (
              <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
                <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2 mb-3">
                  <FileText className="w-3.5 h-3.5 text-red-400" />
                  <span>Recent Results ({results.length})</span>
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {results.map(r => (
                    <div key={r.id} className="bg-[#06080D] border border-white/10 rounded-xl p-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                        <span className="text-red-400/80">{r.tool}</span>
                        <span>{r.timestamp}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono truncate">{r.command}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dashboard / Server Log Tab */}
      {activeSubtab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-arch-card border border-arch-border rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold font-mono text-white mb-4">Server Status</h3>
            <div className="space-y-3">
              <div className="bg-[#06080D] border border-white/10 rounded-2xl p-4">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Status</div>
                <div className={`text-lg font-extrabold font-mono mt-1 ${status.running ? 'text-emerald-400' : 'text-red-400'}`}>
                  {status.running ? 'Running' : 'Stopped'}
                </div>
              </div>
              <div className="bg-[#06080D] border border-white/10 rounded-2xl p-4">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Process ID</div>
                <div className="text-lg font-extrabold font-mono mt-1 text-white">{status.pid || '—'}</div>
              </div>
              <div className="bg-[#06080D] border border-white/10 rounded-2xl p-4">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Health</div>
                <div className={`text-lg font-extrabold font-mono mt-1 ${status.healthy ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {status.healthy ? 'Healthy' : status.running ? 'Degraded' : '—'}
                </div>
              </div>
              <div className="bg-[#06080D] border border-white/10 rounded-2xl p-4">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Port</div>
                <div className="text-lg font-extrabold font-mono mt-1 text-white">8888</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-arch-card border border-arch-border rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-sm font-bold font-mono text-white mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-red-400" />
              <span>Server Log</span>
            </h3>
            <div className="bg-[#06080D] border border-white/10 rounded-2xl p-4 font-mono text-xs text-slate-400 h-80 overflow-y-auto whitespace-pre-wrap">
              {serverLog || <span className="text-slate-600">No log entries yet. Start the server to see output.</span>}
            </div>
            {serverLog && <button onClick={() => setServerLog('')}
              className="mt-2 text-[10px] text-slate-500 hover:text-white transition-colors">Clear log</button>}
          </div>
        </div>
      )}
    </div>
  );
};
