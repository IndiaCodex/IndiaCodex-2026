import { useQuery } from '@tanstack/react-query';
import { patientApi, recordsApi, claimsApi, prescriptionApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FileText, CreditCard, Pill, Shield, CheckCircle, Clock, Search, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientDashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: patientApi.getProfile,
  });

  const { data: claims } = useQuery({
    queryKey: ['my-claims', profile?.id],
    queryFn: () => claimsApi.getByPatient(profile?.id),
    enabled: !!profile?.id,
  });

  const { data: records } = useQuery({
    queryKey: ['my-records', profile?.id],
    queryFn: () => recordsApi.getAll(profile?.id),
    enabled: !!profile?.id,
  });

  const { data: prescriptions } = useQuery({
    queryKey: ['my-prescriptions', profile?.id],
    queryFn: () => prescriptionApi.getByPatient(profile?.id),
    enabled: !!profile?.id,
  });

  const stats = [
    { label: 'Medical Records', value: records?.length ?? '-', icon: FileText, to: '/patient/records', color: 'blue' },
    { label: 'Prescriptions', value: prescriptions?.length ?? '-', icon: Pill, to: '/patient/prescriptions', color: 'green' },
    { label: 'Insurance Claims', value: claims?.length || 0, icon: CreditCard, to: '/patient/claims', color: 'purple' },
    { label: 'Verify on Cardano', value: '🔍', icon: Search, to: '/patient/verify', color: 'teal' },
    { label: 'Book Appointment', value: '📅', icon: FileText, to: '/patient/appointments', color: 'orange' },
    { label: 'Consent Requests', value: '🛡', icon: Shield, to: '/patient/consent', color: 'yellow' },
    { label: 'Audit Trail', value: '⛓', icon: Activity, to: '/patient/audit-trail', color: 'indigo' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-800 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {profile?.user?.name || 'Patient'} 👋
        </h1>
        <p className="text-blue-300 mt-1">Your health data is private, verified, and yours.</p>
        <div className="mt-4 flex items-center gap-2">
          {profile?.kycStatus === 'VERIFIED' ? (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-green-900/50 text-green-400 border border-green-700 rounded-full text-sm">
              <CheckCircle className="w-4 h-4" /> Identity Verified (ZKP)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-yellow-900/50 text-yellow-400 border border-yellow-700 rounded-full text-sm">
              <Clock className="w-4 h-4" /> KYC Pending
            </span>
          )}
          {profile?.identityNftTxHash && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-900/50 text-blue-400 border border-blue-700 rounded-full text-sm">
              <Shield className="w-4 h-4" /> Identity NFT on Cardano
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, to, color }) => (
          <Link key={label} to={to}
            className={`bg-slate-800/50 border border-slate-700 hover:border-${color}-600 rounded-xl p-5 transition-colors`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 bg-${color}-900/50 rounded-lg`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
              </div>
              <span className="text-2xl font-bold text-white">{value}</span>
            </div>
            <p className="text-slate-400 text-sm">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent Claims */}
      {claims && claims.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-white font-semibold">Recent Claims</h3>
          </div>
          <div className="divide-y divide-slate-700/50">
            {claims.slice(0, 3).map(claim => (
              <div key={claim.id} className="px-4 py-3 flex items-center justify-between">
                <span className="text-white text-sm">{claim.claimType}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm">₳{claim.claimAmountAda}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    claim.status === 'APPROVED' ? 'bg-green-900/50 text-green-400' :
                    claim.status === 'PAID' ? 'bg-emerald-900/50 text-emerald-400' :
                    'bg-yellow-900/50 text-yellow-400'
                  }`}>{claim.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
