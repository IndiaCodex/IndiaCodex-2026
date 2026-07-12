export interface Utxo {
  readonly txHash: string;
  readonly outputIndex: number;
  readonly address: string;
  readonly assets: Readonly<Record<string, bigint>>;
  readonly datum?: string;
}

export interface Wallet {
  readonly address: string;
  readonly utxos: readonly Utxo[];
}
