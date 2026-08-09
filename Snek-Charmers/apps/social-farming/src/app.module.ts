import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import configuration from "./common/config/configuration";
import { PrismaModule } from "./infra/prisma/prisma.module";
import { HealthController } from "./common/health/health.controller";
import { IdentityModule } from "./modules/identity/identity.module";
import { IngestionModule } from "./ingestion/ingestion.module";
import { ActivityModule } from "./modules/activity/activity.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    IdentityModule,
    IngestionModule,
    ActivityModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
