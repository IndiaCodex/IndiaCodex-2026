import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../infra/prisma/prisma.service";
import {
  DomainEvents,
  LaunchpadEventPayload,
} from "../common/events/domain-events";
import { IngestEventDto } from "./dto/ingest-event.dto";

export type IngestResult = {
  status: "accepted" | "duplicate";
  eventId: string;
};

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emitter: EventEmitter2,
  ) {}

  /**
   * Idempotently persist a launchpad event, then publish it on the internal bus.
   * Dedupe is enforced by the primary keys on raw_events / processed_events; a
   * duplicate delivery is a no-op (safe for at-least-once transports).
   */
  async ingest(dto: IngestEventDto, signature?: string): Promise<IngestResult> {
    try {
      await this.prisma.$transaction([
        this.prisma.rawEvent.create({
          data: {
            eventId: dto.event_id,
            type: dto.type,
            payload: dto as unknown as Prisma.InputJsonValue,
            signature: signature ?? null,
            processedAt: new Date(),
          },
        }),
        this.prisma.processedEvent.create({ data: { eventId: dto.event_id } }),
      ]);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        return { status: "duplicate", eventId: dto.event_id };
      }
      throw err;
    }

    const payload: LaunchpadEventPayload = {
      eventId: dto.event_id,
      type: dto.type,
      occurredAt: dto.occurred_at,
      projectId: dto.project_id,
      actorWallet: dto.actor_wallet,
      data: dto.data ?? {},
    };
    this.emitter.emit(DomainEvents.LaunchpadEvent, payload);
    this.logger.log(`ingested ${dto.type} (${dto.event_id})`);

    return { status: "accepted", eventId: dto.event_id };
  }
}
