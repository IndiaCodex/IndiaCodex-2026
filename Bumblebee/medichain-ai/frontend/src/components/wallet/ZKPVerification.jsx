import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { zkpApi } from '../../services/api';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, XCircle, Loader2, Lock } from 'lucide-react';

const ZKP_TYPES = {
  PATIENT_KYC: {
    label: 'Patient Identity (KYC)',
    description: 'Prove your identity without revealing your Aadhaar or documents',
    endpoint: 'verifyPatientKyc',
    proves: 'Identity is real',
    hides: 'Aadhaar, DOB, address, name',
  },
  CLAIM_ELIGIBILITY: {
    label: 'Insurance Claim Eligibility',
    description: 'Prove you qualify for a claim without revealing your full medical history',
    endpoint: 'verifyInsuranceClaim',
    proves: 'Claim is eligible',
    hides: 'Actual diagnosis, medical history',
  },
};

export default function ZKPVerification({ type = 'PATIENT_KYC', onVerified, className = '' }) {
  const [zkpInput, setZkpInput] = useState('');
  const [result, setResult] = useState(null);
  const zkpType = ZKP_TYPES[type];

  const verifyMutation = useMutation({
    mutationFn: data => zkpApi[zkpType.endpoint](data),
    onSuccess: data => {
      setResult(data);
      if (data.verified) {
        toast.success('ZKP Proof verified — identity confirmed privately');
        onVerified?.(data);
      } else {
        toast.error('ZKP proof invalid');
      }
    },
    onError: () => toast.error('ZKP verification failed'),
  });

  return (
    <div className={`bg-slate-800/50 border border-purple-800/50 rounded-xl p-5 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-900/50 rounded-lg">
          <Shield className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">{zkpType.label}</h3>
          <p className="text-slate-400 text-sm">{zkpType.description}</p>
        </div>
      </div>

      {/* Privacy explanation */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 text-sm">
          <p className="text-green-400 font-medium mb-1">✅ Proves</p>
          <p className="text-green-300">{zkpType.proves}</p>
        </div>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-sm">
          <p className="text-red-400 font-medium mb-1 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> Hides
          </p>
          <p className="text-red-300">{zkpType.hides}</p>
        </div>
      </div>

      <div className="space-y-3">
        <input value={zkpInput} onChange={e => setZkpInput(e.target.value)}
          placeholder="Paste your Midnight ZKP proof hash..."
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-400 font-mono text-sm focus:outline-none focus:border-purple-500" />

        <button
          onClick={() => verifyMutation.mutate({ zkpProof: zkpInput })}
          disabled={!zkpInput || verifyMutation.isPending}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors">
          {verifyMutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying on Midnight Network...</>
            : <><Shield className="w-4 h-4" /> Verify ZKP Proof</>
          }
        </button>
      </div>

      {result && (
        <div className={`mt-4 p-4 border rounded-xl flex items-start gap-3 ${
          result.verified ? 'bg-green-900/20 border-green-700' : 'bg-red-900/20 border-red-700'}`}>
          {result.verified
            ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          }
          <div>
            <p className={`font-semibold ${result.verified ? 'text-green-400' : 'text-red-400'}`}>
              {result.verified ? 'Verified ✅' : 'Invalid ❌'}
            </p>
            <p className="text-slate-400 text-sm mt-1">{result.privacyNote || result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
