package com.medichain.config;

import com.medichain.entity.*;
import com.medichain.enums.*;
import com.medichain.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Seeds demo data on startup so the app looks real.
 * Only runs if no data exists.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final HospitalRepository hospitalRepository;
    private final InsuranceClaimRepository claimRepository;
    private final MedicalRecordRepository recordRepository;
    private final PrescriptionRepository prescriptionRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (hospitalRepository.count() > 0) return; // Already seeded

        log.info("Seeding demo data...");

        // ── Hospital ─────────────────────────────────────
        Hospital hospital = hospitalRepository.save(Hospital.builder()
            .name("Apollo MediChain Hospital, Hyderabad")
            .walletAddress("addr_test1hospital_apollo_hyd")
            .address("Jubilee Hills, Hyderabad")
            .city("Hyderabad").state("Telangana")
            .licenseNumber("APMCH-2024-HYD")
            .build());

        // ── Demo Users ────────────────────────────────────
        User adminUser   = createUser("addr_test1_demo_hospital_admin",   "Demo Admin",     UserRole.HOSPITAL_ADMIN);
        User doctorUser  = createUser("addr_test1_demo_doctor_rajesh",    "Dr. Rajesh Kumar", UserRole.DOCTOR);
        User doctorUser2 = createUser("addr_test1_demo_doctor_priya",     "Dr. Priya Sharma", UserRole.DOCTOR);
        User patientUser = createUser("addr_test1_demo_patient_priya",    "Priya Sharma",   UserRole.PATIENT);
        User patient2    = createUser("addr_test1_demo_patient_arjun",    "Arjun Patel",    UserRole.PATIENT);
        User patient3    = createUser("addr_test1_demo_patient_kavitha",  "Kavitha Reddy",  UserRole.PATIENT);
        User insUser     = createUser("addr_test1_demo_insurance_kavitha","Insurance Officer", UserRole.INSURANCE_OFFICER);
        User pharmacist  = createUser("addr_test1_demo_pharmacist_arjun", "Arjun Pharmacy", UserRole.PHARMACIST);

        // ── Doctors ───────────────────────────────────────
        Doctor dr1 = doctorRepository.save(Doctor.builder()
            .user(doctorUser).walletAddress(doctorUser.getWalletAddress())
            .specialization("Cardiology").hospital(hospital)
            .credentialsVerified(true).licenseNumber("MCI-CAR-2019-4521")
            .credentialZkpProofHash("midnight_doctor_credential_zkp_001").build());

        Doctor dr2 = doctorRepository.save(Doctor.builder()
            .user(doctorUser2).walletAddress(doctorUser2.getWalletAddress())
            .specialization("Neurology").hospital(hospital)
            .credentialsVerified(true).licenseNumber("MCI-NEU-2020-7832")
            .credentialZkpProofHash("midnight_doctor_credential_zkp_002").build());

        // ── Patients ──────────────────────────────────────
        Patient p1 = patientRepository.save(Patient.builder()
            .user(patientUser).walletAddress(patientUser.getWalletAddress())
            .kycStatus(KycStatus.VERIFIED).bloodGroup("B+")
            .zkpProofHash("midnight_patient_kyc_zkp_001")
            .identityNftTxHash("cardano_tx_identity_nft_priya_001")
            .identityNftAssetId("medichain_identity_priya_001")
            .emergencyContact("+91-9876543210").build());

        Patient p2 = patientRepository.save(Patient.builder()
            .user(patient2).walletAddress(patient2.getWalletAddress())
            .kycStatus(KycStatus.VERIFIED).bloodGroup("O+")
            .zkpProofHash("midnight_patient_kyc_zkp_002")
            .identityNftTxHash("cardano_tx_identity_nft_arjun_002")
            .identityNftAssetId("medichain_identity_arjun_002")
            .emergencyContact("+91-9876501234").build());

        Patient p3 = patientRepository.save(Patient.builder()
            .user(patient3).walletAddress(patient3.getWalletAddress())
            .kycStatus(KycStatus.VERIFIED).bloodGroup("A+")
            .zkpProofHash("midnight_patient_kyc_zkp_003")
            .identityNftTxHash("cardano_tx_identity_nft_kavitha_003")
            .identityNftAssetId("medichain_identity_kavitha_003")
            .emergencyContact("+91-9811223344").build());

        // ── Medical Records (as NFTs) ─────────────────────
        recordRepository.save(MedicalRecord.builder()
            .patient(p1).doctor(dr1).hospital(hospital)
            .recordType(RecordType.CONSULTATION)
            .diagnosis("Hypertensive Heart Disease (ICD-10: I11.9)")
            .notes("BP: 150/95 mmHg. Started on Amlodipine 5mg. Follow-up in 2 weeks.")
            .nftTxHash("cardano_tx_record_nft_001").nftAssetId("medichain_record_001")
            .recordHash("sha256_record_hash_001").build());

        recordRepository.save(MedicalRecord.builder()
            .patient(p1).doctor(dr1).hospital(hospital)
            .recordType(RecordType.LAB_RESULT)
            .diagnosis("Lipid Profile: LDL 145 mg/dL (High)")
            .notes("Recommended dietary changes. Statin therapy discussed.")
            .nftTxHash("cardano_tx_record_nft_002").nftAssetId("medichain_record_002")
            .recordHash("sha256_record_hash_002").build());

        recordRepository.save(MedicalRecord.builder()
            .patient(p2).doctor(dr2).hospital(hospital)
            .recordType(RecordType.CONSULTATION)
            .diagnosis("Tension-Type Headache (ICD-10: G44.2)")
            .notes("Stress-related. Prescribed Ibuprofen 400mg. Lifestyle counselling.")
            .nftTxHash("cardano_tx_record_nft_003").nftAssetId("medichain_record_003")
            .recordHash("sha256_record_hash_003").build());

        recordRepository.save(MedicalRecord.builder()
            .patient(p3).doctor(dr1).hospital(hospital)
            .recordType(RecordType.CONSULTATION)
            .diagnosis("Type 2 Diabetes Mellitus (ICD-10: E11)")
            .notes("HbA1c: 8.2%. Metformin 500mg BID. Diet and exercise plan issued.")
            .nftTxHash("cardano_tx_record_nft_004").nftAssetId("medichain_record_004")
            .recordHash("sha256_record_hash_004").build());

        // ── Prescriptions (as NFTs on Cardano) ───────────
        prescriptionRepository.save(Prescription.builder()
            .patient(p1).doctor(dr1)
            .medicines("[{\"name\":\"Amlodipine\",\"dosage\":\"5mg\",\"frequency\":\"Once daily\",\"duration\":\"30 days\"}," +
                       "{\"name\":\"Atorvastatin\",\"dosage\":\"10mg\",\"frequency\":\"Once at night\",\"duration\":\"30 days\"}]")
            .notes("Take after meals. Monitor BP daily.")
            .validUntil(java.time.LocalDate.now().plusDays(30))
            .nftTxHash("cardano_tx_prescription_nft_001")
            .nftAssetId("medichain_rx_001")
            .prescriptionHash("sha256_rx_hash_001").build());

        prescriptionRepository.save(Prescription.builder()
            .patient(p3).doctor(dr1)
            .medicines("[{\"name\":\"Metformin\",\"dosage\":\"500mg\",\"frequency\":\"Twice daily\",\"duration\":\"90 days\"}]")
            .notes("Take with food. Check blood sugar weekly.")
            .validUntil(java.time.LocalDate.now().plusDays(90))
            .nftTxHash("cardano_tx_prescription_nft_002")
            .nftAssetId("medichain_rx_002")
            .prescriptionHash("sha256_rx_hash_002").build());

        // ── Insurance Claims ──────────────────────────────
        claimRepository.save(InsuranceClaim.builder()
            .patient(p1).claimType(ClaimType.HOSPITALISATION)
            .claimAmountAda(new BigDecimal("500.00"))
            .zkpEligibilityHash("midnight_claim_eligibility_zkp_001")
            .status(ClaimStatus.PAID)
            .aiDecision("APPROVED").aiConfidence(new BigDecimal("0.94"))
            .fraudScore(new BigDecimal("0.03"))
            .masumiTxHash("masumi_tx_claims_agent_001")
            .escrowTxHash("cardano_escrow_tx_001")
            .payoutTxHash("cardano_payout_tx_001")
            .adaReleased(new BigDecimal("500.00"))
            .processedAt(LocalDateTime.now().minusDays(5)).build());

        claimRepository.save(InsuranceClaim.builder()
            .patient(p2).claimType(ClaimType.OPD)
            .claimAmountAda(new BigDecimal("50.00"))
            .zkpEligibilityHash("midnight_claim_eligibility_zkp_002")
            .status(ClaimStatus.APPROVED)
            .aiDecision("APPROVED").aiConfidence(new BigDecimal("0.97"))
            .fraudScore(new BigDecimal("0.01"))
            .masumiTxHash("masumi_tx_claims_agent_002")
            .escrowTxHash("cardano_escrow_tx_002")
            .processedAt(LocalDateTime.now().minusDays(2)).build());

        claimRepository.save(InsuranceClaim.builder()
            .patient(p3).claimType(ClaimType.MEDICINE)
            .claimAmountAda(new BigDecimal("120.00"))
            .zkpEligibilityHash("midnight_claim_eligibility_zkp_003")
            .status(ClaimStatus.MANUAL_REVIEW)
            .aiDecision("MANUAL_REVIEW").aiConfidence(new BigDecimal("0.72"))
            .fraudScore(new BigDecimal("0.42"))
            .masumiTxHash("masumi_tx_claims_agent_003").build());

        claimRepository.save(InsuranceClaim.builder()
            .patient(p1).claimType(ClaimType.SURGERY)
            .claimAmountAda(new BigDecimal("1500.00"))
            .zkpEligibilityHash("midnight_claim_eligibility_zkp_004")
            .status(ClaimStatus.SUBMITTED)
            .build());

        log.info("✅ Demo data seeded: 3 patients, 2 doctors, 4 records, 2 prescriptions, 4 claims");
    }

    private User createUser(String wallet, String name, UserRole role) {
        return userRepository.findByWalletAddress(wallet).orElseGet(() ->
            userRepository.save(User.builder()
                .walletAddress(wallet).name(name).role(role).isActive(true).build()));
    }
}
