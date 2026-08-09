import type { WorkflowDefinition, WorkflowNodeDef } from "@/types/workflow";
import type { AgentRole } from "@/types/execution";
import { COMPANY_WORKFLOW_ID } from "./types";
import { AGENT_CONFIGS } from "@/config/agents";

const createNodeDef = (role: string, deps: string[], phase: string): WorkflowNodeDef => {
  const config = AGENT_CONFIGS.find((c) => c.role === role);
  return {
    id: `${role}-node`,
    agentRole: role as AgentRole,
    label: config?.name || role,
    description: config?.description || "",
    phase,
    dependencies: deps,
    inputSchema: {},
    outputSchema: {},
    systemPrompt: config?.systemPrompt || "",
    model: config?.model || "gpt-4o-mini",
    temperature: config?.temperature || 0.7,
    maxTokens: config?.maxTokens || 4096,
  };
};

export const companyWorkflow: WorkflowDefinition = {
  id: COMPANY_WORKFLOW_ID,
  name: "Company Workflow v1",
  description: "Standard autonomous software company execution workflow",
  nodes: [
    createNodeDef("research", [], "research"),
    createNodeDef("architecture", ["research-node"], "architecture"),
    createNodeDef("contract-engineer", ["architecture-node"], "contracts"),
    createNodeDef("frontend-engineer", ["architecture-node"], "frontend"),
    createNodeDef("security-engineer", ["contract-engineer-node"], "security"),
    createNodeDef("qa-engineer", ["contract-engineer-node", "frontend-engineer-node"], "testing"),
    createNodeDef("documentation-engineer", ["qa-engineer-node"], "documentation"),
    createNodeDef("deployment-engineer", ["documentation-engineer-node"], "deployment"),
  ],
  edges: [
    { id: "e1", source: "research-node", target: "architecture-node" },
    { id: "e2", source: "architecture-node", target: "contract-engineer-node" },
    { id: "e3", source: "architecture-node", target: "frontend-engineer-node" },
    { id: "e4", source: "contract-engineer-node", target: "security-engineer-node" },
    { id: "e5", source: "contract-engineer-node", target: "qa-engineer-node" },
    { id: "e6", source: "frontend-engineer-node", target: "qa-engineer-node" },
    { id: "e7", source: "qa-engineer-node", target: "documentation-engineer-node" },
    { id: "e8", source: "documentation-engineer-node", target: "deployment-engineer-node" },
  ],
};
