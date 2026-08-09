'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout, { useToast } from '@/components/DashboardLayout';
import { dbService } from '@/lib/supabase';
import { 
  Idea, 
  BlockchainRecord, 
  Milestone, 
  Profile, 
  DeveloperApplication, 
  MentorshipRequest 
} from '@/lib/demoData';
import { 
  Lightbulb, 
  Cpu, 
  Users, 
  Award, 
  Plus, 
  ArrowUpRight, 
  Check, 
  X, 
  MessageSquare, 
  Calendar,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Search
} from 'lucide-react';
import dynamic from 'next/dynamic';

const CardanoRegisterModal = dynamic(
  () => import('@/components/CardanoRegisterModal'),
  { ssr: false }
);

export default function Dashboard() {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  
  // Dashboard data states
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [records, setRecords] = useState<BlockchainRecord[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [applications, setApplications] = useState<DeveloperApplication[]>([]);
  const [mentorships, setMentorships] = useState<MentorshipRequest[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  
  // Modal selection for Cardano registration
  const [activeRegisterIdea, setActiveRegisterIdea] = useState<Idea | null>(null);

  // Loading state
  const [loading, setLoading] = useState(true);

  // Load dashboard data based on role
  const loadDashboardData = async () => {
    try {
      const user = dbService.getCurrentUser();
      setCurrentUser(user);
      if (!user) return;

      const [pData, iData, rData, appData, mReqData] = await Promise.all([
        dbService.getProfiles(),
        dbService.getIdeas(),
        dbService.getBlockchainRecords(),
        dbService.getApplications(),
        dbService.getMentorshipRequests(),
      ]);

      // Fetch milestones after ideas are resolved (avoids circular reference)
      const msNested = await Promise.all(iData.map((idea: import('@/lib/demoData').Idea) => dbService.getMilestones(idea.id)));
      const msData = msNested.flat();

      setAllProfiles(pData);
      setIdeas(iData);
      setRecords(rData);
      setApplications(appData);
      setMentorships(mReqData);
      setMilestones(msData);
      setLoading(false);
    } catch (err) {
      console.error(err);
      showToast('Error loading dashboard statistics.', 'error');
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleApproveApplication = async (appId: string) => {
    try {
      await dbService.updateApplication(appId, 'Accepted');
      showToast('Developer application approved!', 'success');
      loadDashboardData();
    } catch (err) {
      showToast('Action failed.', 'error');
    }
  };

  const handleRejectApplication = async (appId: string) => {
    try {
      await dbService.updateApplication(appId, 'Rejected');
      showToast('Application declined.', 'info');
      loadDashboardData();
    } catch (err) {
      showToast('Action failed.', 'error');
    }
  };

  const handleApproveMilestone = async (mId: string) => {
    try {
      await dbService.updateMilestone(mId, { 
        status: 'Approved', 
        approved_by: currentUser?.id 
      });
      showToast('Milestone successfully verified and approved!', 'success');
      loadDashboardData();
    } catch (err) {
      showToast('Action failed.', 'error');
    }
  };

  if (loading || !currentUser) {
    return (
      <DashboardLayout>
        <div className="py-12 flex justify-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Helper selectors
  const studentIdeas = ideas.filter(i => i.owner_id === currentUser.id);
  const studentRecords = records.filter(r => studentIdeas.some(si => si.id === r.idea_id));
  const pendingRegistrationsCount = studentIdeas.filter(i => i.blockchain_status === 'Pending').length;
  
  // Mentor filters
  const mentorRequests = mentorships.filter(m => m.mentor_id === currentUser.id && m.status === 'Pending');
  const mentorAssignedIdeas = ideas.filter(i => 
    mentorships.some(m => m.idea_id === i.id && m.mentor_id === currentUser.id && m.status === 'Accepted')
  );
  
  // Developer filters
  const devAppliedTeams = applications.filter(a => a.developer_id === currentUser.id);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        
        {/* Welcome Banner */}
        <div className="glass-panel p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-surface/40 to-secondary/10">
          <div>
            <span className="text-xs font-bold text-secondary uppercase tracking-widest">Workspace Dashboard</span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1">
              Welcome back, {currentUser.full_name}!
            </h2>
            <p className="text-xs md:text-sm text-gray-400 mt-1 font-medium">
              You are signed in as a <span className="text-primary font-semibold capitalize">{currentUser.role}</span>.
            </p>
          </div>
          
          {currentUser.role === 'student' && (
            <Link 
              href="/submit-idea"
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-sm font-semibold hover:opacity-95 transition flex items-center gap-2 shadow shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Submit Startup Idea
            </Link>
          )}
        </div>

        {/* ===================================================================
            STUDENT PANEL
            =================================================================== */}
        {currentUser.role === 'student' && (
          <div className="space-y-8">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="glass-panel p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Startup Ideas</span>
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-2xl md:text-3xl font-black">{studentIdeas.length}</p>
              </div>

              <div className="glass-panel p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Cardano Proofs</span>
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl md:text-3xl font-black">{studentRecords.length}</p>
              </div>

              <div className="glass-panel p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Milestones Met</span>
                  <Award className="w-5 h-5 text-secondary" />
                </div>
                <p className="text-2xl md:text-3xl font-black">
                  {milestones.filter(m => studentIdeas.some(si => si.id === m.idea_id) && m.status === 'Approved').length}
                </p>
              </div>

              <div className="glass-panel p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Co-founders</span>
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-2xl md:text-3xl font-black">
                  {applications.filter(a => studentIdeas.some(si => si.id === a.idea_id) && a.status === 'Accepted').length + 1}
                </p>
              </div>

            </div>

            {/* Warn user if they have pending Cardano registration */}
            {pendingRegistrationsCount > 0 && (
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-amber-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
                <div className="flex items-start sm:items-center gap-3">
                  <AlertTriangle className="w-5 h-5 mt-0.5 sm:mt-0 flex-shrink-0" />
                  <p className="text-xs font-semibold leading-relaxed">
                    You have {pendingRegistrationsCount} startup ideas that have not been anchored to the Cardano ledger. Register them now to protect your IP!
                  </p>
                </div>
              </div>
            )}

            {/* Startup Ideas List */}
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold tracking-tight">Your Startup Ideas</h3>
              {studentIdeas.length === 0 ? (
                <div className="glass-panel p-10 text-center space-y-3">
                  <Lightbulb className="w-10 h-10 text-gray-600 mx-auto" />
                  <p className="text-sm text-gray-400 font-medium">You haven't submitted any startup ideas yet.</p>
                  <Link 
                    href="/submit-idea" 
                    className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1.5"
                  >
                    Submit your first idea now <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {studentIdeas.map((idea) => {
                    const matchedRecord = records.find(r => r.idea_id === idea.id);
                    return (
                      <div key={idea.id} className="glass-panel p-5 flex flex-col justify-between gap-5 relative overflow-hidden group">
                        
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-4">
                            <span className="px-2.5 py-0.5 rounded-full bg-surface-card border border-translucent text-[10px] text-gray-400 font-bold uppercase">
                              {idea.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
                              idea.blockchain_status === 'Confirmed' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : idea.blockchain_status === 'Demo'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}>
                              {idea.blockchain_status === 'Confirmed' ? 'Cardano Secured' : idea.blockchain_status}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-base text-gray-100 group-hover:text-primary transition">
                              {idea.title}
                            </h4>
                            <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                              {idea.short_description}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="border-t border-translucent pt-3 flex items-center justify-between gap-3">
                          <Link
                            href={`/idea/${idea.id}`}
                            className="text-xs text-gray-400 hover:text-white font-semibold flex items-center gap-1 transition"
                          >
                            Manage details
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>

                          {idea.blockchain_status === 'Pending' ? (
                            <button
                              onClick={() => setActiveRegisterIdea(idea)}
                              className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition"
                            >
                              Register on Cardano
                            </button>
                          ) : (
                            <Link
                              href={`/certificate/${idea.id}`}
                              className="px-3.5 py-1.5 bg-surface border border-translucent hover:bg-white/5 text-gray-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-secondary" />
                              Certificate
                            </Link>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Developer Applications Received */}
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold tracking-tight">Developer Applications (Pending Review)</h3>
              {applications.filter(a => studentIdeas.some(si => si.id === a.idea_id) && a.status === 'Pending').length === 0 ? (
                <div className="p-5 border border-translucent bg-surface/20 rounded-xl text-center text-xs text-gray-500 font-medium">
                  No pending developer applications for your startups.
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.filter(a => studentIdeas.some(si => si.id === a.idea_id) && a.status === 'Pending').map((app) => {
                    const dev = allProfiles.find(p => p.id === app.developer_id);
                    const idea = studentIdeas.find(i => i.id === app.idea_id);
                    return (
                      <div key={app.id} className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <img 
                            src={dev?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${dev?.full_name}`} 
                            alt={dev?.full_name} 
                            className="w-10 h-10 rounded-full border border-translucent mt-0.5"
                          />
                          <div>
                            <h4 className="font-semibold text-sm">{dev?.full_name}</h4>
                            <p className="text-xs text-gray-400 leading-tight">Applied to <span className="text-secondary font-semibold">{idea?.title}</span></p>
                            <p className="text-xs text-gray-400 italic mt-1 font-medium font-sans">"{app.cover_letter}"</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleRejectApplication(app.id)}
                            className="p-1.5 hover:bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg transition"
                            title="Decline"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApproveApplication(app.id)}
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg transition flex items-center gap-1 text-xs font-bold px-3"
                          >
                            <Check className="w-4 h-4" />
                            Accept Dev
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ===================================================================
            MENTOR PANEL
            =================================================================== */}
        {currentUser.role === 'mentor' && (
          <div className="space-y-6">
            
            {/* Mentorship Requests pending */}
            {mentorRequests.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-extrabold tracking-tight">Mentorship Invites</h3>
                <div className="space-y-3">
                  {mentorRequests.map((req) => {
                    const student = allProfiles.find(p => p.id === req.student_id);
                    const idea = ideas.find(i => i.id === req.idea_id);
                    return (
                      <div key={req.id} className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-sm text-gray-100">Invite from {student?.full_name}</h4>
                          <p className="text-xs text-gray-400">Requesting guidance for: <span className="text-primary font-semibold">{idea?.title}</span></p>
                          <p className="text-xs text-gray-400 mt-1 italic font-sans font-medium">"{req.message}"</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              await dbService.updateMentorshipRequest(req.id, 'Rejected');
                              showToast('Invite declined', 'info');
                              loadDashboardData();
                            }}
                            className="px-3 py-1.5 border border-translucent text-gray-300 hover:text-white rounded-lg text-xs font-semibold"
                          >
                            Ignore
                          </button>
                          <button
                            onClick={async () => {
                              await dbService.updateMentorshipRequest(req.id, 'Accepted');
                              showToast('Invitation accepted!', 'success');
                              loadDashboardData();
                            }}
                            className="px-3.5 py-1.5 bg-primary text-white hover:opacity-90 rounded-lg text-xs font-bold"
                          >
                            Accept Request
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assigned startups */}
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold tracking-tight">Assigned Student Startups</h3>
              {mentorAssignedIdeas.length === 0 ? (
                <div className="glass-panel p-10 text-center space-y-3">
                  <Users className="w-10 h-10 text-gray-600 mx-auto" />
                  <p className="text-sm text-gray-400 font-medium">No active student teams are assigned to you.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentorAssignedIdeas.map((idea) => {
                    const owner = allProfiles.find(p => p.id === idea.owner_id);
                    return (
                      <div key={idea.id} className="glass-panel p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-translucent pb-3">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">{idea.category}</span>
                            <h4 className="font-bold text-base mt-0.5">{idea.title}</h4>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {idea.blockchain_status}
                          </span>
                        </div>

                        <p className="text-xs text-gray-400 leading-relaxed font-medium">{idea.short_description}</p>
                        
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-gray-400 font-semibold">Founder: {owner?.full_name}</span>
                          <Link
                            href={`/idea/${idea.id}`}
                            className="text-xs text-primary font-bold hover:underline flex items-center gap-0.5"
                          >
                            Review & Feedbacks
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ===================================================================
            DEVELOPER PANEL
            =================================================================== */}
        {currentUser.role === 'developer' && (
          <div className="space-y-6">
            
            {/* Developer statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-panel p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Submitted Applications</span>
                  <p className="text-2xl md:text-3xl font-black mt-1">{devAppliedTeams.length}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-primary opacity-60" />
              </div>

              <div className="glass-panel p-5 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Accepted Team Placements</span>
                  <p className="text-2xl md:text-3xl font-black mt-1">
                    {devAppliedTeams.filter(a => a.status === 'Accepted').length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-secondary opacity-60" />
              </div>
            </div>

            {/* List of Applications status */}
            <div className="space-y-4">
              <h3 className="text-lg font-extrabold tracking-tight">Active Team Applications</h3>
              {devAppliedTeams.length === 0 ? (
                <div className="glass-panel p-10 text-center space-y-3">
                  <Search className="w-10 h-10 text-gray-600 mx-auto" />
                  <p className="text-sm text-gray-400 font-medium">You haven't applied to join any startup teams yet.</p>
                  <Link
                    href="/explore"
                    className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-lg text-xs inline-flex items-center gap-1.5 mt-2"
                  >
                    Explore Ideas
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {devAppliedTeams.map((app) => {
                    const idea = ideas.find(i => i.id === app.idea_id);
                    return (
                      <div key={app.id} className="glass-panel p-4 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-gray-100">{idea?.title}</h4>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">Role: Software Developer</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          app.status === 'Accepted' && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        } ${
                          app.status === 'Rejected' && 'bg-red-500/10 text-red-400 border border-red-500/30'
                        } ${
                          app.status === 'Pending' && 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ===================================================================
            ADMIN PANEL
            =================================================================== */}
        {currentUser.role === 'admin' && (
          <div className="space-y-6">
            
            {/* System statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-5">
                <span className="text-xs text-gray-400 font-bold block uppercase">Total Users</span>
                <p className="text-2xl font-black mt-1">{allProfiles.length}</p>
              </div>
              <div className="glass-panel p-5">
                <span className="text-xs text-gray-400 font-bold block uppercase">Total Ideas</span>
                <p className="text-2xl font-black mt-1">{ideas.length}</p>
              </div>
              <div className="glass-panel p-5">
                <span className="text-xs text-gray-400 font-bold block uppercase">Blockchain Proofs</span>
                <p className="text-2xl font-black mt-1">{records.length}</p>
              </div>
              <div className="glass-panel p-5">
                <span className="text-xs text-gray-400 font-bold block uppercase">Active Milestones</span>
                <p className="text-2xl font-black mt-1">{milestones.length}</p>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="space-y-3">
              <h3 className="text-lg font-extrabold tracking-tight">On-Chain Audit Records</h3>
              <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase bg-surface border-b border-translucent font-bold">
                      <tr>
                        <th className="px-5 py-3">Idea</th>
                        <th className="px-5 py-3">Cardano Network</th>
                        <th className="px-5 py-3">Transaction Hash</th>
                        <th className="px-5 py-3">Registry UTxO</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-translucent">
                      {records.map((rec) => {
                        const idea = ideas.find(i => i.id === rec.idea_id);
                        return (
                          <tr key={rec.id} className="hover:bg-white/5 transition font-medium">
                            <td className="px-5 py-4 font-bold text-gray-100">{idea?.title}</td>
                            <td className="px-5 py-4 capitalize text-xs text-gray-400">{rec.network}</td>
                            <td className="px-5 py-4">
                              <code className="text-xs text-secondary font-mono block max-w-[120px] truncate">{rec.transaction_hash}</code>
                            </td>
                            <td className="px-5 py-4">
                              <code className="text-xs text-gray-400 font-mono block max-w-[100px] truncate">{rec.utxo_reference}</code>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                rec.confirmation_status === 'Confirmed' && 'bg-emerald-500/10 text-emerald-400'
                              } ${
                                rec.confirmation_status === 'Demo' && 'bg-amber-500/10 text-amber-400'
                              } ${
                                rec.confirmation_status === 'Pending' && 'bg-blue-500/10 text-blue-400'
                              }`}>
                                {rec.confirmation_status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Cardano Register Modal */}
      {activeRegisterIdea && (
        <CardanoRegisterModal
          idea={activeRegisterIdea}
          onClose={() => setActiveRegisterIdea(null)}
          onSuccess={() => {
            setActiveRegisterIdea(null);
            loadDashboardData();
          }}
        />
      )}
    </DashboardLayout>
  );
}
