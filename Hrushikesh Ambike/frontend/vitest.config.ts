import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Exclude macOS AppleDouble sidecar files (`._*`) that this project's
    // exFAT volume creates next to every file — they match the test glob but
    // are binary metadata, not tests.
    exclude: [...configDefaults.exclude, "**/._*"],
    css: false,
    server: {
      deps: {
        // framer-motion is hoisted to the workspace root while react lives
        // in web/node_modules, so Node's own resolver can't link the two.
        // Inlining routes framer-motion through Vite, where the react alias
        // below applies. (Next.js aliases react itself, so the real build
        // does not need this.)
        inline: ["motion", "framer-motion"],
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      // See src/test/mocks/meshsdk-react.tsx for why @meshsdk/react is
      // stubbed at the module boundary for the test run only.
      "@meshsdk/react": path.resolve(
        __dirname,
        "./src/test/mocks/meshsdk-react.tsx",
      ),
    },
  },
});
