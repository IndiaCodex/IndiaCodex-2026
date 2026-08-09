import type { Blueprint } from "@forge/domain";
import { createPortToken } from "@forge/plugin-api";
import type { PortToken } from "@forge/plugin-api";

export interface ISdkGeneratorPort {
  generate(blueprint: Blueprint, outDir: string): Promise<readonly string[]>;
}

export const ISdkGeneratorPortToken: PortToken<ISdkGeneratorPort> =
  createPortToken<ISdkGeneratorPort>("ISdkGeneratorPort");
