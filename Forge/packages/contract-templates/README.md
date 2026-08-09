# @forge/contract-templates

The Forge Engine — implements `IContractTemplateEnginePort`. The only
place in the platform that produces Aiken source, and it does so by
plain, deterministic string substitution. No language model is involved.

## What's here

Three audited templates today, each verified to compile against the real
Aiken compiler:

| Template              | Category                       | Validator purpose | Extractable parameter | Use cases                                  |
| --------------------- | ------------------------------ | ----------------- | --------------------- | ------------------------------------------ |
| `escrow-milestone`    | Escrow with Milestone Payments | `spend`           | `milestoneCount`      | Freelancing, construction, project funding |
| `nft-minting-royalty` | NFT Minting with Royalties     | `mint`            | `royaltyPercent`      | NFT marketplaces, creator royalties        |
| `token-vesting`       | Token Vesting                  | `spend`           | `vestingPeriods`      | Employee token vesting, investor lockups   |

Only one parameter per template is ever extracted from natural language —
`adapter-ai`'s extractor only fills numeric schema properties, and only
one such property per template is declared, by design (see
`adapter-ai/parameter-extractor.ts`). Every other parameter (an address,
a duration, a free-form name) always falls back to its documented
default, recorded honestly as such in the "why these parameters" output.

`beneficiary` (in both `escrow-milestone` and `token-vesting`) is
deliberately **not** a template parameter: it's a datum field, set later
through the generated typed SDK, not baked in at generation time.
`nft-minting-royalty`'s `royaltyBeneficiaryHash` has no datum to live in
(mint validators don't have one) — it ships as a clearly-labeled
placeholder default that a real deployment must replace.

`renderTemplate` performs the substitution and throws `TemplateRenderError`
if a required parameter has no value and no default, or if a placeholder
is left unresolved — it never silently produces broken source.

## Why templates instead of AI-generated code

See [docs/adr/ADR-003-ai-as-intent-parser-only.md](../../docs/adr/ADR-003-ai-as-intent-parser-only.md)
and [docs/adr/ADR-004-template-engine.md](../../docs/adr/ADR-004-template-engine.md).
Adding a new contract category means writing and auditing a new template
by hand — a deliberate throughput ceiling that favors correctness over
breadth. The second and third templates (`nft-minting-royalty`,
`token-vesting`) proved this process actually scales past the original
single-template MVP: neither required any change to `render.ts`, the
template engine adapter's public shape, or any layer above it — only a
new template file, a `TEMPLATES` array entry, and new intent-classifier
keywords.
