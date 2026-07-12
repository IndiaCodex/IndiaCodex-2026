import { useQuery } from '@tanstack/react-query';
import { recordsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { patientApi } from '../../services/api';
import { FileText, ExternalLink, ShieldCheck } from 'lucide-react';
import { getTxUrl, CARDANOSCAN_BASE } from '../../services/cardano';

const TYPE_COLORS = {
  CONSULTATION: 'blue', LAB_RESULT: 'green', IMAGING: 'purple',
  SURGERY: 'red', VACCINATION: 'teal', DISCHARGE: 'gray'
};

export default function PatientRecords() {
  const { data: profile } = useQuery({ queryKey: ['my-profile'], queryFn: patientApi.getProfile });
  const { data: records } = useQuery({
    queryKey: ['records', profile?.id],
    queryFn: () => recordsApi.getAll(profile?.id),
    enabled: !!profile?.id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-900/50 rounded-lg"><FileText className="w-6 h-6 text-blue-400" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">My Medical Records</h2>
          <p className="text-slate-400 text-sm">All records stored as NFTs on Cardano — immutable and owned by you</p>
        </div>
        <a href={CARDANOSCAN_BASE} target="_blank" rel="noreferrer"
          className="ml-auto text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
          CardanoScan <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="space-y-3">
        {records?.length === 0 && (
          <div className="text-center py-12 text-slate-500">No medical records yet</div>
        )}
        {records?.map(record => {
          const color = TYPE_COLORS[record.recordType] || 'gray';
          return (
            <div key={record.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`text-xs px-2 py-0.5 bg-${color}-900/50 text-${color}-400 border border-${color}-700 rounded-full`}>
                    {record.recordType}
                  </span>
                  <h4 className="text-white font-semibold mt-2">{record.diagnosis || 'No diagnosis recorded'}</h4>
                  <p className="text-slate-400 text-sm mt-1">{record.notes}</p>
                </div>
                <span className="text-slate-500 text-xs">{new Date(record.createdAt).toLocaleDateString()}</span>
              </div>
              {record.nftTxHash && (
                <div className="flex items-center gap-2 text-sm mt-3 pt-3 border-t border-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-slate-400 text-xs">On-chain:</span>
                  <span className="text-blue-400 font-mono text-xs truncate max-w-[180px]">{record.nftTxHash}</span>
                  <a
                    href={getTxUrl(record.nftTxHash)}
                    target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"
                  >
                    View on CardanoScan <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
