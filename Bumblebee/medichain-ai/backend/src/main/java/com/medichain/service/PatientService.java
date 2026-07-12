package com.medichain.service;

import com.medichain.entity.Patient;
import com.medichain.entity.User;
import com.medichain.enums.KycStatus;
import com.medichain.enums.UserRole;
import com.medichain.exception.ResourceNotFoundException;
import com.medichain.repository.PatientRepository;
import com.medichain.repository.UserRepository;
import com.medichain.service.audit.AuditService;
import com.medichain.midnight.MidnightService;
import com.medichain.cardano.CardanoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final MidnightService midnightService;
    private final CardanoService cardanoService;
    private final AuditService auditService;

    @Transactional
    public Patient registerPatient(String walletAddress, String zkpProofHash, String name, String phone) {

        // Check if patient already exists
        if (patientRepository.findByWalletAddress(walletAddress).isPresent()) {
            throw new IllegalStateException("Patient already registered for this wallet");
        }

        // Verify ZKP proof on Midnight
        boolean proofValid = midnightService.verifyProof(zkpProofHash, "verify_patient_kyc");
        if (!proofValid) {
            throw new IllegalArgumentException("ZKP KYC proof is invalid");
        }

        // Get or create user
        User user = userRepository.findByWalletAddress(walletAddress)
            .orElseThrow(() -> new ResourceNotFoundException("User not found — connect wallet first"));

        user.setName(name);
        user.setPhone(phone);
        user.setRole(UserRole.PATIENT);
        userRepository.save(user);

        // Create patient record
        Patient patient = Patient.builder()
            .user(user)
            .walletAddress(walletAddress)
            .kycStatus(KycStatus.VERIFIED)
            .zkpProofHash(zkpProofHash)
            .build();

        patient = patientRepository.save(patient);

        // Mint Identity NFT on Cardano (async)
        final UUID patientId = patient.getId();
        cardanoService.mintIdentityNftAsync(walletAddress, patientId, zkpProofHash)
            .thenAccept(txHash -> {
                patientRepository.findById(patientId).ifPresent(p -> {
                    p.setIdentityNftTxHash(txHash);
                    patientRepository.save(p);
                });
                log.info("Identity NFT minted for patient {}: {}", patientId, txHash);
            });

        auditService.log(user.getId(), "PATIENT_REGISTERED", "PATIENT",
            patient.getId().toString(), null, "SUCCESS");

        log.info("Patient registered: {}", patient.getId());
        return patient;
    }

    @Transactional(readOnly = true)
    public Patient getPatientById(UUID patientId, UUID requestingUserId) {
        Patient patient = patientRepository.findByIdWithUser(patientId)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        auditService.log(requestingUserId, "VIEW_PATIENT", "PATIENT",
            patientId.toString(), null, "SUCCESS");

        return patient;
    }

    @Transactional(readOnly = true)
    public Patient getMyProfile(String walletAddress) {
        return patientRepository.findByWalletAddress(walletAddress)
            .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
    }

    @Transactional(readOnly = true)
    public java.util.List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }
}
