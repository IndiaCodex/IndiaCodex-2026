import type { AgentMemory } from "@/types/agent";

const MEMORY_KEY_PREFIX = "foundry_memory_";

export function loadMemory(agentId: string): AgentMemory | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${MEMORY_KEY_PREFIX}${agentId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveMemory(agentId: string, memory: AgentMemory): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${MEMORY_KEY_PREFIX}${agentId}`, JSON.stringify(memory));
  } catch {
    console.warn(`Failed to persist memory for agent ${agentId}`);
  }
}

export function buildMemoryContext(memory: AgentMemory): string {
  const parts: string[] = [];

  if (memory.previousTasks.length > 0) {
    parts.push(
      "Previous tasks completed:",
      ...memory.previousTasks.map((t) => `- ${t}`),
      "",
    );
  }

  if (memory.successfulPatterns.length > 0) {
    parts.push(
      "Patterns that worked well:",
      ...memory.successfulPatterns.map((p) => `- ${p}`),
      "",
    );
  }

  if (memory.failures.length > 0) {
    parts.push(
      "Past failures to avoid:",
      ...memory.failures.map((f) => `- ${f}`),
      "",
    );
  }

  if (memory.preferredStrategies.length > 0) {
    parts.push(
      "Preferred strategies:",
      ...memory.preferredStrategies.map((s) => `- ${s}`),
      "",
    );
  }

  return parts.join("\n");
}

export function extractPatterns(memory: AgentMemory): {
  recentTasks: string;
  successRate: number;
  commonFailures: string[];
} {
  const total = memory.previousTasks.length;
  const fails = memory.failures.length;
  return {
    recentTasks: memory.previousTasks.slice(-3).join(", "),
    successRate: total > 0 ? ((total - fails) / total) * 100 : 100,
    commonFailures: [...new Set(memory.failures)],
  };
}
