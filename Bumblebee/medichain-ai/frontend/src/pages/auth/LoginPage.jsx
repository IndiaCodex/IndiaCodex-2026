import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Wallet, Shield, Brain, Heart, Zap, ExternalLink } from 'lucide-react';
import WalletConnect from '../../components/wallet/WalletConnect';

const DEMO_ROLES = [
  { label: '🏥 Hospital Admin', wallet: 'addr_test1_demo_hospital_admin', role: 'HOSPITAL_ADMIN', color: 'blue' },
  { label: '👨‍⚕️ Doctor', wallet: 'addr_test1_demo_doctor_rajesh', role: 'DOCTOR', color: 'green' },
  { label: '🧑‍💼 Patient', wallet: 'addr_test1_demo_patient_priya', role: 'PATIENT', color: 'purple' },
  { label: '🏦 Insurance Officer', wallet: 'addr_test1_demo_insurance_kavitha', role: 'INSURANCE_OFFICER', color: 'orange' },
  { label: '💊 Pharmacist', wallet: 'addr_test1_demo_pharmacist_arjun', role: 'PHARMACIST', color: 'teal' },
];

export default function LoginPage() {
  const { connectWallet, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDemo, setShowDemo] = useState(true);

  // Already connected — go straight to the app, no need to log in again
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Called by WalletConnect component on successful wallet auth
  const handleWalletSuccess = () => {
    toast.success('Cardano wallet connected!');
    navigate('/');
  };

  // Demo login — connects directly as chosen role (no wallet needed)
  const handleDemoLogin = async (demoUser) => {
    setIsConnecting(true);
    try {
      await connectWallet(demoUser.wallet, 'demo_sig', 'demo_key');
      toast.success(`Demo: Logged in as ${demoUser.label}`);
      navigate('/');
    } catch (err) {
      toast.error('Demo login failed: ' + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">MediChain AI</h1>
          </div>
          <p className="text-blue-300 text-lg">The Trust Layer for Healthcare</p>
          <p className="text-slate-400 text-sm mt-2">AI-powered · Blockchain-secured · Privacy-first</p>
        </div>

        {/* Cardano Track Badges */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {[
            { icon: Wallet, label: 'Cardano CIP-30', color: 'blue' },
            { icon: Brain, label: 'Masumi AI', color: 'green' },
            { icon: Shield, label: 'Midnight ZKP', color: 'purple' },
          ].map(({ icon: Icon, label, color }) => (
            <span key={label} className={`flex items-center gap-1.5 px-3 py-1.5 bg-${color}-900/50 text-${color}-300 border border-${color}-700 rounded-full text-sm`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </span>
          ))}
        </div>

        {/* Cardano Ecosystem Links */}
        <div className="flex items-center justify-center gap-4 mb-6 text-xs text-slate-500">
          <a href="https://www.lace.io/" target="_blank" rel="noreferrer"
            className="hover:text-blue-400 flex items-center gap-1">
            Lace <ExternalLink className="w-3 h-3" />
          </a>
          <a href="https://eternl.io/" target="_blank" rel="noreferrer"
            className="hover:text-purple-400 flex items-center gap-1">
            Eternl <ExternalLink className="w-3 h-3" />
          </a>
          <a href="https://preprod.cardanoscan.io/" target="_blank" rel="noreferrer"
            className="hover:text-green-400 flex items-center gap-1">
            CardanoScan <ExternalLink className="w-3 h-3" />
          </a>
          <a href="https://meshjs.dev/" target="_blank" rel="noreferrer"
            className="hover:text-orange-400 flex items-center gap-1">
            MeshJS <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Connect Card — uses MeshJS WalletConnect */}
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-white mb-2">Connect Your Cardano Wallet</h2>
          <p className="text-slate-400 text-sm mb-6">
            Uses CIP-30 standard via MeshJS SDK. Your identity is verified privately — no documents stored.
          </p>

          {/* MeshJS-powered wallet connect — auto-detects installed wallets */}
          <WalletConnect onSuccess={handleWalletSuccess} />

          {/* Demo Login Button */}
          <div className="mt-4">
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="w-full py-2.5 border border-dashed border-slate-600 hover:border-yellow-500 text-slate-400 hover:text-yellow-400 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Zap className="w-4 h-4" />
              {showDemo ? 'Hide Demo Login' : '⚡ Demo Login — Explore Without Wallet'}
            </button>
          </div>
        </div>

        {/* Demo Role Selector */}
        {showDemo && (
          <div className="mt-4 bg-yellow-900/20 border border-yellow-700/50 rounded-2xl p-5">
            <h3 className="text-yellow-400 font-semibold mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Demo Mode — Choose Your Role
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Explore the full hospital application as any user. All data is test data.
            </p>
            <div className="space-y-2">
              {DEMO_ROLES.map(demo => (
                <button key={demo.role} onClick={() => handleDemoLogin(demo)}
                  disabled={isConnecting}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 hover:border-yellow-500 rounded-xl transition-all text-left disabled:opacity-50">
                  <span className="text-lg">{demo.label.split(' ')[0]}</span>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{demo.label.substring(demo.label.indexOf(' ')+1)}</p>
                    <p className="text-slate-500 text-xs font-mono">{demo.wallet.substring(0,30)}...</p>
                  </div>
                  <span className="text-yellow-400 text-xs">Enter →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-slate-500 text-xs mt-6">
          Built on Cardano · MeshJS SDK · CIP-30 · CIP-25 · IndiaCodex 2026
        </p>
      </div>
    </div>
  );
}

