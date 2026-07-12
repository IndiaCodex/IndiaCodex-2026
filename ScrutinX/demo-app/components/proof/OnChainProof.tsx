"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatAda, shortHash } from "@/lib/format";
import { EXPLORER, CONTRACT_ADDRESS, PROOF_TXS } from "@/lib/onchainProof";

export function OnChainProof() {
  return (
    <Card
      title="Verified on-chain · Cardano Preprod"
      right={<Badge tone="success">● live &amp; public</Badge>}
    >
      <p className="mb-3 text-xs text-muted">
        Real, confirmed transactions — anyone can verify them. Click a card to open Cardanoscan.
      </p>

      <div className="grid gap-2 sm:grid-cols-3">
        {PROOF_TXS.map((t) => (
          <a
            key={t.txHash}
            href={`${EXPLORER}/transaction/${t.txHash}`}
            target="_blank"
            rel="noreferrer"
            className={`block rounded-lg border p-3 transition hover:border-accent ${
              t.highlight
                ? "border-success/50 bg-success/10"
                : "border-border bg-surface2"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{t.label}</span>
              {t.highlight && <Badge tone="success">★</Badge>}
            </div>
            <div className="mt-0.5 text-xs text-muted">{t.desc}</div>
            <div className="mt-2 truncate font-mono text-[11px] text-accent">
              {shortHash(t.txHash)} ↗
            </div>
            {t.feeLovelace != null && (
              <div className="mt-1 text-[11px] text-muted">fee {formatAda(t.feeLovelace)}</div>
            )}
          </a>
        ))}
      </div>

      <a
        href={`${EXPLORER}/address/${CONTRACT_ADDRESS}`}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block text-xs text-accent underline"
      >
        View the smart-contract address (all tickets + activity) ↗
      </a>
    </Card>
  );
}
