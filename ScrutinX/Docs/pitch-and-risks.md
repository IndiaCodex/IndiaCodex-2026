# Pitch, positioning & risks

How to talk about the project, the moat, the risks (named openly — this scores points), and prepared Q&A.
Expands `Projectidea.md` §9.

---

## 1. The one-liner

> **Reusable, adaptive batching infrastructure for Cardano — the shared layer every eUTXO dApp needs but
> currently rebuilds from scratch.** It detects which pending requests collide over the same UTXO, reads
> live network congestion, and settles the largest non-conflicting set in a single transaction.

## 2. What it is (and is not)

**It IS infrastructure**, not a consumer app. The right mental reference class:
- **ERC-4337 bundlers** on Ethereum (aggregate user operations into one bundle).
- **CoW Protocol's solver network** (batch-match orders off-chain, settle together).

The twist that makes it a *stronger* story on Cardano: on account-based chains batching is an optimization;
on Cardano, because of eUTXO contention, an adaptive batcher is **structurally necessary** for any
high-concurrency dApp. We're not porting an Ethereum idea for novelty — we're building the thing the chain's
own design demands.

**It is NOT:**
- **An AI/ML breakthrough.** Conflict detection is graph theory (max independent set); congestion prediction
  is a moving average. Say this plainly — over-claiming "AI" invites exactly the scrutiny that sinks a pitch.
  The value is *reusable infrastructure + adaptive policy*, not the algorithms.
- **A base-layer scaling upgrade.** That's **Leios**. We improve **effective** throughput at the
  application/infrastructure layer. Drawing this boundary yourself signals technical maturity (`§5`).
- **A privacy/ZK project** (that's the Midnight track) or an **agent-to-agent monetization** project (Masumi
  track). Scoped out on purpose.

## 3. The moat (say it explicitly)

1. **Trusted shared infrastructure.** Once dApps rely on a batcher that's proven reliable, switching cost and
   trust become the moat — the same dynamic that keeps protocols on a given bundler/solver.
2. **Network-effect flywheel.** The more dApps route through it, the better its view of real contention
   patterns across the ecosystem → better batching decisions → more attractive to the next dApp. Data and
   reliability compound.

(Both are *narrative* for the pitch; the MVP is single-dApp. Be honest that the flywheel is the thesis, not
yet the implementation.)

## 4. The quantifiable proof

Don't hand-wave efficiency. The demo shows a **real, verifiable "fees saved" number** driven by the
`minFeeB`-paid-once-per-tx structure, plus the **measured `N_max`** batch ceiling from `aiken check`. See
[`fee-economics.md`](./fee-economics.md). A number a judge can check beats an adjective every time.

## 5. Risks — named proactively, each with an answer

Addressing these *before* a judge raises them converts a weakness into a credibility signal.

| Risk | The honest framing | Our answer |
|---|---|---|
| **Small TAM** | Cardano DeFi TVL is ~$130M — a modest market today. | Infrastructure bets on ecosystem *growth*; the layer becomes more valuable as TVL grows, and it *reduces* a top friction to that growth. Also positions for Catalyst funding, which targets exactly this. |
| **Leios may reduce the need** | Base-layer scaling could ease contention over time. | Leios raises base throughput; it doesn't make application-level contention resolution free, and adaptive batching still cuts fees and failed txs. Complementary, not obsoleted. Timeline for Leios is also not near-term. |
| **Centralization / front-running** | A batcher is a privileged middleman — it could reorder or censor. | Named next step: **staked, slashable batcher operators** or a **competitive solver-auction** model (à la CoW), so misbehavior is punished and the role is contestable. Not in the 48h MVP — stated as the roadmap. |
| **"It's just an off-chain script"** | The clever part is off-chain; is it even a Cardano project? | The on-chain validator enforces batch correctness and the **state-splitting invariant** that preserves concurrency — that's genuine, non-trivial eUTXO engineering (`onchain-spec.md` rule 6), and it's the piece that makes the off-chain agent *safe* to trust. |
| **Demo uses one signer for many "users"** | Authorization is simplified for the demo. | Disclosed openly; per-user delegated authorization is a clear next step (`onchain-spec.md` §4, rule 3). |

## 6. Funding path (Project Catalyst)

This fits **Project Catalyst** (ecosystem infrastructure) far better than a single-purpose app. State it
directly: *"This is a 48-hour proof of concept for infrastructure the whole Cardano DeFi ecosystem needs —
the natural next step is a Catalyst proposal to build the staked-operator network and multi-dApp routing."*

## 7. Q&A prep (likely judge questions)

**"Isn't this just what Minswap/SundaeSwap already do?"**
Yes — and that's the point. They each built their own *static* batcher in isolation. Nobody offers it as a
*shared, adaptive* layer. We're the reusable version with congestion-aware policy, so the next team doesn't
reinvent it.

**"Why not just wait for Leios?"**
Leios is base-layer and not near-term; it raises throughput but doesn't resolve application-level contention
or the fee inefficiency of unbatched txs. These are complementary. (See §5.)

**"How is this different from an Ethereum bundler?"**
On Ethereum batching is an optimization; on Cardano, eUTXO contention makes adaptive batching structurally
necessary. Same category, higher stakes.

**"What's actually on-chain? Sounds like an off-chain trick."**
The validator enforces batch validity and, critically, keeps state split across UTXOs so concurrency is
preserved for the next batch — real eUTXO engineering (`onchain-spec.md` rule 6). The off-chain agent is
useless without it as the trust anchor.

**"How big can a batch be?"**
We measured it: `N_max` claims per settlement before hitting the on-chain execution-unit limit, benchmarked
with `aiken check` (`onchain-spec.md` §6, `fee-economics.md` §5).

**"What stops the batcher from cheating / front-running?"**
Today: it's a trusted single operator (disclosed). Next step: staked/slashable operators or a solver
auction so the role is punishable and contestable (§5).

**"Does congestion prediction really need ML?"**
No — and we deliberately didn't fake one. An EWMA of block fullness is the right fidelity for a timing
signal. The honesty is the point; the value is the system, not a model (§2).

## 8. Slide skeleton (Milestone 8)
1. Problem — eUTXO contention, one visual (many txs colliding on one UTXO).
2. Today — everyone rebuilds a static batcher; no shared adaptive layer.
3. Solution — the four-component pipeline + validator, one diagram (`architecture.md` §1).
4. **Live demo** — naive vs batcher, congestion driving batch size, fees-saved counter.
5. The number — real ADA saved + measured `N_max`.
6. Positioning — infrastructure (ERC-4337/CoW analogy), structurally necessary on Cardano.
7. Risks & next steps — the §5 table, honestly.
8. Ask — Catalyst path.
