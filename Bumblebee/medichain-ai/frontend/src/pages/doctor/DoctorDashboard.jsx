import { useAuth } from '../../context/AuthContext';
import { Users, Brain, Shield, Activity, Award, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import CardanoLiveStats from '../../components/common/CardanoLiveStats';

export default function DoctorDashboard() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border border-green-800 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white">Doctor Dashboard</h1>
        <p className="text-green-300 mt-1">AI-assisted diagnosis · Prescription NFTs · Patient records · Cardano credentials</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Patients', color: 'blue', to: '/doctor/patients' },
          { icon: Brain, label: 'AI Diagnosis', color: 'green', to: '/doctor/diagnosis/new' },
          { icon: Shield, label: 'Prescriptions', color: 'purple', to: '/doctor/prescriptions' },
          { icon: Activity, label: 'Records', color: 'orange', to: '/doctor/records' },
          { icon: Award, label: 'Credential NFT', color: 'yellow', to: '/doctor/credentials',
            badge: 'Cardano' },
          { icon: Lock, label: 'Escrow', color: 'teal', to: '/doctor/escrow',
            badge: 'Aiken' },
        ].map(({ icon: Icon, label, color, to, badge }) => (
          <Link key={label} to={to}
            className={`bg-slate-800/50 border border-slate-700 hover:border-${color}-600 rounded-xl p-4 flex flex-col items-center gap-3 transition-colors relative`}>
            <div className={`p-3 bg-${color}-900/50 rounded-xl`}>
              <Icon className={`w-6 h-6 text-${color}-400`} />
            </div>
            <span className="text-white text-sm font-medium">{label}</span>
            {badge && (
              <span className={`absolute top-2 right-2 text-xs px-1.5 py-0.5 bg-${color}-900/60 text-${color}-400 border border-${color}-700 rounded-full`}>
                {badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Live Cardano stats */}
      <CardanoLiveStats />
    </div>
  );
}
