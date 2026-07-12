import { IAikenCompilerPortToken } from "@forge/application";
import type { ForgePlugin } from "@forge/plugin-api";
import { AikenCompilerAdapter } from "./aiken-compiler-adapter.js";

export function createAikenPlugin(): ForgePlugin {
  return {
    name: "@forge/adapter-aiken",
    version: "0.0.0",
    register: (context) => {
      context.bindPort(IAikenCompilerPortToken, new AikenCompilerAdapter());
    },
  };
}
