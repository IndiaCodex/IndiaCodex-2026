import type { SnapshotId, Timestamp } from '@compass/domain';

/**
 * Handed to Source Adapters and Capability Extractors on every call so they
 * can stamp the Evidence they produce with the snapshot it belongs to and
 * when it was collected — both are decided once, by the use case, at the
 * start of an ingestion run, not by each plugin independently.
 */
export interface IngestionContext {
  readonly snapshotId: SnapshotId;
  readonly collectedAt: Timestamp;
}
