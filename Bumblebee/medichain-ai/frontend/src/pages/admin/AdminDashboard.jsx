import { useQuery } from '@tanstack/react-query';
import { adminApi, aiApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Users, CreditCard, Brain, TrendingUp, AlertTriangle, CheckCircle, Activity, Heart, Zap, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import CardanoLiveStats from '../../components/common/CardanoLiveStats';

const WEEK_DATA = [
  { day: 'Mon', approved: 4, pending: 2, rejected: 1 },
  { day: 'Tue', approved: 6, pending: 3, rejected: 0 },
  { day: 'Wed', approved: 3, pending: 1, rejected: 2 },
  { day: 'Thu', approved: 7, pending: 4, rejected: 1 },
  { day: 'Fri', approved: 5, pending: 2, rejected: 0 },
  { day: 'Sat', approved: 2, pending: 1, rejected: 1 },
  { day: 'Sun', approved: 1, pending: 0, rejected: 0 },
];
const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: adminApi.getAnalytics, refetchInterval: 30000 });
  const { data: agentStatus } = useQuery({ queryKey: ['agent-status'], queryFn: aiApi.getAgentStatus, refetchInterval: 10000 });

  const pieData = [
    { name: 'Approved', value: Number(analytics?.claimsApproved || 0) },
    { name: 'Pending', value: Number(analytics?.claimsPending || 0) },
    { name: 'Review', value: Math.max(0, Number(analytics?.totalClaims || 0) - Number(analytics?.claimsApproved || 0) - Number(analytics?.claimsPending || 0)) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Hospital Dashboard</h1>
          <p className="text-slate-400 mt-1">Apollo MediChain Hospital, Hyderabad • All 3 Tracks Active</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 border border-green-700 rounded-full">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm font-medium">All Systems UP</span>
        </div>
      </div>

      {/* Track Status Pills */}
      <div className="flex gap-3 flex-wrap">
        <span className="flex items-center gap-2 px-4 py-2 bg-blue-900/30 border border-blue-700 rounded-xl text-blue-400 text-sm font-medium">
          🔷 Cardano Preprod — Track 1 ✅
        </span>
        <span className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-700 rounded-xl text-green-400 text-sm font-medium">
          <Zap className="w-4 h-4" /> Masumi AI Agents — Track 2 ✅
        </span>
        <span className="flex items-center gap-2 px-4 py-2 bg-purple-900/30 border border-purple-700 rounded-xl text-purple-400 text-sm font-medium">
          <ShieldCheck className="w-4 h-4" /> Midnight ZKP — Track 3 ✅
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients', value: analytics?.totalPatients || 0, icon: Users, color: 'blue', badge: 'On Cardano', link: '/admin/staff' },
          { label: 'Active Doctors', value: analytics?.totalDoctors || 0, icon: Heart, color: 'green', badge: 'ZKP Verified', link: '/admin/staff' },
          { label: 'Claims Processed', value: analytics?.totalClaims || 0, icon: CreditCard, color: 'purple', badge: 'AI in 4 min', link: '/admin/analytics' },
          { label: 'ADA Earned by AI', value: `₳${agentStatus?.totalAdaEarned || 0}`, icon: Brain, color: 'yellow', badge: 'via Masumi', link: '/admin/agents' },
        ].map(({ label, value, icon: Icon, color, badge, link }) => (
          <Link key={label} to={link}
            className="bg-slate-800/70 border border-slate-700/80 hover:border-slate-500 rounded-2xl p-5 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 bg-${color}-900/40 rounded-xl group-hover:bg-${color}-900/60 transition-colors`}>
                <Icon className={`w-5 h-5 text-${color}-400`} />
              </div>
              <span className={`text-xs px-2 py-0.5 bg-${color}-900/30 text-${color}-400 rounded-full`}>{badge}</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-slate-400 text-sm">{label}</div>
          </Link>
        ))}
      </div>

      {/* Cardano Live Stats + Charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cardano Live Stats — real blockchain data */}
        <CardanoLiveStats />

        {/* Charts */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Insurance Claims — This Week</h3>
              <span className="text-xs text-slate-500">AI-processed via Masumi</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={WEEK_DATA} barSize={8} barGap={2}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '12px' }} />
                <Bar dataKey="approved" fill="#22c55e" radius={[3,3,0,0]} name="Approved" />
                <Bar dataKey="pending" fill="#f59e0b" radius={[3,3,0,0]} name="Pending" />
                <Bar dataKey="rejected" fill="#ef4444" radius={[3,3,0,0]} name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4">
            <h3 className="text-white font-semibold mb-3">Claim Distribution</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={120} height={100}>
                <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie><Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '10px', fontSize: '12px' }} /></PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-slate-400">{item.name}</span>
                    </div>
                    <span className="text-white font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Agents + ZKP Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Masumi AI Agents */}
        <div className="bg-slate-800/70 border border-green-900/40 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" /> Masumi AI Agents
            </h3>
            <Link to="/admin/agents" className="text-blue-400 text-xs hover:text-blue-300">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Diagnosis Agent', price: '₳0.5/query', tasks: agentStatus?.diagnosis?.totalTasks || 0, color: 'green' },
              { name: 'Claims Agent', price: '₳2.0/claim', tasks: agentStatus?.insurance?.totalTasks || 0, color: 'blue' },
              { name: 'KYC Agent', price: '₳1.0/verify', tasks: agentStatus?.kyc?.totalTasks || 0, color: 'purple' },
              { name: 'Support Agent', price: '₳0.1/chat', tasks: agentStatus?.support?.totalTasks || 0, color: 'yellow' },
            ].map(a => (
              <div key={a.name} className="bg-slate-900/60 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-slate-400 text-xs">RUNNING</span>
                </div>
                <p className="text-white text-sm font-medium">{a.name}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-${a.color}-400 text-xs font-bold`}>{a.price}</span>
                  <span className="text-slate-500 text-xs">{a.tasks} tasks</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ZKP Privacy Panel */}
        <div className="bg-slate-800/70 border border-purple-900/40 rounded-2xl p-5">
          <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-purple-400" /> Midnight ZKP Privacy
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Patients KYC verified', count: analytics?.totalPatients || 0, note: 'No Aadhaar stored', icon: '🔐' },
              { label: 'Claims verified privately', count: analytics?.claimsApproved || 0, note: 'No medical history revealed', icon: '🛡️' },
              { label: 'Doctors credentialed', count: analytics?.totalDoctors || 0, note: 'No degree details stored', icon: '👨‍⚕️' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-purple-900/10 border border-purple-900/30 rounded-xl">
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{item.label}</p>
                  <p className="text-purple-400 text-xs">{item.note}</p>
                </div>
                <div className="text-2xl font-bold text-purple-300">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-5">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-400" /> Live Activity Feed
        </h3>
        <div className="divide-y divide-slate-700/50">
          {[
            { icon: CheckCircle, color: 'green', text: 'Insurance claim ₳500 approved by Masumi AI Agent — Priya Sharma', time: '2 hours ago', tag: 'Masumi + Cardano' },
            { icon: '💊', text: 'Prescription NFT minted on Cardano Preprod — Dr. Rajesh → Priya', time: '3 hours ago', tag: 'Cardano NFT' },
            { icon: ShieldCheck, color: 'purple', text: 'Patient KYC verified via Midnight ZKP — Arjun Patel', time: '5 hours ago', tag: 'Midnight ZKP' },
            { icon: Brain, color: 'yellow', text: 'Masumi Diagnosis Agent: Hypertensive Heart Disease (confidence: 78%)', time: '6 hours ago', tag: 'Masumi AI' },
            { icon: '🔐', text: 'Doctor credentials verified via ZKP — Dr. Priya Sharma', time: '8 hours ago', tag: 'Midnight ZKP' },
          ].map((item, i) => {
            const Icon = typeof item.icon === 'string' ? null : item.icon;
            return (
              <div key={i} className="py-3 flex items-start gap-3">
                <div className={`p-1.5 bg-${item.color || 'slate'}-900/30 rounded-lg flex-shrink-0 mt-0.5`}>
                  {Icon ? <Icon className={`w-4 h-4 text-${item.color}-400`} /> : <span className="text-base leading-none">{item.icon}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-300 text-sm">{item.text}</p>
                  <span className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded-full mt-1 inline-block">{item.tag}</span>
                </div>
                <span className="text-slate-600 text-xs flex-shrink-0">{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
