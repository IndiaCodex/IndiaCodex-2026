# 🐝 Team Bumblebee — MediChain AI

> **The Trust Layer for Healthcare — Built on Cardano**

## 👥 Team Members
| Name | Role |
|------|------|
| Veera | Full-Stack Developer & Blockchain Engineer |
| Rahul | AI Engineer & Backend Developer |

---

## 🚀 Project: MediChain AI

**MediChain AI** is an AI-powered enterprise healthcare platform that uses Cardano blockchain, Zero Knowledge Proofs, and autonomous AI agents to solve three fundamental problems in Indian healthcare.

### The Problem
| Problem | Impact |
|---------|--------|
| Patients don't own their medical records | Fragmented, inaccessible health data |
| Insurance fraud | ₹45,000 crores/year lost to fraud |
| Medical data exposed without consent | Privacy violations, data breaches |

### Our Solution
| Feature | How It Works |
|---------|-------------|
| 🏥 Medical Records as NFTs | CIP-25 NFTs on Cardano — patient owns, controls, and shares their records |
| 🤖 AI Insurance Agent | Autonomous AI agent processes claims in ~4 minutes (vs weeks) |
| 🔐 Zero Knowledge Proofs | Prove health status without revealing sensitive data |
| 💊 Prescription Escrow | Trustless prescription dispensing via Aiken smart contract |
| 🪪 Identity NFTs | Patient identity verified on-chain with ZKP |

---

## 🏗️ Architecture

```
React 18 Frontend (Tailwind CSS)
         │
    Spring Boot 3 Backend (Java 21)
         │
┌────────┼────────┬──────────┬──────────┐
│        │        │          │          │
PostgreSQL  Valkey  Kafka  Keycloak   MinIO
         │
┌────────┼────────────┐
│        │            │
AI Agents  Cardano    Midnight ZKP
(Masumi)   NFTs/SC    Privacy
```

---

## 🔗 Cardano Smart Contracts (Aiken)

Located in `smart-contracts/` folder.

### 1. `medical_record_nft.ak` — Medical Record NFT Minting Policy
- CIP-25 compliant NFT minting for tamper-proof medical records
- Only authorized hospital wallet can mint
- Records are **immutable** once on-chain
- Prevents forging of medical records

### 2. `prescription_escrow.ak` — Prescription Escrow Contract
- Doctor locks ADA with prescription details as datum
- Patient signs to claim medicine
- Pharmacist + Patient both sign to dispense
- Automatic refund after 30-day expiry
- **Trustless prescription dispensing** — no middleman

---

## 💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Tailwind CSS + Vite |
| Backend | Java 21 + Spring Boot 3 |
| Database | PostgreSQL 16 |
| Cache | Valkey 8 (Redis-compatible) |
| Message Queue | Apache Kafka |
| Identity | Keycloak 24 (SSO/OAuth2) |
| Storage | MinIO (object storage) |
| AI | Azure AI Foundry + Masumi Network |
| Blockchain | Cardano + Aiken smart contracts |
| Privacy | Midnight Network + ZKP |
| Monitoring | Prometheus + Grafana + Loki |
| Tracing | OpenTelemetry + Jaeger |
| Containers | Docker + Kubernetes |

---

## 🎯 Key Features (Demo)

1. **Patient Dashboard** — View records, prescriptions, insurance claims
2. **Identity NFT** — Cardano-anchored identity with ZKP verification
3. **AI Insurance Claims** — Submit → AI validates → Auto-approved in 4 min
4. **Consent Management** — Granular, revocable data access control
5. **Audit Trail** — Every access logged on-chain
6. **Prescription Escrow** — Doctor creates → Patient claims → Pharmacist dispenses

---

## 🏃 Quick Start

```bash
git clone <this-repo>
cd Bumblebee
# See full setup in medichain-ai/
docker-compose up -d
```

**Running on:** http://localhost:3000  
**Cardano Network:** Preprod Testnet  
**Demo wallet:** Built-in demo mode (no Nami/Eternl required)

---

## 📊 Pitch Highlights

### Why Cardano?
- **Deterministic fees** → predictable healthcare costs
- **Plutus/Aiken** → mathematically provable contract correctness
- **Native assets** → first-class NFT support for medical records
- **Midnight integration** → privacy-preserving data sharing (future)

### Impact at Scale
- 1.4B Indians → 300M+ without accessible medical records
- Target: 10M patients onboarded in Year 1
- Revenue: B2B SaaS to hospitals + insurance companies

### Traction
- ✅ Working MVP with full demo
- ✅ 2 Aiken smart contracts deployed on Preprod
- ✅ AI insurance agent live
- ✅ ZKP identity verification working

---

## 📁 Repository Structure

```
Bumblebee/
├── README.md                    ← This file
├── smart-contracts/
│   ├── medical_record_nft.ak    ← NFT minting policy (Aiken)
│   ├── prescription_escrow.ak   ← Prescription escrow (Aiken)
│   ├── aiken.toml               ← Project config
│   └── plutus.json              ← Compiled contract blueprints
└── medichain-ai/                ← Full source code
    ├── frontend/                ← React 18 app
    ├── backend/                 ← Spring Boot API
    ├── contracts/               ← Aiken contracts source
    ├── ai/                      ← AI agents
    ├── docker-compose.yml
    └── start.sh
```

---

## 🔮 Roadmap

- [ ] Mainnet deployment
- [ ] Midnight ZKP integration (privacy-preserving insurance)  
- [ ] Mobile app (React Native)
- [ ] ABDM (Ayushman Bharat Digital Mission) integration
- [ ] Multi-hospital consortium network

---

*Built with ❤️ at IndiaCodex'26 Hackathon — Team Bumblebee (Veera & Rahul)*
