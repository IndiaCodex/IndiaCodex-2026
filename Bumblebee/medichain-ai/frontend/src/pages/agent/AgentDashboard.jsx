import { useQuery } from '@tanstack/react-query';
import { aiApi, adminApi } from '../../services/api';
import { Brain, CheckCircle, Clock, AlertTriangle, TrendingUp, Zap } from 'lucide-react';

const AGENTS = [
  { id: 'diagnosis', name: 'Diagnosis Agent', price: '₳0.5/query', description: 'AI symptom analysis', color: 'green' },
  { id: 'insurance', name: 'Claims Agent', price: '₳2/claim', description: 'Fraud detection + approval', color: 'blue' },
  { id: 'kyc', name: 'KYC Agent', price: '₳1/verification', description: 'Identity verification', color: 'purple' },
  { id: 'support', name: 'Support Agent', price: '₳0.1/chat', description: '24/7 patient support', color: 'yellow' },
  { id: 'records', name: 'Records Agent', price: '₳0.3/summary', description: 'Medical history summary', color: 'orange' },
];

export default function AgentDashboard() {
  const { data: status } = useQuery({
    queryKey: ['agent-status'],
    queryFn: aiApi.getAgentStatus,
    refetchInterval: 10000,
  });

  const { data: logs } = useQuery({
    queryKey: ['agent-logs'],
    queryFn: () => aiApi.getAgentLogs({ size: 20 }),
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-900/50 rounded-lg">
          <Brain className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">AI Agent Dashboard</h2>
          <p className="text-slate-400 text-sm">All agents running autonomously on Masumi Network</p>
        </div>
      </div>

      {/* Agent Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map(agent => {
          const agentStatus = status?.[agent.id];
          const isRunning = agentStatus?.status === 'RUNNING';
          return (
            <div key={agent.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 bg-${agent.color}-900/50 rounded-lg`}>
                  <Zap className={`w-5 h-5 text-${agent.color}-400`} />
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className={`text-xs ${isRunning ? 'text-green-400' : 'text-red-400'}`}>
                    {isRunning ? 'RUNNING' : 'OFFLINE'}
                  </span>
                </div>
              </div>

              <h4 className="text-white font-semibold">{agent.name}</h4>
              <p className="text-slate-400 text-sm mt-0.5">{agent.description}</p>

              <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
                <span className="text-blue-400 font-medium text-sm">{agent.price}</span>
                <span className="text-slate-400 text-xs">
                  {agentStatus?.totalTasks || 0} tasks today
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Agent Logs */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-white font-semibold">Live Agent Activity</h3>
          <div className="flex items-center gap-1.5 text-green-400 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Real-time
          </div>
        </div>

        <div className="divide-y divide-slate-700/50 max-h-80 overflow-y-auto">
          {logs?.content?.map((log, i) => (
            <div key={log.id || i} className="px-4 py-3 flex items-center gap-4">
              <div className="flex-shrink-0">
                {log.status === 'SUCCESS' ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : log.status === 'FAILED' ? (
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{log.agentType}</p>
                <p className="text-slate-400 text-xs truncate">{log.workflowId}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-green-400 text-sm">₳{log.chargedAda}</p>
                <p className="text-slate-500 text-xs">{log.durationMs}ms</p>
              </div>
            </div>
          ))}

          {(!logs?.content || logs.content.length === 0) && (
            <div className="px-4 py-8 text-center text-slate-500 text-sm">
              No agent activity yet. Agents are ready and listening.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
