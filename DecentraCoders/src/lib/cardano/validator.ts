/**
 * src/lib/cardano/validator.ts
 * Loads the compiled Aiken validator from the blueprint and derives the script address.
 * This module is safe to import in both client and server code.
 */

import { resolvePlutusScriptAddress } from '@meshsdk/core';
import type { PlutusScript } from '@meshsdk/core';
import { NETWORK_ID } from './network';
import blueprint from '../cardano-blueprint.json';

/** The title of our spend validator in plutus.json */
const VALIDATOR_TITLE = 'idea_proof_registry.idea_proof_registry.spend';

/** Loaded once at module evaluation time */
const validatorEntry = (blueprint.validators as any[]).find(
  (v: any) => v.title === VALIDATOR_TITLE
);

if (!validatorEntry) {
  throw new Error(
    `[LaunchNest] Could not find validator "${VALIDATOR_TITLE}" in plutus.json blueprint. ` +
    'Run: cd smart-contract && aiken build'
  );
}

/**
 * The Plutus script object accepted by Mesh SDK.
 * Plutus V3 is used because Aiken v1.1.x only compiles to V3.
 */
export const IDEA_PROOF_SCRIPT: PlutusScript = {
  code: validatorEntry.compiledCode as string,
  version: 'V3',
};

/**
 * The script hash from the Aiken blueprint.
 * This is the canonical Blake2b-224 hash of the compiled validator.
 */
export const SCRIPT_HASH: string = validatorEntry.hash as string;

/**
 * The Preview Testnet Bech32 script address derived from the compiled validator.
 * Computed once using Mesh SDK's resolvePlutusScriptAddress.
 */
export const SCRIPT_ADDRESS: string = resolvePlutusScriptAddress(IDEA_PROOF_SCRIPT, NETWORK_ID);

/**
 * Returns the resolved script address (same as SCRIPT_ADDRESS).
 * Call this wherever you need the address at runtime.
 */
export function getScriptAddress(): string {
  return SCRIPT_ADDRESS;
}

/**
 * Returns the compiled script object for use in Mesh transaction builders.
 */
export function getScript(): PlutusScript {
  return IDEA_PROOF_SCRIPT;
}

/**
 * Returns the blueprint validator hash (used for on-chain verification).
 */
export function getScriptHash(): string {
  return SCRIPT_HASH;
}
