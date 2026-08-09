import { z } from "zod";

export const ProjectScopeAnalysisSchema = z.object({
  complexity: z.enum(["simple", "moderate", "complex"]),
  summary: z.string(),
  detectedCapabilities: z.array(z.string()),
  requiredAgents: z.array(z.string()),
  reasoning: z.string(),
  analyzedAt: z.number(),
});

export const ProjectFormSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  targetChain: z.enum(["cardano"]),
  goal: z.string().min(10, "Goal must be at least 10 characters").max(500),
  scopeAnalysis: ProjectScopeAnalysisSchema.nullable(),
});

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  targetChain: z.enum(["cardano"]),
  complexity: z.enum(["simple", "moderate", "complex"]),
  goal: z.string(),
  features: z.array(z.string()),
  scopeAnalysis: ProjectScopeAnalysisSchema.nullable(),
  requiredAgents: z.array(z.string()),
  status: z.enum(["draft", "forging", "executing", "completed", "failed"]),
  companyId: z.string().nullable(),
  summary: z.unknown().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ProjectOutputSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  type: z.string(),
  title: z.string(),
  content: z.string(),
  mimeType: z.string(),
  createdAt: z.number(),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(20),
  targetChain: z.enum(["cardano"]),
  goal: z.string().min(10),
  scopeAnalysis: ProjectScopeAnalysisSchema,
});

/** @deprecated Manual feature picker removed — capabilities are AI-detected */
export const FeatureOptions = [
  "Smart Contracts",
  "NFT Minting",
  "Token Vesting",
  "DAO Governance",
  "Staking Pool",
  "DEX Integration",
  "Wallet Connection",
  "Multi-sig Wallet",
  "Oracle Integration",
  "IPFS Storage",
  "Identity System",
  "Payment Splitter",
  "Time-lock Vault",
  "Council Voting",
  "Subscription Manager",
] as const;