# @forge/adapter-aiken

Real Aiken compiler integration — implements `IAikenCompilerPort`.

## What it does

- Resolves the actual Aiken binary via the `@aiken-lang/aiken` npm
  package (no `PATH` dependency).
- `ensureProject` writes a real `aiken.toml` if one doesn't already exist
  (idempotent).
- `build` runs `aiken build` and parses the resulting `plutus.json`
  (CIP-57 blueprint) into the domain `Blueprint` type — filtering out the
  compiler-generated `.else` fallback purpose, which has no meaningful
  datum/redeemer interface of its own.
- `test` runs `aiken check` and parses its JSON test report into domain
  `TestResult`s.

## Testing

Fast unit tests (`*.test.ts`) exercise the parsers against JSON captured
verbatim from real compiler output — no network or binary required.
`aiken-compiler-adapter.integration.test.ts` really shells out to the
compiler and needs network access the first time (to fetch
`aiken-lang/stdlib`); run it via `pnpm test:integration` from the repo
root, not the default `pnpm test`.
