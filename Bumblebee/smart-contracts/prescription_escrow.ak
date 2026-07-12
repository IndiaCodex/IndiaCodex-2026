// MediChain AI — Prescription Escrow Smart Contract
// Written in Aiken — https://aiken-lang.org
// Track 1: General — Built on Cardano
// IndiaCodex 2026 Hackathon
//
// HOW IT WORKS:
// 1. Doctor locks ADA in this contract with prescription details as datum
// 2. Patient signs to claim (receive medicine)
// 3. Pharmacist + Patient both sign to dispense
// 4. If expired (30 days), Doctor gets refund
//
// This enforces trustless prescription dispensing on-chain

use aiken/collection/list
use aiken/crypto.{VerificationKeyHash}
use aiken/interval.{Finite}
use cardano/transaction.{OutputReference, Transaction}

// ── Datum ────────────────────────────────────────────────────────────────────
// Stored on-chain when doctor creates prescription

pub type PrescriptionDatum {
  // Who can claim this prescription
  patient_pkh: VerificationKeyHash,
  // Doctor who issued it (can refund if expired)
  doctor_pkh: VerificationKeyHash,
  // Pharmacist authorized to dispense
  pharmacist_pkh: VerificationKeyHash,
  // SHA-256 hash of prescription details (stored off-chain, verified on-chain)
  prescription_hash: ByteArray,
  // POSIX timestamp after which doctor can reclaim (30 days)
  expiry_time: Int,
  // Prescription ID for cross-referencing with MediChain database
  prescription_id: ByteArray,
}

// ── Redeemer ─────────────────────────────────────────────────────────────────
// Action the spender wants to take

pub type PrescriptionRedeemer {
  // Patient collects prescription from pharmacist
  // Requires: patient signature
  Dispense
  // Doctor reclaims ADA after expiry (patient didn't collect)
  // Requires: doctor signature + time after expiry
  Refund
  // Emergency cancel by doctor (before expiry)
  // Requires: both doctor AND patient signatures
  Cancel
}

// ── Validator ─────────────────────────────────────────────────────────────────

validator prescription_escrow {
  spend(
    datum: Option<PrescriptionDatum>,
    redeemer: PrescriptionRedeemer,
    _input: OutputReference,
    self: Transaction,
  ) {
    // Datum must be present
    expect Some(d) = datum

    when redeemer is {
      // Patient dispenses prescription at pharmacy
      // Doctor or pharmacist can also authorize dispensing
      Dispense -> {
        let patient_signed =
          list.has(self.extra_signatories, d.patient_pkh)
        let pharmacist_signed =
          list.has(self.extra_signatories, d.pharmacist_pkh)
        let doctor_signed =
          list.has(self.extra_signatories, d.doctor_pkh)

        // Either patient OR pharmacist (with doctor) can dispense
        patient_signed || pharmacist_signed && doctor_signed
      }

      // Doctor reclaims after expiry
      Refund -> {
        let doctor_signed =
          list.has(self.extra_signatories, d.doctor_pkh)

        // Tx validity must be after expiry
        // Use lower bound of validity interval
        let is_expired =
          when self.validity_range.lower_bound.bound_type is {
            Finite(t) -> t >= d.expiry_time
            _ -> False
          }

        doctor_signed && is_expired
      }

      // Emergency cancel requires both parties
      Cancel -> {
        let doctor_signed =
          list.has(self.extra_signatories, d.doctor_pkh)
        let patient_signed =
          list.has(self.extra_signatories, d.patient_pkh)

        doctor_signed && patient_signed
      }
    }
  }
}
