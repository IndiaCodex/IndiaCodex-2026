# Business Case

## Who Benefits, and How

Compass's value is easiest to see stakeholder by stakeholder, because each one is currently paying a different, specific cost that Compass removes.

**The individual developer** stops discovering incompatibility by having their build fail. Time currently spent bisecting which of several version changes broke something is returned to building.

**The Midnight core team** stops fielding the same "does X work with Y" question repeatedly, in different words, across support channels, because the answer becomes a link instead of a lookup someone has to personally perform. Every hour a maintainer spends manually answering a compatibility question is an hour not spent on the roadmap.

**Template and example maintainers** get a detection mechanism for staleness that currently doesn't exist. Today, an example goes stale silently and is discovered by the next developer who tries it — the worst possible moment, because that developer is often new to the ecosystem and the broken example is their first impression of it.

**Enterprise adopters** get something they can put in a due-diligence document. "We manage upgrade risk with automated compatibility checking" is a materially different answer in a vendor security/architecture review than "we haven't had major problems yet." The latter is not a process; it's an absence of evidence, and enterprise procurement treats absence of evidence as risk.

**Ecosystem maintainers deciding what to recommend** get a tool whose recommendation cost is low (it's free, open-source, and requires no migration) and whose downside is limited to false positives in a CI check — a failure mode that is annoying, not dangerous, and one the deterministic-rules architecture (see [architecture-overview.md](architecture-overview.md)) is specifically designed to keep rare and explainable.

## Why This Is Worth Building Now, Not Later

The cost of building compatibility tooling scales with the size of the matrix it has to model, and the size of that matrix scales with the number of components and releases already in the wild. Midnight today has a tractable number of components — protocol, compiler, a handful of SDK packages, node, wallet, templates. Waiting until the ecosystem has several times that many components and years of release history means building the same tooling against a much larger, messier, already-tangled dataset, with less institutional appetite to backfill historical compatibility data that was never recorded.

There is a second reason timing matters: trust. An ecosystem that adopts compatibility tooling before teams have been burned by an incompatibility incident gets to be proactive infrastructure. One adopted after a visible incident is remedial — useful, but arriving too late to prevent the reputational cost the incident already caused. Midnight is currently in the window where the proactive framing is still available.

## Why CI Should Depend On This Weekly, Not Occasionally

A tool that is run manually, occasionally, when someone remembers, does not change outcomes — it becomes another piece of tribal knowledge ("oh, you should check Compass before upgrading"), which is exactly the failure mode described in the [problem statement](problem-statement.md). The reason the GitHub Action is sequenced early in the [roadmap](roadmap.md), not as a later add-on, is that CI integration is what converts Compass from a tool engineers have to remember into a check that runs on their behalf, every time, on every pull request that touches a dependency. This is the same reasoning that makes linting, type-checking, and test suites CI-gated rather than "recommended before you push" — a check that isn't enforced gets skipped exactly when it matters most, under deadline pressure.

## Why an Enterprise Would Pay

The core compatibility engine, CLI, and GitHub Action are open source, by design (see [vision.md](vision.md) — this is ecosystem-owned infrastructure, not a single vendor's product, and its trustworthiness depends on that). The business case for a paid tier is not "pay to get the checking" — it's the layer above shared ecosystem intelligence that only a specific organization needs:

- **Private compatibility policies** for an organization's internal forks or private extensions of Midnight components, which are by definition invisible to a shared open-source dataset
- **Org-wide risk dashboards** aggregating compatibility posture across every internal repository an enterprise maintains, not just public ecosystem ones
- **SLA-backed advisories** — faster or guaranteed turnaround on new compatibility data after a Midnight release, relevant to teams with production deployment windows to hit
- **Audit and compliance exports** formatted for the specific due-diligence and regulatory documentation enterprise security reviews require

This is the same open-core shape that has worked for comparable infrastructure categories — dependency and vulnerability intelligence (Snyk, Renovate's hosted tier), supply-chain trust tooling (Chainguard) — where the shared intelligence is public and trusted precisely because it's open, and the paid product is the organization-specific layer on top, not a gate in front of the core capability.

## Why the Midnight Core Team Should Recommend It

Recommending Compass costs the core team nothing they don't already want: it reduces the support burden described above, it gives new integrators a self-service answer during onboarding instead of a support queue entry, and — because Compass observes public release and repository metadata rather than requiring any Midnight component to change how it ships — adopting it requires no coordination cost from any existing team. The only thing Compass asks of the ecosystem it serves is that releases continue being published the way they already are.

## Cost of Not Building This

None of the costs in the [problem statement](problem-statement.md) require a dramatic failure to accrue — that's what makes them easy to underweight. They are a continuous tax: repeated support questions, repeated individual debugging of the same class of failure, a compounding pool of quietly stale examples, and an accumulating body of enterprise evaluators who each independently conclude that upgrade risk is unmanaged, without any single incident ever being severe enough to force the issue onto a roadmap. The absence of a visible incident is not evidence the cost isn't being paid — it's evidence the cost is distributed widely enough that no one owner feels it acutely, which is exactly the condition under which infrastructure gaps persist for years past the point they were affordable to fix.

## What Would Make This Case Wrong

Worth stating plainly: this case is wrong if Midnight's component count and release cadence stay low enough that manual coordination remains tractable, or if the ecosystem consolidates around a single blessed version combination that most teams simply follow without needing to reason about compatibility themselves. Neither describes Midnight's current trajectory, but both are the honest conditions under which Compass would be solving a problem that doesn't yet justify dedicated tooling — and worth re-checking against as the ecosystem evolves, rather than assumed away.
