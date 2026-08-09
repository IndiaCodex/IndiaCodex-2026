import { bech32 } from "bech32";
import { describe, expect, it } from "vitest";
import { computeEnterpriseScriptAddress, InvalidScriptHashError } from "./cip19-address.js";

const SCRIPT_HASH = "4486d627a370e46712a13da34221f864c4bab449e7d13884926342b7";

describe("computeEnterpriseScriptAddress", () => {
  it("produces a testnet address with the addr_test1 prefix", () => {
    const address = computeEnterpriseScriptAddress(SCRIPT_HASH, "preview");

    expect(address.startsWith("addr_test1")).toBe(true);
  });

  it("produces a mainnet address with the addr1 prefix", () => {
    const address = computeEnterpriseScriptAddress(SCRIPT_HASH, "mainnet");

    expect(address.startsWith("addr1")).toBe(true);
  });

  it("round-trips: decoding the address recovers the original header byte and script hash", () => {
    const address = computeEnterpriseScriptAddress(SCRIPT_HASH, "preview");

    const { prefix, words } = bech32.decode(address);
    const payload = Buffer.from(bech32.fromWords(words));

    expect(prefix).toBe("addr_test");
    expect(payload[0]).toBe(0x70); // (0b0111 << 4) | 0 (testnet)
    expect(payload.subarray(1).toString("hex")).toBe(SCRIPT_HASH);
  });

  it("produces a different header byte (network tag) for mainnet than testnet", () => {
    const testnetAddress = computeEnterpriseScriptAddress(SCRIPT_HASH, "preview");
    const mainnetAddress = computeEnterpriseScriptAddress(SCRIPT_HASH, "mainnet");

    const testnetPayload = Buffer.from(bech32.fromWords(bech32.decode(testnetAddress).words));
    const mainnetPayload = Buffer.from(bech32.fromWords(bech32.decode(mainnetAddress).words));

    expect(testnetPayload[0]).toBe(0x70);
    expect(mainnetPayload[0]).toBe(0x71);
  });

  it("throws InvalidScriptHashError for a malformed hash", () => {
    expect(() => computeEnterpriseScriptAddress("not-a-hash", "preview")).toThrow(
      InvalidScriptHashError,
    );
  });
});
