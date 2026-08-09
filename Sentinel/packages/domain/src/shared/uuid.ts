import { randomBytes, toHex } from "./random.js";

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Generates a UUIDv7 (RFC 9562): a 48-bit big-endian Unix millisecond
 * timestamp, a 4-bit version, 12 random bits, a 2-bit variant, and 62
 * more random bits. Unlike UUIDv4, the timestamp prefix makes these
 * IDs sort by creation time, so storage and Trace Search can
 * range-query recent Executions without a separate timestamp index
 * (ADR-0005).
 */
export function uuidv7(now: Date = new Date()): string {
  const unixMs = BigInt(now.getTime());
  const timeBytes = new Uint8Array(6);
  for (let i = 5; i >= 0; i--) {
    timeBytes[i] = Number((unixMs >> BigInt((5 - i) * 8)) & 0xffn);
  }

  const rand = randomBytes(10);

  const bytes = new Uint8Array(16);
  bytes.set(timeBytes, 0);
  bytes[6] = 0x70 | (rand[0]! & 0x0f); // version 7 (0111) + high nibble of rand_a
  bytes[7] = rand[1]!;
  bytes[8] = 0x80 | (rand[2]! & 0x3f); // variant (10) + high 6 bits of rand_b
  bytes.set(rand.slice(3, 10), 9);

  const hex = toHex(bytes);
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}
