'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  KeyRound, 
  Briefcase, 
  Github, 
  Globe, 
  ArrowRight,
  GraduationCap,
  UserCheck,
  Code
} from 'lucide-react';
import { dbService } from '@/lib/supabase';
import { Profile } from '@/lib/demoData';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'student' | 'mentor' | 'developer'>('student');
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!fullName || !email || !password) {
      setError('Please fill in all required fields (Name, Email, and Password).');
      setLoading(false);
      return;
    }

    try {
      const profiles = await dbService.getProfiles();
      const duplicate = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      
      if (duplicate) {
        setError('An account with this email address already exists.');
        setLoading(false);
        return;
      }

      // Build new profile
      const newProfile: Profile = {
        id: crypto.randomUUID(),
        role,
        full_name: fullName,
        email,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${fullName}`,
        bio: bio || `Enthusiastic LaunchNest ${role}`,
        github_url: githubUrl || undefined,
        portfolio_url: portfolioUrl || undefined
      };

      // Add to local database
      const list = [...profiles, newProfile];
      localStorage.setItem('ln_profiles', JSON.stringify(list));

      // Authenticate session
      dbService.setCurrentUser(newProfile);
      
      // Dispatch welcome notification
      await dbService.createNotification(
        newProfile.id,
        'Welcome to LaunchNest!',
        `Welcome ${fullName}! You have joined as a ${role}. Start launching your startup vision.`,
        'team'
      );

      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="mesh-bg-blob bg-primary -top-40 -right-40" />
      <div className="mesh-bg-blob bg-secondary -bottom-40 -left-40" />

      <div className="w-full max-w-lg space-y-6 relative z-10 my-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-white text-base shadow">
              LN
            </div>
            <span className="font-bold text-lg">LaunchNest</span>
          </Link>
          <h2 className="text-2xl font-extrabold tracking-tight">Create your student or mentor account</h2>
          <p className="text-xs text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary-hover font-medium underline">
              Sign in here
            </Link>
          </p>
        </div>

        {/* Card */}
        <div className="glass-panel p-6 shadow-xl space-y-6">
          <form onSubmit={handleRegister} className="space-y-4">
            
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <span className="text-xs text-gray-300 font-bold block uppercase tracking-wider">Choose Platform Role</span>
              <div className="grid grid-cols-3 gap-2">
                
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                    role === 'student' 
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow' 
                      : 'border-translucent bg-background/50 text-gray-400 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-4.5 h-4.5" />
                  <span className="text-xs">Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('mentor')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                    role === 'mentor' 
                      ? 'border-secondary bg-secondary/10 text-secondary font-bold shadow' 
                      : 'border-translucent bg-background/50 text-gray-400 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4.5 h-4.5" />
                  <span className="text-xs">Mentor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('developer')}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                    role === 'developer' 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold shadow' 
                      : 'border-translucent bg-background/50 text-gray-400 hover:text-white'
                  }`}
                >
                  <Code className="w-4.5 h-4.5" />
                  <span className="text-xs">Developer</span>
                </button>

              </div>
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="fullName" className="text-xs text-gray-300 font-semibold block">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="email" className="text-xs text-gray-300 font-semibold block">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@university.edu"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label htmlFor="password" className="text-xs text-gray-300 font-semibold block">Password *</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Links for Developer / Mentor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="githubUrl" className="text-xs text-gray-300 font-semibold block">GitHub Link</label>
                <div className="relative">
                  <Github className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="githubUrl"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="input-field pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="portfolioUrl" className="text-xs text-gray-300 font-semibold block">Portfolio / Website</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    id="portfolioUrl"
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://mywebsite.me"
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Biography */}
            <div className="space-y-1">
              <label htmlFor="bio" className="text-xs text-gray-300 font-semibold block">Short Biography / Skillset</label>
              <textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Briefly describe your programming skillset, startup interests, or experience level..."
                className="input-field resize-none"
              />
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-95 transition disabled:opacity-50 btn-transition shadow-lg shadow-primary/10"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Register Account
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
