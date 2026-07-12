import { useQuery } from '@tanstack/react-query';
import { prescriptionApi, patientApi } from '../../services/api';
import { Pill, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default function PatientPrescriptions() {
  const { data: profile } = useQuery({ queryKey: ['my-profile'], queryFn: patientApi.getProfile });
  const { data: prescriptions } = useQuery({
    queryKey: ['prescriptions', profile?.id],
    queryFn: () => prescriptionApi.getByPatient(profile?.id),
    enabled: !!profile?.id,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-900/50 rounded-lg"><Pill className="w-6 h-6 text-green-400" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">My Prescriptions</h2>
          <p className="text-slate-400 text-sm">Digital prescriptions as NFTs — show to any pharmacy</p>
        </div>
      </div>

      <div className="space-y-3">
        {prescriptions?.length === 0 && (
          <div className="text-center py-12 text-slate-500">No prescriptions yet</div>
        )}
        {prescriptions?.map(presc => {
          let medicines = [];
          try { medicines = JSON.parse(presc.medicines || '[]'); } catch {}
          return (
            <div key={presc.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {presc.isDispensed
                    ? <span className="flex items-center gap-1.5 text-sm text-emerald-400"><CheckCircle className="w-4 h-4" />Dispensed</span>
                    : <span className="flex items-center gap-1.5 text-sm text-green-400"><Pill className="w-4 h-4" />Active</span>
                  }
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs">Valid until</p>
                  <p className="text-white text-sm">{presc.validUntil || 'Open'}</p>
                </div>
              </div>

              <div className="space-y-2">
                {medicines.map((med, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-700/50 rounded-lg px-3 py-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-white text-sm font-medium">{med.name}</span>
                    <span className="text-slate-400 text-xs">{med.dosage} · {med.frequency} · {med.duration}</span>
                  </div>
                ))}
              </div>

              {presc.nftTxHash && (
                <div className="flex items-center gap-2 text-sm mt-3 pt-3 border-t border-slate-700">
                  <span className="text-slate-400">NFT:</span>
                  <span className="text-blue-400 font-mono text-xs">{presc.nftTxHash}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
