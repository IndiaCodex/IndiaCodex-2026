import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { uuidv7, verifyJournalChain } from "@sentinel/domain";
import {
  buildArtifact,
  buildExecution,
  buildJournalChain,
  buildLifecycleEvent,
  buildToolCompletedEvent,
  testExecutionId,
} from "@sentinel/testkit";
import { SqliteStorage } from "../src/sqlite-storage.js";

describe("SqliteStorage recovery", () => {
  let dir: string;
  let dbPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "sentinel-storage-sqlite-"));
    dbPath = join(dir, "sentinel.db");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("persists Executions, Journal entries, and Artifacts across a reconnect", async () => {
    const executionId = testExecutionId();
    const execution = buildExecution({ executionId, status: "completed" });
    const entries = await buildJournalChain([
      { event: buildLifecycleEvent(executionId, 0, "started"), snapshot: null },
    ]);
    const artifact = buildArtifact(entries);

    const first = new SqliteStorage(dbPath);
    await first.saveExecution(execution);
    for (const entry of entries) {
      await first.appendJournalEntry(entry);
    }
    await first.saveArtifact(artifact);
    first.close();

    // A fresh SqliteStorage instance against the same file, simulating
    // a process restart — nothing here is held in memory from `first`.
    const second = new SqliteStorage(dbPath);
    try {
      expect(await second.getExecution(executionId)).toEqual(execution);
      expect(await second.getJournalEntries(executionId)).toEqual(entries);
      expect(await second.getArtifact(executionId)).toEqual(artifact);
    } finally {
      second.close();
    }
  });

  it("recovered journal entries pass independent hash-chain verification", async () => {
    const executionId = testExecutionId();
    const { event, snapshot } = buildToolCompletedEvent(executionId, 1);
    const entries = await buildJournalChain([
      { event: buildLifecycleEvent(executionId, 0, "started"), snapshot: null },
      { event, snapshot },
    ]);

    const first = new SqliteStorage(dbPath);
    for (const entry of entries) {
      await first.appendJournalEntry(entry);
    }
    first.close();

    const second = new SqliteStorage(dbPath);
    try {
      const recovered = await second.getJournalEntries(executionId);
      expect(await verifyJournalChain(recovered)).toBe(true);
    } finally {
      second.close();
    }
  });

  it("detects corruption introduced directly at the storage layer after recovery", async () => {
    const executionId = testExecutionId();
    const entries = await buildJournalChain([
      { event: buildLifecycleEvent(executionId, 0, "started"), snapshot: null },
    ]);

    const original = entries[0]!;
    const first = new SqliteStorage(dbPath);
    await first.appendJournalEntry(original);
    first.close();

    // Simulate corruption: append a second row that breaks the hash
    // chain, bypassing appendJournalEntry (and its validation) entirely
    // — exactly the "row edited directly in the database" scenario the
    // chain is designed to catch.
    const tamperer = new SqliteStorage(dbPath);
    await tamperer.appendJournalEntry({
      ...original,
      // A fresh id (entry_id is the table's PRIMARY KEY, so it must
      // differ from `original`'s) — the corruption under test is the
      // broken hash chain, not a duplicate key.
      entryId: uuidv7() as typeof original.entryId,
      sequence: 1,
      event: { ...original.event, sequence: 1 },
    });
    tamperer.close();

    const reader = new SqliteStorage(dbPath);
    try {
      const recovered = await reader.getJournalEntries(executionId);
      expect(await verifyJournalChain(recovered)).toBe(false);
    } finally {
      reader.close();
    }
  });
});
