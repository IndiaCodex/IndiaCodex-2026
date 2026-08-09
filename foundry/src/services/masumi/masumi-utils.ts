import type { AgentConfig } from "@/types/agent";
import type { MasumiRegistryMetadata } from "@/types/masumi";
import { APP_NAME } from "@/lib/constants";

export function buildMasumiMetadata(config: AgentConfig): MasumiRegistryMetadata {
  return {
    name: `${config.name} — ${APP_NAME}`,
    description: config.description,
    api_url: config.masumi.capability.name,
    capability: config.masumi.capability,
    author: config.masumi.author,
    tags: config.masumi.tags,
    pricing: config.masumi.pricing,
    requests_per_hour: config.masumi.requestsPerHour,
    metadata_version: "1.0.0",
  };
}
