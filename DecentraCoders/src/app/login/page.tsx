'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  KeyRound, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  Code,
  ShieldAlert
} from 'lucide-react';
import { dbService } from '@/lib/supabase';
import { demoProfiles } from '@/lib/demoData';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    const user = dbService.getCurrentUser();
    if (user) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      // Simulator checks
      const profiles = await dbService.getProfiles();
      const match = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());

      if (match) {
        // Authenticate mock session
        dbService.setCurrentUser(match);
        router.push('/dashboard');
      } else {
        setError('Invalid credentials. (Hint: Use Quick Logins below)');
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleIndex: number) => {
    const user = demoProfiles[roleIndex];
    dbService.setCurrentUser(user);
    router.push('/dashboard');
  };

  // Demo accounts map
  const demoAccounts = [
    { name: 'Rohan Sharma', role: 'Student Founder', index: 0, icon: GraduationCap, color: 'text-primary bg-primary/10 border-primary/20' },
    { name: 'Dr. Aris Thorne', role: 'Cardano Mentor', index: 5, icon: UserCheck, color: 'text-secondary bg-secondary/10 border-secondary/20' },
    { name: 'Kabir Mehta', role: 'Frontend Developer', index: 9, icon: Code, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { name: 'Admin Overseer', role: 'Administrator', index: 15, icon: ShieldAlert, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  ];

  return (
    <div className="min-h-screen bg-background text-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="mesh-bg-blob bg-primary -top-40 -right-40" />
      <div className="mesh-bg-blob bg-secondary -bottom-40 -left-40" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Logo Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white text-base shadow">
              LN
            </div>
            <span className="font-bold text-lg">LaunchNest</span>
          </Link>
          <h2 className="text-2xl font-extrabold tracking-tight">Sign in to your account</h2>
          <p className="text-xs text-gray-400">
            Or{' '}
            <Link href="/register" className="text-primary hover:text-primary-hover font-medium underline">
              create a new student account
            </Link>
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-6 shadow-xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="email" className="text-xs text-gray-300 font-semibold block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="text-xs text-gray-300 font-semibold block">Password</label>
                <span className="text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer">Forgot password?</span>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-95 transition disabled:opacity-50 btn-transition shadow-lg shadow-primary/10"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="space-y-3.5 border-t border-translucent pt-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Demo Quick Access</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.index}
                    onClick={() => handleQuickLogin(acc.index)}
                    className={`p-2.5 rounded-xl border flex flex-col items-start gap-1 transition text-left hover:scale-[1.02] ${acc.color}`}
                  >
                    <Icon className="w-4 h-4" />
                    <div>
                      <p className="text-[11px] font-extrabold leading-tight text-gray-200">{acc.name}</p>
                      <span className="text-[9px] text-gray-400 font-medium capitalize">{acc.role}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
