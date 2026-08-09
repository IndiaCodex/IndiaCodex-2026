export interface AgentOutputMap {
  research: {
    summary: string;
    keyFindings: string[];
    technologies: string[];
    risks: string[];
    recommendations: string[];
  };
  architecture: {
    overview: string;
    components: Array<{
      name: string;
      description: string;
      technology: string;
      dependencies: string[];
    }>;
    dataFlow: string[];
    folderStructure: string[];
  };
  "contract-engineer": {
    contracts: Array<{
      name: string;
      language: string;
      code: string;
      tests: string;
      description: string;
    }>;
    validationRules: string[];
    deploymentPlan: string;
  };
  "frontend-engineer": {
    scaffold: string;
    components: string[];
    pages: string[];
    apiRoutes: string[];
    styling: string;
    dependencies: string[];
  };
  "security-engineer": {
    vulnerabilities: Array<{
      severity: "critical" | "high" | "medium" | "low";
      description: string;
      recommendation: string;
    }>;
    auditSummary: string;
    score: number;
  };
  "qa-engineer": {
    testPlan: string[];
    testCases: string[];
    coverage: number;
    recommendations: string[];
  };
  "documentation-engineer": {
    readme: string;
    technicalDocs: string;
    apiDocs: string;
    deploymentGuide: string;
    developerNotes: string;
    catalystProposal: string;
  };
  "deployment-engineer": {
    checklist: string[];
    steps: Array<{
      order: number;
      name: string;
      description: string;
      command?: string;
    }>;
    configuration: Record<string, unknown>;
    verificationSteps: string[];
  };
  ceo: {
    projectSummary: string;
    architecture: string;
    folderStructure: string;
    contractsSummary: string;
    frontendSummary: string;
    securitySummary: string;
    qaSummary: string;
    documentationSummary: string;
    deploymentSummary: string;
  };
}
