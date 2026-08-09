export type ExecutionStatus = "started" | "running" | "completed" | "failed" | "retried";

export function isTerminalStatus(status: ExecutionStatus): boolean {
  return status === "completed" || status === "failed";
}
