#!/bin/bash
# MediChain AI — Complete Startup Script
# Runs: PostgreSQL + Valkey + Spring Boot Backend + React Frontend
# All 3 Hackathon Tracks: General (Cardano) + Masumi (AI) + Midnight (ZKP)

set -e

echo "========================================"
echo "  MediChain AI — IndiaCodex'26 Startup"
echo "========================================"

ROOT="/Users/veera.konjeti/Desktop/medichain-ai"
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$PATH"

# ── STEP 1: Start Docker Infrastructure ──────────────
echo ""
echo "▶ Starting PostgreSQL + Valkey..."
cd "$ROOT"

# Kill stale containers
docker rm -f medichain-pg 2>/dev/null || true

# Start postgres on 5434 (avoids conflict with ecommerce-valkey on 5432)
docker run -d --name medichain-pg \
  -e POSTGRES_USER=medichain \
  -e POSTGRES_PASSWORD=changeme \
  -e POSTGRES_DB=medichain \
  -p 5434:5432 \
  postgres:16-alpine 2>/dev/null || echo "postgres already running"

# Valkey already running on 6379
docker start medichain-valkey 2>/dev/null || true

sleep 4
echo "✅ PostgreSQL on :5434 | Valkey on :6379"

# ── STEP 2: Start Spring Boot Backend ────────────────
echo ""
echo "▶ Starting Spring Boot Backend on :8080..."

export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5434/medichain
export SPRING_DATASOURCE_USERNAME=medichain
export SPRING_DATASOURCE_PASSWORD=changeme
export SPRING_DATA_REDIS_HOST=localhost
export SPRING_DATA_REDIS_PORT=6379
export SPRING_DATA_REDIS_PASSWORD=changeme
export SPRING_KAFKA_BOOTSTRAP_SERVERS=localhost:9092
export JWT_SECRET=medichain_ai_hackathon_indiacodex26_secret_2026_minimum_256bits
export CARDANO_NETWORK=preprod
export CARDANO_BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0
export CARDANO_BLOCKFROST_API_KEY=${BLOCKFROST_KEY:-preprodfake}
export MIDNIGHT_NODE_URL=https://rpc.midnight-devnet.midnight.network
export MIDNIGHT_NETWORK=preprod
export AZURE_AI_ENDPOINT=${AZURE_AI_ENDPOINT:-http://localhost:9997}
export AZURE_AI_KEY=${AZURE_AI_KEY:-demo}
export AZURE_AI_DEPLOYMENT=gpt-4o
export MASUMI_API_KEY=${MASUMI_API_KEY:-demo}
export MASUMI_WALLET_ADDRESS=addr_test1
export SMTP_HOST=localhost
export SMTP_PORT=25
export SMTP_USERNAME=noreply@medichain.ai
export SMTP_PASSWORD=
export MINIO_ACCESS_KEY=minioadmin
export MINIO_SECRET_KEY=changeme

cd "$ROOT/backend"
nohup mvn org.springframework.boot:spring-boot-maven-plugin:run \
  > /tmp/medichain-backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "Waiting for backend..."
for i in $(seq 1 60); do
  if curl -s http://localhost:8080/api/v1/actuator/health > /dev/null 2>&1; then
    echo "✅ Backend ready!"
    break
  fi
  sleep 2
  echo -n "."
done

# ── STEP 3: Start React Frontend ──────────────────────
echo ""
echo "▶ Starting React Frontend on :3000..."
cd "$ROOT/frontend"
nohup npm run dev > /tmp/medichain-frontend.log 2>&1 &
FRONTEND_PID=$!
sleep 3

# ── STEP 4: Verify Everything ─────────────────────────
echo ""
echo "========================================"
echo "  MediChain AI — Running!"
echo "========================================"
echo ""
echo "  🌐 Frontend:    http://localhost:3000"
echo "  🔧 Backend API: http://localhost:8080/api/v1"
echo "  📖 Swagger UI:  http://localhost:8080/api/v1/swagger-ui.html"
echo "  ❤️  Health:      http://localhost:8080/api/v1/actuator/health"
echo ""
echo "  Track 1 (Cardano): Wallet connect → NFT mint → ADA escrow"
echo "  Track 2 (Masumi):  AI agents → Diagnosis ₳0.5 → Claims ₳2"
echo "  Track 3 (Midnight): ZKP KYC → ZKP eligibility → Private proof"
echo ""
echo "  Set BLOCKFROST_KEY=yourkey for real Cardano transactions"
echo "  Set AZURE_AI_KEY=yourkey for real AI diagnosis"
echo ""
echo "  Logs: tail -f /tmp/medichain-backend.log"
echo "========================================"
