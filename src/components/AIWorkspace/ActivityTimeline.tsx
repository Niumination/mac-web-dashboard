'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Activity, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface ActivityData {
  today: number;
  thisWeek: number;
  total: number;
  errors: number;
  hourly: number[];
  daily: Record<string, number>;
  responseTimes: number[];
}

export default function ActivityTimeline() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/agents/activity');
      const d = await res.json();
      if (d.success) setData(d);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    drawChart(canvasRef.current, data.hourly);
  }, [data]);

  if (loading) return <div className="text-center py-8 text-slate-600 font-mono text-xs">Loading...</div>;
  if (!data) return <div className="text-center py-8 text-slate-600 font-mono text-xs">No data available</div>;

  const avgResponse = data.responseTimes.length > 0
    ? (data.responseTimes.reduce((a, b) => a + b, 0) / data.responseTimes.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-arch-card border border-arch-border rounded-3xl p-4 backdrop-blur-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Today</div>
          <div className="text-2xl font-extrabold font-mono text-white mt-1">{data.today}</div>
          <div className="text-[10px] font-mono text-slate-500">log entries</div>
        </div>
        <div className="bg-arch-card border border-arch-border rounded-3xl p-4 backdrop-blur-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Total</div>
          <div className="text-2xl font-extrabold font-mono text-white mt-1">{data.total.toLocaleString()}</div>
          <div className="text-[10px] font-mono text-slate-500">all time</div>
        </div>
        <div className="bg-arch-card border border-arch-border rounded-3xl p-4 backdrop-blur-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Avg Response</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">{avgResponse}s</div>
          <div className="text-[10px] font-mono text-slate-500">last 20 samples</div>
        </div>
        <div className="bg-arch-card border border-arch-border rounded-3xl p-4 backdrop-blur-xl">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Errors</div>
          <div className="text-2xl font-extrabold font-mono text-red-400 mt-1">{data.errors}</div>
          <div className="text-[10px] font-mono text-slate-500">gateway log</div>
        </div>
      </div>

      <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
            <span>Hourly Activity (today)</span>
          </h3>
          <button onClick={fetchData} className="p-1 hover:bg-white/10 rounded-lg transition-all">
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
        <canvas ref={canvasRef} width={800} height={200} className="w-full h-48 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
          <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2 mb-3">
            <Activity className="w-3.5 h-3.5 text-violet-400" />
            <span>Daily Activity (last 7 days)</span>
          </h3>
          <div className="space-y-2">
            {Object.entries(data.daily).reverse().map(([date, count]) => (
              <div key={date} className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-slate-500 w-24 shrink-0">{date.slice(5)}</span>
                <div className="flex-1 bg-[#06080D] rounded-full h-5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (count / Math.max(...Object.values(data.daily))) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-300 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-arch-card border border-arch-border rounded-3xl p-5 backdrop-blur-xl">
          <h3 className="text-xs font-mono text-slate-400 flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span>Response Times (last 20)</span>
          </h3>
          <div className="space-y-1.5">
            {data.responseTimes.length === 0 ? (
              <div className="text-[10px] font-mono text-slate-600">No response time data</div>
            ) : (
              [...data.responseTimes].reverse().map((t, i) => {
                const max = Math.max(...data.responseTimes, 1);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-500 w-16 shrink-0">#{i + 1}</span>
                    <div className="flex-1 bg-[#06080D] rounded-full h-4 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${
                        t > 100 ? 'bg-red-500' : t > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} style={{ width: `${(t / max) * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-slate-300 w-12 text-right">{t.toFixed(1)}s</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function drawChart(canvas: HTMLCanvasElement, hourly: number[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr, h = canvas.height / dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  const max = Math.max(...hourly, 1);
  const pad = { top: 10, bottom: 20, left: 20, right: 10 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;
  const barW = chartW / 24;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
  }

  // Bars
  hourly.forEach((val, i) => {
    const x = pad.left + barW * i;
    const barH = (val / max) * chartH;
    const y = pad.top + chartH - barH;

    const grad = ctx.createLinearGradient(x, y, x, pad.top + chartH);
    grad.addColorStop(0, '#7c3aed');
    grad.addColorStop(1, 'rgba(124,58,237,0.3)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x + 1, y, barW - 2, barH, [2, 2, 0, 0]) : ctx.rect(x + 1, y, barW - 2, barH);
    ctx.fill();
  });

  // X-axis labels (every 4 hours)
  ctx.fillStyle = 'rgba(148,163,184,0.5)';
  ctx.font = '8px JetBrains Mono, monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i < 24; i += 4) {
    const x = pad.left + barW * i + barW / 2;
    ctx.fillText(`${i}:00`, x, h - 2);
  }
}
