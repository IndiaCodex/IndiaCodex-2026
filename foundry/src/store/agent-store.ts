import { create } from "zustand";
import type { AgentConfig, AgentInstance, LogEntry, ToolCall, AgentMemory } from "@/types/agent";
import type { AgentStatus } from "@/types/execution";
import { generateId } from "@/lib/utils";
import { AGENT_CONFIGS } from "@/config/agents";

interface AgentState {
  agents: AgentInstance[];
  registeredAgentConfigs: AgentConfig[];
  registerAgentConfigs: (configs: AgentConfig[]) => void;
  addAgent: (config: AgentConfig) => AgentInstance;
  removeAgent: (id: string) => void;
  updateAgentStatus: (id: string, status: AgentStatus) => void;
  updateAgentTask: (id: string, task: string | null) => void;
  addLog: (agentId: string, message: string, level?: LogEntry["level"]) => void;
  addToolCall: (agentId: string, toolCall: Omit<ToolCall, "id" | "timestamp" | "agentId">) => void;
  addReasoning: (agentId: string, thought: string) => void;
  updateConfidence: (id: string, confidence: number) => void;
  updateCost: (id: string, cost: number) => void;
  updateDuration: (id: string, duration: number) => void;
  setAgentOutput: (id: string, output: unknown) => void;
  updateMemory: (id: string, memory: Partial<AgentMemory>) => void;
  getAgent: (id: string) => AgentInstance | undefined;
  getAgentsByRole: (role: string) => AgentInstance[];
  resetAgents: () => void;
  initializeDefaultAgents: () => AgentInstance[];
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  registeredAgentConfigs: [],

  registerAgentConfigs: (configs) => set({ registeredAgentConfigs: configs }),

  addAgent: (config) => {
    const agent: AgentInstance = {
      id: generateId(),
      config,
      status: "idle",
      wallet: {
        address: `addr_test1_${generateId().slice(0, 40)}`,
        balance: 0,
        network: "preprod",
      },
      masumiIdentity: {
        agentIdentifier: `000000000000000000000000000000000000000000000000000000000000${generateId().slice(0, 6)}`,
        name: config.name,
        registered: false,
        walletAddress: `addr_test1_${generateId().slice(0, 40)}`,
        reputationScore: 0,
        totalEarnings: 0,
        completedProjects: 0,
      },
      currentTask: null,
      previousTask: null,
      logs: [],
      toolCalls: [],
      reasoning: [],
      confidence: 0,
      duration: 0,
      cost: 0,
      memory: {
        previousTasks: [],
        successfulPatterns: [],
        failures: [],
        preferredStrategies: [],
        recentOutputs: [],
      },
      output: null,
    };
    set((s) => ({ agents: [...s.agents, agent] }));
    return agent;
  },

  removeAgent: (id) =>
    set((s) => ({ agents: s.agents.filter((a) => a.id !== id) })),

  updateAgentStatus: (id, status) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, status } : a)),
    })),

  updateAgentTask: (id, task) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id
          ? { ...a, previousTask: a.currentTask, currentTask: task }
          : a,
      ),
    })),

  addLog: (agentId, message, level = "info") =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === agentId
          ? {
              ...a,
              logs: [
                ...a.logs,
                { id: generateId(), agentId, timestamp: Date.now(), level, message },
              ],
            }
          : a,
      ),
    })),

  addToolCall: (agentId, toolCall) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === agentId
          ? {
              ...a,
              toolCalls: [
                ...a.toolCalls,
                { ...toolCall, agentId, id: generateId(), timestamp: Date.now() },
              ],
            }
          : a,
      ),
    })),

  addReasoning: (agentId, thought) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === agentId ? { ...a, reasoning: [...a.reasoning, thought] } : a,
      ),
    })),

  updateConfidence: (id, confidence) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, confidence } : a)),
    })),

  updateCost: (id, cost) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, cost } : a)),
    })),

  updateDuration: (id, duration) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, duration } : a)),
    })),

  setAgentOutput: (id, output) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, output } : a)),
    })),

  updateMemory: (id, memory) =>
    set((s) => ({
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, memory: { ...a.memory, ...memory } } : a,
      ),
    })),

  getAgent: (id) => get().agents.find((a) => a.id === id),

  getAgentsByRole: (role) => get().agents.filter((a) => a.config.role === role),

  resetAgents: () => set({ agents: [] }),

  initializeDefaultAgents: () => {
    const agents = AGENT_CONFIGS.map((config) => {
      const agent = get().addAgent(config as AgentConfig);
      return agent;
    });
    return agents;
  },
}));
