import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UseGuards,
} from "@nestjs/common";
import { IngestionService } from "./ingestion.service";
import { IngestEventDto } from "./dto/ingest-event.dto";
import { HmacGuard } from "./hmac.guard";

@Controller("events")
export class IngestionController {
  constructor(private readonly ingestion: IngestionService) {}

  /** The launchpad's only inbound door. Signed with x-signature (HMAC). */
  @Post()
  @UseGuards(HmacGuard)
  @HttpCode(200)
  ingest(
    @Body() dto: IngestEventDto,
    @Headers("x-signature") signature?: string,
  ) {
    return this.ingestion.ingest(dto, signature);
  }
}
