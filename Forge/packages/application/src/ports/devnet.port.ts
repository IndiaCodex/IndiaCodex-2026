import { createPortToken } from "@forge/plugin-api";
import type { PortToken } from "@forge/plugin-api";

export interface IDevnetPort {
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): Promise<boolean>;
}

export const IDevnetPortToken: PortToken<IDevnetPort> = createPortToken<IDevnetPort>("IDevnetPort");
