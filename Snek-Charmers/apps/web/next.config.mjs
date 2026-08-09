import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Mesh SDK bundles WebAssembly (cardano-serialization-lib et al.).
  // These experiments let webpack load the .wasm modules in both server and client bundles.
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
      topLevelAwait: true,
    };

    // `libsodium-wrappers-sumo` (pulled in via @meshsdk -> @cardano-sdk/crypto) ships a
    // broken ESM build whose `import` entry references a sibling `./libsodium-sumo.mjs`
    // that isn't published. Force the working CommonJS build instead.
    config.resolve.alias = {
      ...config.resolve.alias,
      "libsodium-wrappers-sumo": path.join(
        __dirname,
        "node_modules/libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers.js"
      ),
    };

    return config;
  },
};

export default nextConfig;
