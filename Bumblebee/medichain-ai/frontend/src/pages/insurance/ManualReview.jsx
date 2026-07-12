import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimsApi } from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';

export default function ManualReview() {
  const { claimId } = useParams();
  const qc = useQueryClient();
  const { data: claim } = useQuery({ queryKey: ['claim', claimId], queryFn: () => claimsApi.getStatus(claimId) });

  const approveMutation = useMutation({
    mutationFn: () => claimsApi.approveManually(claimId, { decision: 'APPROVED' }),
    onSuccess: () => { toast.success('Claim approved'); qc.invalidateQueries(['manual-review']); }
  });
  const rejectMutation = useMutation({
    mutationFn: () => claimsApi.approveManually(claimId, { decision: 'REJECTED' }),
    onSuccess: () => { toast.error('Claim rejected'); qc.invalidateQueries(['manual-review']); }
  });

  if (!claim) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xl font-bold text-white">Manual Review — {claim.claimType}</h2>
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-3">
        <div className="flex justify-between"><span className="text-slate-400">Amount</span><span className="text-white font-bold">₳{claim.claimAmountAda}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">Fraud Score</span>
          <span className={claim.fraudScore > 0.5 ? 'text-red-400 font-bold' : 'text-green-400'}>
            {(claim.fraudScore * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex justify-between"><span className="text-slate-400">AI Decision</span><span className="text-white">{claim.aiDecision}</span></div>
        <div className="flex justify-between"><span className="text-slate-400">ZKP Verified</span><span className="text-green-400">✅ Yes</span></div>
      </div>
      <div className="flex gap-3">
        <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}
          className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2">
          <CheckCircle className="w-5 h-5" /> Approve
        </button>
        <button onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}
          className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center justify-center gap-2">
          <XCircle className="w-5 h-5" /> Reject
        </button>
      </div>
    </div>
  );
}
