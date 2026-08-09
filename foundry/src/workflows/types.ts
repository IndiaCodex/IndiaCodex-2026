import type { WorkflowDefinition, WorkflowNodeDef, WorkflowEdgeDef } from "@/types/workflow";

export { type WorkflowDefinition, type WorkflowNodeDef, type WorkflowEdgeDef };

export const COMPANY_WORKFLOW_ID = "company-workflow-v1";

export const WORKFLOW_NODE_ORDER = [
  "research",
  "architecture",
  "contract-engineer",
  "frontend-engineer",
  "security-engineer",
  "qa-engineer",
  "documentation-engineer",
  "deployment-engineer",
] as const;
