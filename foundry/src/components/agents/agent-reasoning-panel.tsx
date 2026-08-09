"use client";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AgentReasoningPanelProps {
  reasoning: string[];
  className?: string;
}

export function AgentReasoningPanel({ reasoning, className }: AgentReasoningPanelProps) {
  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-2 p-3">
        {reasoning.length === 0 && (
          <p className="text-xs text-foreground-muted italic">No reasoning recorded yet...</p>
        )}
        <AnimatePresence>
          {reasoning.map((thought, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-2 text-xs"
            >
              <Lightbulb className="h-3 w-3 mt-0.5 text-warning shrink-0" />
              <span className="text-foreground-muted">{thought}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
