'use client';

import React from 'react';
import useSWR from 'swr';
import { fetchJobs } from '@/lib/api';
import { Briefcase, Zap, Shield, Palette, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const categoryMeta: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  research: {
    label: 'Research',
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  development: {
    label: 'Development',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  creative: {
    label: 'Creative',
    icon: <Palette className="w-4 h-4" />,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
};

const riskMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  low: { label: 'Low Risk', icon: <Shield className="w-3.5 h-3.5" />, color: 'text-emerald-400' },
  medium: { label: 'Medium Risk', icon: <Minus className="w-3.5 h-3.5" />, color: 'text-amber-400' },
  high: { label: 'High Risk', icon: <TrendingDown className="w-3.5 h-3.5" />, color: 'text-red-400' },
};

export default function EconomyPage() {
  const { data: jobs, isLoading } = useSWR('jobs', fetchJobs);

  const categories = ['research', 'development', 'creative'];

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-primary" />
          Job Economy
        </h1>
        <p className="text-text-muted mt-1">
          All available jobs that AI agents can be assigned by the LLM. Personality determines which jobs they prefer.
        </p>
      </header>

      {/* Personality legend */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Aggressive', desc: 'Prefers high-risk high-pay jobs (±40% variance)', color: 'text-red-400 border-red-500/20 bg-red-500/5' },
          { label: 'Creative', desc: 'Balances risk and reward (±20% variance)', color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
          { label: 'Conservative', desc: 'Picks safe low-risk work (±10% variance)', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
        ].map(p => (
          <div key={p.label} className={`rounded-xl border p-4 ${p.color}`}>
            <div className="font-bold text-sm mb-1">{p.label}</div>
            <div className="text-xs opacity-70">{p.desc}</div>
          </div>
        ))}
      </div>

      {/* Job catalog by category */}
      {isLoading ? (
        <div className="text-center text-text-muted py-12">Loading job catalog...</div>
      ) : (
        categories.map(cat => {
          const catJobs = (jobs || []).filter(j => j.category === cat);
          const meta = categoryMeta[cat];
          return (
            <section key={cat}>
              <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg border ${meta.bg} ${meta.color} w-fit text-sm font-semibold`}>
                {meta.icon}
                {meta.label} ({catJobs.length} jobs)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {catJobs.map(job => {
                  const risk = riskMeta[job.risk] || riskMeta.low;
                  return (
                    <div
                      key={job.name}
                      className="rounded-xl border border-card-border bg-card-bg p-5 hover:border-card-border-hover transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-foreground">{job.name}</h3>
                        <div className={`flex items-center gap-1 text-xs font-medium ${risk.color}`}>
                          {risk.icon}
                          {risk.label}
                        </div>
                      </div>
                      <p className="text-sm text-text-secondary leading-relaxed mb-4">{job.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-text-muted uppercase tracking-wider">Base Pay</span>
                        <span className="font-bold font-mono text-emerald-400">{job.basePay} ADA</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
