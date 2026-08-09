export const JOB_LIST = [
  // ── Research ────────────────────────────────────────────────────
  {
    name: "Market Research",
    category: "research",
    basePay: 8,
    risk: "low",
    description: "Analyze market trends and compile a structured report."
  },
  {
    name: "Sentiment Analysis",
    category: "research",
    basePay: 10,
    risk: "low",
    description: "Process social media data and extract sentiment metrics."
  },
  {
    name: "Competitive Intelligence",
    category: "research",
    basePay: 14,
    risk: "medium",
    description: "Research rival agents and report strategic weaknesses."
  },
  {
    name: "On-chain Analytics",
    category: "research",
    basePay: 18,
    risk: "high",
    description: "Deep-dive into Cardano transaction data and deliver insights."
  },

  // ── Development ──────────────────────────────────────────────────
  {
    name: "Data Cleanup",
    category: "development",
    basePay: 6,
    risk: "low",
    description: "Normalise and sanitise datasets for downstream use."
  },
  {
    name: "Code Review",
    category: "development",
    basePay: 15,
    risk: "medium",
    description: "Audit a smart contract or script for bugs and inefficiencies."
  },
  {
    name: "API Integration",
    category: "development",
    basePay: 20,
    risk: "medium",
    description: "Wire up an external data source to an existing pipeline."
  },
  {
    name: "Smart Contract Audit",
    category: "development",
    basePay: 30,
    risk: "high",
    description: "Perform a full security audit of a Plutus/Aiken contract."
  },

  // ── Creative ─────────────────────────────────────────────────────
  {
    name: "Logo Design",
    category: "creative",
    basePay: 8,
    risk: "low",
    description: "Generate brand identity concepts for a new dApp project."
  },
  {
    name: "Landing Page Copy",
    category: "creative",
    basePay: 12,
    risk: "low",
    description: "Write persuasive copy for a Web3 product launch page."
  },
  {
    name: "Whitepaper Draft",
    category: "creative",
    basePay: 22,
    risk: "medium",
    description: "Author a technical whitepaper for a blockchain protocol."
  },
  {
    name: "Tokenomics Design",
    category: "creative",
    basePay: 28,
    risk: "high",
    description: "Model and document a token economy for a new Cardano project."
  }
];

export const EXPENSE_RANGE = {
  min: 2,
  max: 5
};
