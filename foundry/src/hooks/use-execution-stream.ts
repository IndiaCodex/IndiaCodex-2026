"use client";

import { useCallback, useRef, useState } from "react";
import type { ExecutionEvent } from "@/services/execution-controller";
import type { ProjectContext } from "@/types/workflow";
import type { AgentStatus } from "@/types/execution";
import { useExecutionStore } from "@/store/execution-store";
import { useAgentStore } from "@/store/agent-store";
import { useProjectStore } from "@/store/project-store";
import { getExecutionNodes, getExecutionEdges } from "@/config/execution";
import { useWalletStore } from "@/store/wallet-store";
import type { AgentRole, ExecutionPhase, WorkflowNode, WorkflowEdge } from "@/types/execution";
import type { LogEntry } from "@/types/agent";
import type { ProjectOutput } from "@/types/project";

function findWorkflowNode(agentRole: string): WorkflowNode | undefined {
  return useExecutionStore.getState().nodes.find((n) => n.agentRole === agentRole);
}

export interface ExecutionStreamState {
  isRunning: boolean;
  isComplete: boolean;
  error: string | null;
  progress: { completed: number; total: number };
  currentPhase: string;
  currentAgentRole: string | null;
  events: ExecutionEvent[];
}

interface DagNodePayload {
  id: string;
  agentRole: AgentRole;
  label: string;
  dependencies: string[];
  phase: ExecutionPhase;
}

interface DagGeneratedEventData {
  dag?: DagNodePayload[];
}

interface AgentLogEventData {
  message: string;
  level: LogEntry["level"];
}

interface AgentReasoningEventData {
  thought: string;
}

interface ProgressEventData {
  completed: number;
  total: number;
  edgeUpdate?: {
    id: string;
    status: WorkflowEdge["status"];
  };
}

export function useExecutionStream() {
  const [state, setState] = useState<ExecutionStreamState>({
    isRunning: false,
    isComplete: false,
    error: null,
    progress: { completed: 0, total: 0 },
    currentPhase: "",
    currentAgentRole: null,
    events: [],
  });

  const abortRef = useRef<AbortController | null>(null);
  const executionStore = useExecutionStore();
  const agentStore = useAgentStore();
  const projectStore = useProjectStore();

  const startExecution = useCallback(
    async (projectContext: ProjectContext, projectId: string, walletAddress?: string) => {
      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;
      setState((s) => ({ ...s, isRunning: true, error: null }));

      projectStore.updateProjectStatus(projectId, "executing");
      executionStore.startExecution(projectId);

      // Initialize default DAG in store
      const nodes = getExecutionNodes(projectId);
      const edges = getExecutionEdges(projectId);
      executionStore.setNodes(nodes);
      executionStore.setEdges(edges);

      const handleEvent = (event: ExecutionEvent) => {
        setState((s) => ({
          ...s,
          events: [...s.events.slice(-200), event],
        }));

        switch (event.type) {
          case "dag:generated": {
            const dag = (event.data as DagGeneratedEventData | undefined)?.dag;
            if (dag) {
              const dynamicNodes: WorkflowNode[] = dag.map((n, i) => ({
                id: `${projectId}-${n.id}`,
                agentId: n.agentRole,
                agentRole: n.agentRole,
                label: n.label,
                status: "waiting" as AgentStatus,
                position: { x: 250, y: i * 120 },
                dependencies: n.dependencies.map((d) => `${projectId}-${d}`),
                phase: n.phase,
                confidence: 0,
                duration: 0,
                cost: 0,
              }));
              const dynamicEdges: WorkflowEdge[] = dynamicNodes.flatMap((n) =>
                n.dependencies.map((depId) => ({
                  id: `${n.id}-edge-${depId}`,
                  source: depId,
                  target: n.id,
                  status: "pending" as const,
                })),
              );
              executionStore.setNodes(dynamicNodes);
              executionStore.setEdges(dynamicEdges);
            }
            break;
          }

          case "agent:status": {
            const status = event.data as AgentStatus;
            if (!event.agentRole) break;

            const currentNode = findWorkflowNode(event.agentRole);
            if (currentNode) {
              useExecutionStore.getState().updateNodeStatus(currentNode.id, status);
              if (event.nodeId) useExecutionStore.getState().setCurrentNode(event.nodeId);
            }

            const agentInstance = agentStore.getAgentsByRole(event.agentRole)[0];
            if (agentInstance) {
              agentStore.updateAgentStatus(agentInstance.id, status);
            }

            if (status === "working" || status === "planning" || status === "researching") {
              setState((s) => ({ ...s, currentAgentRole: event.agentRole! }));
            }

            break;
          }

          case "agent:log": {
            const logAgentRole = event.agentRole;
            const logData = event.data as AgentLogEventData;
            if (logAgentRole) {
              const logAgent = agentStore.getAgentsByRole(logAgentRole)[0];
              if (logAgent) {
                agentStore.addLog(logAgent.id, logData.message, logData.level);
              }
            }
            break;
          }

          case "agent:reasoning": {
            if (!event.agentRole) break;
            const thought = (event.data as AgentReasoningEventData | undefined)?.thought;
            const reasonAgent = agentStore.getAgentsByRole(event.agentRole)[0];
            if (reasonAgent && thought) {
              agentStore.addReasoning(reasonAgent.id, thought);
            }
            break;
          }

          case "agent:output": {
            if (!event.agentRole) break;
            const output = event.data;
            const outAgent = agentStore.getAgentsByRole(event.agentRole)[0];
            if (outAgent) {
              agentStore.setAgentOutput(outAgent.id, output);
            }
            break;
          }

          case "agent:confidence": {
            if (!event.agentRole) break;
            const confidence = event.data as number;
            const confAgent = agentStore.getAgentsByRole(event.agentRole)[0];
            if (confAgent && typeof confidence === "number") {
              agentStore.updateConfidence(confAgent.id, confidence);
              const node = findWorkflowNode(event.agentRole);
              if (node) {
                useExecutionStore.getState().updateNodeConfidence(node.id, confidence);
              }
            }
            break;
          }

          case "agent:cost": {
            if (!event.agentRole) break;
            const cost = event.data as number;
            const costAgent = agentStore.getAgentsByRole(event.agentRole)[0];
            if (costAgent && typeof cost === "number") {
              agentStore.updateCost(costAgent.id, cost);
              useExecutionStore.getState().addCost(cost);
              const node = findWorkflowNode(event.agentRole);
              if (node) {
                useExecutionStore.getState().updateNodeCost(node.id, cost);
              }
            }
            break;
          }

          case "agent:duration": {
            if (!event.agentRole) break;
            const duration = event.data as number;
            const durAgent = agentStore.getAgentsByRole(event.agentRole)[0];
            if (durAgent && typeof duration === "number") {
              agentStore.updateDuration(durAgent.id, duration);
              const node = findWorkflowNode(event.agentRole);
              if (node) {
                useExecutionStore.getState().updateNodeDuration(node.id, duration);
              }
            }
            break;
          }

          case "phase:change": {
            const phaseData = event.data as { phase: ExecutionPhase };
            if (phaseData?.phase) {
              executionStore.setPhase(phaseData.phase);
              setState((s) => ({ ...s, currentPhase: phaseData.phase }));
            }
            break;
          }

          case "execution:progress": {
            const progress = event.data as ProgressEventData;
            if (progress.edgeUpdate) {
              useExecutionStore.getState().updateEdgeStatus(
                progress.edgeUpdate.id,
                progress.edgeUpdate.status,
              );
            } else {
              setState((s) => ({ ...s, progress: { completed: progress.completed, total: progress.total } }));
            }
            break;
          }

          case "outputs:generated": {
            const outputsData = event.data as { outputs: ProjectOutput[] };
            if (outputsData?.outputs) {
              outputsData.outputs.forEach((o) => projectStore.addOutput(o));
            }
            break;
          }

          case "execution:complete": {
            setState((s) => ({ ...s, isRunning: false, isComplete: true, currentPhase: "completed" }));
            executionStore.setPhase("completed");
            executionStore.completeExecution();
            projectStore.updateProjectStatus(projectId, "completed");
            if (walletAddress) {
              useWalletStore.getState().clearReservation(walletAddress);
            }
            break;
          }

          case "execution:error": {
            const errData = event.data as { message: string };
            setState((s) => ({ ...s, isRunning: false, error: errData?.message || "Execution failed" }));
            executionStore.failExecution();
            projectStore.updateProjectStatus(projectId, "failed");
            if (walletAddress) {
              useWalletStore.getState().clearReservation(walletAddress);
            }
            break;
          }
        }
      };

      try {
        const response = await fetch("/api/execution", {
          method: "POST",
          signal: abortController.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectContext, projectId, walletAddress }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`Execution request failed (${response.status})`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex = buffer.indexOf("\n");
          while (newlineIndex >= 0) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);
            if (line) {
              try {
                handleEvent(JSON.parse(line) as ExecutionEvent);
              } catch {
                // Ignore malformed lines and continue streaming
              }
            }
            newlineIndex = buffer.indexOf("\n");
          }
        }

        setState((s) => ({ ...s, isRunning: false }));
      } catch (error) {
        if (abortController.signal.aborted) return;
        const message = error instanceof Error ? error.message : "Execution failed";
        setState((s) => ({ ...s, isRunning: false, error: message }));
        executionStore.failExecution();
        projectStore.updateProjectStatus(projectId, "failed");
        if (walletAddress) {
          useWalletStore.getState().clearReservation(walletAddress);
        }
      }
    },
    [executionStore, agentStore, projectStore],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setState((s) => ({ ...s, isRunning: false, error: "Cancelled by user" }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isRunning: false,
      isComplete: false,
      error: null,
      progress: { completed: 0, total: 0 },
      currentPhase: "",
      currentAgentRole: null,
      events: [],
    });
  }, []);

  return {
    ...state,
    startExecution,
    cancel,
    reset,
  };
}
