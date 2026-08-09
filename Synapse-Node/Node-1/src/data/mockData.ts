export interface MedicalRecord {
  id: string;
  name: string;
  type: "lab" | "vaccination" | "prescription" | "imaging" | "consultation" | "allergy";
  date: string;
  locked: boolean;
  accessRequested: boolean;
  requestedBy: string | null;
  content: string;
  summary: string;
}

export interface AccessRequest {
  id: string;
  recordId: string;
  recordName: string;
  doctorName: string;
  doctorAddress: string;
  timestamp: string;
  status: "pending" | "approved" | "denied";
}

export interface PatientProfile {
  name: string;
  walletAddress: string;
  age: number;
  bloodGroup: string;
  registeredSince: string;
}

export interface DoctorProfile {
  name: string;
  walletAddress: string;
  specialty: string;
  hospital: string;
}

export const mockPatient: PatientProfile = {
  name: "Arjun Mehta",
  walletAddress: "addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp",
  age: 32,
  bloodGroup: "O+",
  registeredSince: "2025-03-15",
};

export const mockDoctor: DoctorProfile = {
  name: "Dr. Priya Sharma",
  walletAddress: "addr1q9h8vf3...k4x7nz",
  specialty: "General Medicine",
  hospital: "Apollo Hospitals, Mumbai",
};

export const initialRecords: MedicalRecord[] = [
  {
    id: "rec-001",
    name: "Complete Blood Count (CBC)",
    type: "lab",
    date: "2026-06-28",
    locked: true,
    accessRequested: false,
    requestedBy: null,
    summary: "Routine blood panel — hemoglobin, WBC, platelets",
    content: `COMPLETE BLOOD COUNT (CBC) — 28 Jun 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hemoglobin:      14.2 g/dL    [Normal: 13.5-17.5]
WBC:             7,200 /μL    [Normal: 4,500-11,000]
Platelets:       245,000 /μL  [Normal: 150,000-400,000]
RBC:             4.8 M/μL     [Normal: 4.5-5.5]
Hematocrit:      42%          [Normal: 38.3-48.6%]

STATUS: All values within normal range.
DOCTOR: Dr. Priya Sharma
LAB: MediLab Diagnostics, Mumbai`,
  },
  {
    id: "rec-002",
    name: "COVID-19 Vaccination Record",
    type: "vaccination",
    date: "2026-01-12",
    locked: true,
    accessRequested: false,
    requestedBy: null,
    summary: "Full vaccination course — Covishield + Booster",
    content: `VACCINATION HISTORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dose 1:  Covishield  |  15 Apr 2021  |  Batch: AZ-4120
Dose 2:  Covishield  |  12 Jul 2021  |  Batch: AZ-6832
Booster: Covovax     |  12 Jan 2026  |  Batch: NV-1187

VERIFIED ON-CHAIN: TX#a8f3c...92d1
STATUS: Fully Vaccinated + Boosted`,
  },
  {
    id: "rec-003",
    name: "Chest X-Ray Report",
    type: "imaging",
    date: "2026-05-10",
    locked: true,
    accessRequested: false,
    requestedBy: null,
    summary: "Routine chest radiograph — no abnormalities",
    content: `CHEST X-RAY (PA VIEW) — 10 May 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINDINGS:
- Heart size: Normal
- Lungs: Clear bilateral lung fields
- Mediastinum: Unremarkable
- Costophrenic angles: Sharp

IMPRESSION: Normal chest radiograph.
RADIOLOGIST: Dr. Vikram Patel`,
  },
  {
    id: "rec-004",
    name: "Prescription — Seasonal Allergy",
    type: "prescription",
    date: "2026-06-01",
    locked: true,
    accessRequested: false,
    requestedBy: null,
    summary: "Cetirizine + Montelukast for seasonal allergies",
    content: `PRESCRIPTION — 01 Jun 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Tab. Cetirizine 10mg  — Once daily at bedtime — 14 days
2. Tab. Montelukast 10mg — Once daily at bedtime — 14 days
3. Fluticasone Nasal Spray — 2 puffs each nostril — Morning

DIAGNOSIS: Seasonal Allergic Rhinitis
PRESCRIBER: Dr. Priya Sharma
PHARMACY TX: Pending on-chain verification`,
  },
  {
    id: "rec-005",
    name: "Allergy Profile — CRITICAL",
    type: "allergy",
    date: "2025-11-20",
    locked: true,
    accessRequested: false,
    requestedBy: null,
    summary: "⚠️ Penicillin allergy — Anaphylaxis risk",
    content: `ALLERGY PROFILE — CRITICAL FLAG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALLERGEN:   Penicillin (and derivatives)
SEVERITY:   SEVERE — Anaphylaxis Risk
REACTION:   Urticaria, angioedema, bronchospasm
LAST EVENT: 20 Nov 2025

⚠️ DO NOT ADMINISTER: Amoxicillin, Ampicillin, 
   or any beta-lactam antibiotics.

VERIFIED ON-CHAIN: TX#d4e2b...71f8
EMERGENCY CONTACT: +91 98765 43210`,
  },
  {
    id: "rec-006",
    name: "Annual Health Checkup",
    type: "consultation",
    date: "2026-04-15",
    locked: true,
    accessRequested: false,
    requestedBy: null,
    summary: "Comprehensive annual physical — all clear",
    content: `ANNUAL HEALTH CHECKUP — 15 Apr 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VITALS:
- BP: 120/80 mmHg          [Normal]
- Pulse: 72 bpm            [Normal]
- BMI: 23.4                [Normal]
- SpO2: 98%                [Normal]
- Temperature: 98.4°F      [Normal]

ASSESSMENT: Patient in good overall health.
No acute concerns. Continue current medications.
Follow up in 12 months.

PHYSICIAN: Dr. Priya Sharma
FACILITY: Apollo Hospitals, Mumbai`,
  },
];

export const initialAccessRequests: AccessRequest[] = [
  {
    id: "areq-001",
    recordId: "rec-001",
    recordName: "Complete Blood Count (CBC)",
    doctorName: "Dr. Priya Sharma",
    doctorAddress: "addr1q9h8vf3...k4x7nz",
    timestamp: "2026-07-12T09:30:00",
    status: "pending",
  },
];
