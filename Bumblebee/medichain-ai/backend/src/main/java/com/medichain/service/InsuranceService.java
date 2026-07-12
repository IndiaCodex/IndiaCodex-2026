package com.medichain.service;

import com.medichain.entity.InsuranceClaim;
import com.medichain.entity.Patient;
import com.medichain.enums.ClaimStatus;
import com.medichain.enums.ClaimType;
import com.medichain.exception.ResourceNotFoundException;
import com.medichain.kafka.KafkaEventPublisher;
import com.medichain.midnight.MidnightService;
import com.medichain.repository.InsuranceClaimRepository;
import com.medichain.repository.PatientRepository;
import com.medichain.service.audit.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InsuranceService {

    private final InsuranceClaimRepository claimRepository;
    private final PatientRepository patientRepository;
    private final MidnightService midnightService;
    private final KafkaEventPublisher kafkaPublisher;
    private final AuditService auditService;

    @Transactional
    public InsuranceClaim submitClaim(
            UUID patientId,
            ClaimType claimType,
            BigDecimal claimAmountAda,
            String zkpEligibilityProof,
            String supportingDocHash,
            String patientWallet) {

        Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        // Verify ZKP eligibility proof on Midnight
        boolean proofValid = midnightService.verifyProof(zkpEligibilityProof, "verify_claim_eligibility");
        if (!proofValid) {
            throw new IllegalArgumentException("ZKP eligibility proof is invalid");
        }

        InsuranceClaim claim = InsuranceClaim.builder()
            .patient(patient)
            .claimType(claimType)
            .claimAmountAda(claimAmountAda)
            .zkpEligibilityHash(zkpEligibilityProof)
            .supportingDocHash(supportingDocHash)
            .status(ClaimStatus.ZKP_VERIFIED)
            .build();

        claim = claimRepository.save(claim);

        // Publish to Kafka — AI agent picks this up automatically
        kafkaPublisher.publishClaimSubmitted(Map.of(
            "workflow_id", "wf-claim-" + claim.getId(),
            "action", "PROCESS_CLAIM",
            "patient_id", patientId.toString(),
            "claim_id", claim.getId().toString(),
            "claim_type", claimType.name(),
            "claim_amount_ada", claimAmountAda.toString(),
            "zkp_eligibility_proof", zkpEligibilityProof,
            "patient_wallet", patientWallet
        ));

        claim.setStatus(ClaimStatus.AI_PROCESSING);
        claimRepository.save(claim);

        auditService.log(patient.getUser().getId(), "CLAIM_SUBMITTED", "INSURANCE_CLAIM",
            claim.getId().toString(), null, "SUCCESS");

        log.info("Insurance claim submitted: {} for patient {}", claim.getId(), patientId);
        return claim;
    }

    @Transactional
    public InsuranceClaim updateClaimFromAiDecision(
            UUID claimId,
            String aiDecision,
            BigDecimal aiConfidence,
            BigDecimal fraudScore,
            String masumiTxHash) {

        InsuranceClaim claim = claimRepository.findById(claimId)
            .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));

        claim.setAiDecision(aiDecision);
        claim.setAiConfidence(aiConfidence);
        claim.setFraudScore(fraudScore);
        claim.setMasumiTxHash(masumiTxHash);

        if ("APPROVED".equals(aiDecision)) {
            claim.setStatus(ClaimStatus.APPROVED);
        } else if ("MANUAL_REVIEW".equals(aiDecision)) {
            claim.setStatus(ClaimStatus.MANUAL_REVIEW);
        } else {
            claim.setStatus(ClaimStatus.REJECTED);
        }

        return claimRepository.save(claim);
    }

    @Transactional(readOnly = true)
    public List<InsuranceClaim> getPatientClaims(UUID patientId) {
        return claimRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    @Transactional(readOnly = true)
    public InsuranceClaim getClaimById(UUID claimId) {
        return claimRepository.findById(claimId)
            .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));
    }

    @Transactional(readOnly = true)
    public List<InsuranceClaim> getPendingManualReview() {
        return claimRepository.findByStatus(ClaimStatus.MANUAL_REVIEW);
    }

    @Transactional
    public InsuranceClaim saveClaim(InsuranceClaim claim) {
        return claimRepository.save(claim);
    }
}
