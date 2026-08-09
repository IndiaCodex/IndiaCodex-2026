"use client";

import { shortAddress } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import { Copy, Wallet } from "lucide-react";

export function WalletBadge({ address }: { address: string }) {
  const { toast } = useToast();
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(address);
        toast("success", "Address copied");
      }}
      className="glass flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-muted transition-colors hover:text-white cursor-pointer"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan/15">
        <Wallet className="h-3 w-3 text-cyan" />
      </span>
      <span className="font-mono">{shortAddress(address)}</span>
      <Copy className="h-3 w-3 opacity-60" />
    </button>
  );
}
