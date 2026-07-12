import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyParamsToScript,
  byteString,
  resolveScriptHash,
  type PlutusScript,
} from "@meshsdk/core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLUEPRINT_PATH = resolve(__dirname, "../../onchain/plutus.json");

type BlueprintValidator = {
  title: string;
  compiledCode: string;
  hash: string;
};

type Blueprint = {
  validators: BlueprintValidator[];
};

function loadBlueprint(): Blueprint {
  return JSON.parse(readFileSync(BLUEPRINT_PATH, "utf-8"));
}

function findValidator(
  blueprint: Blueprint,
  title: string,
): BlueprintValidator {
  const found = blueprint.validators.find((v) => v.title === title);
  if (!found) {
    throw new Error(`Validator not found in blueprint: ${title}`);
  }
  return found;
}

export type Validators = {
  // Parameterized per owner - this is what gives each user their own
  // script hash, which in turn gives each user their own stake credential
  // and reward account (see onchain/validators/vault.ak). reserve.ak no
  // longer needs to know vault's hash (it's gated on an admin signature
  // instead), so there's no constraint forcing vault to be single-shared.
  vault: (
    ownerVkh: string,
    tusdmPolicy: string,
    tusdmAssetName: string,
    oracleHash: string,
    reputationHash: string,
  ) => PlutusScript;
  reserve: (adminVkh: string) => PlutusScript;
  oracle: (oracleVkh: string) => PlutusScript;
  // Takes zero parameters (reputation.ak) - one canonical script shared by
  // every user, unlike vault which is parameterized per owner.
  reputation: () => PlutusScript;
};

export function loadValidators(): Validators {
  const blueprint = loadBlueprint();

  return {
    vault(
      ownerVkh: string,
      tusdmPolicy: string,
      tusdmAssetName: string,
      oracleHash: string,
      reputationHash: string,
    ): PlutusScript {
      const v = findValidator(blueprint, "vault.ouro_vault.spend");
      const code = applyParamsToScript(
        v.compiledCode,
        [
          byteString(ownerVkh),
          byteString(tusdmPolicy),
          byteString(tusdmAssetName),
          byteString(oracleHash),
          byteString(reputationHash),
        ],
        "JSON",
      );
      return { version: "V3", code };
    },
    reserve(adminVkh: string): PlutusScript {
      const v = findValidator(blueprint, "reserve.ouro_reserve.mint");
      const code = applyParamsToScript(
        v.compiledCode,
        [byteString(adminVkh)],
        "JSON",
      );
      return { version: "V3", code };
    },
    oracle(oracleVkh: string): PlutusScript {
      const v = findValidator(blueprint, "oracle.oracle.spend");
      const code = applyParamsToScript(
        v.compiledCode,
        [byteString(oracleVkh)],
        "JSON",
      );
      return { version: "V3", code };
    },
    reputation(): PlutusScript {
      const v = findValidator(blueprint, "reputation.reputation.spend");
      return { version: "V3", code: v.compiledCode };
    },
  };
}

export function scriptHash(script: PlutusScript): string {
  return resolveScriptHash(script.code, script.version);
}
