/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lucid Evolution + its CML/UPLC deps ship WASM that Next's bundler mishandles. Marking them as
  // external server packages makes the API routes load them from node_modules at runtime (WASM resolves).
  experimental: {
    serverComponentsExternalPackages: [
      "@lucid-evolution/lucid",
      "@lucid-evolution/uplc",
      "@anastasia-labs/cardano-multiplatform-lib-nodejs",
    ],
  },
};

export default nextConfig;
