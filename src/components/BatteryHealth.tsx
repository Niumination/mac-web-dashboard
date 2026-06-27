import React, { useEffect, useState } from 'react';
import { Battery, BatteryCharging, BatteryWarning, BatteryMedium, Clock, Activity, Zap, RefreshCw } from 'lucide-react';

interface BatteryData {
  percentage: number;
  charging: boolean;
  timeRemaining: string;
  powerSource: string;
  cycleCount: number;
  condition: string;
  maxCapacity: number;
  designCapacity: number;
  healthPercent: number;
}

export const BatteryHealth: React.FC = () => {
  const [data, setData] = useState<BatteryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBattery = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/battery');
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    fetchBattery();
    const interval = setInterval(fetchBattery, 60000); // refresh setiap 1 menit
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-arch-card border border-arch-border rounded-3xl p-6 backdrop-blur-xl shadow-xl">
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-5 h-5 text-slate-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!data || data.percentage === 0) {
    return (
      <div className="bg-arch-card border border-arch-border rounded-3xl p-6 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Battery className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-mono text-white">Battery Status</h3>
            <p className="text-xs text-slate-400 font-mono">No battery detected</p>
          </div>
        </div>
      </div>
    );
  }

  const battColor = data.percentage > 20 ? 'text-emerald-400' : 'text-rose-400';
  const healthColor = data.healthPercent > 80 ? 'text-emerald-400' : data.healthPercent > 60 ? 'text-amber-400' : 'text-rose-400';
  const conditionColor = data.condition === 'Normal' ? 'text-emerald-400' : data.condition === 'Replace Soon' ? 'text-amber-400' : 'text-rose-400';

  return (
    <div className="bg-arch-card border border-arch-border rounded-3xl p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-arch-cyan/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${data.charging ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
            {data.charging
              ? <BatteryCharging className="w-5 h-5 text-emerald-400" />
              : <Battery className={`w-5 h-5 ${battColor}`} />
            }
          </div>
          <div>
            <h3 className="text-lg font-bold font-mono text-white">Battery Status</h3>
            <p className="text-xs text-slate-400 font-mono">
              {data.powerSource} · {data.charging ? 'Charging' : 'Discharging'}
            </p>
          </div>
        </div>

        {/* Overall battery display */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-2xl font-extrabold font-mono text-white">{data.percentage}%</div>
            {data.timeRemaining && data.timeRemaining !== '—' && (
              <div className="text-[10px] text-slate-400 font-mono">{data.timeRemaining} remaining</div>
            )}
          </div>
          <div className="relative w-10 h-16 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            {/* Battery fill */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-500"
              style={{ height: `${data.percentage}%` }}
            />
            {/* Battery tip */}
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-white/20 rounded-t" />
          </div>
        </div>
      </div>

      {/* Battery health details */}
      <div className="grid grid-cols-3 gap-3 mt-5">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono mb-1">
            <Activity className="w-3 h-3" />
            <span>Health</span>
          </div>
          <div className={`text-sm font-bold font-mono ${healthColor}`}>{data.healthPercent}%</div>
          <div className="text-[10px] text-slate-500">{data.cycleCount} cycles</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono mb-1">
            <Zap className="w-3 h-3" />
            <span>Condition</span>
          </div>
          <div className={`text-sm font-bold font-mono ${conditionColor}`}>{data.condition}</div>
          <div className="text-[10px] text-slate-500">{data.maxCapacity} mAh</div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-mono mb-1">
            <Clock className="w-3 h-3" />
            <span>Design</span>
          </div>
          <div className="text-sm font-bold font-mono text-white">{data.designCapacity} mAh</div>
          <div className="text-[10px] text-slate-500">{data.charging ? 'Charging' : 'On battery'}</div>
        </div>
      </div>
    </div>
  );
};
