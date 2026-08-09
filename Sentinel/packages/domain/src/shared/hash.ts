import type { Brand } from "./brand.js";
import { canonicalJson } from "./canonical-json.js";
import { toHex } from "./random.js";

export type Hash = Brand<string, "Hash">;

/**
 * SHA-256 over the canonical JSON encoding of `value`, hex-encoded.
 * Uses the Web Crypto API (`crypto.subtle`) rather than `node:crypto` so
 * the domain layer runs identically in Node, browsers, and edge
 * runtimes. The web console doesn't verify hashes client-side today —
 * it calls the server's `/replay` and `/executions/:id/artifact`
 * routes — but this runtime-agnostic design means it could, without any
 * change to this function, if that became worth building.
 */
export async function sha256Hex(value: unknown): Promise<Hash> {
  const bytes = new TextEncoder().encode(canonicalJson(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return toHex(new Uint8Array(digest)) as Hash;
}
