import { useQuery, useMutation } from '@tanstack/react-query';
import { claimsApi } from '../../services/api';
import { generateClaimEligibilityProof } from '../../services/midnight';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Shield, Clock, CheckCircle, XCircle, AlertTriangle, TrendingDown, Lock } from 'lucide-react';

const STATUS_CONFIG = {
  SUBMITTED:     { color: 'text-blue-400', bg: 'bg-blue-900/30', icon: Clock },
  ZKP_VERIFIED:  { color: 'text-purple-400', bg: 'bg-purple-900/30', icon: Shield },
  AI_PROCESSING: { color: 'text-yellow-400', bg: 'bg-yellow-900/30', icon: Clock },
  APPROVED:      { color: 'text-green-400', bg: 'bg-green-900/30', icon: CheckCircle },
  REJECTED:      { color: 'text-red-400', bg: 'bg-red-900/30', icon: XCircle },
  MANUAL_REVIEW: { color: 'text-orange-400', bg: 'bg-orange-900/30', icon: AlertTriangle },
  PAID:          { color: 'text-emerald-400', bg: 'bg-emerald-900/30', icon: CheckCircle },
};

export default function PatientClaims({ patientId }) {
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [form, setForm] = useState({
    claimType: 'HOSPITALISATION',
    claimAmountAda: '',
    zkpEligibilityProof: '',
  });

  const { data: claims, refetch } = useQuery({
    queryKey: ['claims', patientId],
    queryFn: () => claimsApi.getByPatient(patientId),
    enabled: !!patientId,
  });

  const submitMutation = useMutation({
    mutationFn: async data => {
      // TRACK 3: Real Midnight ZKP — generate proof on Midnight preprod
      toast.loading('Generating ZKP on Midnight Network... Your medical history stays private', { id: 'zkp' });

      const zkpResult = await generateClaimEligibilityProof(
        { claimType: data.claimType, hospitalisationDays: data.hospitalisationDays || 1 },
        { condition: data.condition || 'UNSPECIFIED' }
      );

      toast.dismiss('zkp');
      toast.success(`ZKP generated on Midnight! Medical history NOT revealed.`);

      // TRACK 2: Masumi AI agent processes claim — charges ₳2
      toast.loading('Masumi Claims Agent processing — ₳2 ADA being charged...', { id: 'claims' });
      const result = await claimsApi.submit({
        ...data,
        patientId,
        zkpEligibilityProof: zkpResult.proofHash,
      });
      toast.dismiss('claims');
      return result;
    },
    onSuccess: () => {
      toast.success('Claim submitted! AI agent processing with Masumi payment.');
      setShowNewClaim(false);
      refetch();
    },
    onError: err => toast.error(err.response?.data?.detail || 'Submission failed'),
  });

  const handleSubmit = () => {
    if (!form.claimAmountAda) {
      toast.error('Fill claim amount');
      return;
    }
    // TRACK 3: ZKP generated automatically in submitMutation — no manual proof hash needed
    submitMutation.mutate({
      claimType: form.claimType,
      claimAmountAda: parseFloat(form.claimAmountAda),
      condition: form.condition || 'UNSPECIFIED',
      hospitalisationDays: form.hospitalisationDays || 1,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Insurance Claims</h2>
        <button
          onClick={() => setShowNewClaim(!showNewClaim)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          + New Claim
        </button>
      </div>

      {/* New Claim Form */}
      {showNewClaim && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Submit Insurance Claim
          </h3>

          <div className="p-3 bg-purple-900/20 border border-purple-800 rounded-lg text-sm text-purple-300">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Midnight ZKP will prove eligibility</strong> on the Midnight Network.
                Your actual diagnosis and medical history will NEVER be revealed to the insurance company.
                Masumi AI Agent will process the claim and charge ₳2.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Claim Type</label>
              <select
                value={form.claimType}
                onChange={e => setForm({...form, claimType: e.target.value})}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500"
              >
                {['HOSPITALISATION','SURGERY','OPD','MEDICINE','DENTAL','MATERNITY','ACCIDENT'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-sm mb-1.5 block">Amount (ADA)</label>
              <input
                type="number"
                value={form.claimAmountAda}
                onChange={e => setForm({...form, claimAmountAda: e.target.value})}
                placeholder="e.g. 500"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
          >
            {submitMutation.isPending
              ? 'Generating ZKP → Processing with Masumi AI...'
              : 'Submit Claim (Auto ZKP + AI Processing)'}
          </button>
        </div>
      )}

      {/* Claims List */}
      <div className="space-y-3">
        {claims?.length === 0 && (
          <div className="text-center py-12 text-slate-500">No claims yet</div>
        )}
        {claims?.map(claim => {
          const cfg = STATUS_CONFIG[claim.status] || STATUS_CONFIG.SUBMITTED;
          const Icon = cfg.icon;
          return (
            <div key={claim.id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="text-white font-semibold">{claim.claimType}</h4>
                  <p className="text-slate-400 text-sm">₳{claim.claimAmountAda}</p>
                </div>
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${cfg.color} ${cfg.bg}`}>
                  <Icon className="w-4 h-4" />
                  {claim.status.replace('_', ' ')}
                </span>
              </div>

              {claim.fraudScore && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingDown className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-400">Fraud Score:</span>
                  <span className={claim.fraudScore < 0.4 ? 'text-green-400' : 'text-red-400'}>
                    {(claim.fraudScore * 100).toFixed(0)}%
                  </span>
                </div>
              )}

              {claim.payoutTxHash && (
                <div className="mt-2 text-sm">
                  <span className="text-slate-400">Tx: </span>
                  <span className="text-blue-400 font-mono text-xs">{claim.payoutTxHash}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
