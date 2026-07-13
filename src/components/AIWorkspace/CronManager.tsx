'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Plus, PauseCircle, PlayCircle, Trash2, RefreshCw, Terminal, Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  repeat: string;
  nextRun: string;
  deliver: string;
  script: string;
  status: string;
  lastRun?: string;
}

export default function CronManager() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState('');
  const [formSchedule, setFormSchedule] = useState('');
  const [formScript, setFormScript] = useState('');

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/agents/cron');
      const d = await res.json();
      if (d.success) setJobs(d.jobs || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const doAction = async (action: string, id?: string, extra?: Record<string, string>) => {
    setActionMsg(`${action}...`);
    try {
      const res = await fetch('/api/agents/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id, ...extra }),
      });
      const d = await res.json();
      setActionMsg(d.success ? `✓ ${action} done` : `✗ ${d.error || 'failed'}`);
      await fetchJobs();
    } catch (e: any) { setActionMsg(`✗ ${e.message}`); }
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleCreate = async () => {
    await doAction('create', undefined, { name: formName, schedule: formSchedule, script: formScript });
    setShowCreate(false);
    setFormName('');
    setFormSchedule('');
    setFormScript('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-violet-400" />
          <span>Scheduled Jobs ({jobs.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          {actionMsg && <span className="text-[10px] font-mono text-slate-400">{actionMsg}</span>}
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-90 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-500/20"
          >
            <Plus className="w-3 h-3" />
            <span>New Job</span>
          </button>
          <button onClick={fetchJobs} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/70 animate-fadeIn">
          <div className="bg-arch-dark border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-sm font-bold font-mono text-white mb-4">Create Cron Job</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Name</label>
                <input value={formName} onChange={e => setFormName(e.target.value)}
                  className="w-full bg-[#06080D] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
                  placeholder="e.g. daily-backup" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Schedule (cron)</label>
                <input value={formSchedule} onChange={e => setFormSchedule(e.target.value)}
                  className="w-full bg-[#06080D] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
                  placeholder="e.g. 0 9 * * *" />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Script</label>
                <input value={formScript} onChange={e => setFormScript(e.target.value)}
                  className="w-full bg-[#06080D] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50"
                  placeholder="e.g. brain-capture.py" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowCreate(false)}
                className="bg-white/10 hover:bg-white/15 text-slate-300 px-4 py-2 rounded-xl text-xs font-medium transition-all border border-white/10">Cancel</button>
              <button onClick={handleCreate} disabled={!formName || !formSchedule || !formScript}
                className="bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-90 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-500/20">Create</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-slate-600 font-mono text-xs">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="bg-arch-card border border-arch-border rounded-3xl p-8 text-center backdrop-blur-xl">
          <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm font-mono text-slate-400">No scheduled jobs</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => (
            <div key={job.id} className="bg-arch-card border border-arch-border rounded-3xl p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${job.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                  <div>
                    <span className="text-sm font-bold font-mono text-white">{job.name}</span>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 mt-0.5">
                      <span>{job.schedule}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.nextRun}</span>
                      {job.lastRun && <span>Last: {job.lastRun}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {job.status === 'active' ? (
                    <button onClick={() => doAction('pause', job.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all">
                      <PauseCircle className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => doAction('resume', job.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                      <PlayCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => doAction('run', job.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition-all">
                    <Terminal className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => doAction('delete', job.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 text-[10px] font-mono text-slate-600">
                Script: {job.script} · Deliver: {job.deliver} · Repeat: {job.repeat}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
