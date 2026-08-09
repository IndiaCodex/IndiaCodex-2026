import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-sage/20",
        className
      )}
      {...props}
    />
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="w-full h-[280px] rounded-2xl border border-card-border bg-card-bg shadow-sm p-6 flex flex-col gap-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-sage/10 to-transparent opacity-50" />
      
      {/* Header */}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl bg-sage/20" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 bg-sage/20" />
            <Skeleton className="h-4 w-20 bg-sage/10" />
          </div>
        </div>
        <Skeleton className="w-10 h-10 rounded-full bg-sage/20" />
      </div>

      {/* Body */}
      <div className="flex-1 space-y-3 mt-4 relative z-10">
        <Skeleton className="h-4 w-full bg-sage/20" />
        <Skeleton className="h-4 w-5/6 bg-sage/20" />
        <Skeleton className="h-4 w-4/6 bg-sage/20" />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-card-border relative z-10">
        <Skeleton className="h-6 w-16 rounded-full bg-sage/20" />
        <Skeleton className="h-6 w-24 rounded-full bg-sage/20" />
      </div>
    </div>
  );
}
