import { describe, expect, it } from "vitest";
import { buildAikenToml } from "./aiken-toml.js";

describe("buildAikenToml", () => {
  it("embeds the package name, compiler version, and a stdlib dependency", () => {
    const toml = buildAikenToml("escrow-demo", "v1.1.23+8949565");

    expect(toml).toContain('name = "forge/escrow-demo"');
    expect(toml).toContain('compiler = "v1.1.23+8949565"');
    expect(toml).toContain('plutus = "v3"');
    expect(toml).toContain('name = "aiken-lang/stdlib"');
  });
});
