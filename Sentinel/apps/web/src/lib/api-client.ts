import type {
  WireApiErrorBody,
  WireAuditExport,
  WireExecution,
  WireExecutionArtifact,
  WireExplainabilityReport,
  WireReplaySession,
} from "./wire-types.js";

export function getApiBaseUrl(): string {
  return (
    (import.meta.env["VITE_SENTINEL_API_URL"] as string | undefined) ?? "http://localhost:4000"
  );
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, init);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as WireApiErrorBody | null;
    throw new ApiError(
      response.status,
      body?.error.code ?? "UNKNOWN",
      body?.error.message ?? response.statusText,
    );
  }
  return response.json() as Promise<T>;
}

export interface ListExecutionsParams {
  readonly workflowId?: string;
  readonly limit?: number;
}

export function listExecutions(params: ListExecutionsParams = {}): Promise<WireExecution[]> {
  const search = new URLSearchParams();
  if (params.workflowId) search.set("workflowId", params.workflowId);
  search.set("limit", String(params.limit ?? 100));
  return request(`/executions?${search.toString()}`);
}

export function getExecution(executionId: string): Promise<WireExecution> {
  return request(`/executions/${executionId}`);
}

export function getExecutionArtifact(executionId: string): Promise<WireExecutionArtifact> {
  return request(`/executions/${executionId}/artifact`);
}

export function replayExecution(executionId: string): Promise<WireReplaySession> {
  return request(`/executions/${executionId}/replay`, { method: "POST" });
}

export function explainExecution(executionId: string): Promise<WireExplainabilityReport> {
  return request(`/executions/${executionId}/explain`);
}

export function fetchAuditExport(executionId: string): Promise<WireAuditExport> {
  return request(`/executions/${executionId}/export`);
}

export function getAuditExportDownloadUrl(executionId: string): string {
  return `${getApiBaseUrl()}/executions/${executionId}/export`;
}
