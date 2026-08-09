'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout, { useToast } from '@/components/DashboardLayout';
import { dbService } from '@/lib/supabase';
import { Profile } from '@/lib/demoData';
import { Users, Star, BookOpen, Mail, CheckCircle, Search, Briefcase } from 'lucide-react';

export default function MentorsPage() {
  const { showToast } = useToast();
  const [mentors, setMentors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const profiles = await dbService.getProfiles();
        setMentors(profiles.filter(p => p.role === 'mentor'));
      } catch {
        showToast('Error loading mentors.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRequest = async (mentorId: string) => {
    setRequesting(mentorId);
    try {
      const currentUser = dbService.getCurrentUser();
      if (!currentUser) { showToast('Please log in first.', 'error'); return; }

      const ideas = await dbService.getIdeas();
      const myIdea = ideas.find(i => i.owner_id === currentUser.id);

      await dbService.createMentorshipRequest({
        mentor_id: mentorId,
        student_id: currentUser.id,
        idea_id: myIdea?.id || '',
        message: 'Hi! I would love your guidance on my startup idea.',
      });

      setRequested(prev => { const s = new Set(prev); s.add(mentorId); return s; });
      showToast('Mentorship request sent successfully! ✨', 'success');
    } catch {
      showToast('Failed to send request. Try again.', 'error');
    } finally {
      setRequesting(null);
    }
  };

  const filteredMentors = mentors.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (m.bio || '').toLowerCase().includes(search.toLowerCase())
  );

  // Derive domain badges from bio keywords
  const getExpertiseTags = (mentor: Profile): string[] => {
    const bio = (mentor.bio || '').toLowerCase();
    const tags: string[] = [];
    if (bio.includes('blockchain') || bio.includes('cardano') || bio.includes('crypto') || bio.includes('iohk')) tags.push('Blockchain');
    if (bio.includes('cardano')) tags.push('Cardano');
    if (bio.includes('vc') || bio.includes('venture') || bio.includes('investors') || bio.includes('fund')) tags.push('VC');
    if (bio.includes('saas') || bio.includes('startup') || bio.includes('growth')) tags.push('SaaS');
    if (bio.includes('agri') || bio.includes('farm')) tags.push('AgriTech');
    if (bio.includes('health') || bio.includes('medical')) tags.push('Healthcare');
    if (bio.includes('ai') || bio.includes('machine learning') || bio.includes('ml')) tags.push('AI/ML');
    if (bio.includes('defi') || bio.includes('finance') || bio.includes('fintech')) tags.push('Finance');
    if (tags.length === 0) tags.push('Mentorship');
    return tags;
  };

  const tagColorMap: Record<string, string> = {
    'Blockchain': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    'Cardano': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'VC': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'SaaS': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    'AgriTech': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'Healthcare': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    'AI/ML': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    'Finance': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    'Mentorship': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in font-sans">

        {/* Header */}
        <div className="glass-panel p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" /> Find Mentors
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Connect with experienced mentors who can guide your startup journey.
              </p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or expertise..."
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>

        {/* Mentors Grid */}
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className="glass-panel p-16 text-center">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No mentors match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMentors.map(mentor => {
              const tags = getExpertiseTags(mentor);
              return (
                <div key={mentor.id} className="glass-panel p-6 flex flex-col gap-4">
                  {/* Top row */}
                  <div className="flex items-start gap-4">
                    <img
                      src={mentor.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${mentor.full_name}`}
                      alt={mentor.full_name}
                      className="w-14 h-14 rounded-2xl border-2 border-primary/40 object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base">{mentor.full_name}</h3>
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-primary font-semibold mt-0.5">Expert Mentor</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">{mentor.bio}</p>
                    </div>
                  </div>

                  {/* Expertise tags derived from bio */}
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tagColorMap[tag] || 'bg-gray-500/20 text-gray-300 border-gray-700'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-3 border-t border-translucent pt-4">
                    {mentor.portfolio_url && (
                      <a
                        href={mentor.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Portfolio
                      </a>
                    )}
                    <button
                      onClick={() => handleRequest(mentor.id)}
                      disabled={requesting === mentor.id || requested.has(mentor.id)}
                      className={`ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        requested.has(mentor.id)
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'btn-primary'
                      }`}
                    >
                      {requesting === mentor.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : requested.has(mentor.id) ? (
                        <><CheckCircle className="w-3.5 h-3.5" /> Requested</>
                      ) : (
                        <><Mail className="w-3.5 h-3.5" /> Request Mentorship</>
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
