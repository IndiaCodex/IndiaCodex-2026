/**
 * Internal domain events (in-process bus for the modular monolith).
 * Modules communicate through these — never by reaching into each other's tables.
 * Swap the emitter for BullMQ/Kafka later without changing publishers/consumers.
 */
export const DomainEvents = {
  /** A verified launchpad event has been ingested and persisted. */
  LaunchpadEvent: "launchpad.event",
} as const;

/** Normalized (camelCase) launchpad event carried on the internal bus. */
export interface LaunchpadEventPayload {
  eventId: string;
  type: string;
  occurredAt: string;
  projectId?: string;
  actorWallet?: string;
  data: Record<string, unknown>;
}
