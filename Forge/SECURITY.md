# Security Policy

## Project status

Forge is a hackathon submission in active development. It has **not**
had a formal third-party security audit. The three contract templates it
ships (`escrow-milestone`, `nft-minting-royalty`, `token-vesting`) have
each been manually reviewed and verified against the real Aiken compiler,
but "audited" in this project's documentation means "reviewed by the
project's own contributors," not "audited by an independent third party."
Do not use generated contracts to hold real funds on Cardano mainnet
without your own independent review.

## Reporting a vulnerability

If you find a security issue in Forge itself (not in a contract Forge
generated — see below), please report it privately rather than opening a
public issue:

- Email **skybash@yahoo.com** with a description of the issue, steps to
  reproduce, and its potential impact.
- Please allow a reasonable amount of time to respond and address the
  issue before any public disclosure.

We'll acknowledge receipt, investigate, and keep you updated on
remediation progress. Given this project's current stage (a hackathon
submission with a small, unfunded maintainer base), please be patient —
this is not (yet) a project with a dedicated security team or a bug
bounty program.

## What's in scope

- The platform's own code: `domain`, `plugin-api`, `application`, and
  every adapter/CLI package in `packages/`.
- Any of the three contract templates' Aiken source, in
  `packages/contract-templates/src/templates/` (`escrow-milestone.ts`,
  `nft-minting-royalty.ts`, `token-vesting.ts`) — logic errors here affect
  every project generated from the affected template.
- The CIP-19 address computation in `adapter-providers` — an error here
  could compute an incorrect deployment address.

## What's explicitly out of scope

- Contracts a user has hand-modified after generation. Forge generates a
  starting point; it does not continuously verify code you've since
  edited.
- The Aiken compiler itself, or any of the off-chain libraries Forge
  depends on (report those upstream, to their own maintainers).
- Denial-of-service or resource-exhaustion reports against a local CLI
  tool running on a developer's own machine.

## Known, disclosed limitations (not vulnerabilities to report — already tracked)

- `adapter-emulator`'s test scenario check is generic (checks for a
  spendable UTxO), not a real Plutus/redeemer execution simulation — see
  its [README](packages/adapter-emulator/README.md). This means a passing
  `forge build` test run does **not** constitute a security guarantee
  about the generated validator's logic.
- The eUTxO-specific vulnerability rule engine (`ai-testgen` — double
  satisfaction, missing signer checks, etc.) is architected for but not
  yet implemented. `forge build`'s security-test step currently, and
  correctly, reports zero findings rather than fabricating any — this is
  documented, expected behavior, not silently missing coverage.

See [`docs/ProductionReadiness.md`](docs/ProductionReadiness.md) for the
full, honest engineering assessment, including these points in context.
