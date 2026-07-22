import type {
  Execution,
  ExecutionArtifact,
  ExecutionId,
  ExecutionSearchQuery,
  JournalEntry,
  StoragePort,
} from "@sentinel/domain";

/**
 * In-memory `StoragePort` implementation. Two purposes: an ephemeral
 * adapter for local development/demos that need no database file, and
 * the reference implementation the shared `StoragePort` contract suite
 * (`./contract.js`) is validated against — proving that suite genuinely
 * exercises the port's contract rather than one adapter's quirks
 * (ADR-0003).
 */
export class InMemoryStorage implements StoragePort {
  private readonly journalEntriesByExecution = new Map<ExecutionId, JournalEntry[]>();
  private readonly executions = new Map<ExecutionId, Execution>();
  private readonly artifacts = new Map<ExecutionId, ExecutionArtifact>();

  appendJournalEntry(entry: JournalEntry): Promise<void> {
    const entries = this.journalEntriesByExecution.get(entry.executionId) ?? [];
    entries.push(entry);
    this.journalEntriesByExecution.set(entry.executionId, entries);
    return Promise.resolve();
  }

  getJournalEntries(executionId: ExecutionId): Promise<readonly JournalEntry[]> {
    return Promise.resolve([...(this.journalEntriesByExecution.get(executionId) ?? [])]);
  }

  saveExecution(execution: Execution): Promise<void> {
    this.executions.set(execution.executionId, execution);
    return Promise.resolve();
  }

  getExecution(executionId: ExecutionId): Promise<Execution | null> {
    return Promise.resolve(this.executions.get(executionId) ?? null);
  }

  searchExecutions(query: ExecutionSearchQuery): Promise<readonly Execution[]> {
    let results = [...this.executions.values()];

    if (query.executionId !== undefined) {
      results = results.filter((execution) => execution.executionId === query.executionId);
    }
    if (query.traceId !== undefined) {
      results = results.filter((execution) => execution.traceId === query.traceId);
    }
    if (query.correlationId !== undefined) {
      results = results.filter((execution) => execution.correlationId === query.correlationId);
    }
    if (query.workflowId !== undefined) {
      results = results.filter((execution) => execution.workflowId === query.workflowId);
    }

    results.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    if (query.limit !== undefined) {
      results = results.slice(0, query.limit);
    }

    return Promise.resolve(results);
  }

  saveArtifact(artifact: ExecutionArtifact): Promise<void> {
    this.artifacts.set(artifact.executionId, artifact);
    return Promise.resolve();
  }

  getArtifact(executionId: ExecutionId): Promise<ExecutionArtifact | null> {
    return Promise.resolve(this.artifacts.get(executionId) ?? null);
  }
}
