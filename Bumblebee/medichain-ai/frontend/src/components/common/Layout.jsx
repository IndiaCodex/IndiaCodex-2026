import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Heart, Home, FileText, CreditCard, Pill, Users, BarChart3,
  Shield, Brain, LogOut, Menu, X, Activity, Lock, Calendar,
  ShieldCheck, Zap, Award
} from 'lucide-react';
import { useState } from 'react';

const NAV_BY_ROLE = {
  PATIENT: [
    { to: '/patient/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/patient/appointments', icon: Calendar, label: '📅 Appointments' },
    { to: '/patient/records', icon: FileText, label: 'My Records' },
    { to: '/patient/prescriptions', icon: Pill, label: 'Prescriptions' },
    { to: '/patient/claims', icon: CreditCard, label: 'Insurance Claims' },
    { to: '/patient/consent', icon: ShieldCheck, label: '🛡 Consent' },
    { to: '/patient/audit-trail', icon: Activity, label: '⛓ Audit Trail' },
    { to: '/patient/verify', icon: Shield, label: '🔍 Verify' },
    { to: '/demo', icon: Zap, label: '🎯 Demo Workflow' },
  ],
  DOCTOR: [
    { to: '/doctor/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/doctor/patients', icon: Users, label: 'Patients' },
    { to: '/doctor/credentials', icon: Award, label: '🏅 Credential NFT' },
    { to: '/doctor/escrow', icon: Lock, label: '🔷 Escrow Contract' },
    { to: '/demo', icon: Zap, label: '🎯 Demo Workflow' },
  ],
  HOSPITAL_ADMIN: [
    { to: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/admin/staff', icon: Users, label: 'Staff' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/agents', icon: Brain, label: 'AI Agents' },
    { to: '/admin/audit', icon: Shield, label: 'Audit Logs' },
    { to: '/demo', icon: Zap, label: '🎯 Demo Workflow' },
  ],
  INSURANCE_OFFICER: [
    { to: '/insurance/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/insurance/claims', icon: CreditCard, label: 'Claims Queue' },
    { to: '/insurance/review', icon: Activity, label: 'Manual Review' },
    { to: '/demo', icon: Zap, label: '🎯 Demo Workflow' },
  ],
  SUPER_ADMIN: [
    { to: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/admin/staff', icon: Users, label: 'Staff' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/admin/agents', icon: Brain, label: 'AI Agents' },
    { to: '/admin/audit', icon: Shield, label: 'Audit Logs' },
    { to: '/demo', icon: Zap, label: '🎯 Demo Workflow' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const navItems = NAV_BY_ROLE[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200`}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-slate-800">
          <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0">
            <Heart className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-bold text-sm">MediChain AI</p>
              <p className="text-slate-400 text-xs">{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Wallet + Logout */}
        <div className="p-3 border-t border-slate-800 space-y-2">
          {sidebarOpen && (
            <div className="px-3 py-2 bg-slate-800 rounded-lg">
              <p className="text-slate-400 text-xs">Wallet</p>
              <p className="text-white text-xs font-mono truncate">
                {user?.walletAddress?.substring(0, 20)}...
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          {/* Network indicator */}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-slate-400">Cardano Preprod</span>
          </div>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
