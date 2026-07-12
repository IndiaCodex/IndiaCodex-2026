package com.medichain.kafka;

import com.medichain.entity.InsuranceClaim;
import com.medichain.enums.ClaimStatus;
import com.medichain.repository.InsuranceClaimRepository;
import com.medichain.repository.PatientRepository;
import com.medichain.service.AgentLogService;
import com.medichain.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class KafkaEventConsumer {

    private final InsuranceClaimRepository claimRepository;
    private final PatientRepository patientRepository;
    private final NotificationService notificationService;
    private final AgentLogService agentLogService;

    /**
     * Receives events from AI agents and updates backend state.
     * This closes the loop: AI Agent → Kafka → Backend DB → Frontend real-time update
     */

    @KafkaListener(topics = "agent.completed", groupId = "backend-consumer")
    public void onAgentCompleted(Map<String, Object> event) {
        String eventType = (String) event.get("event_type");
        String workflowId = (String) event.get("workflow_id");
        log.info("Agent event received: {}", eventType);

        // Cache result so frontend can poll it (SPEC-004)
        if (workflowId != null) {
            agentLogService.cacheWorkflowResult(workflowId, event);
        }

        switch (eventType) {
            case "claim.approved" -> handleClaimApproved(event);
            case "payment.released" -> handlePaymentReleased(event);
            case "patient.registered" -> log.info("Patient registered via agent: {}", event.get("patient_id"));
            case "prescription.issued" -> log.info("Prescription NFT issued: {}", event.get("nft_tx_hash"));
            case "diagnosis.completed" -> log.info("Diagnosis completed for patient: {}", event.get("patient_id"));
            default -> log.debug("Unhandled agent event: {}", eventType);
        }
    }

    private void handleClaimApproved(Map<String, Object> event) {
        try {
            String claimId = (String) event.get("claim_id");
            if (claimId == null) return;

            claimRepository.findById(UUID.fromString(claimId)).ifPresent(claim -> {
                claim.setStatus(ClaimStatus.APPROVED);
                claim.setAiDecision("APPROVED");
                claim.setAiConfidence(getBigDecimal(event, "ai_confidence"));
                claim.setFraudScore(getBigDecimal(event, "fraud_score"));
                claim.setMasumiTxHash((String) event.get("masumi_tx_hash"));
                claim.setProcessedAt(java.time.LocalDateTime.now());
                claimRepository.save(claim);
                log.info("Claim {} updated to APPROVED", claimId);

                // SPEC-006: Notify patient after approval
                String patientEmail = claim.getPatient().getUser().getEmail();
                String patientName = claim.getPatient().getUser().getName();
                if (patientEmail != null && patientName != null) {
                    notificationService.sendEmail(patientEmail,
                        "Insurance Claim Approved",
                        "Dear " + patientName + ", your " + claim.getClaimType() + " claim has been approved by our AI agent. ADA will be released to your wallet shortly.");
                }
            });
        } catch (Exception e) {
            log.error("Error handling claim.approved: {}", e.getMessage());
        }
    }

    private void handlePaymentReleased(Map<String, Object> event) {
        try {
            String claimId = (String) event.get("claim_id");
            if (claimId == null) return;

            claimRepository.findById(UUID.fromString(claimId)).ifPresent(claim -> {
                claim.setStatus(ClaimStatus.PAID);
                claim.setPayoutTxHash((String) event.get("tx_hash"));
                claim.setAdaReleased(getBigDecimal(event, "amount_ada"));
                claimRepository.save(claim);
                log.info("Claim {} marked as PAID — Tx: {}", claimId, event.get("tx_hash"));

                // SPEC-006: Notify patient after payment
                String patientEmail = claim.getPatient().getUser().getEmail();
                String patientName = claim.getPatient().getUser().getName();
                if (patientEmail != null && patientName != null) {
                    notificationService.sendClaimApproved(
                        patientEmail, patientName,
                        claim.getClaimType().name(),
                        claim.getAdaReleased() != null ? claim.getAdaReleased().doubleValue() : 0,
                        (String) event.get("tx_hash")
                    );
                }
            });
        } catch (Exception e) {
            log.error("Error handling payment.released: {}", e.getMessage());
        }
    }

    private BigDecimal getBigDecimal(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return null;
        return new BigDecimal(val.toString());
    }
}
