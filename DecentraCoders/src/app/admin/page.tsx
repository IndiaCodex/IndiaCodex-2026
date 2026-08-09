'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout, { useToast } from '@/components/DashboardLayout';
import { dbService } from '@/lib/supabase';
import { Profile, Idea, BlockchainRecord } from '@/lib/demoData';
import {
  Shield, Users, Lightbulb, Cpu, Database,
  TrendingUp, AlertTriangle, CheckCircle, Clock, Activity, Hash
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  students: number;
  mentors: number;
  developers: number;
  totalIdeas: number;
  confirmedOnChain: number;
  pendingRegistrations: number;
  totalRecords: number;
}

export default function AdminPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0, students: 0, mentors: 0, developers: 0,
    totalIdeas: 0, confirmedOnChain: 0, pendingRegistrations: 0, totalRecords: 0,
  });
  const [recentIdeas, setRecentIdeas] = useState<Idea[]>([]);
  const [recentRecords, setRecentRecords] = useState<BlockchainRecord[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = dbService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
          showToast('Admin access required.', 'error');
          setLoading(false);
          return;
        }

        const [ps, ideas, records] = await Promise.all([
          dbService.getProfiles(),
          dbService.getIdeas(),
          dbService.getBlockchainRecords(),
        ]);

        setProfiles(ps);
        setRecentIdeas(ideas.slice(0, 6));
        setRecentRecords(records.slice(0, 5));

        setStats({
          totalUsers: ps.length,
          students: ps.filter(p => p.role === 'student').length,
          mentors: ps.filter(p => p.role === 'mentor').length,
          developers: ps.filter(p => p.role === 'developer').length,
          totalIdeas: ideas.length,
          confirmedOnChain: ideas.filter(i => i.blockchain_status === 'Confirmed').length,
          pendingRegistrations: ideas.filter(i => i.blockchain_status === 'Pending').length,
          totalRecords: records.length,
        });
      } catch {
        showToast('Error loading admin data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: <Users className="w-5 h-5" />, color: 'from-primary/20 to-primary/5 border-primary/30 text-primary' },
    { label: 'Total Ideas', value: stats.totalIdeas, icon: <Lightbulb className="w-5 h-5" />, color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400' },
    { label: 'On-chain Proofs', value: stats.confirmedOnChain, icon: <Cpu className="w-5 h-5" />, color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400' },
    { label: 'Ledger Records', value: stats.totalRecords, icon: <Database className="w-5 h-5" />, color: 'from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-400' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-16 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in font-sans">

        {/* Header */}
        <div className="glass-panel p-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Admin Console
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Platform metrics, user audits, and Cardano ledger records.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map(card => (
            <div key={card.label} className={`p-4 rounded-xl border bg-gradient-to-br ${card.color}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color} border`}>
                {card.icon}
              </div>
              <p className="text-2xl font-extrabold text-white">{card.value}</p>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Role Breakdown */}
        <div className="glass-panel p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">User Role Distribution</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Students', count: stats.students, color: 'bg-primary', pct: Math.round((stats.students / stats.totalUsers) * 100) },
              { label: 'Mentors', count: stats.mentors, color: 'bg-cyan-400', pct: Math.round((stats.mentors / stats.totalUsers) * 100) },
              { label: 'Developers', count: stats.developers, color: 'bg-violet-400', pct: Math.round((stats.developers / stats.totalUsers) * 100) },
            ].map(item => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-400">{item.label}</span>
                  <span className="text-xs font-bold text-white">{item.count}</span>
                </div>
                <div className="h-1.5 bg-surface-card rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${item.pct}%` }} />
                </div>
                <p className="text-[10px] text-gray-600 font-semibold">{item.pct}% of users</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Ideas Audit */}
        <div className="glass-panel p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Recent Startup Ideas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] text-gray-500 uppercase tracking-wider border-b border-translucent">
                  <th className="text-left py-2 pr-4 font-semibold">Title</th>
                  <th className="text-left py-2 pr-4 font-semibold">Owner</th>
                  <th className="text-left py-2 pr-4 font-semibold">Status</th>
                  <th className="text-left py-2 font-semibold">Blockchain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-translucent">
                {recentIdeas.map(idea => {
                  const owner = profiles.find(p => p.id === idea.owner_id);
                  return (
                    <tr key={idea.id} className="text-xs hover:bg-surface-card/20 transition">
                      <td className="py-3 pr-4 font-semibold text-gray-200 max-w-[180px] truncate">{idea.title}</td>
                      <td className="py-3 pr-4 text-gray-400">{owner?.full_name || '—'}</td>
                      <td className="py-3 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          idea.blockchain_status === 'Submitted'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-gray-500/20 text-gray-400 border-gray-700'
                        }`}>
                          {idea.blockchain_status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`flex items-center gap-1 text-[10px] font-bold ${
                          idea.blockchain_status === 'Confirmed' ? 'text-emerald-400' : 'text-gray-500'
                        }`}>
                          {idea.blockchain_status === 'Confirmed' ? (
                            <><CheckCircle className="w-3 h-3" /> Confirmed</>
                          ) : (
                            <><Clock className="w-3 h-3" /> Pending</>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Blockchain Ledger Log */}
        <div className="glass-panel p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Hash className="w-4 h-4 text-primary" /> Cardano Ledger Records
          </h2>
          {recentRecords.length === 0 ? (
            <div className="py-8 text-center">
              <Cpu className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No blockchain records found. Register an idea first.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRecords.map(record => (
                <div key={record.id} className="p-4 rounded-xl bg-surface-card/40 border border-translucent space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">TX Hash</p>
                      <p className="text-xs font-mono text-primary truncate max-w-[300px] md:max-w-none">
                        {record.transaction_hash}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/20 text-emerald-400 border-emerald-500/30 flex-shrink-0">
                      {record.network}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-gray-500">
                    <span>Block: <span className="text-gray-400 font-mono">{record.block_height}</span></span>
                    <span>
                      {new Date(record.registered_at).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform Health */}
        <div className="glass-panel p-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Platform Health
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                label: 'Demo Mode',
                value: typeof window !== 'undefined' && !process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Active' : 'Disabled',
                icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
                color: 'text-amber-400',
              },
              {
                label: 'Cardano Network',
                value: 'Preview Testnet',
                icon: <Cpu className="w-4 h-4 text-emerald-400" />,
                color: 'text-emerald-400',
              },
              {
                label: 'Smart Contract',
                value: 'Deployed (Aiken)',
                icon: <CheckCircle className="w-4 h-4 text-primary" />,
                color: 'text-primary',
              },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-surface-card/40 border border-translucent">
                {item.icon}
                <div>
                  <p className="text-[10px] text-gray-500 font-semibold">{item.label}</p>
                  <p className={`text-xs font-bold ${item.color}`}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
