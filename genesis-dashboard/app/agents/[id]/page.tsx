'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetchAgent } from '@/lib/api';
import { Agent } from '@/types/agent';
import { 
  ArrowLeft, 
  Activity, 
  Battery, 
  Brain, 
  Coins, 
  Heart, 
  Loader2, 
  Skull, 
  Star,
  Target,
  Zap,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Obituary } from '@/components/Obituary';
import { Timeline } from '@/components/Timeline';
import { BalanceChart } from '@/components/BalanceChart';

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: agent, error, isLoading } = useSWR<Agent>(
    id ? `/api/agents/${id}` : null,
    () => fetchAgent(id),
    { refreshInterval: 3000 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-500 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        <p className="font-medium animate-pulse">Establishing neural link to agent {id}...</p>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6">
        <div className="p-6 bg-red-500/10 rounded-full border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
          <Skull className="w-12 h-12 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
        </div>
        <div className="text-center">
          <p className="text-red-400 font-bold text-xl drop-shadow-md mb-2">Agent Not Found</p>
          <p className="text-zinc-500 mb-6">Could not locate neural signature for {id}.</p>
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-100 rounded-lg transition-colors border border-zinc-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Network
          </button>
        </div>
      </div>
    );
  }

  const isAlive = agent.isAlive;
  const statusColor = 
    !isAlive ? 'text-red-500 bg-red-500/10 border-red-500/30' :
    agent.status === 'working' ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' : 
    agent.status === 'idle' ? 'text-blue-500 bg-blue-500/10 border-blue-500/30' : 
    'text-zinc-500 bg-zinc-500/10 border-zinc-500/30';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 pb-20">
      {/* Background gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 container mx-auto px-6 py-12 max-w-5xl">
        {/* Navigation */}
        <button 
          onClick={() => router.push('/')}
          className="group mb-8 flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="font-medium">Back to Network Grid</span>
        </button>

        {/* Header Profile */}
        <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center border-2 shadow-lg ${statusColor}`}>
                {isAlive ? <Activity className="w-10 h-10" /> : <Skull className="w-10 h-10" />}
              </div>
              {isAlive && (
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-zinc-900 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
                  {agent.name}
                </h1>
                <div className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${statusColor}`}>
                  {!isAlive ? 'Deceased' : agent.status}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-zinc-400 font-mono">
                <span className="flex items-center gap-1">
                  <Brain className="w-4 h-4" /> {agent.id}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" /> 
                  {formatDistanceToNow(new Date(agent.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/50">
            <div className="text-sm font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-cyan-500" />
              Wallet Balance
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-cyan-100 font-mono">
                {agent.adaBalance?.toLocaleString() || 0}
              </span>
              <span className="text-sm font-medium text-cyan-500">ADA</span>
            </div>
          </div>
        </div>

        {!isAlive ? (
          <Obituary agent={agent} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Left Column: Stats & Identity */}
            <div className="lg:col-span-1 flex flex-col gap-8">
              {/* Vitals */}
              <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-3xl">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  Vitals & Stats
                </h2>
                <div className="space-y-6">
                  {/* Level */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-400 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" /> Level {agent.stats.level}</span>
                      <span className="text-yellow-400 font-mono">{agent.stats.experience} XP</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                      <div 
                        className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400" 
                        style={{ width: `${(agent.stats.experience % 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Health */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-400 flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Health</span>
                      <span className="text-red-400 font-mono">{agent.stats.health}%</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                      <div 
                        className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500" 
                        style={{ width: `${agent.stats.health}%` }}
                      />
                    </div>
                  </div>

                  {/* Energy */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-zinc-400 flex items-center gap-2"><Zap className="w-4 h-4 text-blue-500" /> Energy</span>
                      <span className="text-blue-400 font-mono">{agent.stats.energy}%</span>
                    </div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500" 
                        style={{ width: `${agent.stats.energy}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Persona & Details */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 rounded-3xl h-full">
                <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Neural Configuration
                </h2>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Primary Directive
                    </h3>
                    <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50 text-zinc-300 leading-relaxed">
                      {agent.goal}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Battery className="w-4 h-4" /> Personality Matrix
                    </h3>
                    <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50 text-zinc-300 leading-relaxed italic">
                      &quot;{agent.personality}&quot;
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Chart Section */}
        <div className="mt-8 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 sm:p-8 rounded-3xl">
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <span className="text-emerald-400">📈</span>
            Balance History
          </h2>
          <p className="text-zinc-500 text-sm mb-6">ADA balance tracked across every economic tick.</p>

          {/* Economy stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-zinc-950/50 rounded-xl border border-zinc-800/50 p-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Earned</div>
              <div className="text-xl font-bold text-emerald-400 font-mono">{(agent as any).totalEarned?.toFixed(2) || '0.00'} <span className="text-xs font-normal text-zinc-500">ADA</span></div>
            </div>
            <div className="bg-zinc-950/50 rounded-xl border border-zinc-800/50 p-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Spent</div>
              <div className="text-xl font-bold text-red-400 font-mono">{(agent as any).totalSpent?.toFixed(2) || '0.00'} <span className="text-xs font-normal text-zinc-500">ADA</span></div>
            </div>
            <div className="bg-zinc-950/50 rounded-xl border border-zinc-800/50 p-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Jobs Completed</div>
              <div className="text-xl font-bold text-cyan-400 font-mono">{(agent as any).jobsCompleted || 0}</div>
            </div>
          </div>

          <BalanceChart
            balanceHistory={(agent as any).balanceHistory || []}
            currentBalance={agent.adaBalance}
          />
        </div>

        {/* Timeline Section */}
        <div className="mt-8 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/80 p-6 sm:p-8 rounded-3xl">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
            <Clock className="w-6 h-6 text-zinc-400" />
            Activity Timeline
          </h2>
          <Timeline agentId={agent.id} />
        </div>
      </main>
    </div>
  );
}
