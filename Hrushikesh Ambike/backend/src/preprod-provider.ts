// Real Blockfrost preprod connection, built from the project's env var.
// Never hardcode the project ID - it's read from BLOCKFROST_PREPROD_PROJECT_ID
// (set in a local, gitignored .env file), matching config.ts's existing
// convention.
import { BlockfrostProvider } from "@meshsdk/provider";

export function getPreprodProvider(): BlockfrostProvider {
  const projectId = process.env.BLOCKFROST_PREPROD_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "BLOCKFROST_PREPROD_PROJECT_ID is not set - add it to ouro/offchain/.env",
    );
  }
  return new BlockfrostProvider(projectId);
}
