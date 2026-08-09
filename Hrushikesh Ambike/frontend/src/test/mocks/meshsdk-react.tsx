import type { ReactNode } from "react";
import { vi } from "vitest";

/**
 * Test double for `@meshsdk/react`'s public surface.
 *
 * Why this exists: `@meshsdk/react`'s bundled entry point unconditionally
 * imports `@utxos/sdk` (Mesh's optional cross-chain web3/social-login
 * feature) at module scope, which in turn imports `@meshsdk/bitcoin` ->
 * `bip32`. `bip32` eagerly self-tests its asm.js secp256k1 implementation
 * on import, and that self-test throws under Vitest's jsdom environment
 * (confirmed: neither `resolve.alias` nor `server.deps.inline` +
 * `vi.mock("bip32")` intercept it, because it is reached through a `require()`
 * inside prebuilt CJS several layers deep — see Vitest's own docs: "Vitest
 * does not support aliasing require calls"). Ouro is Cardano-only and never
 * exercises that code path.
 *
 * This mock reproduces the exact shape of `useWallet()`, `useWalletList()`,
 * and `MeshProvider` as verified from `node_modules/@meshsdk/react/dist/index.d.ts`
 * so that `WalletConnect.tsx` and `AppShell.tsx` are exercised unmodified
 * against a realistic contract. It does not touch the real Next.js build —
 * it is wired only via `vitest.config.ts` -> `resolve.alias` for the test
 * run.
 */

export const mockUseWallet = vi.fn(() => ({
  name: undefined as string | undefined,
  connecting: false,
  connected: false,
  wallet: {
    getChangeAddress: vi.fn(async () => "addr_test1mockaddress0000000000"),
  },
  connect: vi.fn(async () => {}),
  disconnect: vi.fn(),
}));

export const mockUseWalletList = vi.fn(() => [] as Array<{
  id: string;
  name: string;
  icon: string;
  version: string;
}>);

export function MeshProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useWallet() {
  return mockUseWallet();
}

export function useWalletList() {
  return mockUseWalletList();
}
