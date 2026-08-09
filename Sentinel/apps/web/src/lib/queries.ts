import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import * as api from "./api-client.js";
import type { WireReplaySession } from "./wire-types.js";

export const executionKeys = {
  all: ["executions"] as const,
  list: (params: api.ListExecutionsParams) => [...executionKeys.all, "list", params] as const,
  detail: (id: string) => [...executionKeys.all, "detail", id] as const,
  artifact: (id: string) => [...executionKeys.all, "artifact", id] as const,
  explain: (id: string) => [...executionKeys.all, "explain", id] as const,
  replay: (id: string) => [...executionKeys.all, "replay", id] as const,
  export: (id: string) => [...executionKeys.all, "export", id] as const,
};

export function useExecutions(params: api.ListExecutionsParams = {}) {
  return useQuery({
    queryKey: executionKeys.list(params),
    queryFn: () => api.listExecutions(params),
  });
}

export function useExecution(executionId: string | undefined) {
  return useQuery({
    queryKey: executionKeys.detail(executionId ?? ""),
    queryFn: () => api.getExecution(executionId!),
    enabled: Boolean(executionId),
  });
}

export function useExecutionArtifact(executionId: string | undefined) {
  return useQuery({
    queryKey: executionKeys.artifact(executionId ?? ""),
    queryFn: () => api.getExecutionArtifact(executionId!),
    enabled: Boolean(executionId),
  });
}

export function useExplainability(executionId: string | undefined) {
  return useQuery({
    queryKey: executionKeys.explain(executionId ?? ""),
    queryFn: () => api.explainExecution(executionId!),
    enabled: Boolean(executionId),
  });
}

/**
 * Replay is a `POST`, but it's idempotent and side-effect-free from the
 * caller's perspective (it seals-if-needed and reconstructs from
 * already-recorded data — ADR-0001) — so the Replay tab treats it as a
 * cacheable query, not a one-shot mutation, and other tabs/pages can
 * `invalidateQueries` this key after a fresh capture without the UI
 * needing to model "did I already replay this."
 */
export function useReplay(executionId: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: executionKeys.replay(executionId ?? ""),
    queryFn: async () => {
      const session = await api.replayExecution(executionId!);
      queryClient.setQueryData(executionKeys.replay(executionId!), session);
      return session;
    },
    enabled: Boolean(executionId) && enabled,
    staleTime: Infinity,
  });
}

export function useTriggerReplay(executionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.replayExecution(executionId),
    onSuccess: (session) => {
      queryClient.setQueryData(executionKeys.replay(executionId), session);
    },
  });
}

export function useAuditExport(executionId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: executionKeys.export(executionId ?? ""),
    queryFn: () => api.fetchAuditExport(executionId!),
    enabled: Boolean(executionId) && enabled,
  });
}

/** Convenience: is a given replay query result a passing (verified + identical) session? */
export function isVerifiedSession(result: UseQueryResult<WireReplaySession>): boolean {
  return result.data?.verification.valid === true && result.data.fidelity === "identical";
}

/**
 * Replays every given (terminal) execution in parallel to produce a
 * live integrity summary for the Dashboard. Deliberately not cached
 * server-side (Step 3.3 doesn't persist verification results) — this
 * is a genuine, real-time computation over a demo-scale dataset, not a
 * pre-baked stat; it would need a different approach at production
 * scale (tracked as a known limitation).
 */
export function useIntegritySummary(executionIds: readonly string[]) {
  const queryClient = useQueryClient();
  return useQueries({
    queries: executionIds.map((executionId) => ({
      queryKey: executionKeys.replay(executionId),
      queryFn: async () => {
        const session = await api.replayExecution(executionId);
        queryClient.setQueryData(executionKeys.replay(executionId), session);
        return session;
      },
      staleTime: Infinity,
    })),
  });
}
