'use client';

import { motion } from 'framer-motion';
import { Coins, Crown, Skull, HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatsBarProps = {
  totalAlive: number;
  totalDead: number;
  richestAgent: string;
  totalAda: number;
  className?: string;
};

const cards = [
  {
    label: 'Total Alive',
    icon: HeartPulse,
    iconClassName: 'text-emerald-400',
    cardClassName: 'from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/20',
    valueClassName: 'text-emerald-300',
  },
  {
    label: 'Total Dead',
    icon: Skull,
    iconClassName: 'text-red-400',
    cardClassName: 'from-red-500/15 via-red-500/5 to-transparent border-red-500/20',
    valueClassName: 'text-red-300',
  },
  {
    label: 'Richest Agent',
    icon: Crown,
    iconClassName: 'text-purple-400',
    cardClassName: 'from-purple-500/15 via-purple-500/5 to-transparent border-purple-500/20',
    valueClassName: 'text-purple-200',
  },
  {
    label: 'Total ADA',
    icon: Coins,
    iconClassName: 'text-cyan-400',
    cardClassName: 'from-cyan-500/15 via-cyan-500/5 to-transparent border-cyan-500/20',
    valueClassName: 'text-cyan-200',
  },
] as const;

export function StatsBar({ totalAlive, totalDead, richestAgent, totalAda, className }: StatsBarProps) {
  const values = [
    totalAlive.toLocaleString(),
    totalDead.toLocaleString(),
    richestAgent,
    totalAda.toLocaleString(),
  ];

  return (
    <div
      className={cn(
        'grid gap-4 sm:grid-cols-2 xl:grid-cols-4',
        className
      )}
    >
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
            className={cn(
              'relative overflow-hidden rounded-2xl border bg-zinc-950/90 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.25)] backdrop-blur-xl',
              card.cardClassName
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">
                  {card.label}
                </p>
                <div className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">
                  {values[index]}
                </div>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Icon className={cn('h-5 w-5', card.iconClassName)} />
              </div>
            </div>

            <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className={cn(
                  'h-full w-full rounded-full bg-gradient-to-r',
                  index === 0 && 'from-emerald-400 to-teal-400',
                  index === 1 && 'from-red-400 to-rose-400',
                  index === 2 && 'from-purple-400 to-fuchsia-400',
                  index === 3 && 'from-cyan-400 to-blue-400'
                )}
              />
            </div>

            <p className={cn('relative mt-3 text-sm font-medium', card.valueClassName)}>
              {index === 0 && 'Active agents on the network'}
              {index === 1 && 'Agents that are no longer alive'}
              {index === 2 && 'Highest ADA balance holder'}
              {index === 3 && 'Combined balance across all agents'}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
