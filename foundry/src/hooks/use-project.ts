"use client";

import { useCallback } from "react";
import { useProjectStore } from "@/store/project-store";
import { useAgentStore } from "@/store/agent-store";
import { useExecutionStore } from "@/store/execution-store";
import type { ProjectFormData } from "@/types/project";

export function useProject(projectId?: string) {
  const projectStore = useProjectStore();
  const agentStore = useAgentStore();
  const executionStore = useExecutionStore();

  const project = projectId
    ? projectStore.projects.find((p) => p.id === projectId)
    : projectStore.currentProject;

  const createProject = useCallback(
    (data: ProjectFormData) => {
      const proj = projectStore.addProject(data);
      return proj;
    },
    [projectStore],
  );

  const forgeCompany = useCallback(
    (projectId: string) => {
      projectStore.updateProjectStatus(projectId, "forging");
      return agentStore.initializeDefaultAgents();
    },
    [projectStore, agentStore],
  );

  const reset = useCallback(() => {
    agentStore.resetAgents();
    executionStore.resetExecution();
  }, [agentStore, executionStore]);

  return {
    project,
    projects: projectStore.projects,
    outputs: projectStore.outputs,
    isCreating: projectStore.isCreating,
    createProject,
    forgeCompany,
    setCreating: projectStore.setCreating,
    setCurrentProject: projectStore.setCurrentProject,
    addOutput: projectStore.addOutput,
    reset,
  };
}
