# Demo Plan (5 minutes)

Goal: prove the platform claim — a natural-language request produces a
real, compiled, typed, tested Cardano project with a real deployment
artifact, and a deterministic engine (not the model) actually guarantees
the security-relevant properties — within a live demo whose first 60
seconds already communicate the value on their own.

**Everything in this script is real and was captured verbatim from an
actual run of this repository** (see [`README.md`](../README.md#demo) for
the full transcript). There is no fixture standing in for a real result
anywhere in this plan.

**Backup plan:** record a screen capture of the 0:15–1:00 hook and the
depth pass ahead of time. If live tooling misbehaves on the day (network
hiccup fetching Aiken's stdlib, etc.), narrate over the recording instead
of debugging on stage — never let a live failure eat demo time.

## Timing

| Time      | Section         | Content                                                                                                                         |
| --------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:15 | Problem         | One sentence, spoken over an already-open terminal.                                                                             |
| 0:15–1:00 | **The hook**    | Live: `forge build "..."`. By 1:00, a compiled, typed, tested Cardano project with a real deployment artifact exists on screen. |
| 1:00–3:30 | **Depth pass**  | See script below — proves the hook wasn't theater                                                                               |
| 3:30–4:15 | Architecture    | One diagram, plus the deterministic-generation guarantee                                                                        |
| 4:15–5:00 | Roadmap + close | What's next, call to action                                                                                                     |

## The hook (0:15–1:00, ~45s)

1. **Say the one-sentence problem**: "Cardano has great individual
   tools — Aiken, Lucid, Blockfrost — but nothing owns the integration
   between them, and no way to go from an idea to a tested contract in
   one step."
2. **Type and run**:
   ```
   forge build "Build an escrow smart contract with milestone-based payments"
   ```
3. **Narrate the live output as it streams** — don't over-explain, the
   terminal does the work:
   - "Scaffolding the project."
   - "Compiling — this is the real Aiken compiler, not a mock."
   - "Generating the typed TypeScript SDK from the compiled blueprint."
   - "Running tests against an in-memory emulator."
   - "Computing a real deployment address and writing a versioned
     manifest."
4. By 1:00, let the summary block sit on screen for a beat — a compiled
   blueprint, a generated SDK, a passing test, and a real testnet-shaped
   address, all from one sentence, in about ten seconds.

## Depth pass (1:00–3:30, ~2m 30s)

This is where the hook earns credibility.

1. **Open the generated contract** (~20s): `validators/escrow_milestone.ak`.
   Real Aiken source — point at the `const milestone_count: Int = 3` line
   and say: "The description didn't mention a number, so this is the
   template's own declared default, not a guess — and the tool will tell
   you that if you ask."

2. **Scroll to the "Why this template" / "Why these parameters" output**
   already printed at the end of the run (~30s). Read one line aloud:
   "This isn't the model explaining itself after the fact — it's reading
   back the exact deterministic decision the template selector and
   parameter validator already made."

3. **Show the generated typed SDK** (~20s):
   `sdk/generated/index.ts` — a real `EscrowDatum` interface and
   `EscrowRedeemer` tagged union, generated from the CIP-57 blueprint, not
   hand-copied.

4. **Show the deployment artifact** (~20s):
   `deployments/preview/escrow_milestone.escrow_milestone.spend.json` — a
   real, versioned JSON file with a real bech32 address. "This is the
   kind of file you'd commit and diff in a PR, not a note in someone's
   head."

5. **Prove it isn't one trick — a different description, a different real
   contract** (~30s):

   ```
   forge build "Mint an NFT collection with an 8% royalty on every sale"
   ```

   Point at `validators/nft_minting_royalty.ak` — a real minting policy,
   not the escrow validator from the hook — and the "Why this template"
   line: intent category `nft-minting-royalty` matched, not `escrow-milestone`.
   Then point at "Why these parameters": `royaltyPercent = 8`, _extracted
   from the description_, the same mechanism that defaulted
   `milestoneCount` a moment ago, now pulling a different number for a
   different template. Three templates exist today (escrow, NFT minting
   royalty, token vesting) — this is the same one command, correctly
   routing between them based on what was actually asked for, not a
   special-cased demo path.

6. **(If time remains) Plugin proof** (~20s): open `packages/cli/src/commands/build.ts`
   and point at the plugin list passed to `Forge.create`. "Every one of
   these — the Aiken compiler, the emulator, the AI adapter — is loaded
   through the exact same plugin API. Nothing here is special-cased."

## Architecture (3:30–4:15)

One diagram (the root `README.md`'s architecture section or
`docs/Architecture.md`'s layer diagram), two sentences:

- "The CLI is a thin shell over `@forge/sdk` — the same core could power
  an IDE extension tomorrow with zero duplicated logic."
- "The language model only ever does two things in this entire platform:
  interpret intent, and narrate decisions the platform already made
  deterministically. It never writes Aiken source, and it runs locally —
  no hosted API, no network dependency, nothing that can fail mid-demo."

## Roadmap + close (4:15–5:00)

One line on what's next (the eUTxO security-rule engine, a real
transaction-building pipeline, more contract templates), then a direct
call to action: repo link, "we're looking for plugin authors, template
contributors, and early adopters."

## Presenter notes

- Keep the terminal font large and the window uncluttered before
  starting; don't scroll-hunt for output during the timed section.
- Have both `forge build` commands (the escrow hook and the NFT
  minting-royalty proof) ready in shell history so nothing is typed from
  memory under time pressure.
- The first `aiken build` in a given environment needs network access
  once (to fetch `aiken-lang/stdlib`) — run the demo project once before
  going on stage so that fetch is already warm and cached, and the live
  run is fully offline and fast.
- If a judge question threatens to eat into the next team's slot, offer
  to continue after the session rather than extending live.
- Close with the repo link on screen for the entire Q&A, not just the
  last slide.
