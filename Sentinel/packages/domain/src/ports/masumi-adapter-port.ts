import type { PaymentPayload } from "../events/payloads.js";

/**
 * Enriches a captured payment with live Masumi registry/payment state.
 * Called by `CaptureEventUseCase` while a Payment event is being
 * written to the Journal — Sentinel's live touchpoint with Masumi
 * during the normal execution lifecycle, not just at export time.
 * Never load-bearing: a rejected promise here is "no enrichment
 * available," not a failure of capture — the Payment Timeline must
 * always be reconstructable from captured data alone, whether or not
 * Masumi was reachable at the moment of capture.
 */
export interface MasumiAdapterPort {
  enrichPayment(payload: PaymentPayload): Promise<PaymentPayload>;
}
