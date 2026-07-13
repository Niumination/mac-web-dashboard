'use client';

import React, { useState } from 'react';
import { BrainCircuit, LayoutDashboard, Bot, Cpu, Rocket, FolderKanban, MessageSquare, FileText, Server, Activity, Clock, GitBranch } from 'lucide-react';
import AgentDashboard from './AIWorkspace/AgentDashboard';
import HermesConsole from './AIWorkspace/HermesConsole';
import OllamaManager from './AIWorkspace/OllamaManager';
import AgentLauncher from './AIWorkspace/AgentLauncher';
import WorkspaceManager from './AIWorkspace/WorkspaceManager';
import PromptStudio from './AIWorkspace/PromptStudio';
import SessionBrowser from './AIWorkspace/SessionBrowser';
import MCPManager from './AIWorkspace/MCPManager';
import ActivityTimeline from './AIWorkspace/ActivityTimeline';
import CronManager from './AIWorkspace/CronManager';
import SmartRouter from './AIWorkspace/SmartRouter';
import HerdrManager from './AIWorkspace/HerdrManager';

const SUB_TABS = [
  { id: 'dashboard', label: 'Agent Dashboard', icon: LayoutDashboard },
  { id: 'hermes', label: 'Hermes Console', icon: Bot },
  { id: 'ollama', label: 'Ollama Models', icon: Cpu },
  { id: 'launcher', label: 'Agent Launcher', icon: Rocket },
  { id: 'workspace', label: 'Workspaces', icon: FolderKanban },
  { id: 'studio', label: 'Prompt Studio', icon: MessageSquare },
  { id: 'sessions', label: 'Sessions', icon: FileText },
  { id: 'mcp', label: 'MCP Servers', icon: Server },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'cron', label: 'Cron Jobs', icon: Clock },
  { id: 'router', label: 'Smart Router', icon: GitBranch },
  { id: 'herdr', label: 'Herdr', icon: Bot },
];

export default function AIWorkspace() {
  const [activeSubtab, setActiveSubtab] = useState('dashboard');

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-arch-card to-[#111827] border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/20">
            <BrainCircuit className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-mono text-white">AI Workspace</h2>
            <p className="text-slate-400 text-sm mt-1 font-mono">
              Agent discovery, model management, and workspace orchestration
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-full">
        {SUB_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubtab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubtab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-md shadow-violet-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeSubtab === 'dashboard' && <AgentDashboard />}
      {activeSubtab === 'hermes' && <HermesConsole />}
      {activeSubtab === 'ollama' && <OllamaManager />}
      {activeSubtab === 'launcher' && <AgentLauncher />}
      {activeSubtab === 'workspace' && <WorkspaceManager />}
      {activeSubtab === 'studio' && <PromptStudio />}
      {activeSubtab === 'sessions' && <SessionBrowser />}
      {activeSubtab === 'mcp' && <MCPManager />}
      {activeSubtab === 'activity' && <ActivityTimeline />}
      {activeSubtab === 'cron' && <CronManager />}
      {activeSubtab === 'router' && <SmartRouter />}
      {activeSubtab === 'herdr' && <HerdrManager />}
    </div>
  );
}
