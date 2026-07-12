import { create } from "zustand";
import type {
  UserRequest,
  ContentionGraph,
  Batch,
  SettlementResult,
} from "@/lib/agent/types";
import type { Ticket } from "@/lib/engine/loadgen";

const HISTORY_CAP = 60;

interface BatcherState {
  // real on-chain tickets
  tickets: Ticket[];
  ticketsLoading: boolean;

  // live pipeline
  queue: UserRequest[]; // the fired claim rush (simulated users, real tickets)
  graph: ContentionGraph | null;
  currentBatch: Batch | null; // the chosen non-conflicting set, awaiting settlement
  results: SettlementResult[]; // real settlements this session
  settling: boolean;
  lastError: string | null;

  // congestion
  score: number;
  scoreHistory: number[];

  // derived
  totalSavedLovelace: number;
  naiveTxCount: number;
  batchedTxCount: number;

  // actions
  setTickets: (t: Ticket[]) => void;
  setTicketsLoading: (b: boolean) => void;
  setQueue: (r: UserRequest[]) => void;
  setGraph: (g: ContentionGraph | null) => void;
  setBatch: (b: Batch | null) => void;
  setSettling: (b: boolean) => void;
  setError: (e: string | null) => void;
  addResult: (r: SettlementResult) => void;
  setScore: (s: number) => void;
  reset: () => void;
}

export const useBatcherStore = create<BatcherState>((set) => ({
  tickets: [],
  ticketsLoading: false,

  queue: [],
  graph: null,
  currentBatch: null,
  results: [],
  settling: false,
  lastError: null,

  score: 0,
  scoreHistory: [],

  totalSavedLovelace: 0,
  naiveTxCount: 0,
  batchedTxCount: 0,

  setTickets: (tickets) => set({ tickets }),
  setTicketsLoading: (ticketsLoading) => set({ ticketsLoading }),
  setQueue: (queue) => set({ queue }),
  setGraph: (graph) => set({ graph }),
  setBatch: (currentBatch) => set({ currentBatch }),
  setSettling: (settling) => set({ settling }),
  setError: (lastError) => set({ lastError }),

  addResult: (r) =>
    set((s) => ({
      results: [r, ...s.results].slice(0, 50),
      totalSavedLovelace: s.totalSavedLovelace + (r.savedLovelace || 0),
      naiveTxCount: s.naiveTxCount + r.batchSize,
      batchedTxCount: s.batchedTxCount + 1,
    })),

  setScore: (score) =>
    set((s) => ({ score, scoreHistory: [...s.scoreHistory, score].slice(-HISTORY_CAP) })),

  reset: () =>
    set({
      queue: [],
      graph: null,
      currentBatch: null,
      results: [],
      settling: false,
      lastError: null,
      scoreHistory: [],
      totalSavedLovelace: 0,
      naiveTxCount: 0,
      batchedTxCount: 0,
    }),
}));
