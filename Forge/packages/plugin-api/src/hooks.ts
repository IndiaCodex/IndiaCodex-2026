import type { Blueprint, DeploymentManifest, Network, Project, TestReport } from "@forge/domain";

export interface HookPayloadMap {
  onProjectInit: { readonly project: Project };
  beforeCompile: { readonly project: Project };
  afterCompile: { readonly project: Project; readonly blueprint: Blueprint };
  beforeTest: { readonly project: Project };
  afterTest: { readonly project: Project; readonly report: TestReport };
  beforeDeploy: { readonly project: Project; readonly network: Network };
  afterDeploy: { readonly project: Project; readonly manifest: DeploymentManifest };
  onSdkGenerated: { readonly project: Project };
}

export type HookEvent = keyof HookPayloadMap;

export type HookHandler<E extends HookEvent> = (payload: HookPayloadMap[E]) => void | Promise<void>;
