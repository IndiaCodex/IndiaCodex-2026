import * as fs from 'fs';
import * as mesh from '@meshsdk/core';

const blueprint = JSON.parse(fs.readFileSync('smart-contract/plutus.json', 'utf8'));
const validator = blueprint.validators.find(v => v.title === 'idea_proof_registry.idea_proof_registry.spend');
const code = validator.compiledCode;
const hash = validator.hash;

console.log('Compiled code length:', code.length, 'chars =', code.length / 2, 'bytes');
console.log('Validator hash from blueprint:', hash);

try {
  // Derive the script hash using Mesh SDK (takes the raw bytecode hex)
  const computedHash = mesh.resolveScriptHash(code, 'V3');
  console.log('Computed script hash (V3):', computedHash);
  console.log('Hashes match:', computedHash === hash);
} catch (e) {
  console.log('V3 hash failed:', e.message);
}

try {
  // Derive the Preview Testnet script address (network ID = 0)
  const address = mesh.resolvePlutusScriptAddress({ code, version: 'V3' }, 0);
  console.log('Script address (Preview, V3):', address);
} catch (e) {
  console.log('V3 address failed:', e.message);
}
