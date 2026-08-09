"use client";

import { useCallback } from "react";
import { useAgentStore } from "@/store/agent-store";

export function useAgent(agentId?: string) {
  const store = useAgentStore();

  const agent = agentId ? store.getAgent(agentId) : null;

  const initializeAgents = useCallback(() => {
    return store.initializeDefaultAgents();
  }, [store]);

  return {
    agent,
    agents: store.agents,
    initializeAgents,
    addLog: store.addLog,
    addToolCall: store.addToolCall,
    addReasoning: store.addReasoning,
    updateStatus: store.updateAgentStatus,
    updateTask: store.updateAgentTask,
    updateConfidence: store.updateConfidence,
    updateCost: store.updateCost,
    updateDuration: store.updateDuration,
    setOutput: store.setAgentOutput,
    updateMemory: store.updateMemory,
    reset: store.resetAgents,
  };
}
