## What does this change?

<!-- One or two sentences. What problem does it solve, or what capability does it add? -->

## Which package(s)?

<!-- e.g. adapter-aiken, cli, contract-templates. If this touches domain/plugin-api/application, say so explicitly — see the review bar in CONTRIBUTING.md. -->

## Checklist

- [ ] `pnpm format:check && pnpm lint && pnpm build && pnpm test` all pass locally
- [ ] `pnpm test:integration` passes locally (required if this touches `adapter-aiken`, `cli`, or anything that shells out to a real tool)
- [ ] New/changed behavior has real tests, not just a type-check
- [ ] If this adds a package: it has a `README.md` and is wired into the root `tsconfig.json`'s `references`
- [ ] If this touches `domain`, `plugin-api`, or `application`: I opened an issue to discuss the change before this PR, or explained why that wasn't necessary
- [ ] Docs updated if this changes user-facing behavior (`README.md`, the relevant `docs/*.md`, or the package's own `README.md`)

## Anything else reviewers should know?

<!-- Trade-offs considered, things deliberately left out of scope, etc. -->
