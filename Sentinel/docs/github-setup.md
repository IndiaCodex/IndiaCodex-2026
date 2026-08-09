# GitHub Repository Setup Recommendations

Settings that live in GitHub's UI, not in a file this repository can set
itself — recorded here so they're not lost between "the code is ready" and
"the repository is actually configured." Apply these once a real GitHub
remote exists.

## Repository description

> Deterministic engineering assurance for autonomous AI agents — capture,
> replay, verify, and explain every execution. Built for the Masumi
> ecosystem.

Kept under GitHub's ~160-character description field limit. Leads with
"deterministic" and "assurance" (the actual differentiator) rather than
"AI agent platform" (a crowded, generic phrase that undersells what this
does and oversells what it is — Sentinel is not an agent framework).

## GitHub Topics

Add these under repository Settings → General → Topics, roughly in order
of relevance:

```
masumi
ai-agents
observability
determinism
audit-trail
verification
typescript
clean-architecture
autonomous-agents
engineering-tools
open-source
hash-chain
replay
explainability
```

`masumi` and `ai-agents` first — those are what someone searching GitHub
for this specific problem space would type. `typescript` and
`clean-architecture` matter to engineers evaluating code quality before
they evaluate the pitch.

## Social preview image

GitHub renders a 1280×640 social preview image (Settings → General →
Social preview) for link unfurls on Twitter/X, Slack, Discord, and
LinkedIn. None is configured yet. Recommended source: the Dashboard
screenshot (`docs/screenshots/01-dashboard.png`, currently 1440×900) —
crop to 1280×640 keeping the stat tiles and status-distribution bar in
frame, since those communicate "this is a real, running product" in a
thumbnail-sized preview better than the logo alone would. Do not use the
plain logo/wordmark by itself as the social preview — it reads as a
concept, not working software, at thumbnail size.

## Suggested repository name

`sentinel` if available; if a public GitHub org already has that name
taken (likely, given how generic it is), `sentinel-masumi` or
`masumi-sentinel` are the fallbacks that keep the Masumi association
visible in search and in every clone URL.

## Branch protection (once collaborators exist)

Not urgent for a solo-maintained v0.1.0, but worth setting before adding
contributors: require the `verify` CI job to pass before merging to
`main`, and require at least one review on pull requests once there's more
than one maintainer to review them.
