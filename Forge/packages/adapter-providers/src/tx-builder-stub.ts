import type { ITxBuilderPort, TransactionRequest } from "@forge/application";

/**
 * No real off-chain transaction-building pipeline exists yet (that
 * requires integrating a real tx builder against a live or emulated
 * node — out of scope for this phase). This stub exists only so
 * DeployUseCase has something to construct with; it is never actually
 * invoked by the escrow-milestone template today, since that template
 * requires no setup transactions.
 */
export class NotImplementedTxBuilder implements ITxBuilderPort {
  buildAndSubmit(request: TransactionRequest): Promise<string> {
    return Promise.reject(
      new Error(
        `No real transaction-building pipeline is implemented yet (requested: ${request.description}).`,
      ),
    );
  }
}
