"use client";

import { useCallback } from "react";
import { useExecutionStore } from "@/store/execution-store";
import { useAgentStore } from "@/store/agent-store";
import { useProjectStore } from "@/store/project-store";
import { getExecutionNodes, getExecutionEdges, EXECUTION_SPEEDS, DEFAULT_EXECUTION_SPEED } from "@/config/execution";
import type { ExecutionSpeed } from "@/config/execution";
import { delay } from "@/lib/utils";

export function useExecution() {
  const execution = useExecutionStore();
  const agentStore = useAgentStore();
  const projectStore = useProjectStore();

  const initializeExecution = useCallback(
    (projectId: string) => {
      const nodes = getExecutionNodes(projectId);
      const edges = getExecutionEdges(projectId);
      execution.setNodes(nodes);
      execution.setEdges(edges);
      execution.startExecution(projectId);
    },
    [execution],
  );

  const executeAgent = useCallback(
    async (
      nodeId: string,
      agentId: string,
      speed: ExecutionSpeed = DEFAULT_EXECUTION_SPEED,
    ) => {
      const speedConfig = EXECUTION_SPEEDS[speed];
      const delayMs =
        speedConfig.minDelay +
        Math.random() * (speedConfig.maxDelay - speedConfig.minDelay);

      execution.setCurrentNode(nodeId);
      execution.updateNodeStatus(nodeId, "planning");
      agentStore.updateAgentStatus(agentId, "planning");
      agentStore.addLog(agentId, "Starting task...");
      agentStore.addLog(agentId, "Analyzing requirements...");

      await delay(delayMs * 0.3);

      execution.updateNodeStatus(nodeId, "working");
      agentStore.updateAgentStatus(agentId, "working");
      agentStore.addLog(agentId, "Processing...");
      agentStore.addReasoning(agentId, "Analyzing input data and constraints");

      await delay(delayMs * 0.4);

      agentStore.addToolCall(agentId, {
        tool: "analyze",
        input: { task: nodeId },
        output: { status: "processing" },
        duration: delayMs * 0.3,
        status: "success",
      });

      agentStore.addReasoning(agentId, "Evaluating options and selecting approach");
      agentStore.updateConfidence(agentId, 0.75);

      await delay(delayMs * 0.3);

      execution.updateNodeStatus(nodeId, "reviewing");
      agentStore.updateAgentStatus(agentId, "reviewing");
      agentStore.addLog(agentId, "Reviewing output quality...");
      agentStore.updateConfidence(agentId, 0.92);

      await delay(delayMs * 0.2);

      execution.updateNodeStatus(nodeId, "completed");
      agentStore.updateAgentStatus(agentId, "completed");
      agentStore.addLog(agentId, "Task completed successfully", "info");

      execution.updateNodeDuration(nodeId, delayMs);
      execution.addCost(250_000);
      execution.addToolCalls(1);

      agentStore.updateDuration(agentId, delayMs);
      agentStore.updateCost(agentId, 250_000);
    },
    [execution, agentStore],
  );

  const runFullExecution = useCallback(
    async (
      projectId: string,
      speed: ExecutionSpeed = DEFAULT_EXECUTION_SPEED,
    ) => {
      initializeExecution(projectId);
      projectStore.updateProjectStatus(projectId, "executing");

      const nodes = execution.nodes;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const agent = agentStore.getAgentsByRole(node.agentRole)[0];

        if (!agent) continue;

        agentStore.updateAgentTask(agent.id, node.label);
        await executeAgent(node.id, agent.id, speed);

        const edge = execution.edges.find((e) => e.source === node.id);
        if (edge) {
          execution.updateEdgeStatus(edge.id, "completed");
        }

        execution.setPhase(
          i < nodes.length - 1
            ? nodes[i + 1].phase
            : "completed",
        );
      }

      execution.completeExecution();
      projectStore.updateProjectStatus(projectId, "completed");
    },
    [execution, agentStore, projectStore, initializeExecution, executeAgent],
  );

  return {
    ...execution,
    initializeExecution,
    executeAgent,
    runFullExecution,
  };
}
