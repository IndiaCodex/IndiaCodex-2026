"use client";

import { motion } from "framer-motion";
import {
  Crown,
  Search,
  Building2,
  Code2,
  Palette,
  Shield,
  CheckCircle2,
  BookOpen,
  Rocket,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentInstance } from "@/types/agent";

const roleConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  ceo: { icon: Crown, label: "CEO", color: "text-yellow-400" },
  research: { icon: Search, label: "Research", color: "text-blue-400" },
  architecture: { icon: Building2, label: "Architecture", color: "text-purple-400" },
  "contract-engineer": { icon: Code2, label: "Contract Engineer", color: "text-indigo-400" },
  "frontend-engineer": { icon: Palette, label: "Frontend Engineer", color: "text-pink-400" },
  "security-engineer": { icon: Shield, label: "Security Engineer", color: "text-red-400" },
  "qa-engineer": { icon: CheckCircle2, label: "QA Engineer", color: "text-green-400" },
  "documentation-engineer": { icon: BookOpen, label: "Documentation Engineer", color: "text-cyan-400" },
  "deployment-engineer": { icon: Rocket, label: "Deployment Engineer", color: "text-orange-400" },
};

interface OrgNode {
  role: string;
  children?: OrgNode[];
}

const orgStructure: OrgNode[] = [
  {
    role: "ceo",
    children: [
      {
        role: "research",
        children: [],
      },
      {
        role: "architecture",
        children: [
          {
            role: "contract-engineer",
            children: [
              {
                role: "security-engineer",
                children: [
                  {
                    role: "qa-engineer",
                    children: [
                      {
                        role: "documentation-engineer",
                        children: [
                          {
                            role: "deployment-engineer",
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            role: "frontend-engineer",
            children: [
              {
                role: "security-engineer",
              },
            ],
          },
        ],
      },
    ],
  },
];

interface CompanyOrgChartProps {
  agents: AgentInstance[];
}

function OrgNodeComponent({
  node,
  level,
  agents,
}: {
  node: OrgNode;
  level: number;
  agents: AgentInstance[];
}) {
  const agent = agents.find((a) => a.config.role === node.role);
  const config = roleConfig[node.role];
  const Icon = config?.icon ?? ChevronRight;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: level * 0.08, duration: 0.3 }}
        className={cn(
          "relative flex flex-col items-center rounded-xl border border-border",
          "bg-surface p-4 transition-all duration-200",
          "hover:border-primary/20 hover:bg-surface-hover",
          "min-w-[160px]",
        )}
      >
        {agent ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("h-5 w-5", config?.color)} />
              <span className="text-sm font-medium text-foreground">
                {agent.config.name}
              </span>
            </div>
            <span className="text-xs text-foreground-muted mb-2">
              {config?.label}
            </span>
            <Badge
              variant={
                agent.status === "completed"
                  ? "success"
                  : agent.status === "working"
                    ? "default"
                    : agent.status === "failed"
                      ? "error"
                      : "outline"
              }
              className="text-[10px] px-1.5 py-0"
            >
              {agent.status}
            </Badge>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("h-5 w-5 opacity-30", config?.color)} />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-4 w-14 rounded-full" />
          </>
        )}
      </motion.div>

      {hasChildren && (
        <div className="flex flex-col items-center">
          <div className="w-px h-6 bg-surface-hover" />
          <div className="flex gap-6">
            {node.children!.map((child, i) => (
              <div key={i} className="flex flex-col items-center">
                {node.children!.length > 1 && (
                  <div className="w-full h-px bg-surface-hover mb-6" />
                )}
                <OrgNodeComponent
                  node={child}
                  level={level + 1}
                  agents={agents}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CompanyOrgChart({ agents }: CompanyOrgChartProps) {
  return (
    <div className="w-full overflow-x-auto py-8">
      <div className="flex justify-center min-w-[600px]">
        {orgStructure.map((node, i) => (
          <OrgNodeComponent key={i} node={node} level={0} agents={agents} />
        ))}
      </div>
    </div>
  );
}
