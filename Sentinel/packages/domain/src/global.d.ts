/**
 * Minimal ambient declarations for the Web Crypto and TextEncoder APIs
 * this package relies on (`src/shared/hash.ts`, `src/shared/random.ts`).
 * Deliberately narrower than TypeScript's "dom" lib: pulling in "dom"
 * would also expose `window`/`document`/`fetch` and hundreds of
 * unrelated browser globals to a package that must run identically in
 * Node, browsers, and edge runtimes without assuming any of them.
 */
declare global {
  interface Crypto {
    getRandomValues: <T extends Uint8Array>(array: T) => T;
    readonly subtle: SubtleCrypto;
  }

  interface SubtleCrypto {
    digest: (algorithm: string, data: Uint8Array) => Promise<ArrayBuffer>;
  }

  // eslint-disable-next-line no-var -- ambient global declaration requires `var`
  var crypto: Crypto;

  class TextEncoder {
    encode(input?: string): Uint8Array;
  }
}

export {};
