"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAgentStore } from "@/store/agent-store";
import { useExecutionStore } from "@/store/execution-store";
import { useProjectStore } from "@/store/project-store";

interface ExecutionContextType {
  agents: ReturnType<typeof useAgentStore.getState>;
  execution: ReturnType<typeof useExecutionStore.getState>;
  project: ReturnType<typeof useProjectStore.getState>;
}

const ExecutionContext = createContext<ExecutionContextType | null>(null);

export function ExecutionProvider({ children }: { children: ReactNode }) {
  const agentState = useAgentStore();
  const executionState = useExecutionStore();
  const projectState = useProjectStore();

  return (
    <ExecutionContext.Provider
      value={{
        agents: agentState,
        execution: executionState,
        project: projectState,
      }}
    >
      {children}
    </ExecutionContext.Provider>
  );
}

export function useExecutionContext() {
  const ctx = useContext(ExecutionContext);
  if (!ctx) throw new Error("useExecutionContext must be used within ExecutionProvider");
  return ctx;
}
