# Fee economics

The quantifiable heart of the pitch: a real, verifiable "fees saved" number instead of a vague
"AI makes it efficient" claim.

> **Always fetch live values** from Blockfrost `getProtocolParameters()` at demo time. The numbers below
> are current-as-of-writing approximations for illustration; parameters can be changed by governance.

---

## 1. The fee formula

Cardano's minimum transaction fee:
```
min_fee = minFeeA · size(tx_bytes) + minFeeB
```
| Param | Meaning | Approx value |
|---|---|---|
| `minFeeA` | per-byte cost | **44 lovelace/byte**  (= 0.000044 ADA) |
| `minFeeB` | flat per-tx cost | **155381 lovelace** (= 0.155381 ADA) |

(1 ADA = 1,000,000 lovelace.)

**Script transactions add execution cost** on top:
```
script_fee = priceSteps · totalSteps + priceMemory · totalMemory
```
| Param | Approx value |
|---|---|
| `priceSteps` (price_step) | ~0.0000721 lovelace/step |
| `priceMemory` (price_mem) | ~0.0577 lovelace/mem-unit |

So a real script tx costs roughly:
```
total ≈ minFeeA·size + minFeeB + priceSteps·steps + priceMemory·memory
```

---

## 2. The core argument (why batching wins)

The insight is entirely about **`minFeeB` — it's paid once per _transaction_, not once per _operation/user_.**

```
N users, N separate txs:   N · (minFeeA·size₁ + minFeeB + script₁)
                           = N·minFeeB  +  N·minFeeA·size₁  +  N·script₁

Same N users, 1 batched tx: minFeeA·size_batch + minFeeB + script_batch
                           = 1·minFeeB  +  minFeeA·size_batch  +  script_batch
```
- **`minFeeB` collapses from N× to 1×.** This is the guaranteed, structural saving.
- `size_batch` < `N · size₁` because the batch shares one set of tx-level overhead (witnesses, script
  reference, change handling) instead of repeating it N times. Marginal per-claim data still scales, but
  it's small.
- `script_batch` < `N · script₁` if the validator amortizes shared work; at worst it's ~linear in N, but
  it's paid inside **one** `minFeeB`-bearing tx instead of N.

**Net:** savings grow with batch size and are dominated by the `minFeeB` collapse.

---

## 3. Worked example (illustrative)

Assume per single-claim tx: size ≈ 1,500 bytes, script ≈ 0.10 ADA. Batched tx of 10 claims: size ≈
6,000 bytes (shared overhead + 10× small marginal), script ≈ 0.40 ADA (amortized).

| Path | minFeeB | minFeeA·size | script | **total** |
|---|---|---|---|---|
| 10 separate txs | 10 × 0.1554 = **1.554** | 10 × 0.066 = 0.66 | 10 × 0.10 = 1.00 | **≈ 3.21 ADA** |
| 1 batched tx | 1 × 0.1554 = **0.155** | 1 × 0.264 = 0.264 | 0.40 | **≈ 0.82 ADA** |
| **Saved** | | | | **≈ 2.39 ADA (~74%)** |

Numbers are placeholders to show the *shape* — **the demo uses real measured values, not these.** The
`minFeeB` column alone shows the structural win: 1.554 → 0.155.

---

## 4. The live "fees saved" counter (implementation)

The demo must compute both sides from **real data**, not the table above.

**Batched side (measured, exact):** the actual fee of the settlement tx the Tx Builder just submitted —
read it straight from the built/confirmed transaction (`feeLovelace` in `SettlementResult`).

**Naive side (estimated, honest):** what the same requests would have cost as individual txs. Two options,
in order of credibility:
1. **Measure once, multiply:** actually submit a single-claim tx on Preprod, record its real fee `f₁`,
   then estimate naive cost as `N · f₁` for a batch of N. Most credible — it's a real on-chain number.
2. **Formula estimate:** `N · (minFeeA·size₁ + minFeeB + script₁)` using live protocol params and a
   representative single-claim `size₁`/`script₁`. Fine if submitting N real txs is impractical.

```
savedLovelace = naiveFeeEstimate − feeLovelace
```
Accumulate `savedLovelace` across all batches in the demo session → the running "total ADA saved"
headline number. Label the naive side clearly as an estimate and state which method you used — judges
respect the honesty and it removes the "you fudged it" objection.

---

## 5. The batch-size ceiling (connects to on-chain benchmark)

Bigger batches save more — but only up to the **execution-unit limit**. From `onchain-spec.md` §6, the
`aiken check` benchmark gives the largest batch `N_max` whose `steps`/`memory` stay under `maxTxExUnits`.
Beyond `N_max` you must split into multiple settlement txs (and pay `minFeeB` again per tx). So:

```
optimal strategy: batch up to N_max per settlement tx; savings per tx maximized at N_max.
```
Stating "we measured the on-chain limit at N_max claims per settlement" is both a fee-optimization fact
and a technical-credibility signal. Put `N_max` on the fee slide next to the savings number.

---

## 6. Reference script and fees
Publishing the validator as a **reference script** (`onchain-spec.md` §7) removes the script bytecode
from every settlement tx, shrinking `size(tx_bytes)` and thus `minFeeA·size`. It's a second, independent
lever on the same "fees saved" number. Implementing it makes the demo stronger; skipping it and naming it
as a next step is still credible (`decisions.md`, ADR-004).

---

## 7. What NOT to claim
- Don't claim per-user savings are constant — they grow with batch size; show the curve or a representative
  point, not a single inflated figure.
- Don't ignore script cost — a naive "we saved N × minFeeB" overstates it. Include script cost on both
  sides so the number survives scrutiny.
- Don't present the estimated naive side as measured. Say "estimated via method X."
