"use client";

import { RequestStream } from "@/components/requests/RequestStream";
import { Card } from "@/components/ui/Card";

export function NaivePanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-danger">
        Naive path — before
      </h2>
      <RequestStream />
      <Card title="What happens on-chain">
        <p className="text-sm text-muted">
          Each request is its own transaction. Requests targeting the same ticket UTXO collide — only
          one can spend it per block, so the rest{" "}
          <span className="font-medium text-danger">fail on-chain</span> and still pay fees.
        </p>
      </Card>
    </div>
  );
}
