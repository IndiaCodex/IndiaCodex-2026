# MediChain AI — The Trust Layer for Healthcare

> **AI-powered enterprise healthcare platform built on Cardano blockchain with Zero Knowledge Proof privacy**

[![Build Status](https://github.com/medichain-ai/medichain-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/medichain-ai/medichain-ai/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cardano](https://img.shields.io/badge/Blockchain-Cardano-blue)](https://cardano.org)
[![Masumi](https://img.shields.io/badge/AI-Masumi-green)](https://masumi.network)
[![Midnight](https://img.shields.io/badge/Privacy-Midnight-purple)](https://midnight.network)

---

## What is MediChain AI?

MediChain AI is a production-grade, AI-powered healthcare platform that solves three fundamental problems in Indian healthcare:

| Problem | Solution |
|---|---|
| Patients don't own their records | Medical records as NFTs on Cardano — patient owns them |
| Insurance fraud costs ₹45,000 crores/year | AI agents auto-process claims in 4 minutes |
| Medical data is exposed without consent | Zero Knowledge Proofs — prove without revealing |

---

## Architecture Overview

```
React Frontend
      │
  NGINX Gateway
      │
Spring Boot Backend
      │
┌─────┼─────┬──────────┬──────────┐
│     │     │          │          │
PG  Valkey Kafka    Keycloak   MinIO
      │
┌─────┼──────────┐
│     │          │
AI  Cardano  Midnight
Agents  NFTs   ZKP
```

Full architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Tailwind CSS |
| Backend | Java 21 + Spring Boot 3 |
| Database | PostgreSQL 16 |
| Cache | Valkey 8 |
| Message Queue | Apache Kafka |
| Identity | Keycloak 24 |
| Storage | MinIO |
| Search | Qdrant (vector) |
| AI | Azure AI Foundry + Masumi |
| Blockchain | Cardano + Aiken |
| Privacy | Midnight + ZKP |
| Monitoring | Prometheus + Grafana + Loki |
| Tracing | OpenTelemetry + Jaeger |
| CI/CD | GitHub Actions |
| Containers | Docker + Kubernetes |
| Secrets | HashiCorp Vault |

---

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Java 21
- Node.js 20+
- Git

### 1. Clone Repository
```bash
git clone https://github.com/medichain-ai/medichain-ai.git
cd medichain-ai
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start Infrastructure
```bash
docker-compose up -d
```

### 4. Start Backend
```bash
cd backend
./mvnw spring-boot:run
```

### 5. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 6. Access Application
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Keycloak | http://localhost:8180 |
| Grafana | http://localhost:3001 |
| Prometheus | http://localhost:9090 |

---

## Project Structure

```
medichain-ai/
├── README.md
├── docker-compose.yml
├── .env.example
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── SDD.md
│   ├── API_CONTRACT.md
│   ├── DATA_MODEL.md
│   ├── ADR.md
│   ├── AI_AGENT_DESIGN.md
│   ├── CARDANO_INTEGRATION.md
│   ├── MIDNIGHT_ZKP_DESIGN.md
│   ├── SECURITY.md
│   ├── COMPLIANCE.md
│   ├── TESTING_STRATEGY.md
│   ├── DEPLOYMENT.md
│   ├── MONITORING.md
│   └── DEMO_PITCH_SCRIPT.md
├── frontend/          # React + Tailwind
├── backend/           # Spring Boot
├── ai/                # AI Agents (Masumi)
├── blockchain/        # Cardano + Aiken + Midnight
├── infrastructure/
│   ├── kubernetes/
│   └── .github/workflows/
└── tests/
```

---

## Hackathon Tracks

| Track | Coverage |
|---|---|
| General (Built on Cardano) | Wallet connect, NFT records, ADA escrow, smart contracts |
| Masumi (AI Agents) | Diagnosis, Claims, KYC, Support, Records agents |
| Midnight (ZKP) | Patient KYC, Insurance eligibility, Doctor credentials |
| Community Choice | Most relatable real-world healthcare problem |

---

## Submission Details (IndiaCodex'26)

- **Team:** MediChain AI
- **Hackathon:** IndiaCodex'26 — July 12, 2026
- **Tracks:** General + Masumi + Midnight + Community Choice
- **GitHub Issue:** Issue: MediChain AI: Submission

---

## License
MIT License — see [LICENSE](LICENSE)
