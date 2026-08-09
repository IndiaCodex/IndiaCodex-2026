import { z } from "zod";

export const AgentStatusSchema = z.enum([
  "idle",
  "waiting",
  "planning",
  "researching",
  "working",
  "reviewing",
  "completed",
  "failed",
]);

export const AgentRoleSchema = z.enum([
  "ceo",
  "research",
  "architecture",
  "contract-engineer",
  "frontend-engineer",
  "security-engineer",
  "qa-engineer",
  "documentation-engineer",
  "deployment-engineer",
]);

export const LogEntrySchema = z.object({
  id: z.string(),
  agentId: z.string(),
  timestamp: z.number(),
  level: z.enum(["info", "warn", "error", "debug"]),
  message: z.string(),
});

export const ToolCallSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  tool: z.string(),
  input: z.unknown(),
  output: z.unknown(),
  timestamp: z.number(),
  duration: z.number(),
  status: z.enum(["pending", "success", "error"]),
});

export const AgentMemorySchema = z.object({
  previousTasks: z.array(z.string()),
  successfulPatterns: z.array(z.string()),
  failures: z.array(z.string()),
  preferredStrategies: z.array(z.string()),
  recentOutputs: z.array(z.unknown()),
});

export const AgentInstanceSchema = z.object({
  id: z.string(),
  config: z.object({
    id: z.string(),
    name: z.string(),
    role: AgentRoleSchema,
    avatar: z.string(),
    description: z.string(),
    systemPrompt: z.string(),
    model: z.string(),
    temperature: z.number(),
    maxTokens: z.number(),
    fee: z.number(),
    capabilities: z.array(z.string()),
    contextWindow: z.number(),
  }),
  status: AgentStatusSchema,
  currentTask: z.string().nullable(),
  previousTask: z.string().nullable(),
  logs: z.array(LogEntrySchema),
  toolCalls: z.array(ToolCallSchema),
  reasoning: z.array(z.string()),
  confidence: z.number(),
  duration: z.number(),
  cost: z.number(),
  memory: AgentMemorySchema,
  output: z.unknown().nullable(),
});

export const ResearchOutputSchema = z.object({
  summary: z.string(),
  keyFindings: z.array(z.string()),
  technologies: z.array(z.string()),
  risks: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export const ArchitectureOutputSchema = z.object({
  overview: z.string(),
  components: z.array(z.object({
    name: z.string(),
    description: z.string(),
    technology: z.string(),
    dependencies: z.array(z.string()),
  })),
  dataFlow: z.array(z.string()),
  folderStructure: z.array(z.string()),
});

export const ContractOutputSchema = z.object({
  contracts: z.array(z.object({
    name: z.string(),
    language: z.string(),
    code: z.string(),
    tests: z.string(),
    description: z.string(),
  })),
  validationRules: z.array(z.string()),
  deploymentPlan: z.string(),
});

export const FrontendOutputSchema = z.object({
  scaffold: z.string(),
  components: z.array(z.string()),
  pages: z.array(z.string()),
  apiRoutes: z.array(z.string()),
  styling: z.string(),
  dependencies: z.array(z.string()),
});

export const SecurityOutputSchema = z.object({
  vulnerabilities: z.array(z.object({
    severity: z.enum(["critical", "high", "medium", "low"]),
    description: z.string(),
    recommendation: z.string(),
  })),
  auditSummary: z.string(),
  score: z.number(),
});

export const QaOutputSchema = z.object({
  testPlan: z.array(z.string()),
  testCases: z.array(z.string()),
  coverage: z.number(),
  recommendations: z.array(z.string()),
});

export const DocumentationOutputSchema = z.object({
  readme: z.string(),
  technicalDocs: z.string(),
  apiDocs: z.string(),
  deploymentGuide: z.string(),
  developerNotes: z.string(),
  catalystProposal: z.string(),
});

export const DeploymentOutputSchema = z.object({
  checklist: z.array(z.string()),
  steps: z.array(z.object({
    order: z.number(),
    name: z.string(),
    description: z.string(),
    command: z.string().optional(),
  })),
  configuration: z.record(z.string(), z.unknown()),
  verificationSteps: z.array(z.string()),
});
