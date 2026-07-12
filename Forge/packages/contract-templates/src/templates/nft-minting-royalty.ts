import type { ContractTemplate } from "@forge/domain";

/**
 * `royaltyBeneficiaryHash` has no natural-language extraction path (only
 * numeric parameters are extracted from free text — see
 * `adapter-ai/parameter-extractor.ts`), so it ships with a clearly-labeled
 * placeholder default. A real deployment must replace it with the real
 * recipient's 28-byte verification key hash before the royalty check means
 * anything; the validator enforces payment to whatever hash is compiled
 * in, placeholder or not.
 */
export const nftMintingRoyaltyTemplate: ContractTemplate = {
  id: "nft-minting-royalty",
  name: "NFT Minting with Royalties",
  description:
    "Mints a single unit of a named NFT, requiring a royalty payment to a fixed " +
    "beneficiary as a percentage of a fixed mint price, enforced by the minting policy itself.",
  category: "nft-minting-royalty",
  useCases: ["NFT marketplaces", "Creator royalties"],
  parameters: [
    {
      name: "royaltyPercent",
      type: "number",
      description: "the royalty percentage (0-100) paid to the royalty beneficiary on every mint",
      required: true,
      defaultValue: 5,
    },
    {
      name: "mintPriceLovelace",
      type: "number",
      description:
        "the fixed mint price, in lovelace, the royalty percentage is calculated against",
      required: true,
      defaultValue: 100_000_000,
    },
    {
      name: "assetName",
      type: "string",
      description: "the asset name of the minted NFT",
      required: true,
      defaultValue: "ForgeNFT",
    },
    {
      name: "royaltyBeneficiaryHash",
      type: "address",
      description:
        "the 28-byte verification key hash (hex-encoded) of the royalty beneficiary — " +
        "the shipped default is a placeholder and must be replaced with a real recipient's " +
        "key hash before this template is used for anything beyond a demo",
      required: true,
      defaultValue: "0".repeat(56),
    },
  ],
  sourceTemplate: `use aiken/collection/list
use cardano/address.{VerificationKey}
use cardano/assets.{AssetName, PolicyId}
use cardano/transaction.{Transaction}

const asset_name: AssetName = "{{assetName}}"
const royalty_percent: Int = {{royaltyPercent}}
const mint_price_lovelace: Int = {{mintPriceLovelace}}
const royalty_beneficiary: ByteArray = #"{{royaltyBeneficiaryHash}}"

pub type MintRedeemer {
  MintNFT
}

validator nft_minting_royalty {
  mint(redeemer: MintRedeemer, policy_id: PolicyId, self: Transaction) -> Bool {
    when redeemer is {
      MintNFT -> {
        let minted_quantity = assets.quantity_of(self.mint, policy_id, asset_name)
        let royalty_due = mint_price_lovelace * royalty_percent / 100
        let royalty_paid =
          list.any(
            self.outputs,
            fn(output) {
              when output.address.payment_credential is {
                VerificationKey(hash) ->
                  hash == royalty_beneficiary && assets.lovelace_of(output.value) >= royalty_due
                _ -> False
              }
            },
          )
        minted_quantity == 1 && royalty_paid
      }
    }
  }
}
`,
};
