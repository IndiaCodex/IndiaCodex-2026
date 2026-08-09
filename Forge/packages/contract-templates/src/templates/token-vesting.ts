import type { ContractTemplate } from "@forge/domain";

/**
 * `beneficiary` follows the same pattern as `escrow-milestone`'s: it is
 * deliberately NOT a template parameter. It belongs in the datum, set
 * per-UTxO at lock time through the generated typed SDK, not embedded into
 * the validator at generation time. `periodDurationMs` and `vestingStartMs`
 * have no natural-language extraction path (only one numeric parameter is
 * ever extracted per template — see `adapter-ai/parameter-extractor.ts`),
 * so they ship with documented, sensible defaults (a 30-day period, a
 * schedule starting at the Unix epoch) that a generated project is
 * expected to override for a real deployment.
 */
export const tokenVestingTemplate: ContractTemplate = {
  id: "token-vesting",
  name: "Token Vesting",
  description:
    "Locks funds for a beneficiary, released across a fixed number of equal-sized " +
    "tranches as a configurable unlock schedule elapses. Every spend requires the " +
    "beneficiary's signature; each tranche additionally requires the transaction's " +
    "validity range to fall entirely after that tranche's unlock time.",
  category: "token-vesting",
  useCases: ["Employee token vesting", "Investor lockups"],
  parameters: [
    {
      name: "vestingPeriods",
      type: "number",
      description: "the number of equal tranches the vesting schedule is split into",
      required: true,
      defaultValue: 4,
    },
    {
      name: "periodDurationMs",
      type: "duration",
      description: "the time, in milliseconds, between each unlock tranche (default: 30 days)",
      required: true,
      defaultValue: 2_592_000_000,
    },
    {
      name: "vestingStartMs",
      type: "duration",
      description:
        "the absolute POSIX timestamp, in milliseconds, when the vesting schedule begins " +
        "(default: the Unix epoch — override for a real deployment)",
      required: true,
      defaultValue: 0,
    },
  ],
  sourceTemplate: `use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval
use cardano/transaction.{OutputReference, Transaction}

const vesting_periods: Int = {{vestingPeriods}}
const period_duration_ms: Int = {{periodDurationMs}}
const vesting_start_ms: Int = {{vestingStartMs}}

pub type VestingDatum {
  beneficiary: VerificationKeyHash,
  periods_claimed: Int,
}

pub type VestingRedeemer {
  ClaimVestedTokens
  CancelVesting
}

validator token_vesting {
  spend(
    datum: Option<VestingDatum>,
    redeemer: VestingRedeemer,
    _own_ref: OutputReference,
    self: Transaction,
  ) -> Bool {
    when datum is {
      Some(d) -> {
        let signed_by_beneficiary = list.has(self.extra_signatories, d.beneficiary)
        when redeemer is {
          ClaimVestedTokens -> {
            let unlock_time = vesting_start_ms + d.periods_claimed * period_duration_ms
            let period_has_unlocked = interval.is_entirely_after(self.validity_range, unlock_time)
            signed_by_beneficiary && d.periods_claimed < vesting_periods && period_has_unlocked
          }
          CancelVesting -> signed_by_beneficiary
        }
      }
      None -> False
    }
  }
}
`,
};
