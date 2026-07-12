// Pure PlutusData-JSON encoders mirroring the on-chain types in
// ouro/onchain/lib/ouro/types.ak. Constructor indices verified against the
// compiled blueprint (ouro/onchain/plutus.json definitions), never guessed:
// Tier: Bronze=0, Silver=1, Gold=2.
// VaultRedeemer: Borrow=0 (no fields), Repay=1(Int), Harvest=2, Close=3.
import { byteString, conStr, conStr0, integer } from "@meshsdk/core";

export type Tier = "Bronze" | "Silver" | "Gold";

const TIER_INDEX: Record<Tier, number> = { Bronze: 0, Silver: 1, Gold: 2 };

export function buildTierDatum(tier: Tier) {
  return conStr(TIER_INDEX[tier], []);
}

export interface VaultDatumFields {
  ownerVkh: string;
  principalTusdm: number;
  collateralLovelace: number;
  tierAtOpen: Tier;
}

/** Field order matches VaultDatum's declaration in ouro/types.ak exactly. */
export function buildVaultDatum(fields: VaultDatumFields) {
  return conStr0([
    byteString(fields.ownerVkh),
    integer(fields.principalTusdm),
    integer(fields.collateralLovelace),
    buildTierDatum(fields.tierAtOpen),
  ]);
}

export function buildBorrowRedeemer() {
  return conStr0([]);
}

export function buildRepayRedeemer(amountTusdm: number) {
  return conStr(1, [integer(amountTusdm)]);
}

export function buildHarvestRedeemer() {
  return conStr(2, []);
}

export function buildCloseRedeemer() {
  return conStr(3, []);
}
