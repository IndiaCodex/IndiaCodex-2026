/**
 * Minimal ambient declaration for the Web `TextEncoder` API this
 * package relies on (`json-export-adapter.ts`). Deliberately narrower
 * than TypeScript's "dom" lib — see `@sentinel/domain/src/global.d.ts`
 * for the full rationale; each package that touches a Web-standard
 * global declares only what it uses, rather than pulling in "dom"
 * wholesale (ambient globals don't propagate across package
 * boundaries, so this can't simply be inherited from domain).
 */
declare global {
  class TextEncoder {
    encode(input?: string): Uint8Array;
  }
}

export {};
