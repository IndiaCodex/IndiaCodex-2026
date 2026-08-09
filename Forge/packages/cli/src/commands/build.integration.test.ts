import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LowConfidenceTemplateMatchError } from "@forge/sdk";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildCommand } from "./build.js";

describe("forge build (integration, real Aiken compiler + real network)", () => {
  let cwd: string;

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), "forge-cli-e2e-"));
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  it('produces a real Aiken project, blueprint, SDK, tests, docs, and deployment artifact from "forge build"', async () => {
    await buildCommand(
      ["Build an escrow smart contract with milestone-based payments", "--network", "preview"],
      { cwd },
    );

    const projectDir = join(cwd, "escrow-smart-contract");

    // Real Aiken project
    const aikenToml = await readFile(join(projectDir, "aiken.toml"), "utf8");
    expect(aikenToml).toContain('plutus = "v3"');
    const contractSource = await readFile(
      join(projectDir, "validators", "escrow_milestone.ak"),
      "utf8",
    );
    expect(contractSource).toContain("validator escrow_milestone");
    // No explicit milestone count in the description -> falls back to the
    // template's declared default (3), not a guess.
    expect(contractSource).toContain("const milestone_count: Int = 3");

    // Real compiled CIP-57 blueprint
    const blueprintRaw = await readFile(join(projectDir, "plutus.json"), "utf8");
    const blueprint = JSON.parse(blueprintRaw) as { validators: unknown[] };
    expect(blueprint.validators.length).toBeGreaterThan(0);

    // Real generated typed SDK
    const sdk = await readFile(join(projectDir, "sdk", "generated", "index.ts"), "utf8");
    expect(sdk).toContain("export interface EscrowDatum {");
    expect(sdk).toContain("export type EscrowRedeemer =");

    // Docs
    const docs = await readFile(join(projectDir, "GENERATED_README.md"), "utf8");
    expect(docs).toContain("escrow-smart-contract");

    // Deployment artifact
    const deploymentsDir = join(projectDir, "deployments", "preview");
    const deploymentFiles = await readdir(deploymentsDir);
    expect(deploymentFiles.length).toBe(1);
    const manifestRaw = await readFile(join(deploymentsDir, deploymentFiles[0]!), "utf8");
    const manifest = JSON.parse(manifestRaw) as { address: string; network: string };
    expect(manifest.address.startsWith("addr_test1")).toBe(true);
    expect(manifest.network).toBe("preview");
  }, 60_000);

  it('produces a real compiled NFT minting royalty project from "forge build"', async () => {
    await buildCommand(
      ["Mint an NFT collection with an 8% royalty on every sale", "--network", "preview"],
      { cwd },
    );

    const projectDir = join(cwd, "mint-nft-collection");
    const contractSource = await readFile(
      join(projectDir, "validators", "nft_minting_royalty.ak"),
      "utf8",
    );
    expect(contractSource).toContain("validator nft_minting_royalty");
    // "8" extracted from the description — distinct from the template's
    // own default (5), so this proves extraction, not coincidental default.
    expect(contractSource).toContain("const royalty_percent: Int = 8");

    const blueprintRaw = await readFile(join(projectDir, "plutus.json"), "utf8");
    const blueprint = JSON.parse(blueprintRaw) as { validators: { title: string }[] };
    expect(blueprint.validators.some((v) => v.title.includes("mint"))).toBe(true);
  }, 60_000);

  it('produces a real compiled token vesting project from "forge build"', async () => {
    await buildCommand(
      ["Create a token vesting contract with a 6-period unlock schedule", "--network", "preview"],
      { cwd },
    );

    const projectDir = join(cwd, "token-vesting-contract");
    const contractSource = await readFile(
      join(projectDir, "validators", "token_vesting.ak"),
      "utf8",
    );
    expect(contractSource).toContain("validator token_vesting");
    // "6" extracted from the description — distinct from the template's
    // own default (4), so this proves extraction, not coincidental default.
    expect(contractSource).toContain("const vesting_periods: Int = 6");

    const blueprintRaw = await readFile(join(projectDir, "plutus.json"), "utf8");
    const blueprint = JSON.parse(blueprintRaw) as { validators: { title: string }[] };
    expect(blueprint.validators.some((v) => v.title.includes("spend"))).toBe(true);
  }, 60_000);

  it("rejects a description that doesn't confidently match any template, and creates nothing", async () => {
    await expect(
      buildCommand(
        [
          "I want to build a decentralized voting system for governance proposals",
          "--name",
          "mismatch-test",
        ],
        { cwd },
      ),
    ).rejects.toThrow(LowConfidenceTemplateMatchError);

    // No project directory should exist for a rejected match.
    const entries = await readdir(cwd);
    expect(entries).toEqual([]);
  }, 60_000);
});
