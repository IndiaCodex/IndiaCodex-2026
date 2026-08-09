import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgentRole } from "@/types/execution";
import type { Project, ProjectFormData, ProjectOutput } from "@/types/project";
import { generateId } from "@/lib/utils";

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  outputs: ProjectOutput[];
  isCreating: boolean;
  setCurrentProject: (project: Project | null) => void;
  addProject: (data: ProjectFormData) => Project;
  updateProjectStatus: (id: string, status: Project["status"]) => void;
  addOutput: (output: ProjectOutput) => void;
  setCreating: (creating: boolean) => void;
  getProject: (id: string) => Project | undefined;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      outputs: [],
      isCreating: false,

      setCurrentProject: (project) => set({ currentProject: project }),

      addProject: (data) => {
        const scope = data.scopeAnalysis;
        const project: Project = {
          id: generateId(),
          name: data.name,
          description: data.description,
          targetChain: data.targetChain,
          complexity: scope?.complexity ?? "moderate",
          goal: data.goal,
          features: scope?.detectedCapabilities ?? [],
          scopeAnalysis: scope,
          requiredAgents: (scope?.requiredAgents ?? []) as AgentRole[],
          status: "draft",
          companyId: null,
          summary: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ projects: [...s.projects, project], currentProject: project }));
        return project;
      },

      updateProjectStatus: (id, status) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, status, updatedAt: Date.now() } : p,
          ),
          currentProject:
            s.currentProject?.id === id
              ? { ...s.currentProject, status, updatedAt: Date.now() }
              : s.currentProject,
        })),

      addOutput: (output) =>
        set((s) => ({ outputs: [...s.outputs, output] })),

      setCreating: (creating) => set({ isCreating: creating }),

      getProject: (id) => get().projects.find((p) => p.id === id),
    }),
    {
      name: "foundry-projects",
      partialize: (state) => ({
        projects: state.projects,
        outputs: state.outputs,
        currentProject: state.currentProject,
      }),
    },
  ),
);