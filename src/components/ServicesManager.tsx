import React, { useState, useEffect } from 'react';
import { Server, Play, Square, RotateCw, CheckCircle2, XCircle, AlertCircle, RefreshCw, Search } from 'lucide-react';

interface ServiceItem {
  name: string;
  active: boolean;
  status: string;
  description: string;
}

export const ServicesManager: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actioning, setActioning] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (data.success) {
        setServices(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleAction = async (serviceName: string, action: 'start' | 'stop' | 'restart') => {
    setActioning(`${serviceName}-${action}`);
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, serviceName })
      });
      const data = await res.json();
      if (data.success) {
        fetchServices();
      }
    } catch (e) {
      console.error(e);
    }
    setActioning(null);
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      
      {/* Header & Search */}
      <div className="bg-arch-card border border-arch-border rounded-3xl p-6 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-server-cyan/10 rounded-2xl border border-arch-cyan/20 bg-arch-cyan/10">
            <Server className="w-6 h-6 text-arch-cyan" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-mono text-white">Launchd Daemon Manager</h2>
            <p className="text-xs text-slate-400 font-mono">Control macOS native background services</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex-1 md:w-80 bg-[#06080D] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services (e.g. nginx, docker)..."
              className="bg-transparent font-mono text-xs text-white focus:outline-none w-full"
            />
          </div>

          <button
            onClick={fetchServices}
            disabled={loading}
            className="p-3 bg-white/5 hover:bg-white/10 active:scale-95 disabled:opacity-50 rounded-2xl text-white transition-all border border-white/10"
            title="Refresh Services"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-arch-cyan' : ''}`} />
          </button>
        </div>
      </div>

      {/* SERVICE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service, idx) => (
          <div
            key={idx}
            className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl flex flex-col justify-between shadow-lg transition-all duration-200 hover:border-arch-cyan/30 hover:shadow-arch-cyan/5"
          >
            <div>
              {/* Title & Status badge */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-mono font-bold text-base text-white truncate">{service.name}</h3>
                <span
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold uppercase tracking-wider border ${
                    service.active
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {service.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  <span>{service.status}</span>
                </span>
              </div>

              {/* Description */}
              <p className="text-slate-400 text-xs mt-2 font-sans line-clamp-2 leading-relaxed">
                {service.description}
              </p>
            </div>

            {/* Controls bottom */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-end gap-2">
              {!service.active && (
                <button
                  onClick={() => handleAction(service.name, 'start')}
                  disabled={actioning !== null}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 font-mono text-xs transition-all active:scale-95"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start</span>
                </button>
              )}

              {service.active && (
                <>
                  <button
                    onClick={() => handleAction(service.name, 'restart')}
                    disabled={actioning !== null}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 font-mono text-xs transition-all active:scale-95"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Restart</span>
                  </button>

                  <button
                    onClick={() => handleAction(service.name, 'stop')}
                    disabled={actioning !== null}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-mono text-xs transition-all active:scale-95"
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </button>
                </>
              )}
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
