'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout, { useToast } from '@/components/DashboardLayout';
import { dbService } from '@/lib/supabase';
import { Profile, Idea } from '@/lib/demoData';
import {
  Users, LayoutGrid, CheckSquare, Plus, ClipboardList,
  MessageCircle, Link as LinkIcon, Cpu
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  assignee: string;
  status: 'todo' | 'in-progress' | 'done';
}

const DEMO_TASKS: Task[] = [
  { id: '1', title: 'Design smart contract datum schema', assignee: 'Rohan Sharma', status: 'done' },
  { id: '2', title: 'Implement Aiken validator logic', assignee: 'Arjun Mehta', status: 'done' },
  { id: '3', title: 'Build idea submission UI wizard', assignee: 'Rohan Sharma', status: 'done' },
  { id: '4', title: 'Connect Blockfrost testnet API', assignee: 'Arjun Mehta', status: 'in-progress' },
  { id: '5', title: 'Write unit tests for contract', assignee: 'Priya Nair', status: 'in-progress' },
  { id: '6', title: 'Deploy to Preview testnet', assignee: 'Arjun Mehta', status: 'todo' },
  { id: '7', title: 'Generate blockchain certificate UI', assignee: 'Rohan Sharma', status: 'todo' },
  { id: '8', title: 'Prepare hackathon demo video', assignee: 'Priya Nair', status: 'todo' },
];

const STATUS_COLORS: Record<Task['status'], string> = {
  'done': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'in-progress': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'todo': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_LABELS: Record<Task['status'], string> = {
  'done': 'Done',
  'in-progress': 'In Progress',
  'todo': 'To Do',
};

export default function TeamWorkspacePage() {
  const { showToast } = useToast();
  const [team, setTeam] = useState<Profile[]>([]);
  const [myIdea, setMyIdea] = useState<Idea | null>(null);
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const currentUser = dbService.getCurrentUser();
        const profiles = await dbService.getProfiles();
        const ideas = await dbService.getIdeas();

        if (currentUser) {
          const idea = ideas.find(i => i.owner_id === currentUser.id);
          setMyIdea(idea || null);
        }

        // Show students + developers as team
        const teamMembers = profiles.filter(p => p.role === 'student' || p.role === 'developer').slice(0, 5);
        setTeam(teamMembers);
      } catch {
        showToast('Error loading team workspace.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      assignee: team[0]?.full_name || 'Unassigned',
      status: 'todo',
    };
    setTasks(prev => [...prev, task]);
    setNewTaskTitle('');
    setAddingTask(false);
    showToast('Task added to workspace!', 'success');
  };

  const cycleStatus = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const cycle: Task['status'][] = ['todo', 'in-progress', 'done'];
      const idx = cycle.indexOf(t.status);
      return { ...t, status: cycle[(idx + 1) % cycle.length] };
    }));
  };

  const byStatus = (status: Task['status']) => tasks.filter(t => t.status === status);

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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <LayoutGrid className="w-6 h-6 text-primary" /> Team Workspace
              </h1>
              {myIdea && (
                <p className="text-sm text-gray-400 mt-1">
                  <span className="text-primary font-semibold">{myIdea.title}</span> — collaborative task board
                </p>
              )}
            </div>

            {/* Team Avatars */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-semibold">TEAM</span>
              <div className="flex -space-x-2">
                {team.map(member => (
                  <img
                    key={member.id}
                    src={member.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${member.full_name}`}
                    alt={member.full_name}
                    title={member.full_name}
                    className="w-8 h-8 rounded-full border-2 border-background object-cover"
                  />
                ))}
              </div>
              <span className="text-xs text-gray-400 font-semibold">{team.length} members</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Tasks', value: tasks.length, color: 'text-primary' },
            { label: 'In Progress', value: byStatus('in-progress').length, color: 'text-amber-400' },
            { label: 'Completed', value: byStatus('done').length, color: 'text-emerald-400' },
          ].map(stat => (
            <div key={stat.label} className="glass-panel p-4 text-center">
              <p className={`text-2xl font-extrabold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 font-semibold mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Kanban Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['todo', 'in-progress', 'done'] as Task['status'][]).map(status => (
            <div key={status} className="glass-panel p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-widest">
                  {STATUS_LABELS[status]}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLORS[status]}`}>
                  {byStatus(status).length}
                </span>
              </div>

              <div className="space-y-2">
                {byStatus(status).map(task => (
                  <div
                    key={task.id}
                    onClick={() => cycleStatus(task.id)}
                    className="p-3 rounded-xl bg-surface-card/60 border border-translucent cursor-pointer hover:border-primary/40 transition group"
                  >
                    <p className="text-sm font-semibold text-gray-200 group-hover:text-white transition">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1.5">{task.assignee}</p>
                  </div>
                ))}

                {status === 'todo' && (
                  addingTask ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        placeholder="Task title..."
                        className="input-field text-sm"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleAddTask(); if (e.key === 'Escape') setAddingTask(false); }}
                      />
                      <div className="flex gap-2">
                        <button onClick={handleAddTask} className="btn-primary text-xs px-3 py-1.5 flex-1">Add</button>
                        <button onClick={() => setAddingTask(false)} className="text-xs text-gray-400 hover:text-white px-2">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingTask(true)}
                      className="w-full flex items-center gap-1.5 p-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 hover:bg-surface-card/40 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Task
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Blockchain link */}
        {myIdea?.blockchain_status === 'Confirmed' && (
          <div className="glass-panel p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Idea Proof Registered On Cardano</p>
              <p className="text-xs text-gray-400 mt-0.5">Your idea is cryptographically proven and tamper-proof on the blockchain.</p>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
