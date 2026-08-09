'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout, { useToast } from '@/components/DashboardLayout';
import { dbService } from '@/lib/supabase';
import { Idea, Milestone } from '@/lib/demoData';
import { Flag, CheckCircle2, Circle, Clock, Trophy, Rocket, Zap } from 'lucide-react';

const MILESTONE_ICONS: Record<string, React.ReactNode> = {
  'Idea Submitted': <Zap className="w-5 h-5" />,
  'Blockchain Registration': <Flag className="w-5 h-5" />,
  'Team Formation': <Trophy className="w-5 h-5" />,
  'MVP Development': <Rocket className="w-5 h-5" />,
  'Mentor Review': <CheckCircle2 className="w-5 h-5" />,
  'Demo Day': <Trophy className="w-5 h-5" />,
};

// Milestone.status is 'Pending' | 'In Progress' | 'Completed' | 'Approved'
const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  'Completed': {
    label: 'Completed',
    color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
  },
  'Approved': {
    label: 'Approved',
    color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
  },
  'In Progress': {
    label: 'In Progress',
    color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    icon: <Clock className="w-5 h-5 text-amber-400 animate-pulse" />,
  },
  'Pending': {
    label: 'Pending',
    color: 'text-gray-500 border-gray-700 bg-gray-800/40',
    icon: <Circle className="w-5 h-5 text-gray-600" />,
  },
};

export default function MilestonesPage() {
  const { showToast } = useToast();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [myIdea, setMyIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = dbService.getCurrentUser();
        const ideas = await dbService.getIdeas();

        if (currentUser) {
          const idea = ideas.find(i => i.owner_id === currentUser.id) || null;
          setMyIdea(idea);

          if (idea) {
            const ms = await dbService.getMilestones(idea.id);
            setMilestones(ms);
          }
        }
      } catch {
        showToast('Error loading milestones.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const completedCount = milestones.filter(m => m.status === 'Completed' || m.status === 'Approved').length;
  const totalCount = milestones.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
      <div className="space-y-6 animate-fade-in font-sans">

        {/* Header */}
        <div className="glass-panel p-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flag className="w-6 h-6 text-primary" /> Milestones
          </h1>
          {myIdea ? (
            <p className="text-sm text-gray-400 mt-1">
              Roadmap for <span className="text-primary font-semibold">{myIdea.title}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-1">Submit an idea to track your startup milestones.</p>
          )}
        </div>

        {!myIdea ? (
          <div className="glass-panel p-16 text-center">
            <Flag className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No startup idea found. Submit your idea to begin.</p>
          </div>
        ) : (
          <>
            {/* Progress overview */}
            <div className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Overall Progress</p>
                  <p className="text-3xl font-extrabold text-white mt-0.5">{progressPercent}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">{completedCount} of {totalCount} milestones</p>
                  <p className="text-xs text-gray-500 mt-0.5">completed</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-surface-card rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[
                { label: 'Completed', count: milestones.filter(m => m.status === 'Completed' || m.status === 'Approved').length, color: 'text-emerald-400' },
                { label: 'In Progress', count: milestones.filter(m => m.status === 'In Progress').length, color: 'text-amber-400' },
                { label: 'Pending', count: milestones.filter(m => m.status === 'Pending').length, color: 'text-gray-500' },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-3 rounded-xl bg-surface-card/40 border border-translucent">
                    <p className={`text-xl font-extrabold ${stat.color}`}>{stat.count}</p>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-panel p-6 space-y-1">
              <h2 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-widest">Startup Journey Timeline</h2>
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-primary/60 via-surface-card to-transparent" />

                <div className="space-y-6">
                  {milestones.map((ms, idx) => {
                    const statusInfo = STATUS_MAP[ms.status] || STATUS_MAP['Pending'];
                    return (
                      <div key={ms.id} className="flex gap-4 relative">
                        {/* Icon circle */}
                        <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center flex-shrink-0 z-10 ${statusInfo.color}`}>
                          {MILESTONE_ICONS[ms.title] || <Flag className="w-5 h-5" />}
                        </div>

                        {/* Content */}
                        <div className={`flex-1 p-4 rounded-xl border ${statusInfo.color} transition`}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-white text-sm">{ms.title}</h3>
                              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{ms.description}</p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {statusInfo.icon}
                              <span className="text-[10px] font-bold">{statusInfo.label}</span>
                            </div>
                          </div>
                          {ms.due_date && (
                            <p className="text-[10px] text-gray-500 mt-2">
                              Due: {new Date(ms.due_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
