/** Raised for a CLI-level failure (bad arguments, no snapshot available) — always maps to exit code 2, never conflated with a compatibility result (docs/architecture/interfaces.md). */
export class CliToolError extends Error {}
