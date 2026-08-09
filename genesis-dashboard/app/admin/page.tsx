'use client';

import React, { useState, useEffect } from 'react';
import { spawnAgent, runTick, startAutoTick, stopAutoTick, fetchAutoTickStatus } from '@/lib/api';
import toast from 'react-hot-toast';
import { Server, Plus, Zap, Activity, AlertTriangle, Terminal, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

export default function AdminPage() {
  // Spawn Form State
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [goal, setGoal] = useState('');
  const [isSpawning, setIsSpawning] = useState(false);
  
  // Tick State
  const [isTicking, setIsTicking] = useState(false);
  const [isAutoRun, setIsAutoRun] = useState(false);
  const [autoTickInfo, setAutoTickInfo] = useState<{ running: boolean; intervalSeconds: number; ticksRun: number } | null>(null);
  const [isTogglingAuto, setIsTogglingAuto] = useState(false);

  // Poll auto-tick status from backend every 5s
  useEffect(() => {
    const poll = async () => {
      try {
        const status = await fetchAutoTickStatus();
        setAutoTickInfo(status);
        setIsAutoRun(status.running);
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAutoRun = async () => {
    setIsTogglingAuto(true);
    try {
      if (isAutoRun) {
        await stopAutoTick();
        toast.success('Auto-tick stopped');
      } else {
        await startAutoTick(30);
        toast.success('Auto-tick started — every 30s');
      }
      const status = await fetchAutoTickStatus();
      setAutoTickInfo(status);
      setIsAutoRun(status.running);
    } catch {
      toast.error('Failed to toggle auto-tick');
    } finally {
      setIsTogglingAuto(false);
    }
  };

  const handleSpawnAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !personality || !goal) {
      toast.error('All fields are required');
      return;
    }

    setIsSpawning(true);
    const loadingToast = toast.loading('Initiating agent spawning sequence...');
    
    try {
      await spawnAgent({ name, personality, goal });
      toast.success(`Agent ${name} spawned successfully`, { id: loadingToast });
      setName('');
      setPersonality('');
      setGoal('');
    } catch (error) {
      toast.error('Failed to spawn agent. Check core connection.', { id: loadingToast });
    } finally {
      setIsSpawning(false);
    }
  };

  const handleRunTick = async () => {
    setIsTicking(true);
    const loadingToast = toast.loading('Executing network tick...');
    try {
      const result = await runTick();
      const processed = result?.processed ?? 0;
      const deaths = result?.deaths ?? 0;
      toast.success(`Tick complete: ${processed} processed, ${deaths} died`, { id: loadingToast });
    } catch (error) {
      toast.error('Tick execution failed. Subsystem offline.', { id: loadingToast });
    } finally {
      setIsTicking(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Server className="w-8 h-8 text-primary" />
            Orchestration
          </h1>
          <p className="text-text-muted mt-1">Manage global agent network and system ticks.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="success" className="animate-pulse-soft">
            <span className="w-1.5 h-1.5 rounded-full bg-success mr-2" />
            SYSTEM ONLINE
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Spawn Form */}
        <div className="lg:col-span-7">
          <Card className="h-full border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Terminal className="w-5 h-5" />
                Spawn New Agent
              </CardTitle>
              <CardDescription>Deploy a new autonomous AI agent into the network.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSpawnAgent} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-mono text-text-secondary uppercase tracking-wider">Designation / Name</label>
                  <input 
                    id="name"
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Nexus-7"
                    className="w-full bg-background border border-sidebar-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono text-sm"
                    disabled={isSpawning}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="personality" className="text-xs font-mono text-text-secondary uppercase tracking-wider">Personality Core</label>
                  <select
                    id="personality"
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    className="w-full bg-background border border-sidebar-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm"
                    disabled={isSpawning}
                  >
                    <option value="" disabled>Select personality type...</option>
                    <option value="aggressive">Aggressive</option>
                    <option value="creative">Creative</option>
                    <option value="conservative">Conservative</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="goal" className="text-xs font-mono text-text-secondary uppercase tracking-wider">Primary Directive</label>
                  <textarea 
                    id="goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Define the core objective..."
                    className="w-full bg-background border border-sidebar-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all min-h-[100px] resize-y text-sm"
                    disabled={isSpawning}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSpawning}
                  className="w-full mt-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSpawning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Spawn Agent
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Controls */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Run Tick Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <Zap className="w-5 h-5" />
                Network Tick
              </CardTitle>
              <CardDescription>
                Manually force a global progression tick. This advances time and triggers all active agent behaviors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button 
                onClick={handleRunTick}
                disabled={isTicking || isAutoRun}
                className="w-full bg-warning hover:bg-warning/80 text-background font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTicking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Executing Tick...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Run Manual Tick
                  </>
                )}
              </button>
            </CardContent>
          </Card>

          {/* Auto Run Card */}
          <Card className={cn("transition-colors", isAutoRun && "border-success bg-success/5")}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Activity className={cn("w-5 h-5", isAutoRun ? "text-success animate-pulse" : "text-text-muted")} />
                  Auto Run
                </CardTitle>
                <CardDescription className={cn(isAutoRun && "text-success font-medium")}>
                  {isAutoRun
                    ? `🟢 Running every ${autoTickInfo?.intervalSeconds ?? 30}s — ${autoTickInfo?.ticksRun ?? 0} ticks total`
                    : '⚫ Disabled — agents are paused'}
                </CardDescription>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={handleToggleAutoRun}
                disabled={isTogglingAuto}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-success focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50",
                  isAutoRun ? "bg-success" : "bg-sidebar-border"
                )}
              >
                {isTogglingAuto ? (
                  <RefreshCw className="w-3 h-3 absolute left-1/2 -translate-x-1/2 animate-spin text-white" />
                ) : (
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      isAutoRun ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                )}
              </button>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-background rounded-lg border border-sidebar-border flex items-start gap-3 mt-4">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary leading-relaxed">
                  <strong className="text-foreground">Auto Run</strong> fires a real backend tick every 30 seconds — agents earn income, pay expenses, and can die, even without any browser interaction.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

