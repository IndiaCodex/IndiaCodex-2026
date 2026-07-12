import { IEmulatorPortToken } from "@forge/application";
import type { ForgePlugin } from "@forge/plugin-api";
import { InMemoryEmulator } from "./in-memory-emulator.js";

export function createEmulatorPlugin(): ForgePlugin {
  return {
    name: "@forge/adapter-emulator",
    version: "0.0.0",
    register: (context) => {
      context.bindPort(IEmulatorPortToken, new InMemoryEmulator());
    },
  };
}
