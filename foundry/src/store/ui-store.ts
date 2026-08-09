import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  executionPanel: "hidden" | "logs" | "reasoning" | "graph";
  theme: "dark";
  toggleSidebar: () => void;
  setExecutionPanel: (panel: UIState["executionPanel"]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  executionPanel: "graph",
  theme: "dark",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setExecutionPanel: (panel) => set({ executionPanel: panel }),
}));
