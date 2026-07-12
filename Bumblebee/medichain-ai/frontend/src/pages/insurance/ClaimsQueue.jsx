import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { claimsApi } from '../../services/api';
import { getConnectedMeshWallet, CARDANOSCAN_BASE } from '../../services/cardano';
import { lockPrescriptionEscrow } from '../../services/aikenContracts';
import { CreditCard, CheckCircle2, XCircle, Loader2, ExternalLink, Zap, Shield, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  SUBMITTED:     'yellow', ZKP_VERIFIED: 'blue', AI_PROCESSING: 'blue',
  APPROVED:      'green',  REJECTED:     'red',  MANUAL_REVIEW: 'orange',
  PAID:          'green',
};

export default function ClaimsQueue() {
  const queryClient = useQueryClient();
  const meshWallet = getConnectedMeshWallet();
  const [approvingId, setApprovingId] = useState(null);
  const [txResults, setTxResults] = useState({});

  const { data: claims = [] } = useQuery({
    queryKey: ['manual-review'],
    queryFn: claimsApi.getManualReview,
    refetchInterval: 10000,
  });

  const approveClaim = async (claim) => {
    setApprovingId(claim.id);
    try {
      // Step 1: Lock ADA in Aiken escrow contract (real Cardano tx if wallet connected)
      let escrowTxHash = null;
      if (meshWallet) {
        toast.loading('Locking ADA in Aiken escrow...', { id: 'escrow' });
        const escrowResult = await lockPrescriptionEscrow({
          wallet: meshWallet,
          prescriptionId: claim.id,
          adaAmount: String(Math.round(parseFloat(claim.claimAmountAda || 2) * 1_000_000)),
        });
        toast.dismiss('escrow');
        escrowTxHash = escrowResult.txHash;
        if (escrowResult.real) {
          toast.success(`₳${claim.claimAmountAda} locked in Aiken escrow!`);
        }
        setTxResults(prev => ({ ...prev, [claim.id]: escrowResult }));
      }

      // Step 2: Approve in backend — releases payment
      const result = await claimsApi.approve(claim.id, { escrowTxHash });
      queryClient.invalidateQueries({ queryKey: ['manual-review'] });

      toast.success(`✅ Claim approved — ₳${claim.claimAmountAda} released to patient`);
      setTxResults(prev => ({ ...prev, [claim.id]: { ...prev[claim.id], approved: true, ...result } }));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const rejectClaim = async (claim) => {
    setApprovingId(`reject-${claim.id}`);
    try {
      await claimsApi.reject(claim.id);
      queryClient.invalidateQueries({ queryKey: ['manual-review'] });
      toast.error(`Claim rejected`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-900/50 rounded-lg">
          <CreditCard className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Claims Queue</h2>
          <p className="text-slate-400 text-sm">Approve → ADA released via Aiken smart contract</p>
        </div>
        <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-blue-900/30 border border-blue-700 rounded-full text-xs text-blue-300">
          <Zap className="w-3.5 h-3.5" /> AI-processed · ZKP verified
        </div>
      </div>

      {!meshWallet && (
        <div className="px-4 py-3 bg-yellow-900/20 border border-yellow-700 rounded-xl text-sm text-yellow-300">
          ⚠️ Connect Lace wallet to release real ADA payments. Currently running in demo mode.
        </div>
      )}

      <div className="space-y-4">
        {claims.map(claim => {
          const color = STATUS_COLORS[claim.status] || 'slate';
          const isApproving = approvingId === claim.id;
          const isRejecting = approvingId === `reject-${claim.id}`;
          const txResult = txResults[claim.id];
          const isResolved = claim.status === 'APPROVED' || claim.status === 'REJECTED' || txResult?.approved;

          return (
            <div key={claim.id} className={`bg-slate-800/50 border rounded-2xl p-5 ${
              isResolved ? 'border-green-800/50' : 'border-slate-700'
            }`}>
              {/* Claim header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold text-lg">₳{claim.claimAmountAda}</span>
                    <span className={`text-xs px-2 py-0.5 bg-${color}-900/50 text-${color}-400 border border-${color}-700 rounded-full`}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">{claim.claimType?.replace(/_/g, ' ')}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Patient: {claim.patient?.user?.name || claim.patient?.walletAddress?.slice(0, 20) + '...'}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {new Date(claim.createdAt || Date.now()).toLocaleDateString()}
                </div>
              </div>

              {/* AI Decision */}
              {(claim.aiDecision || claim.aiConfidence) && (
                <div className="flex items-center gap-3 mb-4 px-3 py-2.5 bg-slate-900/50 rounded-xl">
                  <Zap className="w-4 h-4 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-slate-400 text-xs">AI Decision: </span>
                    <span className={`text-sm font-medium ${claim.aiDecision === 'APPROVED' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {claim.aiDecision}
                    </span>
                    {claim.aiConfidence && (
                      <span className="text-slate-500 text-xs ml-2">{Math.round(claim.aiConfidence * 100)}% confidence</span>
                    )}
                    {claim.fraudScore !== undefined && (
                      <span className="text-slate-500 text-xs ml-2">Fraud risk: {Math.round(claim.fraudScore * 100)}%</span>
                    )}
                  </div>
                  <Shield className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-purple-400 text-xs">ZKP Verified</span>
                </div>
              )}

              {/* Cardano TX result */}
              {txResult && (
                <div className={`mb-4 p-3 rounded-xl border text-xs ${
                  txResult.real ? 'bg-green-900/20 border-green-700' : 'bg-yellow-900/20 border-yellow-700'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-slate-400">
                      {txResult.real ? '✅ Real Cardano TX — ADA locked in Aiken escrow' : '⚠️ Demo TX (connect wallet for real)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300 font-mono truncate flex-1">{txResult.txHash}</span>
                    <a href={txResult.cardanoScanUrl} target="_blank" rel="noreferrer" className="text-blue-400 flex-shrink-0">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}

              {/* Approve / Reject buttons */}
              {!isResolved && (
                <div className="flex gap-3">
                  <button
                    onClick={() => approveClaim(claim)}
                    disabled={!!approvingId}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {isApproving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                      : <><CheckCircle2 className="w-4 h-4" /> Approve & Release ₳{claim.claimAmountAda}</>
                    }
                  </button>
                  <button
                    onClick={() => rejectClaim(claim)}
                    disabled={!!approvingId}
                    className="px-4 py-2.5 bg-red-900/40 hover:bg-red-900/60 border border-red-700 disabled:opacity-50 text-red-300 font-medium rounded-xl flex items-center gap-2 transition-colors"
                  >
                    {isRejecting
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <XCircle className="w-4 h-4" />
                    }
                  </button>
                </div>
              )}

              {isResolved && (
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  ₳{claim.claimAmountAda} released to patient wallet
                </div>
              )}
            </div>
          );
        })}

        {claims.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
            No claims in queue
          </div>
        )}
      </div>
    </div>
  );
}

