"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { api, ApiError, randomDemoWallet, type TransactionOut, type WalletOut } from "@/lib/api";
import { formatAda, formatDateTime, shortAddress } from "@/lib/format";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Loader2, Wallet } from "lucide-react";
import * as React from "react";

export default function WalletPage() {
  const { toast } = useToast();
  const [wallets, setWallets] = React.useState<WalletOut[]>([]);
  const [txs, setTxs] = React.useState<TransactionOut[]>([]);
  const [linking, setLinking] = React.useState(false);

  const load = React.useCallback(() => {
    api.wallets.list().then(setWallets).catch(() => {});
    api.transactions.mine().then(setTxs).catch(() => {});
  }, []);

  React.useEffect(load, [load]);

  async function linkDemoWallet() {
    setLinking(true);
    const address = randomDemoWallet();
    try {
      await api.wallets.challenge(address);
      // Dev mode: mock signature. Production: CIP-30 wallet signs the nonce.
      await api.wallets.verify(address, `mock:${address}`);
      toast("success", "Wallet linked", "Signature verified against the challenge nonce.");
      load();
    } catch (err) {
      toast("error", "Linking failed", err instanceof ApiError ? err.message : "Backend unreachable.");
    } finally {
      setLinking(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Wallet"
        description="Linked wallets (proven by signature) and your real transaction ledger."
        actions={
          wallets.length === 0 ? (
            <Button onClick={linkDemoWallet} disabled={linking}>
              {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
              Link demo wallet
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Linked wallets</CardTitle>
            {wallets.length > 0 && <Badge variant="success" dot>Verified</Badge>}
          </CardHeader>
          {wallets.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No wallet linked"
              description="Link the demo wallet to enable premium deposits (mock CIP-8 flow)."
            />
          ) : (
            <div className="space-y-2">
              {wallets.map((w) => (
                <div key={w.id} className="rounded-xl bg-white/[0.04] px-4 py-3">
                  <p className="font-mono text-sm">{shortAddress(w.address, 8)}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald">
                    <CheckCircle2 className="h-3.5 w-3.5" /> CIP-8 verified · {w.network}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-0 lg:col-span-2">
          <div className="p-6 pb-0"><CardTitle>Transaction history (live)</CardTitle></div>
          {txs.length === 0 ? (
            <EmptyState icon={ArrowDownLeft} title="No transactions yet" description="Buy a policy and your premium will appear here." />
          ) : (
            <Table className="mt-2">
              <THead>
                <TR><TH>Type</TH><TH>Hash</TH><TH>Amount</TH><TH>Status</TH><TH>When</TH></TR>
              </THead>
              <TBody>
                {txs.map((t) => (
                  <TR key={t.id}>
                    <TD>
                      <span className="flex items-center gap-2 capitalize">
                        {t.direction === "in" ? (
                          <ArrowDownLeft className="h-4 w-4 text-emerald" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-violet" />
                        )}
                        {t.type}
                      </span>
                    </TD>
                    <TD className="max-w-40 truncate font-mono text-xs text-subtle">{t.tx_hash}</TD>
                    <TD className={t.direction === "in" ? "font-medium text-emerald" : "font-medium"}>
                      {t.direction === "in" ? "+" : "−"}{formatAda(t.amount_lovelace, 1)}
                    </TD>
                    <TD><Badge variant="success">{t.status}</Badge></TD>
                    <TD className="text-muted">{formatDateTime(t.created_at)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
