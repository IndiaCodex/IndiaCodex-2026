#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# Foundry — Deploy Smart Contracts to Cardano Preprod Testnet
# ─────────────────────────────────────────────────────────────
# Usage: ./scripts/deploy.sh
#
# Steps:
#   1. Generate validator hashes from compiled Plutus
#   2. Build contract deployment transactions
#   3. Submit to Cardano preprod testnet
#   4. Verify deployment
# ─────────────────────────────────────────────────────────────

NETWORK="preprod"
MAGIC="--testnet-magic 1"
WORK_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KEYS_DIR="${WORK_DIR}/keys"
COMPILED_DIR="${WORK_DIR}/compiled"
TX_DIR="${WORK_DIR}/transactions"

mkdir -p "$TX_DIR"

echo "=== Foundry — Deploying Contracts to Cardano ${NETWORK} ==="
echo ""

# ── 1. Validate prerequisites ───────────────────────────────
if [ ! -f "${KEYS_DIR}/payment.skey" ]; then
  echo "ERROR: Run ./scripts/setup_testnet.sh first to generate keys."
  exit 1
fi

if [ ! -f "${COMPILED_DIR}/plutus.json" ]; then
  echo "ERROR: No compiled contracts found. Run 'aiken build' first."
  exit 1
fi

ADDRESS=$(cat "${KEYS_DIR}/payment.addr")
echo "Using address: ${ADDRESS}"

# ── 2. Query UTXOs ──────────────────────────────────────────
echo ""
echo "[1/5] Querying UTXOs at address..."
cardano-cli query utxo \
  --address "$ADDRESS" \
  $MAGIC

# Let user pick a UTXO
echo ""
echo "Enter the TxHash of the UTXO to use (from the output above):"
read -r TX_HASH
echo "Enter the TxIx (index) of the UTXO to use:"
read -r TX_IX

# ── 3. Build the contract deployment transaction ────────────
echo ""
echo "[2/5] Building deployment transaction..."
# This is a placeholder — in production, the contract engineer agent
# generates this dynamically based on the specific contracts being deployed.

# For the main validator:
cardano-cli transaction build \
  --alonzo-era \
  $MAGIC \
  --tx-in "${TX_HASH}#${TX_IX}" \
  --change-address "$ADDRESS" \
  --tx-out "$ADDRESS+2000000" \
  --tx-out-inline-datum-file "${WORK_DIR}/genesis_datum.json" \
  --out-file "${TX_DIR}/deploy.txbody"

# ── 4. Sign the transaction ─────────────────────────────────
echo "[3/5] Signing transaction..."
cardano-cli transaction sign \
  --tx-body-file "${TX_DIR}/deploy.txbody" \
  --signing-key-file "${KEYS_DIR}/payment.skey" \
  $MAGIC \
  --out-file "${TX_DIR}/deploy.tx"

# ── 5. Submit the transaction ───────────────────────────────
echo "[4/5] Submitting transaction to ${NETWORK}..."
cardano-cli transaction submit \
  --tx-file "${TX_DIR}/deploy.tx" \
  $MAGIC

TX_ID=$(cardano-cli transaction txid --tx-file "${TX_DIR}/deploy.tx")
echo ""
echo "[5/5] Deployment submitted!"
echo "Transaction ID: ${TX_ID}"
echo "View on explorer: https://preprod.cexplorer.io/tx/${TX_ID}"
echo ""

# ── Generate the contract registry ──────────────────────────
echo "Writing contract registry..."
cat > "${WORK_DIR}/contract-registry.json" << EOF
{
  "network": "${NETWORK}",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "transactionId": "${TX_ID}",
  "address": "${ADDRESS}",
  "validators": {
    "main": {
      "compiled": "${COMPILED_DIR}/plutus.json",
      "deployed": false
    },
    "lock": {
      "compiled": "${COMPILED_DIR}/plutus.json",
      "deployed": false
    },
    "mint": {
      "compiled": "${COMPILED_DIR}/plutus.json",
      "deployed": false
    },
    "vesting": {
      "compiled": "${COMPILED_DIR}/plutus.json",
      "deployed": false
    }
  }
}
EOF

echo "Contract registry written to contract-registry.json"
echo ""
echo "=== Deployment Complete ==="
