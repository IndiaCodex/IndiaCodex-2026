import { CEOAgent } from "@/agents/ceo-agent";
import { ResearchAgent } from "@/agents/research-agent";
import { ArchitectureAgent } from "@/agents/architecture-agent";
import { ContractEngineer } from "@/agents/contract-engineer";
import { FrontendEngineer } from "@/agents/frontend-engineer";
import { SecurityEngineer } from "@/agents/security-engineer";
import { QAEngineer } from "@/agents/qa-engineer";
import { DocumentationEngineer } from "@/agents/documentation-engineer";
import { DeploymentEngineer } from "@/agents/deployment-engineer";
import type { BaseAgent } from "@/agents/base-agent";
import type { LogEntry } from "@/types/agent";
import type { ProjectContext } from "@/types/workflow";
import { MasumiAdapter } from "@/services/masumi/masumi-adapter";
import { buildMasumiMetadata } from "@/services/masumi/masumi-utils";
import { generateOutputs } from "@/features/outputs-generation/generator";
import {
  MASUMI_MOCK,
  MASUMI_REGISTRY_API_URL,
  MASUMI_PAYMENT_API_URL,
  MASUMI_API_KEY,
  AGENT_EXECUTION_DELAY,
} from "@/lib/constants";
import { buildExecutionDag } from "@/services/execution-plan";
import type { AgentRole } from "@/types/execution";
import { delay } from "@/lib/utils";

export type ExecutionEventType =
  | "execution:start"
  | "agent:status"
  | "agent:log"
  | "agent:reasoning"
  | "agent:tool_call"
  | "agent:confidence"
  | "agent:cost"
  | "agent:duration"
  | "agent:output"
  | "dag:generated"
  | "phase:change"
  | "execution:progress"
  | "execution:complete"
  | "execution:error"
  | "outputs:generated";

export interface ExecutionEvent {
  type: ExecutionEventType;
  agentId?: string;
  agentRole?: string;
  nodeId?: string;
  timestamp: number;
  data?: unknown;
}

type EventCallback = (event: ExecutionEvent) => void;

export class ExecutionController {
  private agents: Map<string, BaseAgent> = new Map();
  private listeners: Set<EventCallback> = new Set();
  private projectContext: ProjectContext | null = null;
  private dag: Array<{ id: string; agentRole: string; label: string; dependencies: string[]; phase: string }> = [];
  private completedNodes: Set<string> = new Set();
  private totalNodes = 0;
  private masumi: MasumiAdapter;
  private walletAddress: string | null;

  constructor(walletAddress?: string | null) {
    this.masumi = new MasumiAdapter({
      registryApiUrl: MASUMI_REGISTRY_API_URL,
      paymentApiUrl: MASUMI_PAYMENT_API_URL,
      apiKey: MASUMI_API_KEY || undefined,
      mockMode: MASUMI_MOCK,
      network: "preprod",
    });
    this.walletAddress = walletAddress ?? null;
  }

  on(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(event: ExecutionEvent): void {
    this.listeners.forEach((cb) => cb(event));
  }

  async execute(projectContext: ProjectContext): Promise<void> {
    this.projectContext = projectContext;
    this.emit({ type: "execution:start", timestamp: Date.now(), data: projectContext });

    try {
      await this.registerAllAgents();
      await this.runCEO();
      const agentOutputs = await this.runSpecialists();
      const outputs = generateOutputs(
        this.projectContext!.id,
        this.projectContext!.name,
        agentOutputs,
      );
      this.emit({
        type: "outputs:generated",
        timestamp: Date.now(),
        data: { outputs, agentOutputs },
      });
      this.emit({ type: "execution:complete", timestamp: Date.now() });
    } catch (error) {
      this.emit({
        type: "execution:error",
        timestamp: Date.now(),
        data: { message: error instanceof Error ? error.message : "Unknown error" },
      });
    }
  }

  private async registerAllAgents(): Promise<void> {
    const roleToClass: Record<string, new () => BaseAgent> = {
      ceo: CEOAgent,
      research: ResearchAgent,
      architecture: ArchitectureAgent,
      "contract-engineer": ContractEngineer,
      "frontend-engineer": FrontendEngineer,
      "security-engineer": SecurityEngineer,
      "qa-engineer": QAEngineer,
      "documentation-engineer": DocumentationEngineer,
      "deployment-engineer": DeploymentEngineer,
    };

    const rolesToRegister = new Set<string>(["ceo"]);
    for (const role of this.projectContext?.requiredAgents ?? []) {
      rolesToRegister.add(role);
    }
    if (rolesToRegister.size === 1) {
      for (const role of Object.keys(roleToClass)) rolesToRegister.add(role);
    }

    const agentConfigs = [...rolesToRegister]
      .map((role) => roleToClass[role])
      .filter((AgentClass): AgentClass is new () => BaseAgent => Boolean(AgentClass));

    await Promise.allSettled(
      agentConfigs.map(async (AgentClass) => {
        try {
          const agent = new AgentClass();
          const metadata = buildMasumiMetadata(agent.instance.config);
          const result = await this.masumi.registerAgent(
            agent.instance.masumiIdentity,
            metadata,
          );
          agent.instance.masumiIdentity = {
            ...agent.instance.masumiIdentity,
            ...result,
          };
          this.emit({
            type: "agent:log",
            agentRole: agent.instance.config.role,
            timestamp: Date.now(),
            data: {
              message: result.registered
                ? `Registered on Masumi (tx: ${result.registrationTxHash})`
                : "Masumi registration skipped (mock mode)",
              level: "info",
            },
          });
        } catch {
          // Registration failure is non-fatal — execution continues
        }
      }),
    );
  }

  private async runCEO(): Promise<void> {
    const ceo = new CEOAgent();
    this.agents.set("ceo", ceo);

    const hasPreAnalyzedScope = Boolean(this.projectContext!.requiredAgents?.length);
    const ceoDelay = hasPreAnalyzedScope ? 200 : 600;

    await delay(ceoDelay);
    this.emitAgentEvent("ceo", "agent:status", ceo.getId(), "ceo", "planning");
    ceo.addLog("CEO initializing autonomous software company...");
    this.emitAgentLog("ceo", "CEO initializing autonomous software company...");

    await delay(hasPreAnalyzedScope ? 300 : 800);
    const input = {
      projectName: this.projectContext!.name,
      description: this.projectContext!.description,
      goal: this.projectContext!.goal,
      features: this.projectContext!.features,
      complexity: this.projectContext!.complexity,
      requiredAgents: this.projectContext!.requiredAgents,
      scopeSummary: this.projectContext!.scopeSummary,
    };

    const output = await ceo.execute(input);

    this.dag =
      output.dynamicDag?.length
        ? output.dynamicDag
        : buildExecutionDag(this.projectContext!.requiredAgents as AgentRole[]);
    this.totalNodes = this.dag.length;

    this.emit({
      type: "dag:generated",
      timestamp: Date.now(),
      data: { dag: this.dag },
    });

    await delay(hasPreAnalyzedScope ? 150 : 500);
    this.emitAgentEvent("ceo", "agent:status", ceo.getId(), "ceo", "completed");
    this.emitAgentEvent("ceo", "agent:output", ceo.getId(), "ceo", output);
    this.emitAgentEvent("ceo", "agent:confidence", ceo.getId(), "ceo", ceo.instance.confidence);
    this.emitAgentEvent("ceo", "agent:duration", ceo.getId(), "ceo", ceo.instance.duration);
    this.emitAgentEvent("ceo", "agent:cost", ceo.getId(), "ceo", ceo.instance.cost);
    this.emitAgentLog("ceo", "CEO finished. DAG ready. Delegating to specialists.");

    this.emit({
      type: "execution:progress",
      timestamp: Date.now(),
      data: { completed: 0, total: this.totalNodes },
    });
  }

  private async runSpecialists(): Promise<Record<string, unknown>> {
    const agentMap: Record<string, new () => BaseAgent> = {
      research: ResearchAgent,
      architecture: ArchitectureAgent,
      "contract-engineer": ContractEngineer,
      "frontend-engineer": FrontendEngineer,
      "security-engineer": SecurityEngineer,
      "qa-engineer": QAEngineer,
      "documentation-engineer": DocumentationEngineer,
      "deployment-engineer": DeploymentEngineer,
    };

    const outputs: Record<string, unknown> = {};
    const remaining = new Set(this.dag.map((n) => n.id));

    while (remaining.size > 0) {
      const ready = this.dag.filter(
        (node) =>
          remaining.has(node.id) &&
          node.dependencies.every((dep) => !remaining.has(dep)),
      );

      if (ready.length === 0) {
        this.emit({
          type: "execution:error",
          timestamp: Date.now(),
          data: { message: "Deadlock detected in execution DAG" },
        });
        break;
      }

      await Promise.all(
        ready.map((nodeDef) => this.runSpecialistNode(nodeDef, agentMap, outputs, remaining)),
      );

      this.emit({
        type: "execution:progress",
        timestamp: Date.now(),
        data: { completed: this.completedNodes.size, total: this.totalNodes },
      });
    }

    return outputs;
  }

  private emitAgentEvent(
    role: string,
    eventType: ExecutionEventType,
    agentId: string,
    agentRole: string,
    data?: unknown,
    nodeId?: string,
  ): void {
    this.emit({
      type: eventType,
      agentId,
      agentRole,
      nodeId,
      timestamp: Date.now(),
      data,
    });
  }

  private emitAgentLog(role: string, message: string): void {
    this.emit({
      type: "agent:log",
      agentRole: role,
      timestamp: Date.now(),
      data: { message, level: "info" },
    });
  }

  private async runSpecialistNode(
    nodeDef: (typeof this.dag)[number],
    agentMap: Record<string, new () => BaseAgent>,
    outputs: Record<string, unknown>,
    remaining: Set<string>,
  ): Promise<void> {
    const AgentClass = agentMap[nodeDef.agentRole];
    if (!AgentClass) return;

    const agent = new AgentClass();
    this.agents.set(nodeDef.agentRole, agent);

    await delay(AGENT_EXECUTION_DELAY);

    this.emit({
      type: "phase:change",
      timestamp: Date.now(),
      data: { phase: nodeDef.phase, nodeId: nodeDef.id },
    });

    this.emitAgentEvent(
      nodeDef.agentRole,
      "agent:status",
      agent.getId(),
      nodeDef.agentRole,
      "working",
      nodeDef.id,
    );

    for (const depId of nodeDef.dependencies) {
      const edgeId = `${nodeDef.id}-edge-${depId}`;
      this.emit({
        type: "execution:progress",
        timestamp: Date.now(),
        data: { edgeUpdate: { id: edgeId, status: "active" } },
      });
    }

    agent.rememberTask(nodeDef.label);
    agent.addLog(`Starting ${nodeDef.label}...`);
    this.emitAgentLog(nodeDef.agentRole, `Starting ${nodeDef.label}...`);

    const input = {
      projectContext: this.projectContext,
      previousOutputs: outputs,
      [nodeDef.agentRole]: nodeDef,
      walletAddress: this.walletAddress,
    };

    const originalAddLog = agent.addLog.bind(agent);
    agent.addLog = (message: string, level?: LogEntry["level"]) => {
      originalAddLog(message, level);
      this.emitAgentLog(nodeDef.agentRole, message);
    };

    const originalAddReasoning = agent.addReasoning.bind(agent);
    agent.addReasoning = (thought: string) => {
      originalAddReasoning(thought);
      this.emit({
        type: "agent:reasoning",
        agentId: agent.getId(),
        agentRole: nodeDef.agentRole,
        nodeId: nodeDef.id,
        timestamp: Date.now(),
        data: { thought },
      });
    };

    const result = await agent.execute(input);
    outputs[nodeDef.agentRole] = result;

    agent.setOutput(result);
    agent.rememberOutput(result);
    if (agent.instance.confidence >= 0.7) {
      agent.rememberSuccess(`${nodeDef.label} completed with high confidence`);
    }

    this.emitAgentEvent(
      nodeDef.agentRole,
      "agent:status",
      agent.getId(),
      nodeDef.agentRole,
      "completed",
      nodeDef.id,
    );

    for (const depId of nodeDef.dependencies) {
      const edgeId = `${nodeDef.id}-edge-${depId}`;
      this.emit({
        type: "execution:progress",
        timestamp: Date.now(),
        data: { edgeUpdate: { id: edgeId, status: "completed" } },
      });
    }

    this.emitAgentEvent(nodeDef.agentRole, "agent:confidence", agent.getId(), nodeDef.agentRole, agent.instance.confidence);
    this.emitAgentEvent(nodeDef.agentRole, "agent:cost", agent.getId(), nodeDef.agentRole, agent.instance.cost);
    this.emitAgentEvent(nodeDef.agentRole, "agent:duration", agent.getId(), nodeDef.agentRole, agent.instance.duration);
    this.emitAgentEvent(nodeDef.agentRole, "agent:output", agent.getId(), nodeDef.agentRole, result);

    remaining.delete(nodeDef.id);
    this.completedNodes.add(nodeDef.id);
  }
}
