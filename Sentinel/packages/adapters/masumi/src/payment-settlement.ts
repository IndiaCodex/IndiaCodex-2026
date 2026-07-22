import { sha256Hex } from "@sentinel/domain";

export interface PaymentSettlementRequest {
  readonly paymentId: string;
  readonly amount: string;
  readonly currency: string;
  /** Forces a specific outcome, for exercising the failure path in tests/demos. Defaults to `"confirmed"`. */
  readonly outcome?: "confirmed" | "failed";
}

export interface PaymentSettlementResult {
  readonly state: "confirmed" | "failed";
  readonly masumiReference: string;
}

/**
 * Simulates asking Masumi's Payment Service to settle a payment. Stands
 * in for a real Masumi payment API call: same request/result shape a
 * live client would have, so swapping this out later is a matter of
 * replacing this function's body, not any of its callers.
 */
export async function simulatePaymentSettlement(
  request: PaymentSettlementRequest,
): Promise<PaymentSettlementResult> {
  const reference = await deterministicMasumiReference(request.paymentId);
  return {
    state: request.outcome ?? "confirmed",
    masumiReference: reference,
  };
}

async function deterministicMasumiReference(paymentId: string): Promise<string> {
  const digest = await sha256Hex({ paymentId, salt: "masumi-mock-reference" });
  return `masumi_tx_${digest.slice(0, 12)}`;
}
