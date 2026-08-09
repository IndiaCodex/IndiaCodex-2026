import { bech32 } from "bech32";
import type { Network } from "@forge/domain";

/**
 * CIP-19 address type nibble for a script-only "enterprise" address (no
 * staking credential) — the simplest address shape suitable for a
 * validator that doesn't manage its own stake. Real, spec-defined
 * encoding, computed locally: no network call, no external service.
 */
const SCRIPT_ENTERPRISE_ADDRESS_TYPE = 0b0111;

function networkTag(network: Network): number {
  return network === "mainnet" ? 1 : 0;
}

function humanReadablePart(network: Network): string {
  return network === "mainnet" ? "addr" : "addr_test";
}

export class InvalidScriptHashError extends Error {
  constructor(scriptHash: string) {
    super(`Expected a 28-byte (56 hex character) script hash, got: "${scriptHash}"`);
    this.name = "InvalidScriptHashError";
  }
}

/**
 * Computes a real, valid CIP-19 bech32 Cardano address for a script hash
 * — the same format any Cardano wallet or explorer would recognize.
 */
export function computeEnterpriseScriptAddress(scriptHashHex: string, network: Network): string {
  if (!/^[0-9a-fA-F]{56}$/.test(scriptHashHex)) {
    throw new InvalidScriptHashError(scriptHashHex);
  }

  const header = (SCRIPT_ENTERPRISE_ADDRESS_TYPE << 4) | networkTag(network);
  const scriptHashBytes = Buffer.from(scriptHashHex, "hex");
  const payload = Buffer.concat([Buffer.from([header]), scriptHashBytes]);

  const words = bech32.toWords(payload);
  return bech32.encode(humanReadablePart(network), words);
}
