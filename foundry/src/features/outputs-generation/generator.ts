import type { ProjectOutput } from "@/types/project";
import type { AgentRole } from "@/types/execution";
import type { AgentOutputMap } from "@/schemas/output-schemas";
import { generateId } from "@/lib/utils";

function makeOutput(
  projectId: string,
  sourceAgentRole: ProjectOutput["sourceAgentRole"],
  type: string,
  title: string,
  content: string,
  mimeType = "text/markdown",
): ProjectOutput {
  return {
    id: generateId(),
    projectId,
    sourceAgentRole,
    type,
    title,
    content,
    mimeType,
    createdAt: Date.now(),
  };
}

function codeBlock(lang: string, code: string): string {
  return `\`\`\`${lang}\n${code}\n\`\`\``;
}

export function deriveOutputsForAgent(
  projectId: string,
  projectName: string,
  agentRole: AgentRole,
  output: unknown,
): ProjectOutput[] {
  if (!output) return [];
  return generateOutputs(projectId, projectName, { [agentRole]: output });
}

export function generateOutputs(
  projectId: string,
  projectName: string,
  agentOutputs: Record<string, unknown>,
): ProjectOutput[] {
  const outputs: ProjectOutput[] = [];
  const o = agentOutputs as unknown as AgentOutputMap;

  if (o.research) {
    const r = o.research;
    outputs.push(
      makeOutput(
        projectId,
        "research",
        "readme",
        `${projectName} — Research Summary`,
        [
          `# ${projectName} — Research Summary`,
          "",
          r.summary,
          "",
          "## Key Findings",
          ...r.keyFindings.map((f) => `- ${f}`),
          "",
          "## Technologies Identified",
          ...r.technologies.map((t) => `- ${t}`),
          "",
          "## Risks",
          ...r.risks.map((r_) => `- ${r_}`),
          "",
          "## Recommendations",
          ...r.recommendations.map((r_) => `- ${r_}`),
        ].join("\n"),
      ),
    );
  }

  if (o.architecture) {
    const a = o.architecture;
    outputs.push(
      makeOutput(
        projectId,
        "architecture",
        "architecture",
        `${projectName} — Architecture Overview`,
        [
          `# ${projectName} — Architecture`,
          "",
          a.overview,
          "",
          "## Components",
          ...a.components.map(
            (c) => `### ${c.name}\n${c.description}\n- Technology: ${c.technology}\n- Dependencies: ${c.dependencies.join(", ")}`,
          ),
          "",
          "## Data Flow",
          ...a.dataFlow.map((f) => `- ${f}`),
          "",
          "## Folder Structure",
          codeBlock("", a.folderStructure.join("\n")),
        ].join("\n"),
      ),
    );
  }

  if (o["contract-engineer"]) {
    const ce = o["contract-engineer"];
    for (const contract of ce.contracts) {
      outputs.push(
        makeOutput(
          projectId,
          "contract-engineer",
          "contract",
          `${contract.name}.${contract.language === "aiken" ? "ak" : contract.language}`,
          [
            `# ${contract.name}`,
            "",
            contract.description,
            "",
            codeBlock(contract.language, contract.code),
            "",
            "## Tests",
            codeBlock(contract.language, contract.tests),
          ].join("\n"),
          "text/x-aiken",
        ),
      );
    }
    outputs.push(
      makeOutput(
        projectId,
        "contract-engineer",
        "contract",
        `${projectName} — Validation & Deployment`,
        [
          "## Validation Rules",
          ...ce.validationRules.map((r) => `- ${r}`),
          "",
          "## Deployment Plan",
          ce.deploymentPlan,
        ].join("\n"),
      ),
    );
  }

  if (o["frontend-engineer"]) {
    const fe = o["frontend-engineer"];
    outputs.push(
      makeOutput(projectId, "frontend-engineer", "frontend", `${projectName} — Frontend Scaffold`, [
        `# ${projectName} — Frontend`,
        "",
        codeBlock("", fe.scaffold),
        "",
        "## Components",
        ...fe.components.map((c) => `- ${c}`),
        "",
        "## Pages",
        ...fe.pages.map((p) => `- ${p}`),
        "",
        "## API Routes",
        ...fe.apiRoutes.map((r) => `- ${r}`),
        "",
        `## Styling\n${fe.styling}`,
        "",
        "## Dependencies",
        ...fe.dependencies.map((d) => `- ${d}`),
      ].join("\n")),
    );
  }

  if (o["security-engineer"]) {
    const se = o["security-engineer"];
    outputs.push(
      makeOutput(
        projectId,
        "security-engineer",
        "security",
        `${projectName} — Security Audit`,
        [
          `# ${projectName} — Security Audit`,
          "",
          `**Overall Score:** ${se.score}/100`,
          "",
          "## Vulnerabilities",
          ...se.vulnerabilities.map(
            (v) => `### [${v.severity.toUpperCase()}] ${v.description}\n\n${v.recommendation}`,
          ),
          "",
          "## Summary",
          se.auditSummary,
        ].join("\n"),
      ),
    );
  }

  if (o["qa-engineer"]) {
    const qa = o["qa-engineer"];
    outputs.push(
      makeOutput(
        projectId,
        "qa-engineer",
        "docs",
        `${projectName} — QA Test Plan`,
        [
          `# ${projectName} — Test Plan`,
          "",
          `**Coverage Target:** ${qa.coverage}%`,
          "",
          "## Test Plan",
          ...qa.testPlan.map((t) => `- ${t}`),
          "",
          "## Test Cases",
          ...qa.testCases.map((t) => `- ${t}`),
          "",
          "## Recommendations",
          ...qa.recommendations.map((r) => `- ${r}`),
        ].join("\n"),
      ),
    );
  }

  if (o["documentation-engineer"]) {
    const de = o["documentation-engineer"];
    outputs.push(makeOutput(projectId, "documentation-engineer", "readme", "README.md", de.readme));
    outputs.push(
      makeOutput(projectId, "documentation-engineer", "docs", "Technical Documentation", de.technicalDocs),
    );
    outputs.push(
      makeOutput(projectId, "documentation-engineer", "docs", "API Documentation", de.apiDocs),
    );
    outputs.push(
      makeOutput(projectId, "documentation-engineer", "deployment", "Deployment Guide", de.deploymentGuide),
    );
    outputs.push(
      makeOutput(projectId, "documentation-engineer", "docs", "Developer Notes", de.developerNotes),
    );
    outputs.push(
      makeOutput(projectId, "documentation-engineer", "catalyst", "Catalyst Proposal", de.catalystProposal),
    );
  }

  if (o["deployment-engineer"]) {
    const dple = o["deployment-engineer"];
    outputs.push(
      makeOutput(projectId, "deployment-engineer", "deployment", `${projectName} — Deployment Plan`, [
        `# ${projectName} — Deployment Plan`,
        "",
        "## Checklist",
        ...dple.checklist.map((c) => `- [ ] ${c}`),
        "",
        "## Steps",
        ...dple.steps.map(
          (s) => `### ${s.order}. ${s.name}\n\n${s.description}\n${s.command ? codeBlock("bash", s.command) : ""}`,
        ),
        "",
        "## Configuration",
        codeBlock("json", JSON.stringify(dple.configuration, null, 2)),
        "",
        "## Verification",
        ...dple.verificationSteps.map((v) => `- ${v}`),
      ].join("\n")),
    );
  }

  if (o.ceo) {
    const ceo = o.ceo;
    outputs.push(
      makeOutput(
        projectId,
        "ceo",
        "docs",
        `${projectName} — Project Summary`,
        [
          `# ${projectName} — Project Summary`,
          "",
          "## Overview",
          ceo.projectSummary,
          "",
          "## Architecture",
          ceo.architecture,
          "",
          "## Folder Structure",
          codeBlock("", ceo.folderStructure),
          "",
          "## Smart Contracts",
          ceo.contractsSummary,
          "",
          "## Frontend",
          ceo.frontendSummary,
          "",
          "## Security",
          ceo.securitySummary,
          "",
          "## Quality Assurance",
          ceo.qaSummary,
          "",
          "## Documentation",
          ceo.documentationSummary,
          "",
          "## Deployment",
          ceo.deploymentSummary,
        ].join("\n"),
      ),
    );
  }

  return outputs;
}
