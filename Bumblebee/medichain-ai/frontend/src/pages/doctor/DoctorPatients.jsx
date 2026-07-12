import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Users, Brain, Pill, FileText, Search, Shield, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import { CARDANOSCAN_BASE } from '../../services/cardano';
import api from '../../services/api';

export default function DoctorPatients() {
  const [search, setSearch] = useState('');

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['all-patients'],
    queryFn: () => api.get('/patients').then(r => r.data),
    refetchInterval: 30000,
  });

  const filtered = patients.filter(p => {
    const name = p.user?.name?.toLowerCase() || '';
    const wallet = p.walletAddress?.toLowerCase() || '';
    const q = search.toLowerCase();
    return !q || name.includes(q) || wallet.includes(q);
  });

  const KYC_BADGE = {
    VERIFIED:  { label: '✅ ZKP Verified', cls: 'bg-green-900/40 text-green-400 border-green-700' },
    PENDING:   { label: '⏳ Pending', cls: 'bg-yellow-900/40 text-yellow-400 border-yellow-700' },
    REJECTED:  { label: '❌ Rejected', cls: 'bg-red-900/40 text-red-400 border-red-700' },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900/50 rounded-lg">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">My Patients</h2>
            <p className="text-slate-400 text-sm">{patients.length} registered · ZKP verified identities</p>
          </div>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patients..."
            className="pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 w-56"
          />
        </div>
      </div>

      {/* Patient cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          {search ? 'No patients match your search' : 'No patients registered yet'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(patient => {
            const kycBadge = KYC_BADGE[patient.kycStatus] || KYC_BADGE.PENDING;
            return (
              <div key={patient.id} className="bg-slate-800/60 border border-slate-700 hover:border-blue-600 rounded-2xl p-5 transition-colors">
                {/* Patient info */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(patient.user?.name || 'P').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{patient.user?.name || 'Patient'}</p>
                    <p className="text-slate-400 text-xs font-mono truncate">{patient.walletAddress?.slice(0, 28)}...</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${kycBadge.cls}`}>
                        {kycBadge.label}
                      </span>
                      {patient.bloodGroup && (
                        <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 border border-red-800 rounded-full">
                          {patient.bloodGroup}
                        </span>
                      )}
                    </div>
                  </div>
                  {patient.walletAddress && !patient.walletAddress.includes('demo') && (
                    <a href={`${CARDANOSCAN_BASE}/address/${patient.walletAddress}`} target="_blank" rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex-shrink-0">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Identity NFT */}
                {patient.identityNftTxHash && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-blue-900/20 border border-blue-800 rounded-lg">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-blue-300 text-xs">Identity NFT on Cardano</span>
                    <a href={`${CARDANOSCAN_BASE}/transaction/${patient.identityNftTxHash}`}
                      target="_blank" rel="noreferrer" className="text-blue-400 ml-auto">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Quick action buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    to={`/doctor/diagnosis/${patient.id}`}
                    className="flex flex-col items-center gap-1.5 py-2.5 bg-green-900/30 hover:bg-green-900/50 border border-green-800 rounded-xl transition-colors"
                  >
                    <Brain className="w-4 h-4 text-green-400" />
                    <span className="text-green-300 text-xs font-medium">AI Diagnose</span>
                    <span className="text-green-500 text-xs">₳0.5</span>
                  </Link>
                  <Link
                    to={`/doctor/prescribe/${patient.id}`}
                    className="flex flex-col items-center gap-1.5 py-2.5 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800 rounded-xl transition-colors"
                  >
                    <Pill className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-300 text-xs font-medium">Prescribe</span>
                    <span className="text-blue-500 text-xs">NFT</span>
                  </Link>
                  <Link
                    to={`/doctor/patients/${patient.id}`}
                    className="flex flex-col items-center gap-1.5 py-2.5 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-800 rounded-xl transition-colors"
                  >
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-300 text-xs font-medium">Records</span>
                    <span className="text-purple-500 text-xs">On-chain</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

