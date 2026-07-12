import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ouro/offchain is an unbuilt workspace package (TS source, no build
  // step) - this tells Next.js to transpile it instead of treating it as
  // pre-built node_modules.
  transpilePackages: ["@ouro/offchain"],
  // Explicit workspace root (the ouro/ npm workspace) so Turbopack doesn't
  // have to guess between this app's directory and the workspace root.
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  // The production build's serverless-function bundler (output file tracing)
  // only follows `fs` reads it can statically resolve. blueprint.ts and
  // deployment.ts read onchain/plutus.json and offchain/deployments/*.json
  // via paths relative to their OWN file, one workspace package away from
  // web/ - without these, a host that packages each API route as an isolated
  // function (e.g. Netlify) ships a function missing the JSON it needs at
  // runtime, and every /api/* route that touches the vault 500s.
  outputFileTracingRoot: path.join(__dirname, ".."),
  outputFileTracingIncludes: {
    "/api/**/*": [
      "../onchain/plutus.json",
      "../offchain/deployments/*.json",
    ],
  },
};

export default nextConfig;
