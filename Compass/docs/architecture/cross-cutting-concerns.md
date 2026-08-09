# Cross-Cutting Concerns

Seven concerns that don't belong to any one module but constrain all of them. Grouped in one document deliberately — each is a short, firm position, not a subsystem large enough to justify its own spec.

## Error Handling Strategy

**The domain layer raises typed domain errors, never generic exceptions.** `UnknownComponentError`, `ConflictingEvidenceError` — specific, catchable, meaningful to whoever handles them.

**A tool failure must never be reported as a compatibility result.** This is the single most important rule in this section, because it's the one most tempting to shortcut under deadline pressure. If ingestion fails, if a plugin throws, if evaluation can't complete — the outcome is an explicit tool error, distinct from `compatible`, `incompatible`, and `unverified`. A CI check that silently passes because Compass itself crashed is worse than no check at all, for the same reason described in [compatibility-engine.md](compatibility-engine.md#fail-closed-never-fail-open): it manufactures false confidence at exactly the moment confidence should be lowest.

**Plugin failures are isolated.** One ecosystem source being unreachable, or one manifest failing to parse, must not abort an entire ingestion run. The affected component's data is marked stale or missing in the resulting snapshot; every other component's data ingests normally. Partial knowledge, clearly labeled as partial, is more useful than an all-or-nothing run that throws away everything because of one bad source.

**Each interface maps outcomes to its own native convention** — CLI exit codes, HTTP status codes, GitHub check annotations — but all of them draw from the same three-way distinction (`compatible` / `incompatible or unverified` / `tool error`) that `core/application` produces. No interface invents its own error taxonomy.

## Configuration Model

Three distinct things get configured, and they're kept distinct rather than merged into one file:

- **Engine configuration** — which plugins are active, which rule packs are loaded, snapshot retention policy. Lives with whichever process runs ingestion.
- **Consumer configuration** (`compass.config`, in a repository that wants Compass to check it) — which components this repository represents, which of its dependencies are in scope for CI checks. The same file the CLI and the GitHub Action both read, since they run the same underlying evaluation.
- **Credentials** — referenced by name (an environment variable, a secret store key), never inlined into a config file that might get committed.

All configuration is explicit and file-based, consistent with the "no magic" principle carried from [vision.md](../vision.md): no environment-implicit behavior beyond credential references, and no plugin or rule pack becomes active by being merely present on disk — see [plugin-architecture.md](plugin-architecture.md#registration-is-explicit). Configuration schemas are versioned, so a config-shape change is itself subject to the same compatibility discipline Compass practices everywhere else.

**As shipped**, `interfaces/cli` and `interfaces/github-action` configure engine wiring (which plugin, which storage adapter) through CLI flags and Action inputs (`--db`, `--token`) rather than a `compass.config` file — there's only ever been one plugin to select and no per-repository scoping question yet, so the file this section anticipates hasn't been needed. It remains the right shape for the moment a second plugin or per-repository CI scoping makes an implicit "the only plugin there is" assumption wrong.

## Logging Strategy

Structured (key-value), not free text — logs exist for operational debugging ("why did this run take 40 seconds," "which plugin call failed") and are kept distinct from the [Evidence Model](compatibility-engine.md#evidence-model), which is the durable, queryable record of *why a compatibility conclusion was reached*. Conflating the two would make Evidence as disposable as a log line, which it must not be, and would make logs as permanent and query-shaped as Evidence, which they don't need to be.

The CLI keeps command output on `stdout` and logs on `stderr`, so piping `--format json` output into another tool is never polluted by log lines. Credentials are never logged, under any log level, without exception.

## Testing Strategy

Testability follows directly from the [dependency rules](repository-structure.md#dependency-rules) — every layer can be tested in isolation because every layer depends only on interfaces, never on concrete implementations of the layers around it.

- **`core/domain`** — pure unit tests. No mocks needed; entities and value objects are plain data and pure functions. Rule Engine logic is a strong candidate for property-based testing given how many rules a mature rule pack will eventually hold — the risk isn't any single rule being wrong, it's rule *interactions* producing an unintended aggregate result, which is exactly what property-based testing is suited to catching.
- **`core/application`** — unit tests against the fakes in `core/testing`: a fake plugin, an in-memory `SnapshotRepository`. No real network, no real storage backend, in any test at this layer.
- **Plugins** — every plugin must pass the shared conformance suite in `plugin-sdk` (see [plugin-architecture.md](plugin-architecture.md#conformance-not-trust-by-convention)), plus its own tests against recorded fixtures rather than live network calls — deterministic and fast, and immune to an upstream API being temporarily down.
- **Interfaces** — thin by design, so their tests focus on translation correctness (argv in, use-case call out; use-case result in, formatted output out) rather than business logic, plus a small number of end-to-end smoke tests per surface.

**CI enforces two things beyond the test suite itself:** the full test suite passing, and the [dependency-direction lint](repository-structure.md#dependency-rules) passing — an architectural boundary violation fails the build the same way a failing test does.

## Security Model

**Least privilege by default.** Compass reads public ecosystem metadata; it never requires write access to any external system it observes — no ability to push tags, modify a watched repository, or publish a package. The GitHub Action requests the minimum scope it needs (read contents, write check runs), never repository-admin scope. A compromised Action token has a small, well-understood blast radius by construction.

**Credentials are referenced, never embedded.** See [Configuration Model](#configuration-model), above.

**A plugin is a trust boundary.** A Source Adapter and Capability Extractor run real code against real external systems; installing a plugin means trusting its code the same way installing any dependency does. First-party plugins are reviewed like any other code in the repository. Rule Packs are declarative data, not code (see [ADR 0005](../adr/0005-declarative-rule-model.md)), which is what makes it plausible to eventually accept community-contributed rules without accepting community-contributed code into the evaluation path — but a broader third-party plugin distribution and review process is future work, addressed when there's a real plugin ecosystem to secure, not designed speculatively now.

**No secrets in the Knowledge Graph, by construction.** The graph stores public release metadata. If private-fork or enterprise support ([business-case.md](../business-case.md)) later requires storing organization-private compatibility data, that data needs its own access control model — explicitly flagged here as future work rather than solved preemptively.

## Performance Assumptions

Stated explicitly so they can be checked, and revisited deliberately rather than assumed away:

- **v1 ecosystem scale:** tens of components, hundreds of releases each. A Knowledge Graph at this scale fits comfortably in memory for query purposes, which is what justifies the [simplest-adapter-first](knowledge-graph.md#the-first-adapter-should-be-the-simplest-thing-that-works) storage decision.
- **Ingestion is scheduled, not query-triggered.** Queries read the last completed snapshot; ingestion cost never appears in query latency.
- **CI check latency budget: low single-digit seconds**, once a persistent snapshot service exists for the Action to query instead of ingesting itself. As shipped, the Action ingests synchronously on every run and does not yet meet this budget — a known, documented tradeoff, not a silent gap (see [ADR 0012](../adr/0012-interfaces-ingest-fresh-per-invocation.md)).

These are capacity-planning assumptions, not architectural guarantees — if the ecosystem grows by an order of magnitude, revisit the numbers, not the architecture; the [storage port](knowledge-graph.md#storage-abstraction) exists specifically so a scale change doesn't need to become a redesign.

## Future Scalability Considerations

- **Storage scale:** if the simple v1 adapter stops being enough, the fix is a new adapter behind the existing `SnapshotRepository` port — see [ADR 0008](../adr/0008-simplest-storage-adapter-first.md).
- **Query load:** the Query API is stateless and reads immutable snapshots, so it scales horizontally by ordinary means (more instances, response caching) without any change to `core/application`.
- **A second ecosystem:** because the core never hardcodes Midnight ([plugin-architecture.md](plugin-architecture.md)), supporting a second ecosystem is a new plugin, not a redesign — this is the architecture's central bet, and every other decision in this specification is written to keep that bet true.
- **Rule set growth:** the declarative, order-independent rule model ([compatibility-engine.md](compatibility-engine.md#rule-engine)) is what keeps a rule pack tractable as it grows into the hundreds of rules — the alternative, order- or state-dependent rules, is a well-known source of combinatorial interaction bugs that gets worse, not better, with scale.
