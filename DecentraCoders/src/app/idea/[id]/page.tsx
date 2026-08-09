'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout, { useToast } from '@/components/DashboardLayout';
import { dbService } from '@/lib/supabase';
import { Idea, BlockchainRecord, Profile, Milestone, MentorFeedback, TeamMember } from '@/lib/demoData';
import { 
  ArrowLeft, 
  Cpu, 
  Users, 
  Award, 
  ExternalLink, 
  Github, 
  FileText,
  ShieldCheck,
  Send,
  Star,
  CheckCircle2,
  Calendar,
  MessageSquare
} from 'lucide-react';
import dynamic from 'next/dynamic';

const CardanoRegisterModal = dynamic(
  () => import('@/components/CardanoRegisterModal'),
  { ssr: false }
);

export default function IdeaDetails() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast } = useToast();
  
  // Data states
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [record, setRecord] = useState<BlockchainRecord | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  
  // Mentor Feedback inputs
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState(5);
  
  // Developer application inputs
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');

  // Cardano Modal trigger
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Loading
  const [loading, setLoading] = useState(true);

  const loadIdeaData = async () => {
    if (!id) return;
    try {
      const user = dbService.getCurrentUser();
      setCurrentUser(user);

      const iData = await dbService.getIdeaById(id as string);
      if (!iData) {
        showToast('Idea not found', 'error');
        router.push('/dashboard');
        return;
      }

      // Check visibility permissions
      if (iData.visibility === 'private' && user?.role !== 'admin' && iData.owner_id !== user?.id) {
        // Check if mentor request or team membership exists
        const [teams, mentorships] = await Promise.all([
          dbService.getTeamMembers(iData.id),
          dbService.getMentorshipRequests()
        ]);
        const isMember = teams.some(t => t.user_id === user?.id);
        const isMentor = mentorships.some(m => m.idea_id === iData.id && m.mentor_id === user?.id && m.status === 'Accepted');
        
        if (!isMember && !isMentor) {
          showToast('You do not have permission to view this private startup idea.', 'error');
          router.push('/dashboard');
          return;
        }
      }

      const [rData, ownData, tData, mData, fData, allProfiles] = await Promise.all([
        dbService.getBlockchainRecordByIdeaId(iData.id),
        dbService.getProfileById(iData.owner_id),
        dbService.getTeamMembers(iData.id),
        dbService.getMilestones(iData.id),
        dbService.getFeedback(iData.id),
        dbService.getProfiles()
      ]);

      setIdea(iData);
      setRecord(rData);
      setOwner(ownData);
      setMilestones(mData);
      
      // Match feedback profile details
      const resolvedFeedback = fData.map(f => ({
        ...f,
        mentor: allProfiles.find(p => p.id === f.mentor_id)
      }));
      setFeedbacks(resolvedFeedback);

      // Match team profile details
      const resolvedTeam = tData.map(t => ({
        ...t,
        profile: allProfiles.find(p => p.id === t.user_id)
      }));
      setTeam(resolvedTeam);

      setLoading(false);
    } catch (err) {
      console.error(err);
      showToast('Error loading idea details.', 'error');
    }
  };

  useEffect(() => {
    loadIdeaData();
  }, [id]);

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !idea || !feedbackText) return;

    try {
      await dbService.createFeedback({
        idea_id: idea.id,
        mentor_id: currentUser.id,
        feedback_text: feedbackText,
        rating_readiness: rating
      });

      await dbService.createNotification(
        idea.owner_id,
        'New Mentor Feedback',
        `${currentUser.full_name} left review feedback on your startup idea.`,
        'feedback'
      );

      setFeedbackText('');
      showToast('Feedback submitted successfully!', 'success');
      loadIdeaData();
    } catch (err) {
      showToast('Failed to submit feedback.', 'error');
    }
  };

  const handleApplyDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !idea) return;

    try {
      await dbService.createApplication({
        idea_id: idea.id,
        developer_id: currentUser.id,
        cover_letter: coverLetter
      });

      await dbService.createNotification(
        idea.owner_id,
        'Developer Team Application',
        `${currentUser.full_name} applied to join the ${idea.title} team.`,
        'application'
      );

      setShowApplyModal(false);
      setCoverLetter('');
      showToast('Application sent successfully!', 'success');
      loadIdeaData();
    } catch (err) {
      showToast('Application submission failed.', 'error');
    }
  };

  const handleApproveMilestone = async (milestoneId: string) => {
    try {
      await dbService.updateMilestone(milestoneId, { status: 'Approved' });
      showToast('Milestone approved!', 'success');
      loadIdeaData();
    } catch {
      showToast('Failed to approve milestone.', 'error');
    }
  };

  if (loading || !idea || !owner) {
    return (
      <DashboardLayout>
        <div className="py-12 flex justify-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Developer application states check
  const hasApplied = devAppliedTeamsCheck();
  function devAppliedTeamsCheck() {
    if (!currentUser) return false;
    return team.some(t => t.user_id === currentUser.id);
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in font-sans">
        
        {/* Back navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to list
        </button>

        {/* Title Block Banner */}
        <div className="glass-panel p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-surface-card border border-translucent text-[10px] text-gray-400 font-bold uppercase">
              {idea.category}
            </span>
            <h2 className="text-2xl font-extrabold text-gray-100 mt-1">{idea.title}</h2>
            <p className="text-sm text-gray-400 font-medium">Stage: {idea.stage} | Founder: {owner.full_name}</p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Cardano status checks */}
            {idea.blockchain_status === 'Pending' ? (
              idea.owner_id === currentUser?.id ? (
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-bold transition flex items-center gap-2 shadow"
                >
                  <Cpu className="w-4 h-4" />
                  Anchor Proof on Cardano
                </button>
              ) : (
                <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                  Cardano Proof Pending
                </div>
              )
            ) : (
              <Link
                href={`/certificate/${idea.id}`}
                className="px-5 py-2.5 bg-gradient-to-r from-primary/20 to-secondary/15 hover:opacity-90 border border-purple-glow text-primary rounded-xl text-sm font-bold transition flex items-center gap-2"
              >
                <ShieldCheck className="w-4.5 h-4.5 text-success" />
                View IP Certificate
              </Link>
            )}

            {/* Developer applying trigger */}
            {currentUser?.role === 'developer' && !hasApplied && (
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-secondary to-success text-white rounded-xl text-sm font-bold hover:opacity-95 transition flex items-center gap-1.5"
              >
                Apply to Team
              </button>
            )}
          </div>
        </div>

        {/* Core details layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Columns (Details content) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Problem & Solution */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="font-extrabold text-base border-b border-translucent pb-2.5">Problem & Solution</h3>
              
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Problem Statement</span>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">{idea.problem_statement}</p>
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Proposed Solution</span>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">{idea.proposed_solution}</p>
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Target User Demographics</span>
                <p className="text-sm text-gray-300 leading-relaxed font-medium">{idea.target_users}</p>
              </div>
            </div>

            {/* Business Information */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="font-extrabold text-base border-b border-translucent pb-2.5">Business & Growth Model</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 font-bold uppercase block">Revenue Strategy</span>
                  <p className="text-sm text-gray-300 font-medium">{idea.revenue_model}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 font-bold uppercase block">Market Opportunity</span>
                  <p className="text-sm text-gray-300 font-medium">{idea.market_opportunity}</p>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <span className="text-xs text-gray-400 font-bold uppercase block">Competitor landscape</span>
                <p className="text-sm text-gray-300 font-medium">{idea.competitors}</p>
              </div>
            </div>

            {/* Document resources */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="font-extrabold text-base border-b border-translucent pb-2.5">Resources & URLs</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {idea.pitch_deck_url && (
                  <a 
                    href={idea.pitch_deck_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-background hover:bg-gray-800 rounded-xl border border-translucent flex items-center gap-3 transition text-sm text-gray-200"
                  >
                    <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>Pitch Presentation</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto text-gray-500" />
                  </a>
                )}
                {idea.prototype_url && (
                  <a 
                    href={idea.prototype_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-background hover:bg-gray-800 rounded-xl border border-translucent flex items-center gap-3 transition text-sm text-gray-200"
                  >
                    <ExternalLink className="w-5 h-5 text-secondary flex-shrink-0" />
                    <span>Live Prototype</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto text-gray-500" />
                  </a>
                )}
                {idea.github_repo_url && (
                  <a 
                    href={idea.github_repo_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-background hover:bg-gray-800 rounded-xl border border-translucent flex items-center gap-3 transition text-sm text-gray-200"
                  >
                    <Github className="w-5 h-5 text-success flex-shrink-0" />
                    <span>Codebase Repository</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-auto text-gray-500" />
                  </a>
                )}
              </div>
            </div>

            {/* Milestones / Roadmaps */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="font-extrabold text-base border-b border-translucent pb-2.5 flex items-center gap-2">
                <Award className="w-5 h-5 text-secondary" />
                Startup milestones
              </h3>
              
              {milestones.length === 0 ? (
                <p className="text-xs text-gray-500">No milestones registered on the roadmap.</p>
              ) : (
                <div className="space-y-3">
                  {milestones.map((m) => (
                    <div key={m.id} className="p-3.5 rounded-xl border border-translucent bg-background/30 flex items-center justify-between gap-4 text-sm font-medium">
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-200">{m.title}</p>
                        <p className="text-xs text-gray-400">{m.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {m.status}
                        </span>

                        {currentUser?.role === 'mentor' && m.status !== 'Approved' && (
                          <button
                            onClick={() => handleApproveMilestone(m.id)}
                            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-bold transition"
                          >
                            Approve
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column (Side details: Team & Mentors Feedback) */}
          <div className="space-y-6">
            
            {/* Team Members */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="font-extrabold text-base border-b border-translucent pb-2.5 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Squad members
              </h3>
              
              <div className="space-y-3">
                {team.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <img
                      src={member.profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${member.profile?.full_name}`}
                      alt={member.profile?.full_name}
                      className="w-9 h-9 rounded-full border border-translucent"
                    />
                    <div>
                      <p className="text-xs font-extrabold text-gray-200 leading-tight">{member.profile?.full_name}</p>
                      <span className="text-[10px] text-gray-400 capitalize">{member.role_in_team}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mentor reviews feedback list */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="font-extrabold text-base border-b border-translucent pb-2.5 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Mentor Feedback
              </h3>

              {/* Feedbacks list */}
              {feedbacks.length === 0 ? (
                <p className="text-xs text-gray-500 font-medium py-2">No mentor feedbacks submitted yet.</p>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((f, idx) => (
                    <div key={idx} className="space-y-1.5 border-b border-translucent pb-3.5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-200">{f.mentor?.full_name}</p>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {Array.from({ length: f.rating_readiness }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed font-sans">"{f.feedback_text}"</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Submit Feedback Form for Mentor */}
              {currentUser?.role === 'mentor' && (
                <form onSubmit={handleAddFeedback} className="space-y-3 pt-4 border-t border-translucent">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Add Mentor Evaluation</span>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-medium">Readiness Rating (1-5)</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="input-field"
                    >
                      {[5, 4, 3, 2, 1].map(r => (
                        <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-medium">Feedback Review</label>
                    <textarea
                      rows={3}
                      required
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Write startup feedback here..."
                      className="input-field text-xs resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Review
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Cardano Register Modal */}
      {showRegisterModal && idea && (
        <CardanoRegisterModal
          idea={idea}
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            setShowRegisterModal(false);
            loadIdeaData();
          }}
        />
      )}

      {/* Developer Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-surface border border-translucent rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-lg">Apply to Join {idea.title}</h3>
            
            <form onSubmit={handleApplyDeveloper} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Introduce yourself & cover letter</label>
                <textarea
                  rows={4}
                  required
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Explain why you are a good fit for this startup team. Link your GitHub or projects..."
                  className="input-field"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
