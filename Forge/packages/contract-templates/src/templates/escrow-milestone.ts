import type { ContractTemplate } from "@forge/domain";

/**
 * The only parameter baked into the compiled source is `milestoneCount` —
 * a compile-time constant. `beneficiary` is deliberately NOT a template
 * parameter: it belongs in the datum, set per-UTxO at spend-lock time
 * through the generated typed SDK, not embedded into the validator at
 * generation time. This keeps the Forge Engine's job limited to
 * deterministic substitution of values that must be compiled in.
 */
export const escrowMilestoneTemplate: ContractTemplate = {
  id: "escrow-milestone",
  name: "Escrow with Milestone Payments",
  description:
    "Locks funds for a beneficiary, released as a fixed number of milestones are completed. " +
    "Every spend requires the beneficiary's signature.",
  category: "escrow-milestone",
  useCases: ["Freelancing", "Construction", "Project funding"],
  parameters: [
    {
      name: "milestoneCount",
      type: "number",
      description: "the total number of milestones the escrow is split into",
      required: true,
      defaultValue: 3,
    },
  ],
  sourceTemplate: `use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use cardano/transaction.{OutputReference, Transaction}

const milestone_count: Int = {{milestoneCount}}

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
`,
};
