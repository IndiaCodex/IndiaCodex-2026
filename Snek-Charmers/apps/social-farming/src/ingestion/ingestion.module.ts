import { Module } from "@nestjs/common";
import { IngestionController } from "./ingestion.controller";
import { IngestionService } from "./ingestion.service";
import { HmacGuard } from "./hmac.guard";

@Module({
  controllers: [IngestionController],
  providers: [IngestionService, HmacGuard],
})
export class IngestionModule {}
