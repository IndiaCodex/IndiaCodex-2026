'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Skull, HeartPulse, Coins, Target, Fingerprint, Clock, Activity } from 'lucide-react';
import { Agent } from '@/types/agent';
import { cn } from '@/lib/utils';
import { formatDateUTC } from '@/lib/date';
import { getPersonalityBadgeTheme } from '@/lib/personality';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface AgentCardProps {
  agent: Agent;
  onClick?: (agent: Agent) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick }) => {
  const isAlive = agent.isAlive;
  const personalityBadge = getPersonalityBadgeTheme(agent.personality);

  const bornTime = formatDateUTC(agent.createdAt, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  const diedTime = agent.diedAt
    ? formatDateUTC(agent.diedAt, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <motion.div
      onClick={() => onClick?.(agent)}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="cursor-pointer h-full"
    >
      <Card className={cn(
        "relative h-full overflow-hidden transition-all duration-300",
        isAlive 
          ? "hover:border-primary/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
          : "hover:border-error/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)] opacity-80 hover:opacity-100"
      )}>
        {/* Top Glow bar based on status */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-[2px]",
          isAlive ? "bg-gradient-to-r from-primary/10 via-primary to-primary/10" : "bg-gradient-to-r from-error/10 via-error to-error/10"
        )} />

        <CardContent className="p-5 flex flex-col gap-4">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 leading-tight">
                {agent.name}
                {!isAlive && <Skull className="w-4 h-4 text-error" />}
              </h3>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {isAlive && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                  )}
                  <span className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    isAlive ? "bg-success" : "bg-error"
                  )}></span>
                </span>
                <span className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  isAlive ? "text-success" : "text-error"
                )}>
                  {isAlive ? 'Active' : 'Terminated'}
                </span>
              </div>
            </div>
            
            <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-[10px]">
              <Fingerprint className="w-3 h-3" />
              {personalityBadge.label}
            </Badge>
          </div>

          {/* Goal Section */}
          <div className="p-3 rounded-lg bg-background border border-sidebar-border">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-3.5 h-3.5 text-warning" />
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Directive</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-2" title={agent.goal}>
              {agent.goal}
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mt-auto pt-2">
            <div className="flex flex-col gap-1 p-3 rounded-lg bg-background border border-sidebar-border">
              <div className="flex items-center gap-1.5 text-text-muted">
                <Coins className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Balance</span>
              </div>
              <div className="text-base font-bold text-foreground font-mono tracking-tight flex items-baseline gap-1">
                {agent.adaBalance.toLocaleString()} <span className="text-[10px] font-sans text-text-muted font-semibold">ADA</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 p-3 rounded-lg bg-background border border-sidebar-border">
              <div className="flex items-center gap-1.5 text-text-muted">
                <HeartPulse className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Health</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-base font-bold text-foreground font-mono">
                  {agent.stats.health}%
                </div>
                {/* Health Bar Mini */}
                <div className="flex-1 h-1.5 bg-sidebar-border rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full transition-all", agent.stats.health > 50 ? "bg-success" : agent.stats.health > 20 ? "bg-warning" : "bg-error")} 
                    style={{ width: `${agent.stats.health}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-sidebar-border flex items-center justify-between text-[11px] font-medium">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Clock className="w-3 h-3" />
              Born {bornTime}
            </div>
            {diedTime ? (
              <div className="text-error/80">Died {diedTime}</div>
            ) : (
              <div className="flex items-center gap-1 text-primary/80">
                <Activity className="w-3 h-3" />
                Processing
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
