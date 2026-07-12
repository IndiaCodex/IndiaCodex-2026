import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AikenCompilerAdapter } from "./aiken-compiler-adapter.js";

const ESCROW_MILESTONE_SOURCE = `use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{OutputReference, Transaction}

const milestone_count: Int = 3

pub type EscrowDatum {
  beneficiary: VerificationKeyHash,
  milestones_completed: Int,
}

pub type EscrowRedeemer {
  CompleteMilestone
  Cancel
}

validator escrow_milestone {
  spend(
    datum: Option<EscrowDatum>,
    redeemer: EscrowRedeemer,
    _own_ref: OutputReference,
    self: Transaction,
  ) -> Bool {
    when datum is {
      Some(d) -> {
        let signed_by_beneficiary = list.has(self.extra_signatories, d.beneficiary)
        when redeemer is {
          CompleteMilestone ->
            signed_by_beneficiary && d.milestones_completed < milestone_count
          Cancel -> signed_by_beneficiary
        }
      }
      None -> False
    }
  }
}
`;

const ESCROW_MILESTONE_TEST_SOURCE = `test example_pass() {
  1 + 1 == 2
}
`;

describe("AikenCompilerAdapter (integration, real aiken binary + network)", () => {
  let projectRoot: string;
  const adapter = new AikenCompilerAdapter();

  beforeEach(async () => {
    projectRoot = await mkdtemp(join(tmpdir(), "forge-aiken-integration-"));
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it("scaffolds, compiles, and parses a real escrow-milestone blueprint", async () => {
    await adapter.ensureProject(projectRoot, "escrow-demo");
    await mkdir(join(projectRoot, "validators"), { recursive: true });
    await writeFile(
      join(projectRoot, "validators", "escrow_milestone.ak"),
      ESCROW_MILESTONE_SOURCE,
    );

    const blueprint = await adapter.build(projectRoot);

    expect(blueprint.preamble.plutusVersion).toBe("v3");
    expect(blueprint.validators).toHaveLength(1);
    const validator = blueprint.validators[0];
    expect(validator?.title).toBe("escrow_milestone.escrow_milestone.spend");
    expect(validator?.datum?.schema.$ref).toContain("EscrowDatum");
    expect(validator?.compiledCode.length).toBeGreaterThan(0);
  }, 60_000);

  it("runs real aiken check and parses a passing test result", async () => {
    await adapter.ensureProject(projectRoot, "escrow-demo");
    await writeFile(
      join(projectRoot, "validators", "escrow_milestone.ak"),
      ESCROW_MILESTONE_SOURCE,
    );
    await writeFile(
      join(projectRoot, "validators", "escrow_milestone_tests.ak"),
      ESCROW_MILESTONE_TEST_SOURCE,
    );

    const results = await adapter.test(projectRoot);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ name: "example_pass", passed: true });
  }, 60_000);

  it("is idempotent — calling ensureProject twice does not fail or overwrite an existing aiken.toml", async () => {
    await adapter.ensureProject(projectRoot, "escrow-demo");
    await adapter.ensureProject(projectRoot, "escrow-demo");

    await writeFile(
      join(projectRoot, "validators", "escrow_milestone.ak"),
      ESCROW_MILESTONE_SOURCE,
    );
    const blueprint = await adapter.build(projectRoot);

    expect(blueprint.validators).toHaveLength(1);
  }, 60_000);
});
