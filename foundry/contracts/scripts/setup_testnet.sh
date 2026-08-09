#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# Foundry — Cardano Preprod Testnet Setup
# ─────────────────────────────────────────────────────────────
# Prerequisites:
#   1. Install cardano-cli: https://github.com/IntersectMBO/cardano-cli
#   2. Install aiken:       cargo install aiken
#   3. Get testnet ADA from the faucet:
#      https://docs.cardano.org/cardano-testnet/tools/faucet
# ─────────────────────────────────────────────────────────────

NETWORK="preprod"
MAGIC="--testnet-magic 1"
WORK_DIR="$(cd "$(dirname "$0")/.." && pwd)"
KEYS_DIR="${WORK_DIR}/keys"
COMPILED_DIR="${WORK_DIR}/compiled"

mkdir -p "$KEYS_DIR" "$COMPILED_DIR"

echo "=== Foundry — Cardano ${NETWORK} Setup ==="
echo ""

# ── 1. Generate keys if they don't exist ────────────────────
if [ ! -f "${KEYS_DIR}/payment.vkey" ]; then
  echo "[1/5] Generating payment keys..."
  cardano-cli address key-gen \
    --verification-key-file "${KEYS_DIR}/payment.vkey" \
    --signing-key-file "${KEYS_DIR}/payment.skey"
else
  echo "[1/5] Payment keys already exist."
fi

# ── 2. Build address ────────────────────────────────────────
if [ ! -f "${KEYS_DIR}/payment.addr" ]; then
  echo "[2/5] Building address..."
  cardano-cli address build \
    --payment-verification-key-file "${KEYS_DIR}/payment.vkey" \
    --out-file "${KEYS_DIR}/payment.addr" \
    $MAGIC
else
  echo "[2/5] Address already built."
fi

echo "Address: $(cat "${KEYS_DIR}/payment.addr")"

# ── 3. Query balance ────────────────────────────────────────
echo "[3/5] Querying balance..."
cardano-cli query utxo \
  --address "$(cat "${KEYS_DIR}/payment.addr")" \
  $MAGIC

echo ""
echo "=== Setup Complete ==="
echo ""
echo "If your address shows 0 ADA, fund it from the faucet:"
echo "  https://docs.cardano.org/cardano-testnet/tools/faucet"
echo ""

# ── 4. Generate protocol parameters ─────────────────────────
echo "[4/5] Downloading protocol parameters..."
cardano-cli query protocol-parameters \
  $MAGIC \
  --out-file "${WORK_DIR}/protocol.json"

# ── 5. Compile contracts ────────────────────────────────────
echo "[5/5] Compiling Aiken contracts..."
aiken build
cp "${WORK_DIR}/plutus.json" "${COMPILED_DIR}/plutus.json"
echo "Contracts compiled: ${COMPILED_DIR}/plutus.json"
echo ""
echo "=== Next: Run ./scripts/deploy.sh ==="
