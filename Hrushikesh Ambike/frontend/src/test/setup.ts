import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL only auto-cleans between tests when Vitest globals are enabled; this
// project keeps globals off, so unmount rendered trees explicitly.
afterEach(() => {
  cleanup();
});

/**
 * `@meshsdk/react` transitively pulls in `@utxos/sdk` (Mesh's optional
 * cross-chain web3/social-login feature), which imports `@meshsdk/bitcoin`
 * -> `bip32` at module scope. `bip32` eagerly self-tests its asm.js
 * secp256k1 implementation on import, which throws under Vitest's jsdom
 * environment. Ouro is Cardano-only — nothing in this app exercises a
 * Bitcoin/BIP32 code path — so `bip32` is mocked out here to keep the
 * module graph loadable. This has no effect on the real Next.js build,
 * only on the Vitest run.
 */
vi.mock("bip32", () => ({
  default: () => ({}),
  BIP32Factory: () => ({}),
}));

/**
 * jsdom ships neither IntersectionObserver, ResizeObserver, nor matchMedia.
 * The landing page's motion components (whileInView reveals, scroll
 * progress, useReducedMotion) touch all three, so minimal no-op stands-ins
 * are installed here. Rendering correctness is asserted in tests; animation
 * behavior is verified visually in the browser, not in jsdom.
 */
class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

vi.stubGlobal("IntersectionObserver", ObserverStub);
vi.stubGlobal("ResizeObserver", ObserverStub);

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
