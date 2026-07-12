import {
  IsISO8601,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from "class-validator";

/** Event types the launchpad may send. Unknown types are still stored, just not specially handled. */
export const LAUNCHPAD_EVENT_TYPES = [
  "PROJECT_CREATED",
  "TOKEN_PURCHASED",
  "TOKEN_SOLD",
  "LP_ADDED",
  "LP_REMOVED",
  "PROJECT_MIGRATED",
] as const;

/** Inbound event envelope (POST /events). Mirrors the launchpad ↔ social contract. */
export class IngestEventDto {
  @IsString()
  @IsNotEmpty()
  event_id!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsISO8601()
  occurred_at!: string;

  @IsOptional()
  @IsString()
  project_id?: string;

  @IsOptional()
  @IsString()
  actor_wallet?: string;

  @IsObject()
  data: Record<string, unknown> = {};
}
