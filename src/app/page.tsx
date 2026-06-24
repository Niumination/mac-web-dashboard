'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Dashboard } from '@/components/Dashboard';
import { FileManager } from '@/components/FileManager';
import { ServicesManager } from '@/components/ServicesManager';
import { ProcessList } from '@/components/ProcessList';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemData, setSystemData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentFilePath, setCurrentFilePath] = useState('/Users/zaryu');

  const fetchSystemData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system');
      const data = await res.json();
      if (data.success) {
        setSystemData(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch telemetry:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSystemData();
    // Setup automatic telemetry polling every 30 seconds
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-arch-dark text-slate-100 flex flex-col font-sans selection:bg-arch-cyan selection:text-white">
      
      {/* Top Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-tr from-arch-cyan/15 to-purple-500/10 blur-[140px] pointer-events-none -z-10" />

      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        osInfo={{
          hostname: systemData?.os?.hostname || 'MacBook',
          kernel: systemData?.os?.kernel || '24.5.0 Darwin',
          uptime: systemData?.os?.uptime || 'Just now'
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard
            systemData={systemData}
            onRefresh={fetchSystemData}
            loading={loading}
          />
        )}

        {activeTab === 'files' && (
          <FileManager
            currentPath={currentFilePath}
            setCurrentPath={setCurrentFilePath}
          />
        )}

        {activeTab === 'services' && (
          <ServicesManager />
        )}

        {activeTab === 'processes' && (
          <ProcessList />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-xs font-mono text-slate-500 space-y-2">
        <div>
          Designed with <span className="text-arch-cyan">UI/UX Pro Max Skill</span> standards (Modern Glassmorphism + Minimalist Swiss Style).
        </div>
        <div className="text-slate-600">
          Powered by Next.js App Router & Serverless Telemetry Fallback ● Vercel Ready ● Self-Hostable in macOS
        </div>
      </footer>

    </div>
  );
}
