/**
 * Patient Consent Page — Scenario 5 of Demo Workflow
 * "Dr. X wants to share your prescription with Insurance Company"
 * Patient approves → Consent recorded on Cardano (CIP-674 metadata tx)
 * This is the UNIQUE blockchain UX that no other team has
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consentApi } from '../../services/api';
import { anchorRecordHashOnChain, getConnectedMeshWallet, CARDANOSCAN_BASE } from '../../services/cardano';
import {
  ShieldCheck, ShieldX, Clock, ExternalLink, Loader2,
  CheckCircle2, XCircle, Bell, FileText, User, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

const CONSENT_ICONS = {
  SHARE_WITH_INSURANCE: Building2,
  SHARE_WITH_SPECIALIST: User,
  PRESCRIPTION_ACCESS: FileText,
};

const CONSENT_COLORS = {
  PENDING: 'yellow',
  APPROVED: 'green',
  DENIED: 'red',
};

export default function PatientConsentPage() {
  const queryClient = useQueryClient();
  const meshWallet = getConnectedMeshWallet();
  const [processingId, setProcessingId] = useState(null);
  const [txResults, setTxResults] = useState({});

  const { data: consents = [], isLoading } = useQuery({
    queryKey: ['my-consents'],
    queryFn: consentApi.getMyConsents,
    refetchInterval: 15000,
  });

  const pendingConsents = consents.filter(c => c.status === 'PENDING');
  const resolvedConsents = consents.filter(c => c.status !== 'PENDING');

  const respondMutation = useMutation({
    mutationFn: ({ consentId, approved, txHash }) =>
      consentApi.respond(consentId, { approved, txHash }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-consents'] });
    },
  });

  const handleRespond = async (consent, approved) => {
    setProcessingId(consent.id);
    try {
      // Anchor consent decision on Cardano
      const hashToAnchor = `consent:${consent.id}:${approved ? 'APPROVED' : 'DENIED'}:${Date.now()}`;
      const anchorResult = await anchorRecordHashOnChain({
        recordId: consent.id,
        recordType: 'CONSENT',
        patientId: consent.patientId,
        doctorId: consent.requestedBy,
        dataHash: hashToAnchor,
      });

      await respondMutation.mutateAsync({
        consentId: consent.id,
        approved,
        txHash: anchorResult.txHash,
      });

      setTxResults(prev => ({ ...prev, [consent.id]: anchorResult }));

      if (approved) {
        toast.success(`✅ Consent approved — recorded on Cardano${anchorResult.real ? '' : ' (demo)'}`);
      } else {
        toast.error(`❌ Consent denied — recorded on Cardano`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-purple-900/50 rounded-xl">
          <ShieldCheck className="w-7 h-7 text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Data Consent</h1>
          <p className="text-slate-400 mt-1">
            You control who sees your health data. Every decision is recorded immutably on Cardano.
          </p>
        </div>
        {pendingConsents.length > 0 && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-yellow-900/30 border border-yellow-700 rounded-full animate-pulse">
            <Bell className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm font-medium">{pendingConsents.length} pending</span>
          </div>
        )}
      </div>

      {/* Track badges */}
      <div className="flex flex-wrap gap-2">
        <span className="px-3 py-1 bg-blue-900/30 text-blue-300 border border-blue-700 rounded-full text-xs">🔷 Cardano — CIP-674 Consent Metadata</span>
        <span className="px-3 py-1 bg-purple-900/30 text-purple-300 border border-purple-700 rounded-full text-xs">🛡 Midnight — ZKP Identity Verified</span>
        <span className="px-3 py-1 bg-green-900/30 text-green-300 border border-green-700 rounded-full text-xs">🤖 Masumi — AI Consent Analysis</span>
      </div>

      {/* How it works */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-4">
        <p className="text-slate-300 text-sm font-medium mb-3">🔐 How consent works on MediChain:</p>
        <div className="flex items-center gap-2 text-sm text-slate-400 flex-wrap">
          <span className="px-2 py-1 bg-slate-700 rounded-lg">Doctor requests</span>
          <span className="text-slate-600">→</span>
          <span className="px-2 py-1 bg-slate-700 rounded-lg">You see it here</span>
          <span className="text-slate-600">→</span>
          <span className="px-2 py-1 bg-slate-700 rounded-lg">You approve/deny</span>
          <span className="text-slate-600">→</span>
          <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded-lg">Anchored on Cardano</span>
          <span className="text-slate-600">→</span>
          <span className="px-2 py-1 bg-slate-700 rounded-lg">Insurance can verify</span>
        </div>
      </div>

      {/* Pending consents */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : pendingConsents.length === 0 ? (
        <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-8 text-center">
          <ShieldCheck className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-white font-semibold">No pending consent requests</p>
          <p className="text-slate-400 text-sm mt-1">You'll be notified when a doctor requests data access</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-400" />
            Pending Requests ({pendingConsents.length})
          </h2>
          {pendingConsents.map(consent => {
            const Icon = CONSENT_ICONS[consent.consentType] || FileText;
            const isProcessing = processingId === consent.id;
            const txResult = txResults[consent.id];

            return (
              <div key={consent.id} className="bg-slate-800/60 border border-yellow-700/50 rounded-2xl p-5">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 bg-yellow-900/40 rounded-xl flex-shrink-0">
                    <Icon className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{consent.title || 'Data Access Request'}</h3>
                      <span className="text-xs px-2 py-0.5 bg-yellow-900/50 text-yellow-400 border border-yellow-700 rounded-full">
                        PENDING
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">{consent.description || `Dr. ${consent.requestedByName} wants to share your ${consent.consentType?.replace(/_/g, ' ').toLowerCase()} with ${consent.recipientName}.`}</p>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-400">
                      <span>👨‍⚕️ Requested by: <span className="text-white">{consent.requestedByName || 'Doctor'}</span></span>
                      <span>🏢 Recipient: <span className="text-white">{consent.recipientName || 'Insurance Company'}</span></span>
                      <span>📅 {new Date(consent.createdAt).toLocaleDateString()}</span>
                    </div>

                    {txResult && (
                      <div className={`mt-3 p-2.5 rounded-lg border text-xs ${txResult.real ? 'bg-green-900/20 border-green-700' : 'bg-yellow-900/20 border-yellow-700'}`}>
                        <span className="text-slate-400">Cardano TX: </span>
                        <span className="text-blue-300 font-mono truncate">{txResult.txHash}</span>
                        <a href={txResult.cardanoScanUrl} target="_blank" rel="noreferrer"
                          className="ml-2 text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleRespond(consent, true)}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {isProcessing
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <CheckCircle2 className="w-4 h-4" />
                    }
                    Approve & Record on Cardano
                  </button>
                  <button
                    onClick={() => handleRespond(consent, false)}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 bg-red-900/50 hover:bg-red-900/70 border border-red-700 disabled:opacity-50 text-red-300 font-medium rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Deny
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolved consents */}
      {resolvedConsents.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-sm text-slate-400">History</h2>
          {resolvedConsents.map(consent => {
            const approved = consent.status === 'APPROVED';
            return (
              <div key={consent.id} className={`bg-slate-800/30 border rounded-xl p-4 flex items-center gap-4 ${
                approved ? 'border-green-800/50' : 'border-red-800/50'
              }`}>
                {approved
                  ? <ShieldCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                  : <ShieldX className="w-5 h-5 text-red-400 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{consent.title || 'Data Access Request'}</p>
                  <p className="text-slate-400 text-xs">{consent.requestedByName} → {consent.recipientName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    approved
                      ? 'bg-green-900/30 text-green-400 border-green-700'
                      : 'bg-red-900/30 text-red-400 border-red-700'
                  }`}>
                    {consent.status}
                  </span>
                  {consent.cardanoTxHash && (
                    <a href={`${CARDANOSCAN_BASE}/transaction/${consent.cardanoTxHash}`}
                      target="_blank" rel="noreferrer"
                      className="ml-2 text-blue-400 text-xs hover:text-blue-300 inline-flex items-center gap-0.5">
                      On-chain <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
