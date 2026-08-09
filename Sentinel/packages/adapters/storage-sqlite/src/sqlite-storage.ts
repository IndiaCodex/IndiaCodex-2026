import Database from "better-sqlite3";
import type {
  Execution,
  ExecutionArtifact,
  ExecutionId,
  ExecutionSearchQuery,
  JournalEntry,
  StoragePort,
} from "@sentinel/domain";
import { SCHEMA_SQL } from "./schema.js";
import {
  parseJson,
  reviveArtifact,
  reviveExecution,
  reviveJournalEntryContents,
} from "./serialization.js";

interface JournalEntryRow {
  entry_id: string;
  execution_id: string;
  sequence: number;
  event_json: string;
  snapshot_json: string | null;
  previous_entry_hash: string | null;
  entry_hash: string;
}

interface ExecutionRow {
  execution_id: string;
  workflow_id: string;
  correlation_id: string;
  trace_id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  timeline_json: string;
}

interface ArtifactRow {
  artifact_json: string;
}

/**
 * `StoragePort` implementation over SQLite (better-sqlite3), the
 * hackathon-MVP-acceptable default per ADR-0003. All SQL lives in this
 * file and `schema.ts` — nothing outside this package ever sees a query
 * or a row type. Swapping in a PostgreSQL adapter later means writing a
 * new package that satisfies the same `StoragePort` contract (validated
 * by the shared suite in `@sentinel/storage-memory/contract`); it does
 * not touch domain, application, or any other adapter.
 */
export class SqliteStorage implements StoragePort {
  private readonly db: Database.Database;

  constructor(filename = ":memory:") {
    this.db = new Database(filename);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(SCHEMA_SQL);
  }

  close(): void {
    this.db.close();
  }

  appendJournalEntry(entry: JournalEntry): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO journal_entries
           (entry_id, execution_id, sequence, event_json, snapshot_json, previous_entry_hash, entry_hash)
         VALUES (@entryId, @executionId, @sequence, @eventJson, @snapshotJson, @previousEntryHash, @entryHash)`,
      )
      .run({
        entryId: entry.entryId,
        executionId: entry.executionId,
        sequence: entry.sequence,
        eventJson: JSON.stringify(entry.event),
        snapshotJson: entry.snapshot ? JSON.stringify(entry.snapshot) : null,
        previousEntryHash: entry.previousEntryHash,
        entryHash: entry.entryHash,
      });
    return Promise.resolve();
  }

  getJournalEntries(executionId: ExecutionId): Promise<readonly JournalEntry[]> {
    const rows = this.db
      .prepare<{ executionId: string }, JournalEntryRow>(
        `SELECT entry_id, execution_id, sequence, event_json, snapshot_json, previous_entry_hash, entry_hash
         FROM journal_entries
         WHERE execution_id = @executionId
         ORDER BY sequence ASC`,
      )
      .all({ executionId });

    const entries = rows.map((row) => this.rowToJournalEntry(row));
    return Promise.resolve(entries);
  }

  saveExecution(execution: Execution): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO executions
           (execution_id, workflow_id, correlation_id, trace_id, status, started_at, ended_at, timeline_json)
         VALUES (@executionId, @workflowId, @correlationId, @traceId, @status, @startedAt, @endedAt, @timelineJson)
         ON CONFLICT(execution_id) DO UPDATE SET
           workflow_id = excluded.workflow_id,
           correlation_id = excluded.correlation_id,
           trace_id = excluded.trace_id,
           status = excluded.status,
           started_at = excluded.started_at,
           ended_at = excluded.ended_at,
           timeline_json = excluded.timeline_json`,
      )
      .run({
        executionId: execution.executionId,
        workflowId: execution.workflowId,
        correlationId: execution.correlationId,
        traceId: execution.traceId,
        status: execution.status,
        startedAt: execution.startedAt.toISOString(),
        endedAt: execution.endedAt ? execution.endedAt.toISOString() : null,
        timelineJson: JSON.stringify(execution.timeline),
      });
    return Promise.resolve();
  }

  getExecution(executionId: ExecutionId): Promise<Execution | null> {
    const row = this.db
      .prepare<{ executionId: string }, ExecutionRow>(
        `SELECT execution_id, workflow_id, correlation_id, trace_id, status, started_at, ended_at, timeline_json
         FROM executions WHERE execution_id = @executionId`,
      )
      .get({ executionId });

    return Promise.resolve(row ? this.rowToExecution(row) : null);
  }

  searchExecutions(query: ExecutionSearchQuery): Promise<readonly Execution[]> {
    const conditions: string[] = [];
    const params: Record<string, string | number> = {};

    if (query.executionId !== undefined) {
      conditions.push("execution_id = @executionId");
      params["executionId"] = query.executionId;
    }
    if (query.traceId !== undefined) {
      conditions.push("trace_id = @traceId");
      params["traceId"] = query.traceId;
    }
    if (query.correlationId !== undefined) {
      conditions.push("correlation_id = @correlationId");
      params["correlationId"] = query.correlationId;
    }
    if (query.workflowId !== undefined) {
      conditions.push("workflow_id = @workflowId");
      params["workflowId"] = query.workflowId;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const limit = query.limit !== undefined ? "LIMIT @limit" : "";
    if (query.limit !== undefined) {
      params["limit"] = query.limit;
    }

    const rows = this.db
      .prepare<Record<string, string | number>, ExecutionRow>(
        `SELECT execution_id, workflow_id, correlation_id, trace_id, status, started_at, ended_at, timeline_json
         FROM executions ${where}
         ORDER BY started_at DESC
         ${limit}`,
      )
      .all(params);

    return Promise.resolve(rows.map((row) => this.rowToExecution(row)));
  }

  saveArtifact(artifact: ExecutionArtifact): Promise<void> {
    this.db
      .prepare(
        `INSERT INTO execution_artifacts (artifact_id, execution_id, root_hash, artifact_json)
         VALUES (@artifactId, @executionId, @rootHash, @artifactJson)
         ON CONFLICT(execution_id) DO UPDATE SET
           artifact_id = excluded.artifact_id,
           root_hash = excluded.root_hash,
           artifact_json = excluded.artifact_json`,
      )
      .run({
        artifactId: artifact.artifactId,
        executionId: artifact.executionId,
        rootHash: artifact.rootHash,
        artifactJson: JSON.stringify(artifact),
      });
    return Promise.resolve();
  }

  getArtifact(executionId: ExecutionId): Promise<ExecutionArtifact | null> {
    const row = this.db
      .prepare<{ executionId: string }, ArtifactRow>(
        `SELECT artifact_json FROM execution_artifacts WHERE execution_id = @executionId`,
      )
      .get({ executionId });

    return Promise.resolve(row ? reviveArtifact(parseJson(row.artifact_json)) : null);
  }

  private rowToJournalEntry(row: JournalEntryRow): JournalEntry {
    const { event, snapshot } = reviveJournalEntryContents(
      parseJson(row.event_json),
      row.snapshot_json ? parseJson(row.snapshot_json) : null,
    );
    return {
      entryId: row.entry_id as JournalEntry["entryId"],
      executionId: row.execution_id as ExecutionId,
      sequence: row.sequence,
      event,
      snapshot,
      previousEntryHash: row.previous_entry_hash as JournalEntry["previousEntryHash"],
      entryHash: row.entry_hash as JournalEntry["entryHash"],
    };
  }

  private rowToExecution(row: ExecutionRow): Execution {
    return reviveExecution({
      executionId: row.execution_id,
      workflowId: row.workflow_id,
      correlationId: row.correlation_id,
      traceId: row.trace_id,
      status: row.status,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      timeline: parseJson(row.timeline_json),
    });
  }
}
