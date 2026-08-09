'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetchAgents, fetchEvents, fetchStats, fetchAutoTickStatus } from '@/lib/api';
import { Agent } from '@/types/agent';
import { formatDistanceToNow } from 'date-fns';
import {
  Users,
  TrendingUp,
  Calendar,
  Bell,
  Zap,
  Loader2,
  Skull,
  Activity,
  Coins,
  Briefcase,
  CheckCircle2,
  ExternalLink,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';

// ── Event icon helper ────────────────────────────────────────────
function eventIcon(type: string) {
  if (type === 'task_complete') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  if (type === 'error') return <Skull className="w-3.5 h-3.5 text-red-400 shrink-0" />;
  if (type === 'tick') return <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
  if (type === 'spawn') return <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />;
  return <Activity className="w-3.5 h-3.5 text-zinc-400 shrink-0" />;
}

export default function DashboardPage() {
  const router = useRouter();

  // ── Data fetching ──────────────────────────────────────────────
  const { data: agents, error, isLoading } = useSWR<Agent[]>('agents', fetchAgents, { refreshInterval: 4000 });
  const { data: events } = useSWR<any[]>('events', fetchEvents, { refreshInterval: 4000 });
  const { data: stats } = useSWR<any>('stats', fetchStats, { refreshInterval: 4000 });
  const { data: autoStatus } = useSWR<any>('autoStatus', fetchAutoTickStatus, { refreshInterval: 5000 });

  // ── Live clock (client-only) ───────────────────────────────────
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setCurrentTime(new Date()), 0);
    const i = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => { clearTimeout(t); clearInterval(i); };
  }, []);

  // ── Derived values ─────────────────────────────────────────────
  const safeAgents = agents || [];
  const totalAgents = stats?.totalAgents ?? safeAgents.length;
  const aliveAgents = stats?.aliveAgents ?? safeAgents.filter(a => a.isAlive).length;
  const totalAda = stats?.totalADA ?? safeAgents.reduce((s, a) => s + (a.adaBalance || 0), 0);
  const ticksRun = stats?.ticksRun ?? 0;
  const totalJobs = stats?.totalJobs ?? 0;
  const totalEarned = stats?.totalEarned ?? 0;
  const survivalRate = totalAgents > 0 ? ((aliveAgents / totalAgents) * 100).toFixed(0) : '0';

  const recentEvents = [...(events || [])].slice(0, 8);
  const topAgents = [...safeAgents]
    .filter(a => a.isAlive)
    .sort((a, b) => b.adaBalance - a.adaBalance)
    .slice(0, 5);

  const formattedDate = currentTime
    ? currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';
  const formattedTime = currentTime
    ? currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
    : '--:--:-- --';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="relative z-10 container mx-auto px-6 py-8 max-w-[1400px]">

        {/* ─── Header ─── */}
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Genesis Network{' '}
              <span className="text-primary text-lg font-normal">
                {autoStatus?.running
                  ? <span className="inline-flex items-center gap-1.5 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />Auto-Running</span>
                  : <span className="inline-flex items-center gap-1.5 text-zinc-500"><span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />Paused</span>
                }
              </span>
            </h1>
            <p className="text-text-secondary mt-1 text-sm">
              Live Cardano testnet simulation — {aliveAgents} agent{aliveAgents !== 1 ? 's' : ''} active across {ticksRun} ticks
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-card-border bg-card-bg shadow-sm text-sm font-mono text-text-primary">
              <Calendar className="w-4 h-4 text-text-secondary" />
              <span className="hidden sm:inline">{formattedDate} •</span>
              <span>{formattedTime}</span>
            </div>
            <button
              onClick={() => router.push('/admin')}
              className="relative p-2.5 rounded-xl border border-card-border bg-card-bg shadow-sm hover:border-primary/50 transition-colors"
            >
              <Bell className="w-5 h-5 text-text-secondary" />
              {(events?.length ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
              )}
            </button>
          </div>
        </header>

        {/* ─── Live Stat Cards (from /api/stats) ─── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            value={isLoading ? '...' : aliveAgents.toString()}
            label="Live Agents"
            sub={`${totalAgents} total spawned`}
            accent="text-emerald-400"
            pulse={aliveAgents > 0}
          />
          <StatCard
            icon={<Coins className="w-5 h-5" />}
            value={isLoading ? '...' : `${totalAda.toFixed(1)}`}
            label="ADA in Network"
            sub="testnet balance"
            accent="text-cyan-400"
          />
          <StatCard
            icon={<Briefcase className="w-5 h-5" />}
            value={isLoading ? '...' : totalJobs.toString()}
            label="Jobs Completed"
            sub={`${totalEarned} ADA earned`}
            accent="text-purple-400"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            value={isLoading ? '...' : `${survivalRate}%`}
            label="Survival Rate"
            sub={`Tick ${ticksRun}`}
            accent="text-amber-400"
          />
        </section>

        {/* ─── Two-column: Live Events + Live Leaderboard ─── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Live Event Feed */}
          <div className="rounded-2xl border border-card-border bg-card-bg shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border/50">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">Live Event Feed</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Syncing
              </div>
            </div>
            <div className="divide-y divide-card-border/30 max-h-[320px] overflow-y-auto">
              {recentEvents.length === 0 && (
                <div className="py-10 text-center text-text-muted text-sm">
                  No events yet — run a tick to see activity
                </div>
              )}
              {recentEvents.map(ev => (
                <div key={ev.id} className="flex items-start gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="mt-0.5">{eventIcon(ev.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{ev.message}</p>
                    {ev.txHash && (
                      <a
                        href={`https://preprod.cardanoscan.io/transaction/${ev.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary mt-0.5"
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> View on Cardanoscan
                      </a>
                    )}
                  </div>
                  <span className="text-[10px] text-text-muted whitespace-nowrap shrink-0 mt-0.5">
                    {formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Leaderboard */}
          <div className="rounded-2xl border border-card-border bg-card-bg shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-card-border/50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-sm text-foreground">Wealth Leaderboard</span>
              </div>
              <span className="text-xs text-text-muted">Live balances</span>
            </div>
            <div className="divide-y divide-card-border/30">
              {topAgents.length === 0 && (
                <div className="py-10 text-center text-text-muted text-sm">
                  No agents alive — spawn one from Orchestration
                </div>
              )}
              {topAgents.map((agent, i) => (
                <div
                  key={agent.id}
                  onClick={() => router.push(`/agents/${agent.id}`)}
                  className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <span className={`text-base font-black w-6 text-center ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-700' : 'text-text-muted'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground truncate">{agent.name}</div>
                    <div className="text-xs text-text-muted capitalize">{agent.personality}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold font-mono text-emerald-400 text-sm">{agent.adaBalance.toFixed(2)}</div>
                    <div className="text-[10px] text-text-muted">ADA</div>
                  </div>
                  {/* Balance bar */}
                  <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (agent.adaBalance / Math.max(...topAgents.map(a => a.adaBalance), 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-tick status panel */}
            <div className={`mx-4 mb-4 mt-2 rounded-xl border p-3 flex items-center justify-between ${autoStatus?.running ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-card-border bg-card-bg'}`}>
              <div>
                <div className={`text-xs font-semibold ${autoStatus?.running ? 'text-emerald-400' : 'text-text-muted'}`}>
                  {autoStatus?.running ? `⚡ Auto-ticking every ${autoStatus.intervalSeconds}s` : '⏸ Simulation paused'}
                </div>
                <div className="text-[10px] text-text-muted mt-0.5">{ticksRun} ticks completed</div>
              </div>
              <button
                onClick={() => router.push('/admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${autoStatus?.running ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-card-bg border border-card-border text-text-secondary hover:text-foreground'}`}
              >
                {autoStatus?.running ? <><Pause className="w-3 h-3" /> Manage</> : <><Play className="w-3 h-3" /> Start</>}
              </button>
            </div>
          </div>
        </section>

        {/* ─── Error State ─── */}
        {error && (
          <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border border-card-border bg-card-bg shadow-sm">
            <Skull className="w-8 h-8 text-red-400" />
            <p className="text-text-primary font-medium">Backend offline — start the server on port 4000</p>
          </div>
        )}

        {/* ─── Active Agent Grid ─── */}
        {!error && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold tracking-[0.15em] uppercase text-text-secondary flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Active Agents
              </h2>
              <button
                onClick={() => router.push('/agents')}
                className="text-xs text-text-secondary hover:text-foreground transition-colors"
              >
                View all →
              </button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-text-muted animate-spin" />
              </div>
            )}

            {!isLoading && safeAgents.length === 0 && (
              <div className="py-12 text-center text-text-muted text-sm rounded-2xl border border-dashed border-card-border">
                No agents in the network — go to Orchestration to spawn one.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {safeAgents.map(agent => (
                <div
                  key={agent.id}
                  onClick={() => router.push(`/agents/${agent.id}`)}
                  className={`group relative rounded-xl border bg-card-bg shadow-sm p-5 cursor-pointer transition-all hover:shadow-md ${
                    agent.isAlive
                      ? 'border-card-border hover:border-emerald-500/30 hover:shadow-emerald-500/5'
                      : 'border-card-border opacity-60 hover:opacity-80'
                  }`}
                >
                  {/* Status glow top bar */}
                  <div className={`absolute top-0 left-4 right-4 h-[1px] rounded-full ${agent.isAlive ? 'bg-emerald-500/40' : 'bg-red-500/30'}`} />

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${agent.isAlive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                      <h3 className="font-semibold text-foreground text-sm">{agent.name}</h3>
                    </div>
                    {!agent.isAlive && <Skull className="w-3.5 h-3.5 text-red-400" />}
                  </div>

                  <p className="text-xs text-text-muted line-clamp-2 mb-4 leading-relaxed">{agent.goal}</p>

                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      agent.personality === 'aggressive' ? 'text-red-400 border-red-500/20 bg-red-500/5'
                        : agent.personality === 'creative' ? 'text-purple-400 border-purple-500/20 bg-purple-500/5'
                        : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5'
                    }`}>
                      {agent.personality}
                    </span>
                    <span className="font-bold font-mono text-sm text-foreground">
                      {agent.adaBalance.toFixed(2)} <span className="text-[10px] text-text-muted font-normal">ADA</span>
                    </span>
                  </div>

                  {/* Balance mini-bar */}
                  <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${agent.isAlive ? 'bg-emerald-500' : 'bg-red-500/50'}`}
                      style={{ width: `${Math.min(100, Math.max(2, (agent.adaBalance / 30) * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/* ── StatCard ─────────────────────────────────────────────────── */
function StatCard({
  icon, value, label, sub, accent, pulse,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  sub: string;
  accent: string;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card-bg shadow-sm p-5 hover:border-card-border-hover transition-all">
      <div className={`flex items-center gap-2 mb-3 ${accent}`}>
        {icon}
        {pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      </div>
      <div className={`text-3xl font-bold font-mono tracking-tight mb-0.5 ${accent}`}>{value}</div>
      <div className="text-sm font-medium text-text-secondary">{label}</div>
      <div className="text-xs text-text-muted mt-0.5">{sub}</div>
    </div>
  );
}
