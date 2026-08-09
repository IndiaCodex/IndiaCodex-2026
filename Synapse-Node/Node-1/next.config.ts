import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "node:buffer": "buffer",
      "node:crypto": "crypto-browserify",
      "node:process": "process/browser",
      "node:stream": "stream-browserify",
    };
    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      buffer: require.resolve("buffer/"),
      crypto: require.resolve("crypto-browserify"),
      process: require.resolve("process/browser"),
      stream: require.resolve("stream-browserify"),
    };
    config.plugins = [
      ...(config.plugins ?? []),
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request?: string }) => {
        resource.request = resource.request?.replace(/^node:/, "");
      }),
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"],
        process: "process/browser",
      }),
    ];
    return config;
  },
};

export default nextConfig;
