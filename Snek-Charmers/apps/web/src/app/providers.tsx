"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

// MeshProvider is loaded client-only (ssr:false) so Mesh's WASM is never pulled
// into the server prerender. This is a client component, so ssr:false is allowed.
const MeshProvider = dynamic(
  () => import("@meshsdk/react").then((m) => m.MeshProvider),
  { ssr: false }
);

/**
 * Client-side provider wrapper exposing wallet connection state
 * (useWallet, useWalletList, CardanoWallet) to the app.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <MeshProvider>{children}</MeshProvider>;
}
