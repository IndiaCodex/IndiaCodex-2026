"use client";

import dynamic from "next/dynamic";

// Load all Mesh UI client-only: Mesh depends on WASM that cannot run during
// Next's server prerender, so ssr:false keeps it out of the server bundle.
const LaunchpadHome = dynamic(() => import("@/components/LaunchpadHome"), {
  ssr: false,
  loading: () => (
    <main className="grid min-h-screen place-items-center">
      <p className="rocket-bob font-display text-2xl">🚀</p>
    </main>
  ),
});

export default function Page() {
  return <LaunchpadHome />;
}
