import type { AgentInstance, AgentConfig, AgentMemory, LogEntry, ToolCall } from "@/types/agent";
import type { AgentStatus } from "@/types/execution";
import { generateId } from "@/lib/utils";
import { loadMemory, saveMemory, buildMemoryContext } from "@/services/memory/memory-service";

export abstract class BaseAgent {
  public instance: AgentInstance;

  constructor(config: AgentConfig) {
    const persisted = loadMemory(config.id);

    this.instance = {
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
      memory: persisted ?? {
        previousTasks: [],
        successfulPatterns: [],
        failures: [],
        preferredStrategies: [],
        recentOutputs: [],
      },
      output: null,
    };
  }

  abstract get systemPrompt(): string;
  abstract get inputSchema(): Record<string, unknown>;
  abstract get outputSchema(): Record<string, unknown>;
  abstract execute(input: unknown): Promise<unknown>;

  get memoryContext(): string {
    return buildMemoryContext(this.instance.memory);
  }

  persistMemory(): void {
    saveMemory(this.instance.config.id, this.instance.memory);
  }

  setStatus(status: AgentStatus): void {
    this.instance.status = status;
  }

  setTask(task: string | null): void {
    this.instance.previousTask = this.instance.currentTask;
    this.instance.currentTask = task;
  }

  addLog(message: string, level: LogEntry["level"] = "info"): void {
    this.instance.logs.push({
      id: generateId(),
      agentId: this.instance.id,
      timestamp: Date.now(),
      level,
      message,
    });
  }

  addReasoning(thought: string): void {
    this.instance.reasoning.push(thought);
  }

  addToolCall(tool: string, input: unknown, output: unknown, status: ToolCall["status"] = "success"): void {
    this.instance.toolCalls.push({
      id: generateId(),
      agentId: this.instance.id,
      tool,
      input,
      output,
      timestamp: Date.now(),
      duration: 0,
      status,
    });
  }

  setConfidence(confidence: number): void {
    this.instance.confidence = Math.max(0, Math.min(1, confidence));
  }

  addCost(cost: number): void {
    this.instance.cost += cost;
  }

  setDuration(duration: number): void {
    this.instance.duration = duration;
  }

  setOutput(output: unknown): void {
    this.instance.output = output;
  }

  updateMemory(memory: Partial<AgentMemory>): void {
    this.instance.memory = { ...this.instance.memory, ...memory };
    this.persistMemory();
  }

  rememberTask(task: string): void {
    this.instance.memory.previousTasks.push(task);
    this.persistMemory();
  }

  rememberSuccess(pattern: string): void {
    this.instance.memory.successfulPatterns.push(pattern);
    this.persistMemory();
  }

  rememberFailure(failure: string): void {
    this.instance.memory.failures.push(failure);
    this.persistMemory();
  }

  rememberOutput(output: unknown): void {
    this.instance.memory.recentOutputs.push(output);
    if (this.instance.memory.recentOutputs.length > 20) {
      this.instance.memory.recentOutputs = this.instance.memory.recentOutputs.slice(-20);
    }
    this.persistMemory();
  }

  getId(): string {
    return this.instance.id;
  }

  getStatus(): AgentStatus {
    return this.instance.status;
  }
}
