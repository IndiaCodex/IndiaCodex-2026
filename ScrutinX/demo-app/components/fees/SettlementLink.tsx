"use client";

import { useBatcherStore } from "@/stores/useBatcherStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { shortHash, formatAda } from "@/lib/format";

export function SettlementLink() {
  const results = useBatcherStore((s) => s.results);

  return (
    <Card title="Recent settlements">
      {results.length === 0 ? (
        <p className="py-3 text-sm text-muted">No settlements yet.</p>
      ) : (
        <div className="max-h-56 space-y-1.5 overflow-y-auto">
          {results.slice(0, 12).map((r, i) => (
            <div
              key={`${r.txHash}-${i}`}
              className="flex items-center justify-between rounded-md bg-surface2 px-2.5 py-1.5 text-xs"
            >
              <Badge tone={r.mode === "real" ? "success" : "default"}>{r.mode}</Badge>
              <span className="text-muted">{r.batchSize} claims</span>
              <span className="nums text-success">−{formatAda(r.savedLovelace)}</span>
              {r.explorerUrl ? (
                <a
                  href={r.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-accent underline"
                >
                  {shortHash(r.txHash)}
                </a>
              ) : (
                <span className="font-mono text-muted">{shortHash(r.txHash)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
