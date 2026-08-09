'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout, { useToast } from '@/components/DashboardLayout';
import { dbService } from '@/lib/supabase';
import { Profile } from '@/lib/demoData';
import { User, Github, Globe, Save, Camera, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    bio: '',
    github_url: '',
    portfolio_url: '',
    avatar_url: '',
  });

  useEffect(() => {
    const currentUser = dbService.getCurrentUser();
    if (currentUser) {
      setProfile(currentUser);
      setForm({
        full_name: currentUser.full_name || '',
        bio: currentUser.bio || '',
        github_url: currentUser.github_url || '',
        portfolio_url: currentUser.portfolio_url || '',
        avatar_url: currentUser.avatar_url || '',
      });
    }
    setLoading(false);
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await dbService.updateProfile(profile.id, form);
      showToast('Profile updated successfully! ✅', 'success');
    } catch {
      showToast('Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

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
      <div className="space-y-6 animate-fade-in font-sans max-w-2xl mx-auto">

        {/* Page header */}
        <div className="glass-panel p-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-primary" /> Profile Settings
          </h1>
          <p className="text-sm text-gray-400 mt-1">Update your public profile visible to mentors and collaborators.</p>
        </div>

        {/* Avatar section */}
        <div className="glass-panel p-6 flex items-center gap-5">
          <div className="relative">
            <img
              src={form.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${form.full_name}`}
              alt="Avatar"
              className="w-20 h-20 rounded-2xl border-2 border-primary/40 object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary border-2 border-background flex items-center justify-center cursor-pointer hover:bg-primary/80 transition">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white text-base">{form.full_name || 'Your Name'}</h3>
            <p className="text-xs text-primary font-semibold capitalize">{profile?.role}</p>
          </div>
        </div>

        {/* Form fields */}
        <div className="glass-panel p-6 space-y-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Personal Info</h2>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold">Full Name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="input-field"
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="input-field resize-none"
              placeholder="Tell the community about yourself..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold">Avatar URL</label>
            <input
              type="url"
              value={form.avatar_url}
              onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
              className="input-field"
              placeholder="https://..."
            />
          </div>
        </div>

        {/* Social Links */}
        <div className="glass-panel p-6 space-y-5">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Links</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Github className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="url"
                value={form.github_url}
                onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))}
                className="input-field"
                placeholder="https://github.com/username"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Globe className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="url"
                value={form.portfolio_url}
                onChange={e => setForm(f => ({ ...f, portfolio_url: e.target.value }))}
                className="input-field"
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pb-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-8 flex items-center gap-2"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : (
              <><Save className="w-4 h-4" /> Save Profile</>
            )}
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}
