import type { AgentRole } from "@/types/execution";
import { ALL_SPECIALIST_ROLES } from "@/config/agent-scope";
import { SPECIALIST_AGENTS } from "@/config/agent-scope";

export interface ExecutionDagNode {
  id: string;
  agentRole: AgentRole;
  label: string;
  dependencies: string[];
  phase: string;
}

const LABEL_BY_ROLE = Object.fromEntries(
  SPECIALIST_AGENTS.map((a) => [a.role, a.label]),
) as Record<AgentRole, string>;

const PHASE_BY_ROLE = Object.fromEntries(
  SPECIALIST_AGENTS.map((a) => [a.role, a.phase]),
) as Record<AgentRole, string>;

function nodeId(role: AgentRole): string {
  return `${role}-node`;
}

/** Build a minimal dependency DAG for only the agents needed by this project. */
export function buildExecutionDag(requiredAgents: AgentRole[]): ExecutionDagNode[] {
  const roles = new Set(
    requiredAgents.filter((r) => ALL_SPECIALIST_ROLES.includes(r)),
  );

  if (roles.size === 0) {
    roles.add("research");
    roles.add("architecture");
    roles.add("frontend-engineer");
    roles.add("documentation-engineer");
    roles.add("deployment-engineer");
  }

  const has = (role: AgentRole) => roles.has(role);
  const nodes: ExecutionDagNode[] = [];

  const add = (role: AgentRole, dependencies: AgentRole[]) => {
    if (!has(role)) return;
    nodes.push({
      id: nodeId(role),
      agentRole: role,
      label: LABEL_BY_ROLE[role],
      dependencies: dependencies.filter(has).map(nodeId),
      phase: PHASE_BY_ROLE[role],
    });
  };

  add("research", []);
  add("architecture", ["research"]);
  add("contract-engineer", ["architecture"]);
  add("frontend-engineer", ["architecture"]);

  if (has("security-engineer")) {
    add("security-engineer", has("contract-engineer") ? ["contract-engineer"] : ["architecture"]);
  }

  if (has("qa-engineer")) {
    const qaDeps: AgentRole[] = [];
    if (has("contract-engineer")) qaDeps.push("contract-engineer");
    if (has("frontend-engineer")) qaDeps.push("frontend-engineer");
    if (qaDeps.length === 0) qaDeps.push("architecture");
    add("qa-engineer", qaDeps);
  }

  if (has("documentation-engineer")) {
    const docDeps: AgentRole[] = [];
    if (has("qa-engineer")) docDeps.push("qa-engineer");
    else if (has("security-engineer")) docDeps.push("security-engineer");
    else if (has("frontend-engineer")) docDeps.push("frontend-engineer");
    else if (has("contract-engineer")) docDeps.push("contract-engineer");
    else docDeps.push("architecture");
    add("documentation-engineer", docDeps);
  }

  if (has("deployment-engineer")) {
    add(
      "deployment-engineer",
      has("documentation-engineer") ? ["documentation-engineer"] : ["architecture"],
    );
  }

  return nodes;
}

export function estimateExecutionMinutes(agentCount: number): number {
  return Math.max(2, Math.round(agentCount * 1.5));
}