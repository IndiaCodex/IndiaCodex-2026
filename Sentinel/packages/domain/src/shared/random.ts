const HEX_DIGITS = "0123456789abcdef";

/**
 * Cryptographically strong random bytes via the Web Crypto API
 * (`crypto.getRandomValues`), available identically in Node, browsers,
 * and edge runtimes — the domain layer never imports `node:crypto`.
 */
export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) {
    // byte is always 0-255 (Uint8Array), so both indices are always in range.
    out += HEX_DIGITS[byte >> 4]! + HEX_DIGITS[byte & 0x0f]!;
  }
  return out;
}

export function randomHex(byteLength: number): string {
  return toHex(randomBytes(byteLength));
}
