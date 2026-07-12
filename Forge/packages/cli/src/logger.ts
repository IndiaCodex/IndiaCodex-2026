import type { Logger } from "@forge/plugin-api";

/**
 * Keeps demo output focused: the CLI's own progress narrator plugin and
 * command output already say everything a demo audience needs, so
 * routine info-level plumbing (e.g. "Plugin loaded: ...") is silenced
 * here rather than interleaved. Warnings and errors still surface.
 */
export function createConsoleLogger(): Logger {
  return {
    debug: () => {},
    info: () => {},
    warn: (message) => {
      console.warn(message);
    },
    error: (message) => {
      console.error(message);
    },
  };
}
