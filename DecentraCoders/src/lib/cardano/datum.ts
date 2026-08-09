/**
 * src/lib/cardano/datum.ts
 *
 * Encodes the IdeaProofDatum for on-chain use.
 *
 * Aiken datum constructor (index 0):
 * Datum {
 *   idea_id:               ByteArray  (UTF-8 bytes of the idea UUID string)
 *   idea_hash:             ByteArray  (32 raw bytes of the SHA-256 hash)
 *   owner_public_key_hash: ByteArray  (28 raw bytes of the wallet PKH)
 *   submitted_at:          Int        (Unix timestamp ms as integer)
 *   app_name:              ByteArray  (UTF-8 bytes of "LaunchNest")
 *   version:               ByteArray  (UTF-8 bytes of "1.0")
 * }
 *
 * Mesh SDK's mConStr(0, [...]) builds a Plutus constructor with index 0,
 * matching the Aiken `Datum { ... }` type above.
 */

import { mConStr, stringToHex } from '@meshsdk/core';

/** ─── validation helpers ──────────────────────────────────────────────── */

/**
 * Validates that a hex string represents exactly 32 bytes (SHA-256 output).
 */
export function validateIdeaHashHex(hex: string): void {
  if (!/^[0-9a-f]{64}$/i.test(hex)) {
    throw new Error(
      `Invalid idea hash: expected 64 hex characters (32 bytes SHA-256), got "${hex.substring(0, 16)}..."`
    );
  }
}

/**
 * Validates that a hex string represents exactly 28 bytes (Cardano payment key hash).
 */
export function validatePaymentKeyHash(hex: string): void {
  if (!/^[0-9a-f]{56}$/i.test(hex)) {
    throw new Error(
      `Invalid payment key hash: expected 56 hex characters (28 bytes), got "${hex.substring(0, 16)}..."`
    );
  }
}

/**
 * Converts a UTF-8 string to a hex-encoded ByteArray for use in Plutus data.
 * Equivalent to Cardano's stringToHex / encodeUtf8.
 */
export function hexToBytes(hex: string): string {
  return hex; // In Mesh, ByteArray fields are already raw hex strings
}

/** ─── datum builder ───────────────────────────────────────────────────── */

export interface IdeaProofDatumParams {
  ideaId: string;       // UUID string (e.g. "abc-123")
  ideaHash: string;     // 64-char hex (32 bytes, SHA-256)
  ownerPkh: string;     // 56-char hex (28 bytes, payment key hash)
  submittedAt: number;  // Unix timestamp in milliseconds
  appName?: string;     // defaults to "LaunchNest"
  version?: string;     // defaults to "1.0"
}

/**
 * Builds the inline datum Plutus Data object for Mesh SDK's txOutInlineDatumValue.
 *
 * Encoding rules matching the Aiken Datum type:
 * - idea_id:               UTF-8 bytes of the string, hex-encoded
 * - idea_hash:             Raw 32 bytes of the SHA-256 value, already as a 64-char hex string
 * - owner_public_key_hash: Raw 28 bytes of the PKH, already as a 56-char hex string
 * - submitted_at:          Integer (milliseconds since epoch)
 * - app_name:              UTF-8 bytes of "LaunchNest", hex-encoded
 * - version:               UTF-8 bytes of "1.0", hex-encoded
 */
export function buildIdeaProofDatum(params: IdeaProofDatumParams) {
  const {
    ideaId,
    ideaHash,
    ownerPkh,
    submittedAt,
    appName = 'LaunchNest',
    version = '1.0',
  } = params;

  // Validate inputs before building datum
  validateIdeaHashHex(ideaHash);
  validatePaymentKeyHash(ownerPkh);

  // Encode text fields as UTF-8 hex ByteArrays
  const ideaIdHex = stringToHex(ideaId);
  const appNameHex = stringToHex(appName);
  const versionHex = stringToHex(version);

  // ideaHash is already 64-char hex (32 raw bytes) — use as-is (ByteArray)
  // ownerPkh is already 56-char hex (28 raw bytes) — use as-is (ByteArray)

  // Build Plutus constructor 0 (matching Aiken's Datum { ... } record type)
  return mConStr(0, [
    ideaIdHex,    // idea_id: ByteArray
    ideaHash,     // idea_hash: ByteArray (32 raw bytes)
    ownerPkh,     // owner_public_key_hash: ByteArray (28 raw bytes)
    submittedAt,  // submitted_at: Int
    appNameHex,   // app_name: ByteArray
    versionHex,   // version: ByteArray
  ]);
}

/**
 * Serializes datum fields into a human-readable format for display in the UI.
 */
/**
 * Serializes datum fields into a human-readable format for display in the UI.
 */
export function serializeDatumForDisplay(params: IdeaProofDatumParams) {
  return {
    idea_id: params.ideaId,
    idea_hash: params.ideaHash,
    owner_public_key_hash: params.ownerPkh,
    submitted_at: new Date(params.submittedAt).toISOString(),
    app_name: params.appName ?? 'LaunchNest',
    version: params.version ?? '1.0',
  };
}

/**
 * Safely retrieves the payment key hash (pkh) from the connected wallet API.
 * - Queries addresses in order: getUsedAddresses() -> getUnusedAddresses() -> getChangeAddress()
 * - Decodes CBOR-encoded hexadecimal addresses.
 * - Validates network (must be Cardano Preview Testnet network ID = 0).
 * - Extracts and verifies key credentials (rejects script credentials).
 * - Throws clear, descriptive error messages for any validation failure.
 */
export async function getWalletPaymentKeyHash(walletApi: any): Promise<{ paymentKeyHash: string; addressBech32: string }> {
  if (!walletApi) {
    throw new Error("Wallet not enabled: walletApi is undefined.");
  }

  // 1. Retrieve addresses in safe fallback order
  let usedAddresses: string[] = [];
  try {
    usedAddresses = await walletApi.getUsedAddresses();
  } catch (e: any) {
    console.warn("[getWalletPaymentKeyHash] getUsedAddresses failed:", e);
  }
  console.log("Used addresses:", usedAddresses);

  let unusedAddresses: string[] = [];
  try {
    unusedAddresses = await walletApi.getUnusedAddresses();
  } catch (e: any) {
    console.warn("[getWalletPaymentKeyHash] getUnusedAddresses failed:", e);
  }
  console.log("Unused addresses:", unusedAddresses);

  let changeAddress = "";
  try {
    changeAddress = await walletApi.getChangeAddress();
  } catch (e: any) {
    console.warn("[getWalletPaymentKeyHash] getChangeAddress failed:", e);
  }
  console.log("Change address:", changeAddress);

  // Select the first available address
  let selectedAddress = "";
  if (usedAddresses && usedAddresses.length > 0) {
    selectedAddress = usedAddresses[0];
  } else if (unusedAddresses && unusedAddresses.length > 0) {
    selectedAddress = unusedAddresses[0];
  } else if (changeAddress) {
    selectedAddress = changeAddress;
  }

  console.log("Selected address hex:", selectedAddress);

  if (!selectedAddress) {
    throw new Error("No wallet address returned: All address retrieval methods (getUsedAddresses, getUnusedAddresses, getChangeAddress) returned empty.");
  }

  console.log("[CARDANO] Address selected for parsing:", selectedAddress);
  console.log("[CARDANO] Address length:", selectedAddress?.length);
  console.log(
    "[CARDANO] Address format:",
    selectedAddress?.startsWith("addr") ? "bech32" : "CIP-30 hex"
  );

  // Validate the address format is hex
  const cleanHex = selectedAddress.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(cleanHex)) {
    // If it is already a Bech32 address (starts with 'addr')
    if (cleanHex.startsWith('addr')) {
      console.log("[getWalletPaymentKeyHash] Address is already in Bech32 format.");
      try {
        const { resolvePaymentKeyHash } = await import('@meshsdk/core');
        const pkh = resolvePaymentKeyHash(selectedAddress);
        console.log("Payment key hash:", pkh);
        return { paymentKeyHash: pkh, addressBech32: selectedAddress };
      } catch (decodeError: any) {
        console.error("[CARDANO ADDRESS DECODE ERROR]", decodeError);
        throw new Error(`Could not decode Cardano address: Failed to resolve payment key hash from Bech32: ${decodeError?.message}`);
      }
    }
    throw new Error("Invalid CIP-30 address hex: Address returned by wallet is not a valid hex string.");
  }

  if (cleanHex.length < 2) {
    throw new Error("Invalid CIP-30 address hex: Address is too short.");
  }

  let paymentKeyHash = "";
  let addressBech32 = selectedAddress;

  try {
    // 2. Decode the header byte and verify network ID
    const headerByte = parseInt(cleanHex.substring(0, 2), 16);
    const addrType = (headerByte & 0xf0) >> 4;
    const networkId = headerByte & 0x0f;

    console.log("Address network ID:", networkId);

    // Cardano Preview Testnet network ID is 0, Mainnet is 1
    if (networkId !== 0) {
      console.error(`[getWalletPaymentKeyHash] Network mismatch: expected network ID 0, got ${networkId}`);
      throw new Error("Wrong Cardano network: Switch Lace to Preview Testnet.");
    }

    // 3. Determine address type, validate length, and verify key credential
    let expectedLength = 0;
    let typeName = "";
    let credentialType: "key" | "script" | "unknown" = "unknown";

    if (addrType >= 0 && addrType <= 3) {
      expectedLength = 114; // 57 bytes (Base Address)
      typeName = "Base Address";
      credentialType = (addrType === 0 || addrType === 2) ? "key" : "script";
    } else if (addrType === 4 || addrType === 5) {
      expectedLength = 60; // minimum 30 bytes (Pointer Address)
      typeName = "Pointer Address";
      credentialType = (addrType === 4) ? "key" : "script";
    } else if (addrType === 6 || addrType === 7) {
      expectedLength = 58; // 29 bytes (Enterprise Address)
      typeName = "Enterprise Address";
      credentialType = (addrType === 6) ? "key" : "script";
    } else if (addrType === 14 || addrType === 15) {
      expectedLength = 58; // 29 bytes (Reward Address)
      typeName = "Reward Address";
    }

    console.log("Payment credential type:", credentialType);

    if (!typeName) {
      throw new Error(`Could not decode Cardano address: Unsupported header byte 0x${headerByte.toString(16)}.`);
    }

    if (typeName === "Reward Address") {
      throw new Error("Payment credential missing: Reward addresses do not contain payment credentials.");
    }

    // Validate expected length
    if (addrType === 4 || addrType === 5) {
      if (cleanHex.length < expectedLength) {
        throw new Error(`Invalid CIP-30 address hex: Hex length is ${cleanHex.length}, expected at least ${expectedLength} for ${typeName}.`);
      }
    } else {
      if (cleanHex.length !== expectedLength) {
        throw new Error(`Invalid CIP-30 address hex: Hex length is ${cleanHex.length}, expected ${expectedLength} for ${typeName}.`);
      }
    }

    // Verify that the address contains a key credential
    if (credentialType === "script") {
      throw new Error(`Script credential unsupported: Address type ${addrType} contains a script credential instead of a key credential.`);
    }

    if (credentialType !== "key") {
      throw new Error("Could not decode payment credential: Address does not contain a valid payment key credential.");
    }

    // Extract payment key hash (28 bytes = 56 hex chars starting at index 2)
    paymentKeyHash = cleanHex.substring(2, 58);
    console.log("Payment key hash:", paymentKeyHash);

    // 4. Convert hex address to Bech32 for display purposes
    console.log("[CARDANO] Serialization details:");
    console.log("  - address type before serialization: raw hex");
    console.log("  - input: ", cleanHex);
    console.log("  - derived payment credential:", paymentKeyHash);

    try {
      const hrp = networkId === 0 ? 'addr_test' : 'addr';
      addressBech32 = toBech32(hrp, cleanHex);
      console.log("  - address type after serialization: bech32");
      console.log("  - result: ", addressBech32);
    } catch (serializationError) {
      console.error("[CARDANO ADDRESS SERIALIZATION ERROR]", serializationError);
      addressBech32 = selectedAddress;
    }
  } catch (decodeError) {
    console.error("[CARDANO ADDRESS DECODE ERROR]", decodeError);
    throw decodeError;
  }

  return { paymentKeyHash, addressBech32 };
}

// Bech32 implementation helpers to avoid loading WASM/CSL in the browser environment
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values: number[]): number {
  let chk = 1;
  for (let p = 0; p < values.length; ++p) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ values[p];
    for (let i = 0; i < 5; ++i) {
      if ((top >> i) & 1) {
        chk ^= GENERATOR[i];
      }
    }
  }
  return chk;
}

function hrpExpand(hrp: string): number[] {
  const ret: number[] = [];
  for (let p = 0; p < hrp.length; ++p) {
    ret.push(hrp.charCodeAt(p) >> 5);
  }
  ret.push(0);
  for (let p = 0; p < hrp.length; ++p) {
    ret.push(hrp.charCodeAt(p) & 31);
  }
  return ret;
}

function createChecksum(hrp: string, data: number[]): number[] {
  const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const mod = polymod(values) ^ 1;
  const ret: number[] = [];
  for (let p = 0; p < 6; ++p) {
    ret.push((mod >> (5 * (5 - p))) & 31);
  }
  return ret;
}

function convertBits(data: number[], frombits: number, tobits: number, pad: boolean): number[] {
  let acc = 0;
  let bits = 0;
  const ret: number[] = [];
  const maxv = (1 << tobits) - 1;
  for (let p = 0; p < data.length; ++p) {
    const value = data[p];
    if (value < 0 || (value >> frombits) !== 0) {
      throw new Error('Invalid value: ' + value);
    }
    acc = (acc << frombits) | value;
    bits += frombits;
    while (bits >= tobits) {
      bits -= tobits;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) {
      ret.push((acc << (tobits - bits)) & maxv);
    }
  }
  return ret;
}

export function toBech32(hrp: string, hexStr: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < hexStr.length; i += 2) {
    bytes.push(parseInt(hexStr.substring(i, i + 2), 16));
  }
  const data = convertBits(bytes, 8, 5, true);
  const checksum = createChecksum(hrp, data);
  const combined = data.concat(checksum);
  let ret = hrp + '1';
  for (let p = 0; p < combined.length; ++p) {
    ret += CHARSET.charAt(combined[p]);
  }
  return ret;
}

