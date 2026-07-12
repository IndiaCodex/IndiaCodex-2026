/**
 * Real, confirmed transactions on Cardano Preprod — the on-chain proof shown in the UI.
 * Update these if you run new settlements (`npm run claim` / `npm run batch` print the hashes).
 */

export const EXPLORER = "https://preprod.cardanoscan.io";

export const CONTRACT_ADDRESS =
  "addr_test1wrdmud86ufl4f5mgq03uxlgg9474mxfzvytz0jglqz56g3s589ysn";

export interface ProofTx {
  label: string;
  desc: string;
  txHash: string;
  feeLovelace?: number;
  highlight?: boolean;
}

export const PROOF_TXS: ProofTx[] = [
  {
    label: "Full batch (N_max)",
    desc: "6 claims → 1 transaction",
    txHash: "c54c38023e419e655d0c8b89e1127f887d947bc88966ae99f6c5345f77e48484",
    feeLovelace: 772246,
    highlight: true,
  },
  {
    label: "Settled from this app",
    desc: "batch submitted via the UI",
    txHash: "c4bea1af24616febb33990a9315e34cf45518ab12de5e6c9088962ac621efb90",
    feeLovelace: 352138,
  },
  {
    label: "Deploy tickets",
    desc: "seeded Open tickets",
    txHash: "70bc0c84d8839cf503b254ac820afc6ea95f6ab09793253dbaf5505a6afdbdcf",
  },
];
