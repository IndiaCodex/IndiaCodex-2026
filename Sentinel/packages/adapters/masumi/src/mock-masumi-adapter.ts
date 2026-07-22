import type { MasumiAdapterPort, PaymentPayload } from "@sentinel/domain";
import { simulatePaymentSettlement } from "./payment-settlement.js";

/**
 * Implements `MasumiAdapterPort` against a simulated Masumi Payment
 * Service rather than a live one. A `requested` payment has nothing to
 * enrich yet — Masumi hasn't produced an outcome — so it passes
 * through unchanged. A `completed` payment that's missing a
 * `masumiReference` gets one filled in, standing in for what a real
 * registry/payment-service lookup would return.
 */
export class MockMasumiAdapter implements MasumiAdapterPort {
  async enrichPayment(payload: PaymentPayload): Promise<PaymentPayload> {
    if (payload.phase === "requested" || payload.masumiReference) {
      return payload;
    }

    const settlement = await simulatePaymentSettlement({
      paymentId: payload.paymentId,
      amount: payload.amount,
      currency: payload.currency,
    });

    return { ...payload, masumiReference: settlement.masumiReference };
  }
}
