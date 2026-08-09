export const mockUser = {
  id: "usr_7f3a2b",
  name: "Venn Bagga",
  email: "baggaamv@gmail.com",
  joinedAt: "2026-01-14T09:30:00Z",
  wallet: "addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgse35a3x",
  walletVerified: true,
  privacyScore: 98,
};

export const mockPlans = [
  {
    id: "plan_basic",
    name: "Essential",
    tagline: "Core private coverage",
    coverageAda: 25_000,
    premiumAda: 45,
    period: "monthly",
    apyShare: 20,
    features: ["₳25,000 coverage", "ZK claim privacy", "Emergency care", "48h payout target"],
    accent: "cyan",
  },
  {
    id: "plan_plus",
    name: "Shield Plus",
    tagline: "Extended coverage + yield boost",
    coverageAda: 100_000,
    premiumAda: 120,
    period: "monthly",
    apyShare: 35,
    features: [
      "₳100,000 coverage",
      "ZK claim privacy",
      "Specialist & surgery",
      "Dental & vision",
      "24h payout target",
      "35% yield share",
    ],
    accent: "violet",
    popular: true,
  },
  {
    id: "plan_max",
    name: "Sovereign",
    tagline: "Maximum private protection",
    coverageAda: 500_000,
    premiumAda: 380,
    period: "monthly",
    apyShare: 50,
    features: [
      "₳500,000 coverage",
      "ZK claim privacy",
      "Global treatment",
      "Chronic care",
      "Instant payout target",
      "50% yield share",
      "Family add-ons",
    ],
    accent: "emerald",
  },
];

export const mockPolicy = {
  id: "pol_9c41e8",
  planId: "plan_plus",
  planName: "Shield Plus",
  status: "active" as const,
  coverageAda: 100_000,
  premiumAda: 120,
  startDate: "2026-02-01T00:00:00Z",
  nextPremiumDue: "2026-08-01T00:00:00Z",
  premiumsPaidAda: 720,
  treasuryContributionAda: 576,
  yieldGeneratedAda: 41.8,
  currentApy: 9.4,
  commitmentHash: "0x8f4e2a91c3b7d6e5f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3",
};

export const mockClaims = [
  {
    id: "clm_2201",
    reference: "CLM-2026-2201",
    title: "Outpatient procedure",
    amountAda: 1_850,
    status: "paid" as const,
    submittedAt: "2026-04-11T10:12:00Z",
    decidedAt: "2026-04-12T16:40:00Z",
    hospital: "Nova Medica Center",
    payoutTx: "tx_a81f...c2e9",
  },
  {
    id: "clm_2317",
    reference: "CLM-2026-2317",
    title: "Diagnostic imaging",
    amountAda: 640,
    status: "approved" as const,
    submittedAt: "2026-06-28T14:05:00Z",
    decidedAt: "2026-06-29T09:22:00Z",
    hospital: "Helix Health Institute",
    payoutTx: null,
  },
  {
    id: "clm_2402",
    reference: "CLM-2026-2402",
    title: "Specialist consultation",
    amountAda: 320,
    status: "proof_verified" as const,
    submittedAt: "2026-07-16T08:45:00Z",
    decidedAt: null,
    hospital: "Nova Medica Center",
    payoutTx: null,
  },
];

export const mockActivity = [
  { id: "a1", type: "yield" as const, title: "Yield distributed", detail: "+₳6.2 from lending pool", at: "2026-07-18T22:10:00Z" },
  { id: "a2", type: "claim" as const, title: "Claim proof verified", detail: "CLM-2026-2402 · ZK proof valid", at: "2026-07-16T09:02:00Z" },
  { id: "a3", type: "deposit" as const, title: "Premium paid", detail: "₳120 · Shield Plus · July", at: "2026-07-01T07:30:00Z" },
  { id: "a4", type: "payout" as const, title: "Claim payout", detail: "₳1,850 → private vault", at: "2026-04-12T16:41:00Z" },
  { id: "a5", type: "policy" as const, title: "Policy renewed", detail: "Shield Plus · auto-renew", at: "2026-04-01T00:01:00Z" },
];

export const mockTransactions = [
  { id: "t1", hash: "tx_9d2c...f1a4", type: "Premium", direction: "out" as const, amountAda: 120, status: "confirmed", at: "2026-07-01T07:30:00Z" },
  { id: "t2", hash: "tx_c4b7...09ee", type: "Yield", direction: "in" as const, amountAda: 6.2, status: "confirmed", at: "2026-07-18T22:10:00Z" },
  { id: "t3", hash: "tx_11ab...77cd", type: "Premium", direction: "out" as const, amountAda: 120, status: "confirmed", at: "2026-06-01T07:28:00Z" },
  { id: "t4", hash: "tx_a81f...c2e9", type: "Claim payout", direction: "in" as const, amountAda: 1850, status: "confirmed", at: "2026-04-12T16:41:00Z" },
  { id: "t5", hash: "tx_5e6f...b3a2", type: "Premium", direction: "out" as const, amountAda: 120, status: "confirmed", at: "2026-05-01T07:31:00Z" },
  { id: "t6", hash: "tx_77aa...d901", type: "Yield", direction: "in" as const, amountAda: 5.8, status: "confirmed", at: "2026-06-18T21:55:00Z" },
];

export const treasurySeries = [
  { label: "Jan", pool: 1.24, yield: 0.011, apy: 7.8 },
  { label: "Feb", pool: 1.61, yield: 0.026, apy: 8.1 },
  { label: "Mar", pool: 2.02, yield: 0.044, apy: 8.6 },
  { label: "Apr", pool: 2.38, yield: 0.067, apy: 8.9 },
  { label: "May", pool: 2.91, yield: 0.095, apy: 9.1 },
  { label: "Jun", pool: 3.42, yield: 0.128, apy: 9.3 },
  { label: "Jul", pool: 3.87, yield: 0.163, apy: 9.4 },
];

export const mockTreasury = {
  totalPoolAda: 3_870_000,
  allocatedAda: 3_020_000,
  liquidAda: 850_000,
  allocationCapPct: 80,
  currentAllocationPct: 78.0,
  currentApy: 9.4,
  interestEarnedAda: 163_000,
  activeLoans: 42,
  outstandingLoansAda: 2_140_000,
  strategies: [
    { name: "Collateralized lending", value: 1_690_000, color: "#22d3ee" },
    { name: "ADA staking", value: 830_000, color: "#8b5cf6" },
    { name: "Stable LP", value: 500_000, color: "#10b981" },
    { name: "Liquid reserve", value: 850_000, color: "#374151" },
  ],
};

export const mockNotifications = [
  { id: "n1", title: "Yield distribution complete", body: "July yield of ₳6.2 credited to your vault share.", at: "2026-07-18T22:11:00Z", read: false, kind: "success" },
  { id: "n2", title: "Claim update", body: "CLM-2026-2402 proof verified. Awaiting approval.", at: "2026-07-16T09:03:00Z", read: false, kind: "info" },
  { id: "n3", title: "Premium reminder", body: "Next premium of ₳120 due Aug 1.", at: "2026-07-15T08:00:00Z", read: true, kind: "warning" },
  { id: "n4", title: "Privacy report", body: "Zero data disclosures this quarter. Privacy score 98.", at: "2026-07-01T12:00:00Z", read: true, kind: "success" },
];

// ---------- Hospital portal ----------

export const mockHospital = {
  id: "hsp_novamedica",
  name: "Nova Medica Center",
  license: "MED-LIC-2024-8817",
  verified: true,
  address: "Sector 21, Cyber City",
  wallet: "addr1q9hospital7v2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc",
  totalReceivableAda: 48_200,
  paidAda: 31_650,
  pendingAda: 16_550,
  claimsThisMonth: 37,
  approvalRate: 92.4,
};

export const hospitalClaims = [
  { id: "hc1", reference: "CLM-2026-2402", patientRef: "PT-8841", procedureType: "Consultation", amountAda: 320, status: "proof_verified" as const, submittedAt: "2026-07-16T08:45:00Z", zkVerified: true },
  { id: "hc2", reference: "CLM-2026-2398", patientRef: "PT-2210", procedureType: "Surgery", amountAda: 9_400, status: "submitted" as const, submittedAt: "2026-07-15T17:20:00Z", zkVerified: false },
  { id: "hc3", reference: "CLM-2026-2390", patientRef: "PT-5567", procedureType: "Imaging", amountAda: 780, status: "approved" as const, submittedAt: "2026-07-14T11:32:00Z", zkVerified: true },
  { id: "hc4", reference: "CLM-2026-2371", patientRef: "PT-1093", procedureType: "Emergency", amountAda: 3_150, status: "paid" as const, submittedAt: "2026-07-11T02:12:00Z", zkVerified: true },
  { id: "hc5", reference: "CLM-2026-2355", patientRef: "PT-7742", procedureType: "Therapy", amountAda: 460, status: "rejected" as const, submittedAt: "2026-07-09T15:44:00Z", zkVerified: false },
  { id: "hc6", reference: "CLM-2026-2344", patientRef: "PT-8841", procedureType: "Lab work", amountAda: 210, status: "paid" as const, submittedAt: "2026-07-07T10:05:00Z", zkVerified: true },
];

export const hospitalRevenueSeries = [
  { label: "Feb", revenue: 21.4 },
  { label: "Mar", revenue: 26.8 },
  { label: "Apr", revenue: 24.1 },
  { label: "May", revenue: 31.5 },
  { label: "Jun", revenue: 35.2 },
  { label: "Jul", revenue: 38.9 },
];

export const hospitalPatients = [
  { ref: "PT-8841", policyTier: "Shield Plus", coverageOk: true, claims: 3, lastVisit: "2026-07-16T08:45:00Z" },
  { ref: "PT-2210", policyTier: "Sovereign", coverageOk: true, claims: 1, lastVisit: "2026-07-15T17:20:00Z" },
  { ref: "PT-5567", policyTier: "Essential", coverageOk: true, claims: 2, lastVisit: "2026-07-14T11:32:00Z" },
  { ref: "PT-1093", policyTier: "Shield Plus", coverageOk: true, claims: 5, lastVisit: "2026-07-11T02:12:00Z" },
  { ref: "PT-7742", policyTier: "Essential", coverageOk: false, claims: 2, lastVisit: "2026-07-09T15:44:00Z" },
];

// ---------- Platform admin ----------

export const adminStats = {
  totalUsers: 12_847,
  totalHospitals: 214,
  activePolicies: 9_631,
  treasuryAda: 3_870_000,
  poolHealth: 96,
  fraudAlerts: 3,
  pendingClaims: 128,
  pendingLoans: 7,
};

export const adminGrowthSeries = [
  { label: "Jan", users: 4200, policies: 2900 },
  { label: "Feb", users: 5900, policies: 4100 },
  { label: "Mar", users: 7300, policies: 5400 },
  { label: "Apr", users: 8900, policies: 6800 },
  { label: "May", users: 10400, policies: 8000 },
  { label: "Jun", users: 11800, policies: 8900 },
  { label: "Jul", users: 12847, policies: 9631 },
];

export const adminLoans = [
  { id: "ln_501", borrower: "Meld Protocol Pool A", principalAda: 620_000, apr: 11.2, collateralRatio: 168, status: "active" as const, maturity: "2026-11-01" },
  { id: "ln_498", borrower: "Liqwid Market ADA", principalAda: 540_000, apr: 9.8, collateralRatio: 182, status: "active" as const, maturity: "2026-09-15" },
  { id: "ln_495", borrower: "Lenfi Vault 7", principalAda: 380_000, apr: 10.5, collateralRatio: 175, status: "active" as const, maturity: "2026-10-20" },
  { id: "ln_509", borrower: "Optim DAO Bond", principalAda: 300_000, apr: 12.1, collateralRatio: 161, status: "pending" as const, maturity: "2027-01-10" },
  { id: "ln_512", borrower: "Indigo iAsset LP", principalAda: 300_000, apr: 8.9, collateralRatio: 190, status: "pending" as const, maturity: "2026-12-05" },
];

export const fraudAlerts = [
  { id: "fa1", severity: "high" as const, title: "Duplicate claim pattern", detail: "Commitment reuse attempt across 2 policies", entity: "CLM-2026-2405", at: "2026-07-18T04:22:00Z" },
  { id: "fa2", severity: "medium" as const, title: "Velocity anomaly", detail: "4 claims in 72h from same hospital cluster", entity: "hsp_eastgate", at: "2026-07-17T19:10:00Z" },
  { id: "fa3", severity: "low" as const, title: "Proof retry spike", detail: "Elevated failed ZK verifications", entity: "verifier-node-2", at: "2026-07-16T23:47:00Z" },
];

export const adminUsers = [
  { id: "u_1", ref: "USR-10021", tier: "Shield Plus", status: "active", joined: "2026-01-14", claims: 3 },
  { id: "u_2", ref: "USR-10394", tier: "Sovereign", status: "active", joined: "2026-02-02", claims: 1 },
  { id: "u_3", ref: "USR-11207", tier: "Essential", status: "lapsed", joined: "2026-03-19", claims: 0 },
  { id: "u_4", ref: "USR-11893", tier: "Shield Plus", status: "active", joined: "2026-04-25", claims: 2 },
  { id: "u_5", ref: "USR-12440", tier: "Essential", status: "suspended", joined: "2026-05-30", claims: 4 },
];

export const adminHospitals = [
  { id: "h_1", name: "Nova Medica Center", region: "North", verified: true, claims: 412, payoutAda: 480_000, rating: 4.8 },
  { id: "h_2", name: "Helix Health Institute", region: "West", verified: true, claims: 356, payoutAda: 401_500, rating: 4.6 },
  { id: "h_3", name: "Eastgate Clinics", region: "East", verified: true, claims: 289, payoutAda: 322_000, rating: 3.9 },
  { id: "h_4", name: "Aurora Care Group", region: "South", verified: false, claims: 0, payoutAda: 0, rating: 0 },
];

export const auditLogs = [
  { id: "al1", actor: "admin@medvault.io", action: "APPROVE_LOAN", entity: "ln_495", at: "2026-07-18T10:14:00Z" },
  { id: "al2", actor: "system", action: "YIELD_DISTRIBUTION", entity: "epoch-2026-07", at: "2026-07-18T22:10:00Z" },
  { id: "al3", actor: "admin@medvault.io", action: "APPROVE_CLAIM", entity: "CLM-2026-2390", at: "2026-07-14T12:01:00Z" },
  { id: "al4", actor: "risk-engine", action: "FLAG_FRAUD", entity: "CLM-2026-2405", at: "2026-07-18T04:22:00Z" },
  { id: "al5", actor: "admin@medvault.io", action: "VERIFY_HOSPITAL", entity: "hsp_novamedica", at: "2026-07-02T09:40:00Z" },
];
