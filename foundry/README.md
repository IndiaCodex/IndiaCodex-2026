# Foundry

**Team name:** foundry  
**India Codex '26 submission** — Autonomous Software Companies on Cardano

> Describe an idea in plain language. Foundry scopes the work, assigns agents, and runs a tailored pipeline — contracts, frontend, docs, and deployment.

---

## Table of contents

- [Foundry](#foundry)
  - [Table of contents](#table-of-contents)
  - [Project overview](#project-overview)
  - [Problem statement](#problem-statement)
  - [Solution](#solution)
  - [Tech stack](#tech-stack)
  - [Architecture](#architecture)
    - [System overview](#system-overview)
    - [Layer structure](#layer-structure)
    - [Execution flow](#execution-flow)
    - [Default agent DAG](#default-agent-dag)
    - [Data flow (stores)](#data-flow-stores)
  - [Features \& routes](#features--routes)
    - [API routes](#api-routes)
  - [Agent system](#agent-system)
  - [Cardano integration](#cardano-integration)
  - [Smart contracts](#smart-contracts)
  - [Getting started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Install \& run](#install--run)
    - [Environment variables](#environment-variables)
  - [Presentation](#presentation)
  - [Demo \& screenshots](#demo--screenshots)
  - [Team members](#team-members)

---

## Project overview

**Foundry** is the operating system for autonomous software companies on Cardano. Users describe a product idea; Foundry uses AI to analyze scope, assemble a team of specialist agents, fund execution via a CIP-30 wallet, and orchestrate a live dependency DAG that produces deployable artifacts — including Aiken smart contracts, frontend scaffolds, security audits, documentation, and deployment plans.

This submission includes:

| Component | Location |
|-----------|----------|
| Frontend + backend (Next.js) | `src/`, `package.json` |
| Smart contracts (Aiken) | [`contracts/`](contracts/) — **separate on-chain codebase** |
| Presentation (HTML → PDF) | [`presentation.html`](presentation.html) |

---

## Problem statement

Building on Cardano requires many disciplines — market research, system architecture, Aiken development, frontend integration, security review, QA, documentation, and Preprod deployment. Today these steps are fragmented across tools, teams, and manual handoffs. Foundry unifies them into a single orchestrated workflow with on-chain funding and transparent agent execution.

---

## Solution

Foundry treats a software project as an **autonomous company**:

1. **Scope** — AI analyzes the project brief and selects which agents are needed
2. **Assemble** — CEO agent builds a dependency DAG; user can override the agent roster
3. **Fund** — User connects a Cardano Preprod wallet and funds a treasury before execution
4. **Execute** — Specialists run in parallel where dependencies allow; progress streams live to the UI
5. **Deliver** — Artifacts are downloadable per agent; Aiken contracts deploy to Preprod

```mermaid
flowchart LR
  A[Idea] --> B[AI Scope]
  B --> C[Agent Team]
  C --> D[Wallet Fund]
  D --> E[CEO DAG]
  E --> F[Parallel Execution]
  F --> G[Artifacts + Contracts]
```

---

## Tech stack

| Layer | Technologies |
|-------|----------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Framer Motion, React Flow, Recharts, Radix UI |
| **Backend** | Next.js API routes, NDJSON streaming, Node.js runtime |
| **AI** | OpenAI SDK / OpenRouter, structured JSON streaming, Zod validation |
| **Cardano** | Mesh SDK, CIP-30 wallets, Preprod network, lovelace treasury |
| **Smart contracts** | Aiken ≥1.1, `aiken-lang/stdlib` ≥2.1 |
| **Agent economy** | Masumi registry + payment APIs (mock mode for local dev) |
| **State** | Zustand (persisted projects, execution, agents, wallet) |
| **Tooling** | pnpm, TypeScript 5, ESLint |

---

## Architecture

### System overview

```mermaid
flowchart TB
  subgraph UI["Frontend (Next.js App Router)"]
    Landing[Landing]
    Projects[Projects / Wizard]
    Execution[Execution Canvas]
    Outputs[Outputs / Deploy]
    Marketplace[Marketplace]
  end

  subgraph API["API Routes"]
    ScopeAPI["POST /api/analyze-scope"]
    ExecAPI["POST /api/execution"]
  end

  subgraph Services["Services"]
    ScopeAnalyzer[Project Scope Analyzer]
    ExecController[Execution Controller]
    ExecPlan[Execution Plan / DAG]
    OpenAI[OpenAI / OpenRouter Client]
    Masumi[Masumi Adapter]
    Cardano[Fund Company / Mesh]
    OutputGen[Output Generator]
  end

  subgraph Agents["AI Agents"]
    CEO[CEO]
    Specialists[9 Specialist Agents]
  end

  subgraph Stores["Zustand Stores"]
    ProjectStore[Project Store]
    ExecutionStore[Execution Store]
    AgentStore[Agent Store]
    WalletStore[Wallet Store]
  end

  subgraph Chain["Cardano"]
    Wallet[CIP-30 Wallet]
    Treasury[Treasury]
    Contracts[Aiken Contracts]
  end

  UI --> API
  ScopeAPI --> ScopeAnalyzer --> OpenAI
  ExecAPI --> ExecController
  ExecController --> CEO
  ExecController --> Specialists
  ExecController --> OutputGen
  ExecController --> Masumi
  ExecController --> Cardano
  Specialists --> OpenAI
  UI --> Stores
  ExecAPI -.stream.-> UI
  Cardano --> Wallet
  Cardano --> Treasury
  Specialists -.generates.-> Contracts
```

### Layer structure

```
foundry/
├── src/app/              # Pages + API routes (frontend + backend)
├── src/agents/           # CEO + 9 specialist agent implementations
├── src/services/         # Execution, OpenAI, Masumi, Cardano, scope analysis
├── src/store/            # Zustand state (projects, execution, agents, wallet)
├── src/components/       # UI (execution canvas, wallet, dashboard, landing)
├── src/features/         # Project creation wizard, output generation
├── src/hooks/            # useWallet, useExecutionStream, useMasumi
├── src/config/           # Agent roster, execution phases, site config
├── src/prompts/          # Per-agent system prompts
└── contracts/            # Aiken smart contracts (separate project)
```

### Execution flow

```mermaid
sequenceDiagram
  participant User
  participant UI as Execution UI
  participant API as /api/execution
  participant EC as ExecutionController
  participant CEO as CEO Agent
  participant Spec as Specialist Agents
  participant Store as Project Store

  User->>UI: Fund & Execute
  UI->>API: POST projectContext + walletAddress
  API->>EC: execute()
  EC->>EC: registerAllAgents (Masumi)
  EC->>CEO: analyze + build DAG
  CEO-->>API: dag:generated
  API-->>UI: stream event

  loop Parallel DAG waves
    EC->>Spec: execute (ready nodes)
    Spec-->>API: agent:status, agent:log, agent:output, agent:confidence
    API-->>UI: stream events
  end

  EC->>Store: generateOutputs()
  EC-->>API: outputs:generated, execution:complete
  API-->>UI: stream complete
  User->>UI: Download artifacts / Deploy
```

### Default agent DAG

```mermaid
flowchart TD
  R[Research] --> A[Architecture]
  A --> CE[Contract Engineer]
  A --> FE[Frontend Engineer]
  CE --> SE[Security Engineer]
  CE --> QA[QA Engineer]
  FE --> QA
  QA --> DE[Documentation Engineer]
  DE --> DP[Deployment Engineer]
```

- **CEO** orchestrates outside the DAG (scope + task decomposition)
- **Research** and **Architecture** always run (core agents)
- **Contract Engineer** and **Frontend Engineer** run **in parallel** after architecture
- DAG is **tailored** to project scope — optional agents omitted when not needed

### Data flow (stores)

```mermaid
flowchart LR
  Stream[NDJSON Stream] --> AgentStore[Agent Store]
  Stream --> ExecutionStore[Execution Store]
  Stream --> ProjectStore[Project Store]
  ExecutionStore --> ReactFlow[React Flow Nodes]
  AgentStore --> Sidebar[Agent Sidebar]
  ProjectStore --> Outputs[Output Drawer]
  WalletStore[Wallet Store] --> Funding[Fund & Execute]
```

---

## Features & routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard` | Company dashboard — metrics, activity, health |
| `/projects` | Project list |
| `/projects/new` | 3-step wizard — details, AI scope, agent picker |
| `/projects/[id]` | Project detail, org chart, treasury |
| `/projects/[id]/execution` | Live React Flow DAG, wallet funding, streaming logs |
| `/projects/[id]/outputs` | Download generated artifacts |
| `/projects/[id]/deploy` | Aiken deployment pipeline (6 steps) |
| `/marketplace` | Masumi agent marketplace |
| `/settings` | AI model, Cardano network, execution speed |

### API routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze-scope` | POST | AI scope analysis → complexity + required agents |
| `/api/execution` | POST | NDJSON stream of execution events |

---

## Agent system

| Role | Name | Phase | Capabilities |
|------|------|-------|--------------|
| `ceo` | CEO | orchestration | Project analysis, DAG generation |
| `research` | Researcher | research | Tech analysis, risks, recommendations |
| `architecture` | Architect | architecture | System design, components, data flow |
| `contract-engineer` | Contract Engineer | contracts | Aiken development, validation |
| `frontend-engineer` | Frontend Engineer | frontend | React/Next.js UI, wallet integration |
| `security-engineer` | Security Engineer | security | Contract + frontend audit |
| `qa-engineer` | QA Engineer | testing | Test plans and cases |
| `documentation-engineer` | Documentation Engineer | documentation | README, API docs, Catalyst proposal |
| `deployment-engineer` | Deployment Engineer | deployment | Preprod deploy checklist |

**Scope detection** — AI analyzes the project brief and selects only the agents needed. Users can toggle specialists after analysis and reset to the AI pick.

**Outputs per agent** — Research summaries, architecture docs, `.ak` contract files, frontend scaffolds, security audits, QA plans, deployment guides, and Catalyst proposals.

---

## Cardano integration

```mermaid
flowchart LR
  User[User Wallet] -->|CIP-30| Mesh[Mesh SDK]
  Mesh -->|Fund tx| Treasury[Treasury Address]
  Treasury -->|85%| Agents[Agent Fees]
  Treasury -->|15%| Protocol[Protocol Fee]
  Agents --> Execution[Agent Execution]
  Contracts[Aiken Contracts] --> Preprod[Cardano Preprod]
```

- **Wallet** — CIP-30 via Mesh SDK (Vesper, Eternl, Nami, Lace); Preprod only
- **Funding** — User funds treasury before execution; mock mode when treasury not configured
- **Fees** — 85% agent allocation, 15% treasury fee
- **Deploy** — 6-step pipeline: compile → keys → faucet → build → submit → verify

---

## Smart contracts

Smart contract code lives in **[`contracts/`](contracts/)** as a **separate Aiken project** (not embedded in the Next.js app).

| Validator | File | Purpose |
|-----------|------|---------|
| **main** | `validators/main.ak` | Owner-signed spending validator |
| **lock** | `validators/lock.ak` | Timelock — lock ADA until deadline |
| **mint** | `validators/mint.ak` | Minting policy — owner mint, open burn |
| **vesting** | `validators/vesting.ak` | Linear vesting with cliff |

```bash
cd contracts
aiken check
aiken build
```

See [`contracts/README.md`](contracts/README.md) for full contract documentation.

---

## Getting started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 20 |
| pnpm | ≥ 9 |
| Aiken | ≥ 1.1 (optional, for contracts) |

### Install & run

```bash
cd foundry
pnpm install
cp .env.example .env.local   # add your keys
pnpm dev
```

Open **http://localhost:3000**

Full setup, env vars, and troubleshooting: **[RUNBOOK.md](RUNBOOK.md)**

### Environment variables

Copy `.env.example` to `.env.local`. Key variables:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI or OpenRouter key (empty = mock mode) |
| `OPENAI_BASE_URL` | `https://openrouter.ai/api/v1` for OpenRouter |
| `OPENAI_MODEL` | e.g. `gpt-4o-mini` or `openai/gpt-oss-20b` |
| `NEXT_PUBLIC_CARDANO_NETWORK` | `preprod` |
| `NEXT_PUBLIC_TREASURY_ADDRESS` | Preprod treasury for funding txs |
| `MASUMI_MOCK` | `true` for local demo without Masumi infra |

---

## Presentation

**Files:**
- [`presentation.pdf`](presentation.pdf) — submission-ready PDF (14 pages)
- [`presentation.html`](presentation.html) — source deck (11 sections, editable)

The deck covers problem, solution, user flow, all platform features, execution engine, detailed agent roster, Cardano integration, smart contracts, tech stack, and demo instructions.

**Regenerate PDF** (after editing HTML):
```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --print-to-pdf-no-header \
  --print-to-pdf="presentation.pdf" \
  "file://$(pwd)/presentation.html"
```

---

## Demo & screenshots

### Presentation: [presentation.pdf](https://github.com/user-attachments/files/29939316/presentation.pdf)

#### Screenshots

<img width="3002" height="6544" alt="Image" src="https://github.com/user-attachments/assets/b6a8e243-1de2-4ea2-879b-c71af4eae85c" />
<img width="3002" height="2182" alt="Image" src="https://github.com/user-attachments/assets/3bc4a31e-ac94-4feb-bba1-0e0573a6c564" />
<img width="3002" height="2182" alt="Image" src="https://github.com/user-attachments/assets/b4314365-e627-4b76-aa9a-6a2ad2df56ce" />
<img width="3002" height="2858" alt="Image" src="https://github.com/user-attachments/assets/13fd3212-c5a6-4261-aa19-919bdef57c21" />
<img width="3002" height="2182" alt="Image" src="https://github.com/user-attachments/assets/05da243c-431a-4484-81e0-3708482d6528" />
<img width="3002" height="6544" alt="Image" src="https://github.com/user-attachments/assets/6f2dc5d3-53ec-494f-ab9b-506a7c70032b" />
<img width="3002" height="6544" alt="Image" src="https://github.com/user-attachments/assets/7c41a0dc-44f4-44c6-92f5-0c10c0c57a73" />
<img width="2848" height="2164" alt="Image" src="https://github.com/user-attachments/assets/e50c5e71-42b5-4d34-bc17-2393d1f3efb9" />
<img width="2848" height="2362" alt="Image" src="https://github.com/user-attachments/assets/535342fa-c02d-4210-b9f9-103e31d97942" />
<img width="2848" height="2164" alt="Image" src="https://github.com/user-attachments/assets/6ec7e04c-582c-4181-832b-26b975665dc7" />
<img width="3116" height="2446" alt="Image" src="https://github.com/user-attachments/assets/a79024b1-afc6-46bd-bc8a-f00921e2e641" />
<img width="3116" height="2446" alt="Image" src="https://github.com/user-attachments/assets/34ae4df6-9098-4bfd-bef7-30ca0f8fbe07" />
<img width="3116" height="2446" alt="Image" src="https://github.com/user-attachments/assets/f951dcc7-90a3-4a0a-8f9d-3ab5b9a0b587" />
<img width="3116" height="2446" alt="Image" src="https://github.com/user-attachments/assets/b2d059da-7521-4ddc-bf49-d0259e3498cb" />
<img width="3116" height="2446" alt="Image" src="https://github.com/user-attachments/assets/112c63f2-86ce-45d9-9a2f-06ed52144cb1" />
<img width="3116" height="2446" alt="Image" src="https://github.com/user-attachments/assets/7a99ad1e-fbe7-4342-abe6-0438f50dc2ac" />
<img width="3116" height="2446" alt="Image" src="https://github.com/user-attachments/assets/bf1a39b2-9bfe-488c-9b8e-c41d02037df8" />
<img width="3116" height="2446" alt="Image" src="https://github.com/user-attachments/assets/8fcef59a-08f6-4ba5-8c98-97d25935cfb5" />
<img width="3116" height="2446" alt="Image" src="https://github.com/user-attachments/assets/507fd4bb-64e2-47a9-a3d2-4ee051400422" />
<img width="1961" height="1161" alt="Image" src="https://github.com/user-attachments/assets/eb45dc9c-4715-4721-a85c-f5d092c5b58c" />
<img width="3002" height="2294" alt="Image" src="https://github.com/user-attachments/assets/9f32ff43-dc3e-4a33-8077-4e51fba741ef" />
<img width="3116" height="2446" alt="Image" src="https://github.com/user-attachments/assets/6187b50d-111b-46d6-ad00-d6e98aa8385a" />
<img width="3116" height="2446" alt="Image" src="https://github.com/user-attachments/assets/e61c22c9-e239-408c-90c5-c13873005d40" />
<img width="1535" height="1128" alt="Image" src="https://github.com/user-attachments/assets/3caa4694-a9fc-4fc8-8ffe-5386b50458ad" />
<img width="1237" height="1052" alt="Image" src="https://github.com/user-attachments/assets/5c1e85f4-03f9-440e-b396-9cc37c0c0395" />
<img width="3116" height="2334" alt="Image" src="https://github.com/user-attachments/assets/62c6219f-e065-4e96-a695-edac26aa789c" />
<img width="3116" height="2692" alt="Image" src="https://github.com/user-attachments/assets/f6e8131a-cb84-45eb-bd14-93f3b222de12" />
<img width="3116" height="2572" alt="Image" src="https://github.com/user-attachments/assets/3d620a02-9a91-49cc-aff9-a918cfcc0381" />
<img width="3116" height="2446" alt="Image" src="https://github.com/user-attachments/assets/a5ec8092-1870-4150-a20c-55092d65f2e8" />
<img width="3116" height="2446" alt="Image" src="https://github.com/user-attachments/assets/23979840-8b8c-4269-b6a1-edd8b2e2fb2e" />
<img width="3116" height="2446" alt="Image" src="https://github.com/user-attachments/assets/915c5ea8-1e18-4ff2-958e-06ce11b3634f" />

#### Live Demo

[https://foundry-gamma-three.vercel.app/](https://foundry-gamma-three.vercel.app/)

#### YouTube Pitch Video

[https://youtu.be/6hji9L5TAM0](https://youtu.be/6hji9L5TAM0)

---

## Team members

| Name | Role | GitHub |
|------|------|--------|
| _Harish Kotra_ | _Builder_ | _[@harishkotra]_ |

> **Team name:** foundry
