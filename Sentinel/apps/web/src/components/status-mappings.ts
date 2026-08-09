import type { StatusTone } from "./StatusBadge.js";

export function executionStatusTone(status: string): StatusTone {
  switch (status) {
    case "completed":
      return "good";
    case "failed":
      return "critical";
    case "running":
    case "started":
      return "info";
    case "retried":
      return "warning";
    default:
      return "neutral";
  }
}

export function executionStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "running":
      return "Running";
    case "started":
      return "Started";
    case "retried":
      return "Retried";
    default:
      return status;
  }
}

export function toolOutcomeTone(outcome: string): StatusTone {
  switch (outcome) {
    case "succeeded":
      return "good";
    case "failed":
      return "critical";
    case "pending":
      return "warning";
    default:
      return "neutral";
  }
}

export function paymentStateTone(state: string): StatusTone {
  switch (state) {
    case "confirmed":
      return "good";
    case "failed":
      return "critical";
    case "pending":
    case "initiated":
    case "submitted":
      return "warning";
    default:
      return "neutral";
  }
}

export function verificationTone(valid: boolean): StatusTone {
  return valid ? "good" : "critical";
}

export function fidelityTone(fidelity: string): StatusTone {
  return fidelity === "identical" ? "good" : "critical";
}
