import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { prescriptionApi } from '../../services/api';
import toast from 'react-hot-toast';
import { Pill, CheckCircle, XCircle, Search } from 'lucide-react';

export default function PharmacyDashboard() {
  const [nftAssetId, setNftAssetId] = useState('');
  const [verifiedPresc, setVerifiedPresc] = useState(null);

  const verifyMutation = useMutation({
    mutationFn: id => prescriptionApi.verify(id),
    onSuccess: data => {
      setVerifiedPresc(data);
      toast.success('Prescription verified on Cardano blockchain!');
    },
    onError: err => toast.error(err.response?.data?.detail || 'Prescription not found or already dispensed'),
  });

  const dispenseMutation = useMutation({
    mutationFn: id => prescriptionApi.verify(id),
    onSuccess: () => { toast.success('Prescription dispensed and marked on-chain'); setVerifiedPresc(null); setNftAssetId(''); },
    onError: () => toast.error('Failed to dispense'),
  });

  let medicines = [];
  if (verifiedPresc?.medicines) {
    try { medicines = JSON.parse(verifiedPresc.medicines); } catch {}
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-900/50 rounded-lg"><Pill className="w-6 h-6 text-green-400" /></div>
        <div>
          <h2 className="text-xl font-bold text-white">Pharmacy — Verify Prescription</h2>
          <p className="text-slate-400 text-sm">Scan NFT asset ID from patient wallet to verify</p>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-4">
        <label className="text-white font-medium block">NFT Asset ID</label>
        <div className="flex gap-2">
          <input value={nftAssetId} onChange={e => setNftAssetId(e.target.value)}
            placeholder="medichain_presc_abc12345..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 font-mono text-sm focus:outline-none focus:border-blue-500" />
          <button onClick={() => verifyMutation.mutate(nftAssetId)}
            disabled={!nftAssetId || verifyMutation.isPending}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 transition-colors">
            <Search className="w-4 h-4" /> Verify
          </button>
        </div>
      </div>

      {verifiedPresc && (
        <div className="bg-slate-800/50 border border-green-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-green-400 font-semibold">
            <CheckCircle className="w-5 h-5" /> Valid Prescription — Verified on Cardano
          </div>

          {verifiedPresc.isDispensed && (
            <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
              <XCircle className="w-4 h-4" /> Already dispensed — cannot dispense again
            </div>
          )}

          <div className="space-y-2">
            <p className="text-slate-400 text-sm font-medium">Medicines:</p>
            {medicines.map((med, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-700/50 rounded-lg px-3 py-2.5">
                <Pill className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-white font-medium">{med.name}</span>
                <span className="text-slate-400 text-sm">{med.dosage} · {med.frequency}</span>
              </div>
            ))}
          </div>

          <div className="text-sm text-slate-400">
            Valid until: <span className="text-white">{verifiedPresc.validUntil || 'Open'}</span>
          </div>

          {!verifiedPresc.isDispensed && (
            <button onClick={() => dispenseMutation.mutate(nftAssetId)}
              disabled={dispenseMutation.isPending}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors">
              {dispenseMutation.isPending ? 'Dispensing...' : 'Dispense & Mark on Chain'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
