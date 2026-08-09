import { ILanguageModelPortToken } from "@forge/application";
import type { ForgePlugin } from "@forge/plugin-api";
import { LocalLanguageModelAdapter } from "./local-language-model-adapter.js";

export function createAiPlugin(): ForgePlugin {
  return {
    name: "@forge/adapter-ai",
    version: "0.0.0",
    register: (context) => {
      context.bindPort(ILanguageModelPortToken, new LocalLanguageModelAdapter());
    },
  };
}
