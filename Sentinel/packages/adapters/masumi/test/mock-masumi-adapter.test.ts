import { describe, expect, it } from "vitest";
import { MockMasumiAdapter } from "../src/mock-masumi-adapter.js";

describe("MockMasumiAdapter", () => {
  const adapter = new MockMasumiAdapter();

  it("passes a 'requested' payment through unchanged (nothing to enrich yet)", async () => {
    const payload = {
      phase: "requested" as const,
      paymentId: "pay_1",
      amount: "4.50",
      currency: "ADA",
    };

    expect(await adapter.enrichPayment(payload)).toEqual(payload);
  });

  it("fills in a masumiReference for a 'completed' payment that's missing one", async () => {
    const enriched = await adapter.enrichPayment({
      phase: "completed",
      paymentId: "pay_1",
      amount: "4.50",
      currency: "ADA",
      state: "confirmed",
    });

    expect(enriched.masumiReference).toBeDefined();
    expect(enriched.masumiReference).toMatch(/^masumi_tx_/);
  });

  it("leaves an existing masumiReference untouched", async () => {
    const payload = {
      phase: "completed" as const,
      paymentId: "pay_1",
      amount: "4.50",
      currency: "ADA",
      state: "confirmed" as const,
      masumiReference: "already-set",
    };

    expect(await adapter.enrichPayment(payload)).toEqual(payload);
  });

  it("is deterministic: the same paymentId always gets the same reference", async () => {
    const first = await adapter.enrichPayment({
      phase: "completed",
      paymentId: "pay_stable",
      amount: "1.00",
      currency: "ADA",
      state: "confirmed",
    });
    const second = await adapter.enrichPayment({
      phase: "completed",
      paymentId: "pay_stable",
      amount: "1.00",
      currency: "ADA",
      state: "confirmed",
    });

    expect(first.masumiReference).toBe(second.masumiReference);
  });
});
