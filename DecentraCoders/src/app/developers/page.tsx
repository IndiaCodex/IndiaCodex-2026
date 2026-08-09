'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout, { useToast } from '@/components/DashboardLayout';
import { dbService } from '@/lib/supabase';
import { Profile } from '@/lib/demoData';
import { Code2, Search, UserPlus, CheckCircle, Github, Globe } from 'lucide-react';

export default function DevelopersPage() {
  const { showToast } = useToast();
  const [developers, setDevelopers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [invited, setInvited] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const profiles = await dbService.getProfiles();
        setDevelopers(profiles.filter(p => p.role === 'developer'));
      } catch {
        showToast('Error loading developers.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleInvite = (devId: string) => {
    const currentUser = dbService.getCurrentUser();
    if (!currentUser) { showToast('Please log in first.', 'error'); return; }
    setInvited(prev => { const s = new Set(prev); s.add(devId); return s; });
    showToast('Team invitation sent! 🚀', 'success');
  };

  // Derive skill tags from bio keywords
  const getSkillTags = (dev: Profile): string[] => {
    const bio = (dev.bio || '').toLowerCase();
    const tags: string[] = [];
    if (bio.includes('haskell')) tags.push('Haskell');
    if (bio.includes('rust')) tags.push('Rust');
    if (bio.includes('typescript') || bio.includes('ts')) tags.push('TypeScript');
    if (bio.includes('python')) tags.push('Python');
    if (bio.includes('react') || bio.includes('next')) tags.push('React');
    if (bio.includes('plutus')) tags.push('Plutus');
    if (bio.includes('aiken')) tags.push('Aiken');
    if (bio.includes('solidity')) tags.push('Solidity');
    if (bio.includes('go lang') || bio.includes('golang')) tags.push('Go');
    if (bio.includes('cardano') || bio.includes('blockchain')) tags.push('Blockchain');
    if (tags.length === 0) tags.push('Web3');
    return tags;
  };

  const allSkills = ['All', 'Haskell', 'Rust', 'TypeScript', 'Python', 'React', 'Plutus', 'Aiken', 'Blockchain'];

  const filteredDevs = developers.filter(d => {
    const skillTags = getSkillTags(d);
    const matchSearch =
      d.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (d.bio || '').toLowerCase().includes(search.toLowerCase());
    const matchSkill =
      selectedSkill === 'All' || skillTags.includes(selectedSkill);
    return matchSearch && matchSkill;
  });

  const skillBadgeColor = (skill: string) => {
    const map: Record<string, string> = {
      'Haskell': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      'Rust': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      'TypeScript': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      'Python': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'React': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      'Plutus': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      'Aiken': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      'Blockchain': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      'Go': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      'Solidity': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      'Web3': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    };
    return map[skill] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in font-sans">

        {/* Header + Search + Filters */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Code2 className="w-6 h-6 text-primary" /> Find Developers
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Recruit skilled blockchain developers for your startup team.
              </p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or skill..."
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Skill filter chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 flex-wrap">
            {allSkills.map(skill => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition whitespace-nowrap ${
                  selectedSkill === skill
                    ? 'bg-primary text-white border-primary'
                    : 'border-translucent bg-background text-gray-400 hover:text-white'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Developers Grid */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredDevs.length === 0 ? (
          <div className="glass-panel p-16 text-center">
            <Code2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No developers match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDevs.map(dev => {
              const tags = getSkillTags(dev);
              return (
                <div key={dev.id} className="glass-panel p-5 flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <img
                      src={dev.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${dev.full_name}`}
                      alt={dev.full_name}
                      className="w-12 h-12 rounded-xl border-2 border-primary/30 object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm">{dev.full_name}</h3>
                      <p className="text-[11px] text-primary font-semibold">Blockchain Developer</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{dev.bio}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1">
                    {tags.map(skill => (
                      <span
                        key={skill}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${skillBadgeColor(skill)}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="border-t border-translucent pt-3.5 flex items-center gap-2">
                    {dev.github_url && (
                      <a
                        href={dev.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-white transition"
                      >
                        <Github className="w-3.5 h-3.5" />
                        GitHub
                      </a>
                    )}
                    {dev.portfolio_url && (
                      <a
                        href={dev.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-white transition"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Portfolio
                      </a>
                    )}
                    <button
                      onClick={() => handleInvite(dev.id)}
                      disabled={invited.has(dev.id)}
                      className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        invited.has(dev.id)
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'btn-primary'
                      }`}
                    >
                      {invited.has(dev.id) ? (
                        <><CheckCircle className="w-3.5 h-3.5" /> Invited</>
                      ) : (
                        <><UserPlus className="w-3.5 h-3.5" /> Invite to Team</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
