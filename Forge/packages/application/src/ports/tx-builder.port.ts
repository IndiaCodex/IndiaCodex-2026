import type { Network } from "@forge/domain";
import { createPortToken } from "@forge/plugin-api";
import type { PortToken } from "@forge/plugin-api";

export interface TransactionRequest {
  readonly network: Network;
  readonly description: string;
  readonly payload: Readonly<Record<string, unknown>>;
}

export interface ITxBuilderPort {
  buildAndSubmit(request: TransactionRequest): Promise<string>;
}

export const ITxBuilderPortToken: PortToken<ITxBuilderPort> =
  createPortToken<ITxBuilderPort>("ITxBuilderPort");
