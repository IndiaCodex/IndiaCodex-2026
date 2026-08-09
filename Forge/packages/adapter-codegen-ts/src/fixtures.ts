import type { Blueprint } from "@forge/domain";

/**
 * Mirrors a real `aiken build` blueprint for the escrow-milestone template
 * (verified against Aiken v1.1.23), used across this package's tests so
 * codegen is checked against a realistic shape rather than a toy one.
 */
export const escrowBlueprintFixture: Blueprint = {
  preamble: {
    title: "forge/escrow-demo",
    version: "0.0.0",
    plutusVersion: "v3",
  },
  validators: [
    {
      title: "escrow_milestone.escrow_milestone.spend",
      datum: { title: "datum", schema: { $ref: "#/definitions/escrow_milestone~1EscrowDatum" } },
      redeemer: {
        title: "redeemer",
        schema: { $ref: "#/definitions/escrow_milestone~1EscrowRedeemer" },
      },
      compiledCode: "58db01010029...",
      hash: "4486d627a370e46712a13da34221f864c4bab449e7d13884926342b7",
    },
  ],
  definitions: {
    Int: { dataType: "integer" },
    "aiken/crypto/VerificationKeyHash": { title: "VerificationKeyHash", dataType: "bytes" },
    "escrow_milestone/EscrowDatum": {
      title: "EscrowDatum",
      anyOf: [
        {
          title: "EscrowDatum",
          dataType: "constructor",
          index: 0,
          fields: [
            { title: "beneficiary", $ref: "#/definitions/aiken~1crypto~1VerificationKeyHash" },
            { title: "milestones_completed", $ref: "#/definitions/Int" },
          ],
        },
      ],
    },
    "escrow_milestone/EscrowRedeemer": {
      title: "EscrowRedeemer",
      anyOf: [
        { title: "CompleteMilestone", dataType: "constructor", index: 0, fields: [] },
        { title: "Cancel", dataType: "constructor", index: 1, fields: [] },
      ],
    },
  },
};
