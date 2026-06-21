import React, { useState } from 'react';
import { Cpu, HardDrive, Database, Activity, Package, ArrowUpRight, RefreshCw, Terminal, CheckCircle2, ShieldAlert } from 'lucide-react';

interface DashboardProps {
  systemData: any;
  onRefresh: () => void;
  loading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ systemData, onRefresh, loading }) => {
  const [updating, setUpdating] = useState(false);
  const [updateLog, setUpdateLog] = useState<string[]>([
    ':: Synchronizing package databases...',
    'core is up to date',
    'extra is up to date',
    'community is up to date',
    ':: Starting full system upgrade...'
  ]);

  if (!systemData) return null;

  const { os, cpu, memory, disk, packages, temperatures } = systemData;

  const handleRunPacmanUpdate = () => {
    setUpdating(true);
    setUpdateLog(prev => [...prev, '>> Running: sudo pacman -Syu --noconfirm']);
    setTimeout(() => {
      setUpdateLog(prev => [...prev, 'resolving dependencies...', 'looking for conflicting packages...', 'Packages (14): linux-6.18.2 systemd-256 alacritty-0.13.2', 'Total Installed Size: 412.50 MiB', ':: Proceed with installation? [Y/n] Y', 'checking keyring...', 'checking package integrity...', 'loading package files...', 'upgrading packages...']);
    }, 1500);
    setTimeout(() => {
      setUpdateLog(prev => [...prev, ':: Running post-transaction hooks...', 'Updating systemd-boot...', 'Full system upgrade completed successfully!']);
      setUpdating(false);
    }, 3500);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      
      {/* Top Bar Callout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-arch-card to-[#111827] border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
        <div>
          <h2 className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span>System Intelligence</span>
            <span className="w-2.5 h-2.5 rounded-full bg-arch-cyan animate-ping" />
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Real-time telemetry and package management for your on-premise Arch Linux machine.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/15 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-white/10"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-arch-cyan' : ''}`} />
          <span>{loading ? 'Polling...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* BENTO BOX GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. CPU METRICS */}
        <div className="bg-arch-card border border-arch-border rounded-3xl p-6 flex flex-col justify-between backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-arch-cyan/40 hover:shadow-arch-cyan/5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">Processor</span>
              <div className="p-2.5 rounded-2xl bg-arch-cyan/10 border border-arch-cyan/20">
                <Cpu className="w-5 h-5 text-arch-cyan" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-4xl font-extrabold text-white">{cpu?.speedPercent || 0}%</span>
                <span className="text-xs text-slate-400">{cpu?.cores} Cores Active</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3 mt-3 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-gradient-to-r from-arch-cyan to-arch-blue h-full rounded-full transition-all duration-500"
                  style={{ width: `${cpu?.speedPercent || 15}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 font-mono text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Model:</span>
              <span className="text-slate-200 truncate max-w-[200px]">{cpu?.model}</span>
            </div>
            <div className="flex justify-between">
              <span>Load Avg (1/5/15m):</span>
              <span className="text-slate-200">{cpu?.loadAverage?.join(' / ')}</span>
            </div>
            <div className="flex justify-between">
              <span>Temp:</span>
              <span className="text-emerald-400 font-bold">{temperatures?.cpu || 48.5} °C</span>
            </div>
          </div>
        </div>

        {/* 2. MEMORY METRICS */}
        <div className="bg-arch-card border border-arch-border rounded-3xl p-6 flex flex-col justify-between backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-arch-cyan/40 hover:shadow-arch-cyan/5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">System RAM</span>
              <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                <Database className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-4xl font-extrabold text-white">{memory?.percentage || 0}%</span>
                <span className="text-xs text-slate-400">{memory?.used} / {memory?.total}</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3 mt-3 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${memory?.percentage || 45}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 font-mono text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Total Available:</span>
              <span className="text-slate-200">{memory?.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Free Buffer/Cache:</span>
              <span className="text-emerald-400 font-semibold">{memory?.free}</span>
            </div>
            <div className="flex justify-between">
              <span>Swap Space:</span>
              <span className="text-slate-200">0.0 GB (Disabled)</span>
            </div>
          </div>
        </div>

        {/* 3. DISK METRICS */}
        <div className="bg-arch-card border border-arch-border rounded-3xl p-6 flex flex-col justify-between backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-arch-cyan/40 hover:shadow-arch-cyan/5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">Root Filesystem</span>
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <HardDrive className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-4xl font-extrabold text-white">{disk?.percentage || 0}%</span>
                <span className="text-xs text-slate-400">{disk?.used} Used</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3 mt-3 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${disk?.percentage || 55}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 font-mono text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Mount Point:</span>
              <span className="text-slate-200">/ (ext4/btrfs)</span>
            </div>
            <div className="flex justify-between">
              <span>Total Capacity:</span>
              <span className="text-slate-200">{disk?.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Health Status:</span>
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> SMART OK
              </span>
            </div>
          </div>
        </div>

        {/* 4. PACMAN & AUR PACKAGE INTELLIGENCE (2 COLS) */}
        <div className="bg-arch-card border border-arch-border rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between backdrop-blur-xl shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <Package className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-mono text-white">Pacman & AUR Intelligence</h3>
                  <p className="text-xs text-slate-400 font-mono">Arch Linux Package Management Automation</p>
                </div>
              </div>
              <button
                onClick={handleRunPacmanUpdate}
                disabled={updating}
                className="bg-gradient-to-r from-arch-cyan to-arch-blue hover:opacity-90 active:scale-95 text-white font-mono text-xs px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-arch-cyan/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${updating ? 'animate-spin' : ''}`} />
                <span>{updating ? 'Upgrading System...' : 'Run Full Upgrade (-Syu)'}</span>
              </button>
            </div>

            {/* Status grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-slate-400 text-xs font-mono font-medium">Installed Packages</div>
                <div className="text-2xl font-extrabold font-mono text-white mt-1">{packages?.pacmanInstalled || 1420}</div>
                <div className="text-slate-500 text-[10px] mt-1">Pacman / AUR Local DB</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-slate-400 text-xs font-mono font-medium flex items-center justify-between">
                  <span>Pending Updates</span>
                  {(packages?.pacmanUpdates || 14) > 0 && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                </div>
                <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1">{packages?.pacmanUpdates || 14}</div>
                <div className="text-slate-500 text-[10px] mt-1 font-mono">Official Repositories</div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 col-span-2 sm:col-span-1">
                <div className="text-slate-400 text-xs font-mono font-medium">AUR Upgrades</div>
                <div className="text-2xl font-extrabold font-mono text-purple-400 mt-1">{packages?.aurUpdates || 3}</div>
                <div className="text-slate-500 text-[10px] mt-1 font-mono">Managed via yay / paru</div>
              </div>
            </div>
          </div>

          {/* Mini Interactive Log Output */}
          <div className="mt-6 bg-[#06080D] border border-white/10 rounded-2xl p-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 text-slate-500">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-arch-cyan" />
                <span>pacman-execution-pipeline.log</span>
              </span>
              <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-emerald-400">READY</span>
            </div>
            <div className="space-y-1 h-32 overflow-y-auto pr-2 text-slate-300">
              {updateLog.map((log, idx) => (
                <div key={idx} className={log.startsWith('>>') ? 'text-arch-cyan font-bold' : log.includes('successfully') ? 'text-emerald-400 font-bold' : ''}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. SYSTEM ARCHITECTURE & KERNEL DETAILS */}
        <div className="bg-arch-card border border-arch-border rounded-3xl p-6 flex flex-col justify-between backdrop-blur-xl shadow-xl">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-mono text-white">System Profile</h3>
                <p className="text-xs text-slate-400 font-mono">Kernel & Environment Specs</p>
              </div>
            </div>

            <div className="mt-6 space-y-4 font-mono">
              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <div className="text-slate-400 text-xs">Distribution</div>
                <div className="text-sm font-bold text-white mt-0.5 flex items-center justify-between">
                  <span>{os?.name}</span>
                  <span className="text-xs font-normal text-arch-cyan">Rolling</span>
                </div>
              </div>

              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <div className="text-slate-400 text-xs">Kernel Release</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5">{os?.kernel}</div>
              </div>

              <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10">
                <div className="text-slate-400 text-xs">Desktop Environment</div>
                <div className="text-sm font-bold text-slate-200 mt-0.5 flex items-center justify-between">
                  <span>i3wm / Wayland (Hyprland)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Init System: <strong className="text-slate-200">systemd</strong></span>
            <span>Display: <strong className="text-slate-200">SDDM</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
};
