import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import {
  DomainEvents,
  LaunchpadEventPayload,
} from "../../common/events/domain-events";

/**
 * Minimal Activity Tracker (Phase 1 seam into Phase 2).
 * - PROJECT_CREATED registers the project mirror.
 * - Everything else becomes an immutable activity record, creating the acting
 *   user on first sight. Later phases add richer typing + reward triggers here.
 */
@Injectable()
export class ActivityListener {
  private readonly logger = new Logger(ActivityListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(DomainEvents.LaunchpadEvent)
  async onLaunchpadEvent(evt: LaunchpadEventPayload) {
    if (evt.type === "PROJECT_CREATED" && evt.projectId) {
      await this.prisma.project.upsert({
        where: { id: evt.projectId },
        create: {
          id: evt.projectId,
          creatorWallet: evt.actorWallet ?? null,
          tokenPolicyId: (evt.data?.token_policy_id as string) ?? null,
        },
        update: {},
      });
      this.logger.log(`registered project ${evt.projectId}`);
      return;
    }

    let userId: string | undefined;
    if (evt.actorWallet) {
      const user = await this.prisma.user.upsert({
        where: { walletAddress: evt.actorWallet },
        create: { walletAddress: evt.actorWallet },
        update: {},
      });
      userId = user.id;
    }

    await this.prisma.activity.create({
      data: {
        userId,
        projectId: evt.projectId ?? null,
        type: evt.type,
        source: "launchpad",
        payload: (evt.data ?? {}) as Prisma.InputJsonValue,
        occurredAt: new Date(evt.occurredAt),
        originEventId: evt.eventId,
      },
    });
    this.logger.log(`recorded activity ${evt.type}`);
  }
}
