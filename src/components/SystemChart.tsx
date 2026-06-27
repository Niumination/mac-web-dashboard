import React, { useEffect, useRef, useState } from 'react';
import { Activity } from 'lucide-react';

interface MetricPoint {
  timestamp: number;
  cpu: { percent: number; load: number[]; temp: number };
  memory: { percent: number; used: string; total: string; free: string };
}

const MAX_POINTS = 60; // 3 menit @ 3s interval

export const SystemChart: React.FC = () => {
  const [history, setHistory] = useState<MetricPoint[]>([]);
  const [latest, setLatest] = useState<MetricPoint | null>(null);
  const [connected, setConnected] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let mounted = true;

    function connect() {
      eventSource = new EventSource('/api/system/events');
      setConnected(true);

      eventSource.onmessage = (ev) => {
        if (!mounted) return;
        try {
          const parsed = JSON.parse(ev.data);
          if (parsed.success) {
            const point = parsed.data as MetricPoint;
            setLatest(point);
            setHistory((prev) => {
              const next = [...prev, point];
              if (next.length > MAX_POINTS) next.splice(0, next.length - MAX_POINTS);
              return next;
            });
          }
        } catch { /* ignore parse errors */ }
      };

      eventSource.onerror = () => {
        setConnected(false);
        eventSource?.close();
        if (mounted) setTimeout(connect, 3000);
      };
    }

    connect();
    return () => { mounted = false; eventSource?.close(); };
  }, []);

  // Draw chart when history changes
  useEffect(() => {
    if (history.length < 2 || !canvasRef.current) return;
    drawChart(canvasRef.current, history);
  }, [history]);

  return (
    <div className="bg-arch-card border border-arch-border rounded-3xl p-6 backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-arch-cyan/40">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-mono text-white">Real-Time Telemetry</h3>
            <p className="text-xs text-slate-400 font-mono">Live stream via SSE</p>
          </div>
        </div>
        <span
          className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border ${
            connected
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          {connected ? 'LIVE' : 'Disconnected'}
        </span>
      </div>

      {/* Live values */}
      {latest && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <div className="text-slate-400 text-[10px] font-mono uppercase">CPU</div>
            <div className="text-xl font-extrabold font-mono text-white mt-0.5">
              {latest.cpu.percent}%
            </div>
            <div className="text-[10px] text-slate-500">{latest.cpu.temp}°C</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <div className="text-slate-400 text-[10px] font-mono uppercase">Memory</div>
            <div className="text-xl font-extrabold font-mono text-white mt-0.5">
              {latest.memory.percent}%
            </div>
            <div className="text-[10px] text-slate-500">{latest.memory.used}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
            <div className="text-slate-400 text-[10px] font-mono uppercase">Points</div>
            <div className="text-xl font-extrabold font-mono text-white mt-0.5">
              {history.length}
            </div>
            <div className="text-[10px] text-slate-500">/ {MAX_POINTS}</div>
          </div>
        </div>
      )}

      {/* Chart canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={700}
          height={200}
          className="w-full h-48 rounded-xl bg-[#06080D] border border-white/10"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-600 mt-1 px-1">
          <span>{history.length > 0 ? new Date(history[0].timestamp).toLocaleTimeString() : ''}</span>
          <span>CPU % (cyan) · Memory % (purple)</span>
          <span>{history.length > 0 ? new Date(history[history.length - 1].timestamp).toLocaleTimeString() : ''}</span>
        </div>
      </div>

      {/* Empty state */}
      {history.length === 0 && (
        <div className="text-center py-8 text-slate-500 font-mono text-xs">
          {connected ? 'Collecting data...' : 'Waiting for connection...'}
        </div>
      )}
    </div>
  );
};

function drawChart(canvas: HTMLCanvasElement, data: MetricPoint[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const c: CanvasRenderingContext2D = ctx;
  const w = canvas.width;
  const h = canvas.height;
  const pad = { top: 12, bottom: 16, left: 8, right: 8 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  c.clearRect(0, 0, w, h);

  if (data.length < 2) return;

  // Grid lines
  c.strokeStyle = 'rgba(255,255,255,0.04)';
  c.lineWidth = 1;
  for (let y = 0; y <= 4; y++) {
    const yy = pad.top + (chartH / 4) * y;
    c.beginPath();
    c.moveTo(pad.left, yy);
    c.lineTo(w - pad.right, yy);
    c.stroke();
  }

  const maxPoints = data.length;
  const stepX = chartW / (maxPoints - 1);

  const toX = (i: number) => pad.left + i * stepX;
  const toY = (val: number) => pad.top + chartH - (val / 100) * chartH;

  function drawLine(points: { x: number; y: number }[], color: string, fillColor?: string) {
    c.beginPath();
    c.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const xc = (points[i].x + points[i - 1].x) / 2;
      const yc = (points[i].y + points[i - 1].y) / 2;
      c.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
    }
    c.lineTo(points[points.length - 1].x, points[points.length - 1].y);
    c.strokeStyle = color;
    c.lineWidth = 2;
    c.stroke();

    if (fillColor) {
      c.lineTo(points[points.length - 1].x, pad.top + chartH);
      c.lineTo(points[0].x, pad.top + chartH);
      c.closePath();
      c.fillStyle = fillColor;
      c.fill();
    }
  }

  // CPU line (cyan)
  const cpuPoints = data.map((d, i) => ({
    x: toX(i),
    y: toY(d.cpu.percent),
  }));
  drawLine(cpuPoints, '#22d3ee', 'rgba(34, 211, 238, 0.08)');

  // Memory line (purple)
  const memPoints = data.map((d, i) => ({
    x: toX(i),
    y: toY(d.memory.percent),
  }));
  drawLine(memPoints, '#a78bfa', 'rgba(167, 139, 250, 0.08)');

  // Current value dots
  const last = data[data.length - 1];
  if (last) {
    c.beginPath();
    c.arc(toX(data.length - 1), toY(last.cpu.percent), 4, 0, Math.PI * 2);
    c.fillStyle = '#22d3ee';
    c.fill();

    c.beginPath();
    c.arc(toX(data.length - 1), toY(last.memory.percent), 4, 0, Math.PI * 2);
    c.fillStyle = '#a78bfa';
    c.fill();
  }
}
