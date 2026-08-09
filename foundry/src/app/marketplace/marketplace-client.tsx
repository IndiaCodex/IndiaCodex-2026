"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Store,
  Cpu,
  Coins,
  Check,
  BrainCircuit,
  Sparkles,
  Star,
  BarChart3,
  Wallet,
} from "lucide-react";
import { cn, formatADA } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AGENT_CONFIGS } from "@/config/agents";
import { useMasumi } from "@/hooks/use-masumi";
import type { MasumiRegistryEntry } from "@/types/masumi";
import type { AgentConfig } from "@/types/agent";

function shortenAddress(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function AgentCard({
  agent,
  selected,
  onSelect,
  registryEntry,
}: {
  agent: AgentConfig;
  selected: boolean;
  onSelect: () => void;
  registryEntry?: MasumiRegistryEntry;
}) {
  const capabilities = agent.capabilities.slice(0, 4);
  const isRegistered = registryEntry?.status === "active";

  const mockWalletAddr = `addr_test1${Array.from(
    { length: 50 },
    (_, i) => "abcdefghijklmnopqrstuvwxyz0123456789"[agent.id.charCodeAt(i % agent.id.length) % 36],
  ).join("")}`;

  const mockRevenue = agent.fee * (agent.id === "ceo" ? 47 : agent.id === "contract-engineer" ? 23 : agent.id === "security-engineer" ? 18 : 5 + Math.round(agent.id.length * 3.7));
  const mockRating = Math.min(5, Math.max(3.5, 4.5 - (agent.id.length % 11) / 10));
  const mockProjects = agent.id === "ceo" ? 42 : agent.id === "research" ? 38 : 12 + (agent.id.length * 4);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative rounded-xl border p-5 transition-all duration-300 cursor-pointer",
        selected
          ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/5"
          : "border-border bg-surface shadow-[var(--shadow-card)] hover:border-border-hover hover:bg-surface-hover",
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-muted text-primary">
          <Cpu className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              {agent.name}
            </h3>
            {isRegistered && (
              <Badge variant="success" className="text-[9px] px-1 py-0">
                On-chain
              </Badge>
            )}
          </div>
          <p className="text-xs text-foreground-muted capitalize">
            {agent.role.replace(/-/g, " ")}
          </p>
          <p className="text-xs font-mono text-foreground-dim mt-0.5">
            {shortenAddress(mockWalletAddr)}
          </p>
        </div>
      </div>

      <p className="text-sm text-foreground-muted mb-4 line-clamp-2">
        {agent.description}
      </p>

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-1.5 text-sm text-foreground-muted">
          <Coins className="h-4 w-4 text-yellow-400" />
          <span className="font-medium text-foreground">
            {formatADA(agent.fee)}
          </span>
          <span>/ task</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-foreground-dim">
          <Wallet className="h-3.5 w-3.5" />
          <span>Revenue</span>
          <span className="font-medium text-foreground">{formatADA(mockRevenue)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-foreground-dim">
          <BarChart3 className="h-3.5 w-3.5" />
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3 text-warning fill-warning" />
            <span className="font-medium text-foreground">{mockRating.toFixed(1)}</span>
            <span className="text-foreground-dim">({mockProjects} projects)</span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {capabilities.map((cap) => (
          <Badge key={cap} variant="outline" className="text-[10px] px-1.5 py-0">
            {cap.replace(/-/g, " ")}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-foreground-muted mb-4">
        <BrainCircuit className="h-3.5 w-3.5" />
        <span>{agent.model}</span>
        <span className="mx-1">·</span>
        <span>{(agent.contextWindow / 1000).toFixed(0)}K context</span>
      </div>

      <Button
        variant={selected ? "default" : "secondary"}
        size="sm"
        className="w-full gap-2"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {selected ? (
          <>
            <Check className="h-4 w-4" />
            Selected
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Select Agent
          </>
        )}
      </Button>
    </motion.div>
  );
}

export default function MarketplaceClient() {
  const [selected, setSelected] = useState<string | null>(null);
  const [registryEntries, setRegistryEntries] = useState<MasumiRegistryEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const { discoverAgents, isMock } = useMasumi();

  useEffect(() => {
    discoverAgents().then(setRegistryEntries).catch(() => {});
  }, [discoverAgents]);

  const filtered =
    filter === "all"
      ? AGENT_CONFIGS
      : AGENT_CONFIGS.filter((a) => a.role === filter);

  const uniqueRoles = [...new Set(AGENT_CONFIGS.map((a) => a.role))];

  const registryMap = new Map(
    registryEntries.map((e) => [e.metadata.capability.name, e]),
  );

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-6 py-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[1.5rem] border border-border bg-card p-6 shadow-[var(--shadow-card)]"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Store className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-semibold tracking-tight">Agent Marketplace</h1>
            </div>
            <p className="max-w-2xl text-sm text-foreground-muted">
              Browse and select specialized AI agents to build your autonomous software company.
              {!isMock && " Live data from the Masumi Registry."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Preprod</Badge>
            <Badge variant="outline">{filtered.length} agents</Badge>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        <Button variant={filter === "all" ? "default" : "secondary"} size="sm" onClick={() => setFilter("all")}>
          All Agents
        </Button>
        {uniqueRoles.map((role) => (
          <Button key={role} variant={filter === role ? "default" : "secondary"} size="sm" onClick={() => setFilter(role)}>
            {role.replace(/-/g, " ")}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            selected={selected === agent.id}
            onSelect={() => setSelected(agent.id === selected ? null : agent.id)}
            registryEntry={registryMap.get(agent.masumi.capability.name)}
          />
        ))}
      </div>
    </main>
  );
}
