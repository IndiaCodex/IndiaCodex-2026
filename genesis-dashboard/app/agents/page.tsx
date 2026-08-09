'use client';

import React from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Users, Loader2, AlertTriangle } from 'lucide-react';
import { fetchAgents } from '@/lib/api';
import { Agent } from '@/types/agent';
import { AgentCard } from '@/components/AgentCard';
import { Leaderboard } from '@/components/Leaderboard';

export default function AgentsPage() {
  const router = useRouter();
  const { data: agents, error, isLoading } = useSWR<Agent[]>('/api/agents', fetchAgents, {
    refreshInterval: 3000,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          Agents
        </h1>
        <div className="text-sm text-text-muted bg-card-bg px-3 py-1.5 rounded-lg border border-card-border">
          {agents ? `${agents.length} Total Agents` : '...'}
        </div>
      </div>

      {isLoading && !agents && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="p-6 bg-error/10 border border-error/20 rounded-xl text-error flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          Failed to fetch agents. Ensure backend is running.
        </div>
      )}

      {!isLoading && agents?.length === 0 && (
        <div className="p-12 text-center border border-dashed border-sidebar-border rounded-xl">
          <p className="text-text-muted">No agents found in the network. Spawn one in Orchestration.</p>
        </div>
      )}

      <Leaderboard agents={agents || []} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {agents?.map(agent => (
          <AgentCard 
            key={agent.id} 
            agent={agent} 
            onClick={() => router.push(`/agents/${agent.id}`)} 
          />
        ))}
      </div>
    </div>
  );
}
