import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { Shield, Clock } from 'lucide-react';

export default function AuditLogs() {
  const { data: logs } = useQuery({ queryKey: ['audit-logs'], queryFn: () => adminApi.getAuditLogs({ page: 0, size: 50 }) });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-blue-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Audit Logs</h2>
          <p className="text-slate-400 text-sm">Immutable record of all system actions — cannot be deleted</p>
        </div>
      </div>
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl divide-y divide-slate-700/50">
        {logs?.content?.map(log => (
          <div key={log.id} className="px-4 py-3 flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.result === 'SUCCESS' ? 'bg-green-400' : 'bg-red-400'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium">{log.action}</p>
              <p className="text-slate-500 text-xs">{log.resourceType} · {log.ipAddress}</p>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs flex-shrink-0">
              <Clock className="w-3.5 h-3.5" />
              {new Date(log.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
        {(!logs?.content || logs.content.length === 0) && (
          <p className="px-4 py-8 text-center text-slate-500 text-sm">No audit logs yet</p>
        )}
      </div>
    </div>
  );
}
