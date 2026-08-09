"use client";

import { useCallback } from "react";
import { useExecutionStore } from "@/store/execution-store";
import { useAgentStore } from "@/store/agent-store";

export function useWorkflow() {
  const execution = useExecutionStore();
  const agentStore = useAgentStore();

  const getReadyNodes = useCallback(() => {
    return execution.nodes.filter((node) => {
      if (node.status !== "waiting") return false;
      return node.dependencies.every((depId) => {
        const depNode = execution.nodes.find((n) => n.id === depId);
        return depNode?.status === "completed";
      });
    });
  }, [execution.nodes]);

  const getNodeProgress = useCallback(() => {
    const total = execution.nodes.length;
    const completed = execution.nodes.filter(
      (n) => n.status === "completed",
    ).length;
    const failed = execution.nodes.filter((n) => n.status === "failed").length;
    const active = execution.nodes.filter(
      (n) =>
        n.status === "working" ||
        n.status === "planning" ||
        n.status === "reviewing",
    ).length;

    return {
      total,
      completed,
      failed,
      active,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [execution.nodes]);

  const getPhaseCost = useCallback((phase: string) => {
    return execution.nodes
      .filter((n) => n.phase === phase)
      .reduce((sum, n) => sum + n.cost, 0);
  }, [execution.nodes]);

  const getAgentCosts = useCallback(() => {
    return agentStore.agents.map((a) => ({
      name: a.config.name,
      role: a.config.role,
      cost: a.cost,
      duration: a.duration,
      status: a.status,
    }));
  }, [agentStore.agents]);

  return {
    getReadyNodes,
    getNodeProgress,
    getPhaseCost,
    getAgentCosts,
    nodes: execution.nodes,
    edges: execution.edges,
    status: execution.status,
  };
}
