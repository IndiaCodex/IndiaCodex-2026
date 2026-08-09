import { create } from "zustand";
import type {
  WorkflowNode,
  WorkflowEdge,
  ExecutionState,
  ExecutionPhase,
  AgentStatus,
} from "@/types/execution";
import { generateId } from "@/lib/utils";

interface ExecutionStore extends ExecutionState {
  phase: ExecutionPhase;
  startExecution: (projectId: string) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  updateNodeStatus: (nodeId: string, status: AgentStatus) => void;
  updateNodeConfidence: (nodeId: string, confidence: number) => void;
  updateNodeDuration: (nodeId: string, duration: number) => void;
  updateNodeCost: (nodeId: string, cost: number) => void;
  setCurrentNode: (nodeId: string | null) => void;
  updateEdgeStatus: (edgeId: string, status: WorkflowEdge["status"]) => void;
  setPhase: (phase: ExecutionPhase) => void;
  addCost: (cost: number) => void;
  addTokens: (tokens: number) => void;
  addToolCalls: (count: number) => void;
  completeExecution: () => void;
  failExecution: () => void;
  resetExecution: () => void;
}

const initialState: ExecutionState = {
  projectId: "",
  status: "draft",
  currentNodeId: null,
  nodes: [],
  edges: [],
  startedAt: null,
  completedAt: null,
  totalCost: 0,
  totalTokens: 0,
  totalToolCalls: 0,
};

export const useExecutionStore = create<ExecutionStore>((set) => ({
  ...initialState,
  phase: "research",

  startExecution: (projectId) =>
    set({
      projectId,
      status: "executing",
      startedAt: Date.now(),
      currentNodeId: null,
    }),

  setNodes: (nodes) => set({ nodes }),

  setEdges: (edges) => set({ edges }),

  updateNodeStatus: (nodeId, status) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, status } : n)),
    })),

  updateNodeConfidence: (nodeId, confidence) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, confidence } : n)),
    })),

  updateNodeDuration: (nodeId, duration) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, duration } : n)),
    })),

  updateNodeCost: (nodeId, cost) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, cost } : n)),
    })),

  setCurrentNode: (nodeId) => set({ currentNodeId: nodeId }),

  updateEdgeStatus: (edgeId, status) =>
    set((s) => ({
      edges: s.edges.map((e) => (e.id === edgeId ? { ...e, status } : e)),
    })),

  setPhase: (phase) => set({ phase }),

  addCost: (cost) => set((s) => ({ totalCost: s.totalCost + cost })),

  addTokens: (tokens) => set((s) => ({ totalTokens: s.totalTokens + tokens })),

  addToolCalls: (count) => set((s) => ({ totalToolCalls: s.totalToolCalls + count })),

  completeExecution: () =>
    set({
      status: "completed",
      completedAt: Date.now(),
      currentNodeId: null,
    }),

  failExecution: () =>
    set({
      status: "failed",
      completedAt: Date.now(),
      currentNodeId: null,
    }),

  resetExecution: () => set({ ...initialState, phase: "research" }),
}));
