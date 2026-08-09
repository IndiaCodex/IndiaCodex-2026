import { describe, expect, it } from "vitest";
import { canonicalJson, sha256Hex } from "../src/index.js";

describe("canonicalJson", () => {
  it("produces identical output regardless of key insertion order", () => {
    const a = { b: 1, a: 2, c: { z: 1, y: 2 } };
    const b = { a: 2, c: { y: 2, z: 1 }, b: 1 };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
  });

  it("serializes Date as ISO string so timestamps affect the hash", () => {
    const json = canonicalJson({ at: new Date("2026-01-01T00:00:00.000Z") });
    expect(json).toBe('{"at":"2026-01-01T00:00:00.000Z"}');
  });

  it("treats undefined properties as absent, not null", () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe('{"a":1}');
  });
});

describe("sha256Hex", () => {
  it("is deterministic for structurally identical input", async () => {
    const a = await sha256Hex({ x: 1, y: [1, 2, 3] });
    const b = await sha256Hex({ y: [1, 2, 3], x: 1 });
    expect(a).toBe(b);
  });

  it("changes when any input byte changes", async () => {
    const a = await sha256Hex({ x: 1 });
    const b = await sha256Hex({ x: 2 });
    expect(a).not.toBe(b);
  });

  it("returns a 64-character lowercase hex string", async () => {
    const hash = await sha256Hex({ anything: true });
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
