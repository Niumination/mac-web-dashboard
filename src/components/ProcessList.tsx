import React, { useState, useEffect } from 'react';
import { Cpu, Skull, Search, RefreshCw, AlertTriangle } from 'lucide-react';

interface ProcessItem {
  pid: string;
  user: string;
  cpu: number;
  mem: number;
  command: string;
}

export const ProcessList: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [killing, setKilling] = useState<string | null>(null);

  useEffect(() => {
    fetchProcesses();
  }, []);

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/processes');
      const data = await res.json();
      if (data.success) {
        setProcesses(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleKill = async (pid: string, command: string) => {
    if (!confirm(`Are you sure you want to FORCE KILL process ${pid} (${command})?`)) return;
    setKilling(pid);
    try {
      const res = await fetch(`/api/processes?pid=${pid}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchProcesses();
      }
    } catch (e) {
      console.error(e);
    }
    setKilling(null);
  };

  const filteredProcesses = processes.filter(p => 
    p.command.toLowerCase().includes(search.toLowerCase()) || 
    p.pid.includes(search) ||
    p.user.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      
      {/* Header & Search */}
      <div className="bg-arch-card border border-arch-border rounded-3xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
            <Cpu className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-mono text-white">Process Inspection</h2>
            <p className="text-xs text-slate-400 font-mono">Monitor Top Resource Consuming Tasks & Kill Unwanted PIDs</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-80 bg-[#06080D] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by PID or executable name..."
              className="bg-transparent font-mono text-xs text-white focus:outline-none w-full"
            />
          </div>

          <button
            onClick={fetchProcesses}
            disabled={loading}
            className="p-3 bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-50 rounded-2xl text-white transition-all border border-white/10"
            title="Refresh Processes"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-arch-cyan' : ''}`} />
          </button>
        </div>
      </div>

      {/* PROCESS TABLE */}
      <div className="bg-arch-card border border-arch-border rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
        
        {/* Table Head */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-white/5 border-b border-white/10 font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div className="col-span-2">PID</div>
          <div className="col-span-2">User</div>
          <div className="col-span-2 text-right">CPU %</div>
          <div className="col-span-2 text-right">MEM %</div>
          <div className="col-span-3">Command / Binary</div>
          <div className="col-span-1 text-right">Kill</div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="p-12 text-center font-mono text-slate-400 flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-arch-cyan" />
            <span>Scanning Active Tasks...</span>
          </div>
        )}

        {/* Empty */}
        {!loading && filteredProcesses.length === 0 && (
          <div className="p-12 text-center font-mono text-slate-500">
            No processes match the query.
          </div>
        )}

        {/* Table Body */}
        {!loading && (
          <div className="divide-y divide-white/5 font-mono text-sm">
            {filteredProcesses.map((p, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-white/5 transition-all">
                <div className="col-span-2 font-bold text-arch-cyan">{p.pid}</div>
                <div className="col-span-2 text-slate-300">{p.user}</div>
                <div className="col-span-2 text-right font-semibold text-amber-400">{p.cpu}%</div>
                <div className="col-span-2 text-right font-semibold text-purple-400">{p.mem}%</div>
                <div className="col-span-3 text-slate-200 truncate" title={p.command}>{p.command}</div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => handleKill(p.pid, p.command)}
                    disabled={killing === p.pid || p.pid === '1'}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 disabled:opacity-30 text-rose-400 rounded-xl transition-all border border-rose-500/20"
                    title={p.pid === '1' ? 'Cannot kill init process' : 'Force kill (SIGKILL)'}
                  >
                    <Skull className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
