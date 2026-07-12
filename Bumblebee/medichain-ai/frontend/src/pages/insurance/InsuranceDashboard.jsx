import { useQuery } from '@tanstack/react-query';
import { claimsApi } from '../../services/api';
import { CreditCard, Brain, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function InsuranceDashboard() {
  const { data: manualReview } = useQuery({ queryKey: ['manual-review'], queryFn: claimsApi.getManualReview });

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-800 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white">Insurance Portal</h1>
        <p className="text-purple-300 mt-1">AI-powered claim processing · ZKP privacy · Fraud detection</p>
      </div>

      {manualReview && manualReview.length > 0 && (
        <div className="bg-orange-900/20 border border-orange-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            <h3 className="text-orange-400 font-semibold">{manualReview.length} claims need manual review</h3>
          </div>
          <div className="space-y-2">
            {manualReview.map(claim => (
              <Link key={claim.id} to={`/insurance/review/${claim.id}`}
                className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2 hover:bg-slate-700/50">
                <span className="text-white text-sm">{claim.claimType} · ₳{claim.claimAmountAda}</span>
                <span className="text-orange-400 text-xs">Review →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Link to="/insurance/claims" className="bg-slate-800/50 border border-slate-700 hover:border-purple-600 rounded-xl p-5 transition-colors">
          <CreditCard className="w-8 h-8 text-purple-400 mb-3" />
          <p className="text-white font-semibold">Claims Queue</p>
          <p className="text-slate-400 text-sm mt-1">AI-processed claims</p>
        </Link>
        <Link to="/insurance/review" className="bg-slate-800/50 border border-slate-700 hover:border-orange-600 rounded-xl p-5 transition-colors">
          <Brain className="w-8 h-8 text-orange-400 mb-3" />
          <p className="text-white font-semibold">Manual Review</p>
          <p className="text-slate-400 text-sm mt-1">{manualReview?.length || 0} pending</p>
        </Link>
      </div>
    </div>
  );
}
