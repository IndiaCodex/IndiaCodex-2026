"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { deriveOutputsForAgent } from "@/features/outputs-generation/generator";
import type { AgentRole } from "@/types/execution";
import type { ProjectOutput } from "@/types/project";
import { motion } from "framer-motion";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import AgentNode from "@/components/agents/agent-node";
import { ExecutionProgress } from "@/components/execution/execution-progress";
import { PhaseTimeline } from "@/components/execution/phase-timeline";
import { CostBreakdown } from "@/components/execution/cost-breakdown";
import { WalletConnect } from "@/components/wallet/wallet-connect";
import { useExecutionStream } from "@/hooks/use-execution-stream";
import { useWallet } from "@/hooks/use-wallet";
import { useExecutionStore } from "@/store/execution-store";
import { useAgentStore } from "@/store/agent-store";
import { useProjectStore } from "@/store/project-store";
import { useShallow } from "zustand/react/shallow";
import { useWalletStore } from "@/store/wallet-store";
import { PHASE_LABELS, EXECUTION_PHASES } from "@/config/execution";
import { AGENTS } from "@/config/agents";
import { CARDANO_MOCK_FUNDING, TREASURY_FEE_PERCENTAGE } from "@/lib/constants";
import { fundCompanyExecution } from "@/services/cardano/fund-company";
import type { AgentInstance } from "@/types/agent";
import {
  Play,
  Square,
  CheckCircle2,
  Loader2,
  Coins,
  Layers,
  Wallet,
  ArrowUpRight,
  FileJson,
  BrainCircuit,
  ListChecks,
  NotebookPen,
  PanelRightOpen,
  PanelRightClose,
  FileText,
  FileCode2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatADA } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const nodeTypes = { agent: AgentNode };

interface ExecutionClientProps {
  projectId: string;
  className?: string;
}

export default function ExecutionClient({ projectId, className }: ExecutionClientProps) {
  const { startExecution, isRunning, isComplete, error, progress, cancel } =
    useExecutionStream();
  const { connected, info, wallet } = useWallet();
  const { addToast } = useToast();
  const [funding, setFunding] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"live" | "history">("live");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [outputDrawerOpen, setOutputDrawerOpen] = useState(false);
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);

  const storeNodes = useExecutionStore((s) => s.nodes);
  const storeEdges = useExecutionStore((s) => s.edges);
  const totalCost = useExecutionStore((s) => s.totalCost);
  const status = useExecutionStore((s) => s.status);
  const phase = useExecutionStore((s) => s.phase);
  const agents = useAgentStore((s) => s.agents);
  const initializeDefaultAgents = useAgentStore((s) => s.initializeDefaultAgents);
  const project = useProjectStore((s) => s.projects.find((p) => p.id === projectId));
  const projectOutputs = useProjectStore(useShallow((s) => s.outputs.filter((o) => o.projectId === projectId)));
  const reserveSpend = useWalletStore((s) => s.reserveSpend);
  const clearReservation = useWalletStore((s) => s.clearReservation);

  const allOutputs = useMemo(() => {
    if (projectOutputs.length > 0) return projectOutputs;
    const name = project?.name ?? "Project";
    return agents.flatMap((agent) =>
      agent.output
        ? deriveOutputsForAgent(projectId, name, agent.config.role, agent.output)
        : [],
    );
  }, [projectOutputs, agents, projectId, project?.name]);

  const outputsByRole = useMemo(() => {
    const map = new Map<AgentRole, ProjectOutput[]>();
    for (const output of allOutputs) {
      if (!output.sourceAgentRole) continue;
      const existing = map.get(output.sourceAgentRole) ?? [];
      existing.push(output);
      map.set(output.sourceAgentRole, existing);
    }
    return map;
  }, [allOutputs]);

  const handleOutputClick = useCallback(
    (outputId: string, agentRole: AgentRole) => {
      setSelectedOutputId(outputId);
      setOutputDrawerOpen(true);
      const agent = agents.find((a) => a.config.role === agentRole);
      if (agent) setSelectedAgentId(agent.id);
    },
    [agents],
  );

  const rfNodes: Node[] = useMemo(
    () =>
      storeNodes.map((n) => ({
        id: n.id,
        type: "agent",
        position: n.position,
        data: {
          label: n.label,
          role: n.agentRole,
          status: n.status,
          confidence: n.confidence,
          outputs: outputsByRole.get(n.agentRole) ?? [],
          onOutputClick: (outputId: string) => handleOutputClick(outputId, n.agentRole),
        },
      })),
    [storeNodes, outputsByRole, handleOutputClick],
  );

  const rfEdges = useMemo(
    () =>
      storeEdges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.status === "active",
        style: {
          stroke:
            e.status === "completed"
              ? "#10b981"
              : e.status === "active"
                ? "#0033ad"
                : "rgba(255,255,255,0.08)",
          strokeWidth: e.status === "active" ? 3 : 2,
        },
      })),
    [storeEdges],
  );

  const activeAgentRoles = useMemo(() => {
    if (project?.requiredAgents?.length) return project.requiredAgents;
    return AGENTS.map((a) => a.role);
  }, [project?.requiredAgents]);

  const estimatedBudget = useMemo(() => {
    const roster = AGENTS.filter((a) => activeAgentRoles.includes(a.role));
    const subtotal = roster.reduce((sum, agent) => sum + agent.fee, 0);
    const ceoFee = AGENTS.find((a) => a.role === "ceo")?.fee ?? 0;
    const treasuryFee = Math.round((subtotal + ceoFee) * TREASURY_FEE_PERCENTAGE);
    return subtotal + ceoFee + treasuryFee;
  }, [activeAgentRoles]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  useEffect(() => {
    setNodes(rfNodes);
    setEdges(rfEdges);
  }, [rfNodes, rfEdges, setNodes, setEdges]);

  useEffect(() => {
    if (project && agents.length === 0) {
      initializeDefaultAgents();
    }
  }, [project, agents.length, initializeDefaultAgents]);

  const spendableBalance = Number(info?.spendableBalance ?? info?.balance ?? "0");
  const hasInsufficientBalance =
    connected && !CARDANO_MOCK_FUNDING && spendableBalance < estimatedBudget;

  const currentAgent = agents.find(
    (a) =>
      a.status === "working" ||
      a.status === "planning" ||
      a.status === "researching" ||
      a.status === "reviewing",
  );
  const activeAgent = agents.find((a) => a.id === selectedAgentId) || currentAgent || agents[0] || null;
  const activeAgentOutputs = useMemo(() => {
    if (!activeAgent) return allOutputs;
    const matched = allOutputs.filter((output) => output.sourceAgentRole === activeAgent.config.role);
    return matched.length > 0 ? matched : allOutputs;
  }, [activeAgent, allOutputs]);
  const selectedOutput = useMemo(
    () => allOutputs.find((output) => output.id === selectedOutputId) ?? activeAgentOutputs[0] ?? null,
    [activeAgentOutputs, allOutputs, selectedOutputId],
  );

  const completedAgents = agents.filter((a) => a.status === "completed");

  const phases = EXECUTION_PHASES.filter((p) => p !== "completed").map((p) => ({
    id: p,
    label: PHASE_LABELS[p],
    status: (EXECUTION_PHASES.indexOf(p) < EXECUTION_PHASES.indexOf(phase)
      ? "completed"
      : EXECUTION_PHASES.indexOf(p) === EXECUTION_PHASES.indexOf(phase)
        ? "active"
        : "pending") as "completed" | "active" | "pending",
  }));

  const handleFundAndStart = async () => {
    if (!project || !connected || !wallet || !info?.address) {
      addToast({ type: "error", title: "Cannot execute", message: !project ? "Project not found" : !connected ? "Wallet not connected" : !info?.address ? "Wallet address not available" : "Wallet instance missing" });
      return;
    }
    setFunding(true);
    try {
      const tx = await fundCompanyExecution(wallet, estimatedBudget);
      if (!tx.simulated) {
        reserveSpend(info.address, estimatedBudget);
      }
      addToast({
        type: "success",
        title: tx.simulated ? "Demo funding recorded" : "Funding submitted",
        message: tx.simulated
          ? "Treasury not configured — execution started in demo mode."
          : `Tx ${tx.txHash.slice(0, 12)}... sent to treasury.`,
      });
      await startExecution(
          {
            id: projectId,
            name: project.name,
            description: project.description,
            targetChain: project.targetChain,
            complexity: project.complexity,
            goal: project.goal,
            features: project.features,
            requiredAgents: project.requiredAgents,
            scopeSummary: project.scopeAnalysis?.summary,
          },
          projectId,
          info?.address,
        );
    } catch (err) {
      if (info?.address) {
        clearReservation(info.address);
      }
      addToast({
        type: "error",
        title: "Funding failed",
        message: err instanceof Error ? err.message : "Transaction could not be submitted.",
      });
    } finally {
      setFunding(false);
    }
  };

  return (
    <div className={cn("relative flex min-h-0 flex-1 overflow-hidden bg-background", className)}>
      <div className="flex-1 relative">
        {/* Overlay for initial state */}
        {status === "draft" && !isRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/75 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center space-y-5 max-w-2xl px-6"
            >
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-2xl border border-border bg-surface flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
                  <Layers className="h-7 w-7 text-primary" />
                </div>
              </div>
              <div className="space-y-3">
                <Badge variant="outline" className="mx-auto">
                  Pre-prod execution
                </Badge>
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                  Ready to launch the company
                </h2>
              </div>
              <p className="mx-auto max-w-xl text-sm leading-6 text-foreground-muted">
                Your autonomous software company is assembled. When you start,
                agents will work together to build your project.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-foreground-muted">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5">
                  <UsersIcon className="h-4 w-4" /> {agents.length || 9} Agents
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5">
                  <Layers className="h-4 w-4" /> {storeNodes.length || 8} Tasks
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5">
                  <Coins className="h-4 w-4" /> {formatADA(estimatedBudget)}
                </span>
              </div>
              {!connected ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-surface p-4 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Wallet required</span>
                    </div>
                    <p className="text-xs leading-5 text-foreground-muted">
                      Connect your wallet to fund agent execution. Funds are locked during execution and unused amounts are returned.
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <WalletConnect />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <CostBreakdown
                    walletBalance={info?.spendableBalance ?? info?.balance ?? null}
                    selectedAgents={activeAgentRoles}
                  />
                  {CARDANO_MOCK_FUNDING && (
                    <p className="text-center text-xs text-foreground-muted">
                      Demo mode: on-chain treasury transfer is skipped until{" "}
                      <code className="text-foreground-dim">NEXT_PUBLIC_TREASURY_ADDRESS</code> is set.
                    </p>
                  )}
                  {hasInsufficientBalance && !CARDANO_MOCK_FUNDING && (
                    <p className="text-center text-xs text-error">
                      Insufficient wallet balance. Get Preprod ADA from the Cardano faucet.
                    </p>
                  )}
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={handleFundAndStart}
                      disabled={funding || hasInsufficientBalance}
                      className="gap-2 text-sm px-6 w-full"
                    >
                      {funding ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Funding Execution...
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5" />
                          Fund &amp; Execute
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Completion overlay */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.3 }}
              className="text-center space-y-4"
            >
              <CheckCircle2 className="h-16 w-16 text-success mx-auto" />
              <h2 className="text-2xl font-bold text-foreground">Company Complete</h2>
              <p className="text-foreground-muted">
                All agents completed their tasks successfully.
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
          defaultEdgeOptions={{
            style: { stroke: "rgba(255,255,255,0.08)", strokeWidth: 2 },
            animated: true,
          }}
        >
          <Background color="rgba(255,255,255,0.02)" gap={24} size={1} />
          <Controls className="!bg-surface !border-border !text-foreground-muted [&>button]:!border-border [&>button]:!bg-surface [&>button]:!text-foreground-muted" />
          <MiniMap
            className="!border-border"
            style={{ background: "rgba(10,10,15,0.95)" }}
            nodeColor={(n) =>
              n.data?.status === "completed"
                ? "#10b981"
                : n.data?.status === "working" || n.data?.status === "planning"
                  ? "#0033ad"
                  : "rgba(255,255,255,0.1)"
            }
            maskColor="rgba(10,10,15,0.7)"
          />
        </ReactFlow>
      </div>

      <div className="w-[420px] border-l border-border bg-background/95 flex flex-col shrink-0">
        <div className="border-b border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-foreground-dim">Execution</p>
              <h3 className="text-lg font-semibold text-foreground">Agent control room</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOutputDrawerOpen((open) => !open)}
                className="h-8 gap-1.5 text-foreground-muted"
              >
                {outputDrawerOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
                {outputDrawerOpen ? "Close" : "Outputs"}
              </Button>
              {isRunning && (
                <Button variant="ghost" size="sm" onClick={cancel} className="btn--compact">
                  <Square className="h-3 w-3" />
                  Stop
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-foreground-muted">
              <span>Progress</span>
              <span>
                {progress.completed} / {progress.total} tasks
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-hover overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: "0%" }}
                animate={{
                  width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`,
                }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Spent" value={formatADA(totalCost)} icon={Coins} />
            <MetricCard label="Agents" value={`${completedAgents.length}/${agents.length || 9}`} icon={UsersIcon} />
            <MetricCard label="Phase" value={PHASE_LABELS[phase] || "Ready"} icon={Layers} />
          </div>
          {error && (
            <div className="rounded-xl border border-error/20 bg-error/10 px-3 py-2 text-xs text-error">
              {error}
            </div>
          )}
        </div>

        <div className="border-b border-border p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-foreground-dim">Pipeline</p>
          <ExecutionProgress phases={phases} />
        </div>

        <div className="flex border-b border-border">
          {(["live", "history"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedTab(tab)}
              className={cn("btn-tab", tab === selectedTab && "btn-tab--active")}
            >
              {tab === "live" ? "Live" : "History"}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          {selectedTab === "live" ? (
            <div className="flex h-full min-h-0 flex-col">
              <div className="max-h-[min(320px,38vh)] shrink-0 overflow-y-auto border-b border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground-dim">Agents</p>
                  <Badge variant="outline">{agents.length || 9} total</Badge>
                </div>
                <div className="space-y-2">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={cn(
                        "btn-list-item",
                        selectedAgentId === agent.id && "btn-list-item--selected",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{agent.config.name}</p>
                          <p className="text-[11px] text-foreground-dim capitalize">
                            {agent.config.role.replace(/-/g, " ")}
                          </p>
                        </div>
                        <Badge variant={agent.status === "completed" ? "success" : agent.status === "failed" ? "error" : "outline"}>
                          {agent.status}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-foreground-muted">
                        <span className="rounded-md bg-black/10 px-2 py-1">Cost {formatADA(agent.cost)}</span>
                        <span className="rounded-md bg-black/10 px-2 py-1">Conf {Math.round(agent.confidence * 100)}%</span>
                        <span className="rounded-md bg-black/10 px-2 py-1">Time {formatDuration(agent.duration)}</span>
                      </div>
                      {agent.output != null && (
                        <p className="mt-3 line-clamp-2 text-[11px] leading-5 text-foreground-muted">
                          {summarizeOutput(agent.output)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {activeAgent ? (
                  <AgentDetail agent={activeAgent} isRunning={isRunning} isComplete={isComplete} />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-xs text-foreground-dim">
                    Waiting for execution to start...
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <PhaseTimeline />
            </div>
          )}
        </div>
      </div>

      {outputDrawerOpen && (
        <motion.aside
          initial={{ x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 24, opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="absolute inset-y-0 right-[420px] z-30 flex w-[min(34rem,calc(100vw-420px))] border-l border-border bg-background/95 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] shadow-[var(--shadow-card)]"
        >
          <div className="flex w-full flex-col">
            <div className="border-b border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground-dim">Agent outputs</p>
                  <h3 className="text-lg font-semibold text-foreground">
                    {activeAgent ? activeAgent.config.name : "All outputs"}
                  </h3>
                  <p className="text-xs text-foreground-muted">
                    {selectedOutput ? selectedOutput.title : "Choose a file to preview"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOutputDrawerOpen(false)} className="shrink-0">
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">{allOutputs.length} files</Badge>
                {activeAgent && <Badge variant="outline">{activeAgent.config.role.replace(/-/g, " ")}</Badge>}
              </div>
            </div>

            <div className="grid flex-1 min-h-0 grid-rows-[auto_1fr]">
              <div className="border-b border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.2em] text-foreground-dim">Files</p>
                  <Badge variant="outline">{activeAgentOutputs.length}</Badge>
                </div>
              </div>

              <div className="grid min-h-0 grid-rows-[minmax(0,1fr)]">
                <div className="grid min-h-0 grid-cols-[14rem_minmax(0,1fr)]">
                  <div className="min-h-0 overflow-y-auto border-r border-border p-3">
                    <div className="space-y-2">
                      {activeAgentOutputs.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border bg-surface/40 p-4 text-center">
                          <FileText className="mx-auto mb-2 h-6 w-6 text-foreground-dim" />
                          <p className="text-xs text-foreground-muted">
                            Files appear here as each agent completes — or click output chips on the flow canvas.
                          </p>
                        </div>
                      )}
                      {activeAgentOutputs.map((output) => {
                        const selected = selectedOutput?.id === output.id;
                        return (
                          <button
                            key={output.id}
                            type="button"
                            onClick={() => setSelectedOutputId(output.id)}
                            className={cn("btn-list-item", selected && "btn-list-item--selected")}
                          >
                            <div className="flex items-start gap-2">
                              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {output.mimeType === "text/x-aiken" ? <FileCode2 className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{output.title}</p>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-foreground-dim">
                                  {output.type}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="min-h-0 overflow-y-auto p-4">
                    {selectedOutput ? (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-border bg-card p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-foreground-dim">Preview</p>
                              <h4 className="mt-1 text-base font-semibold text-foreground">{selectedOutput.title}</h4>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">{selectedOutput.type}</Badge>
                              {selectedOutput.sourceAgentRole && (
                                <Badge variant="outline">{selectedOutput.sourceAgentRole.replace(/-/g, " ")}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-foreground-muted">
                            <span className="rounded-full border border-border px-2.5 py-1">
                              {new Date(selectedOutput.createdAt).toLocaleString()}
                            </span>
                            <span className="rounded-full border border-border px-2.5 py-1">{selectedOutput.mimeType}</span>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-background p-4">
                          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-foreground-muted">
                            {selectedOutput.content}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border bg-surface/40 p-6 text-center">
                        <div className="space-y-2">
                          <FileText className="mx-auto h-8 w-8 text-foreground-dim" />
                          <p className="text-sm text-foreground-muted">No output selected</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-foreground-dim">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
      </div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function AgentDetail({
  agent,
  isRunning,
  isComplete,
}: {
  agent: AgentInstance;
  isRunning: boolean;
  isComplete: boolean;
}) {
  const output = agent.output;
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-foreground-dim">Selected output</p>
            <h4 className="mt-1 text-base font-semibold text-foreground">{agent.config.name}</h4>
          </div>
          <Badge variant={agent.status === "completed" ? "success" : agent.status === "failed" ? "error" : "outline"}>
            {agent.status}
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-foreground-muted">
          <span className="rounded-full border border-border px-2.5 py-1">Confidence {Math.round(agent.confidence * 100)}%</span>
          <span className="rounded-full border border-border px-2.5 py-1">Cost {formatADA(agent.cost)}</span>
          <span className="rounded-full border border-border px-2.5 py-1">Duration {formatDuration(agent.duration)}</span>
        </div>
      </div>

      <div className="grid flex-1 min-h-0 grid-rows-[1fr_auto] gap-0">
        <div className="min-h-0 overflow-y-auto p-4 space-y-4">
          <SectionCard title="Output" icon={FileJson}>
            <pre className="whitespace-pre-wrap break-words rounded-xl border border-border bg-black/20 p-3 font-mono text-[11px] leading-5 text-foreground-muted">
              {output ? JSON.stringify(output, null, 2) : "No output yet."}
            </pre>
          </SectionCard>

          <SectionCard title="Reasoning" icon={BrainCircuit}>
            {agent.reasoning.length ? (
              <div className="space-y-2">
                {agent.reasoning.map((thought, index) => (
                  <div key={index} className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground-muted">
                    <span className="mr-2 text-[10px] uppercase tracking-[0.2em] text-foreground-dim">{index + 1}</span>
                    {thought}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-foreground-dim">Reasoning will appear while the agent works.</p>
            )}
          </SectionCard>

          <SectionCard title="Logs" icon={ListChecks}>
            {agent.logs.length ? (
              <div className="space-y-2">
                {agent.logs.slice(-8).map((log) => (
                  <div key={log.id} className="rounded-xl border border-border bg-surface px-3 py-2">
                    <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-foreground-dim">
                      <span>{log.level}</span>
                      <span>·</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-foreground-muted">{log.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-foreground-dim">Logs will appear here as the agent streams work.</p>
            )}
          </SectionCard>

          <SectionCard title="System Prompt" icon={NotebookPen}>
            <p className="text-xs leading-6 text-foreground-muted line-clamp-10">{agent.config.description}</p>
          </SectionCard>
        </div>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 text-xs text-foreground-dim">
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
            <span>{isRunning ? "Streaming live from the server" : isComplete ? "Execution completed" : "Waiting for execution"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-foreground-dim">
        <Icon className="h-3.5 w-3.5" />
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

function summarizeOutput(output: unknown): string {
  if (output == null) return "";
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return output.join(", ");
  if (typeof output === "object") {
    const obj = output as Record<string, unknown>;
    const keys = Object.keys(obj).slice(0, 3);
    return keys
      .map((key) => `${key}: ${typeof obj[key] === "string" ? obj[key] : JSON.stringify(obj[key]).slice(0, 80)}`)
      .join(" · ");
  }
  return String(output);
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
