import { describe, expect, it } from "vitest";
import { simulatePaymentSettlement } from "../src/payment-settlement.js";

describe("simulatePaymentSettlement", () => {
  it("defaults to a confirmed outcome", async () => {
    const result = await simulatePaymentSettlement({
      paymentId: "pay_1",
      amount: "4.50",
      currency: "ADA",
    });

    expect(result.state).toBe("confirmed");
    expect(result.masumiReference).toMatch(/^masumi_tx_[0-9a-f]{12}$/);
  });

  it("honors an explicit failed outcome, for exercising the failure path", async () => {
    const result = await simulatePaymentSettlement({
      paymentId: "pay_2",
      amount: "4.50",
      currency: "ADA",
      outcome: "failed",
    });

    expect(result.state).toBe("failed");
  });

  it("produces a different reference for a different paymentId", async () => {
    const a = await simulatePaymentSettlement({ paymentId: "pay_a", amount: "1", currency: "ADA" });
    const b = await simulatePaymentSettlement({ paymentId: "pay_b", amount: "1", currency: "ADA" });

    expect(a.masumiReference).not.toBe(b.masumiReference);
  });
});
