import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // This project sits on an exFAT/SMB volume that auto-generates AppleDouble
    // sidecar files (e.g. "._smoke.test.ts") next to every real file. Exclude
    // them explicitly alongside the standard excludes.
    exclude: ["**/node_modules/**", "**/dist/**", "**/._*"],
  },
});
