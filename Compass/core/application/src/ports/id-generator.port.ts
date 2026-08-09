/**
 * The only source of new identifiers a use case is allowed to consult —
 * injected for the same reason as ClockPort: deterministic tests, and no
 * hidden randomness anywhere an Evidence trail depends on stable ids.
 */
export interface IdGeneratorPort {
  next(kind: string): string;
}
