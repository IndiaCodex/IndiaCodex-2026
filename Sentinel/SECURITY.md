# Security Policy

## Reporting a vulnerability

Please report security issues privately rather than opening a public issue:

- Preferred: open a [GitHub Security Advisory](../../security/advisories/new) for this repository.
- If that isn't available to you, open a regular issue asking a maintainer to
  follow up privately — do not include exploit details in the public issue.

Include what you'd include in any good bug report: the affected component
(package or route), a reproduction, and the impact you believe it has. We'll
acknowledge reports as promptly as we can and follow up with next steps.

## Supported versions

Sentinel is pre-1.0 (`0.1.0`). There is one supported line: `main`. Security
fixes land there; no older version is maintained separately.

## Current security posture

This is worth stating plainly rather than leaving implicit. As shipped,
Sentinel's HTTP API (`apps/server`) is built for local, trusted-network use —
a single engineer or a demo environment, not a multi-tenant deployment:

- **No authentication or authorization.** Every route is open to anyone who
  can reach the port.
- **CORS defaults to allow any origin** (`SENTINEL_CORS_ORIGIN` narrows this;
  see [`docs/api.md`](docs/api.md) and [`.env.example`](apps/server/.env.example)).
- **No rate limiting.**
- **No secret redaction.** Captured Snapshots store LLM/tool/API request and
  response payloads verbatim — anything sensitive an agent passes through a
  captured call is stored as-is in the Execution Journal.
- **No concurrency control on Journal writes.** Two concurrent capture calls
  for the same execution are not locked (tracked in
  [`docs/roadmap.md`](docs/roadmap.md)).

None of this is hidden — the same list lives in
[`docs/roadmap.md`](docs/roadmap.md) as "Known limitations." Do not expose
`apps/server` beyond a trusted network without addressing the items above
first. Hardening these is the top priority in the roadmap's near-term list.

## What _is_ defended today

- Every SQL query in the storage adapter is parameterized (no string-built
  SQL) — see [`packages/adapters/storage-sqlite`](packages/adapters/storage-sqlite).
- The Execution Journal's hash chain and independent artifact re-verification
  (`verifyArtifact`) mean stored data is tamper-evident even without perimeter
  security — an altered Journal entry or artifact fails verification
  deterministically rather than silently passing.
- Dependencies are checked with `pnpm audit`; there are no known
  vulnerabilities in the current dependency tree as of this writing.
