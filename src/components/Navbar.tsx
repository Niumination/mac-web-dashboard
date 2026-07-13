import React from 'react';
import { Terminal, Shield, Cpu, Activity, FolderKanban, Server, Settings, ExternalLink, ShieldAlert, BrainCircuit, Send } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  osInfo: {
    hostname: string;
    kernel: string;
    uptime: string;
  };
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, osInfo }) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Activity },
    { id: 'files', label: 'File Manager', icon: FolderKanban },
    { id: 'services', label: 'Launchd Services', icon: Server },
    { id: 'processes', label: 'Process List', icon: Cpu },
    { id: 'security', label: 'Security', icon: ShieldAlert },
    { id: 'ai-workspace', label: 'AI Workspace', icon: BrainCircuit },
    { id: 'telegram', label: 'Telegram', icon: Send },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0B0F17]/80 border-b border-white/10 px-6 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
      {/* macOS Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-arch-cyan to-arch-blue flex items-center justify-center shadow-lg shadow-arch-cyan/20">
            <span className="font-mono font-black text-white text-xl tracking-tighter">M</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-lg font-bold text-white tracking-tight">macOS</h1>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-arch-cyan/20 text-arch-cyan border border-arch-cyan/30">
                PRO MAX
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {osInfo.hostname || 'MacBook'} <span className="text-arch-cyan">●</span> {osInfo.kernel || 'Darwin'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/10">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-arch-cyan to-arch-blue text-white shadow-md shadow-arch-cyan/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick System Uptime Badge */}
        <div className="hidden lg:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <div className="text-right font-mono text-xs">
            <div className="text-slate-400">UPTIME</div>
            <div className="text-slate-200 font-semibold">{osInfo.uptime || '00:00:00'}</div>
          </div>
        </div>

      </div>
    </header>
  );
};
