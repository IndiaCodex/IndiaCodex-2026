## Summary

What does this change, and why?

## Related issue

Closes #

## Checklist

- [ ] `pnpm verify` passes locally (build → lint → typecheck → test)
- [ ] Tests added or updated for the behavior this PR changes
- [ ] `pnpm exec vitest run` was run more than once — this project has hit
      real flaky tests before (see [`docs/development.md`](../docs/development.md#testing));
      a single green run isn't sufficient evidence for anything touching
      hashes, generated IDs, or timestamps
- [ ] Docs updated if this changes behavior described in `README.md`,
      `docs/`, or an ADR (a changed decision gets a **new** ADR that
      supersedes the old one — ADRs are not edited after acceptance)
- [ ] No new dependency direction violation (`domain` still depends on
      nothing else in this repo — see `docs/architecture.md` §1)

## Screenshots

If this touches `apps/web`, include a before/after screenshot or short clip.

## Anything reviewers should know

Trade-offs made, things deliberately left out of scope, or open questions.
