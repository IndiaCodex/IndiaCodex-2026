# Use Cases

Each use case below follows the same shape: who's asking, what they're actually trying to decide, what they do today without Compass, and what Compass gives them instead. These are the scenarios every capability in the [roadmap](roadmap.md) is justified against — a capability that doesn't map to one of these (or a clear variant of one) is a candidate for cutting, not building.

## 1. Application Developer — "Can I safely upgrade?"

**Who:** A developer maintaining a Midnight application in production, considering a routine dependency bump.

**The decision:** Whether to take a new SDK release now, and whether anything else in their stack needs to move with it.

**Today, without Compass:** Bump the version, run the test suite, and find out empirically. If something breaks, spend time determining whether it's their code or an incompatibility, then search changelogs and ask in community channels to confirm.

**With Compass:** Query the Upgrade Advisor with their current component versions and the target SDK release. Compass returns whether the upgrade is known-compatible with their pinned node and compiler versions, and if not, which other components need to move and to what version. The decision moves from "try it and see" to "check, then act."

## 2. Contract Developer — "Will this compile against the next runtime?"

**Who:** A developer writing Compact contracts, ahead of a protocol or node upgrade to their target network.

**The decision:** Whether their contract, written and tested against the current runtime, will still compile and behave correctly once the network they deploy to moves to a newer protocol version.

**Today, without Compass:** Wait for the upgrade to happen, redeploy to a test environment on the new version, and find out. If the network upgrades on a schedule outside their control, this can mean discovering a break at a time not of their choosing.

**With Compass:** Query compatibility between their contract's compiler version and the upcoming protocol/node release ahead of time, using published release metadata rather than needing the new version deployed to test against. Breaking Change Detection surfaces specifically what changed that could affect compiled output, not just that "something changed."

## 3. Core Midnight Engineer — "What breaks if I ship this?"

**Who:** A maintainer of a core Midnight component (SDK, compiler, node) preparing a release.

**The decision:** Whether a proposed change is safe to ship without warning downstream consumers, or whether it needs a major version bump, a migration note, or direct outreach to affected teams.

**Today, without Compass:** Ship it, and find out from bug reports and support requests which downstream projects it affected — a purely reactive signal that arrives after the fact, from whichever downstream teams happen to notice and report.

**With Compass:** Before merging, query which known downstream components and applications declare a dependency on the piece being changed, and what current compatibility relationships exist between them. This turns "we'll hear about it if it breaks something" into "we know in advance who's affected and can decide how to communicate the change." This is also the query that powers the CI Compatibility Check on core repositories themselves — the same capability serving a maintainer's manual pre-release check also runs automatically on every pull request.

## 4. Platform/DevOps Engineer at an Adopting Enterprise — "Is our stack still supported?"

**Who:** An engineer responsible for an organization's internal Midnight-based systems, including internal forks or extensions of ecosystem components.

**The decision:** Whether the specific combination of versions currently running in production is still within the set the ecosystem actively supports, and what upgrade path exists if not.

**Today, without Compass:** No systematic way to check this beyond manually cross-referencing changelogs against internal version records, typically done only reactively, when something has already broken or a security concern forces an audit.

**With Compass:** Run an Environment Validation check against the organization's declared stack, surfacing anything unsupported, deprecated, or drifting from the current compatibility matrix — before it becomes an incident. For organizations with private forks, the paid tier ([business-case.md](business-case.md)) extends this to internal-only components the public dataset can't see.

## 5. Template/Example Maintainer — "Is my example still correct?"

**Who:** A maintainer of an official or community reference template, tutorial, or example repository.

**The decision:** Whether an example that was correct when published is still correct against current ecosystem versions, without manually re-running every example against every new release.

**Today, without Compass:** Examples go stale silently. Staleness is discovered by whichever new developer tries the example next and reports (or more often, doesn't report, and just concludes the ecosystem doesn't work well) that it's broken.

**With Compass:** A scheduled Release Health check flags when a new release invalidates a compatibility relationship an example depends on, giving the maintainer an alert instead of waiting for a bug report. This is the direct fix for "broken examples" as a named symptom in the [problem statement](problem-statement.md) — it converts an invisible failure mode into a detectable one.

## 6. Security/Compliance Reviewer — "What's our upgrade risk posture?"

**Who:** A reviewer assessing Midnight-based infrastructure as part of an enterprise security or architecture review, not primarily a developer.

**The decision:** Whether to approve, flag, or request mitigation for the organization's dependency and upgrade management process as part of a broader risk sign-off.

**Today, without Compass:** Rely on the engineering team's verbal assurance that "we keep things up to date," with no artifact to attach to the review.

**With Compass:** An Ecosystem Risk / audit export summarizing the organization's current compatibility posture — known-good, known-risky, or unverified — in a form suitable for attaching to a compliance record. This is the use case the enterprise tier's audit export ([business-case.md](business-case.md)) exists to serve directly.

## Where Compass Draws the Line

Two adjacent scenarios come up often enough to address directly, because the reasoning behind the boundary is itself useful context for evaluating the tool:

- **"Resolve my dependency versions for me."** Compass answers whether a chosen set of versions is known to work together; choosing and installing them stays the job of the package managers engineers already use. Keeping that boundary is what lets Compass stay a fast, focused check rather than a second source of truth for what gets installed. See [vision.md](vision.md).
- **"Predict which upcoming changes are likely to cause problems."** Compass's answers are only useful if they're reproducible and traceable to specific data — that's what makes them safe to gate a merge on. A prediction is a genuinely useful, different kind of signal, but mixing it into the compatibility answer would make that answer less stable, exactly where stability matters most. See [architecture-overview.md](architecture-overview.md).
