import { ISdkGeneratorPortToken } from "@forge/application";
import type { ForgePlugin } from "@forge/plugin-api";
import { SdkGeneratorAdapter } from "./sdk-generator-adapter.js";

export function createCodegenTsPlugin(): ForgePlugin {
  return {
    name: "@forge/adapter-codegen-ts",
    version: "0.0.0",
    register: (context) => {
      context.bindPort(ISdkGeneratorPortToken, new SdkGeneratorAdapter());
    },
  };
}
