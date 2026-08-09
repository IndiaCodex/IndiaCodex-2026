import React from 'react';
import { Agent } from '@/types/agent';
import { Trophy, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  agents: Agent[];
}

export function Leaderboard({ agents }: LeaderboardProps) {
  // Sort by adaBalance DESC and take top 5
  const topAgents = [...agents]
    .sort((a, b) => b.adaBalance - a.adaBalance)
    .slice(0, 5);

  const getRankMedal = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return null;
    }
  };

  if (topAgents.length === 0) return null;

  return (
    <div className="bg-zinc-900/50 backdrop-blur-md border border-amber-500/20 p-6 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.15)] w-full mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-amber-500/10 rounded-xl">
          <Trophy className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100 drop-shadow-sm">Top Agents Leaderboard</h2>
      </div>

      <div className="flex flex-col gap-3">
        {topAgents.map((agent, index) => (
          <div 
            key={agent.id}
            className={cn(
              "flex items-center justify-between p-4 rounded-xl border transition-all",
              index === 0 ? "bg-gradient-to-r from-amber-500/10 to-transparent border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:bg-amber-500/10" :
              index === 1 ? "bg-gradient-to-r from-zinc-400/10 to-transparent border-zinc-400/30 hover:bg-zinc-400/10" :
              index === 2 ? "bg-gradient-to-r from-amber-700/10 to-transparent border-amber-700/30 hover:bg-amber-700/10" :
              "bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-800/50"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 text-2xl drop-shadow-md">
                {getRankMedal(index) || <span className="text-lg font-bold text-zinc-500">#{index + 1}</span>}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-zinc-100 text-lg flex items-center gap-2">
                  {agent.name}
                  {!agent.isAlive && <span className="text-[10px] uppercase tracking-wider bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20">Dead</span>}
                </span>
                <span className="text-xs font-medium text-zinc-400 capitalize">{agent.personality}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
              <Coins className="w-4 h-4 text-cyan-400" />
              <span className="font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-cyan-100 text-lg">
                {agent.adaBalance.toLocaleString()}
              </span>
              <span className="text-xs text-cyan-500 font-bold uppercase">ADA</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
