package com.medichain.controller;

import com.medichain.entity.ConsentRecord;
import com.medichain.entity.User;
import com.medichain.repository.ConsentRepository;
import com.medichain.repository.PatientRepository;
import com.medichain.service.audit.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/consent")
@RequiredArgsConstructor
@Tag(name = "Consent", description = "Patient data consent management — recorded on Cardano")
public class ConsentController {

    private final ConsentRepository consentRepository;
    private final PatientRepository patientRepository;
    private final AuditService auditService;

    /** Get all consents for the logged-in patient */
    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Get all consent requests for the current patient")
    public ResponseEntity<List<ConsentRecord>> getMyConsents(
            @AuthenticationPrincipal User currentUser) {
        var patient = patientRepository.findByWalletAddress(currentUser.getWalletAddress())
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        return ResponseEntity.ok(
            consentRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId())
        );
    }

    /** Doctor/Admin creates a consent request */
    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Create a consent request for a patient")
    public ResponseEntity<ConsentRecord> createConsent(
            @RequestBody ConsentRequest req,
            @AuthenticationPrincipal User currentUser) {

        ConsentRecord consent = ConsentRecord.builder()
                .patientId(req.getPatientId())
                .requestedById(currentUser.getId())
                .requestedByName(currentUser.getName() != null ? currentUser.getName() : "Dr. " + currentUser.getWalletAddress().substring(0, Math.min(8, currentUser.getWalletAddress().length())))
                .recipientName(req.getRecipientName())
                .consentType(req.getConsentType() != null ? req.getConsentType() : "SHARE_WITH_INSURANCE")
                .title(req.getTitle())
                .description(req.getDescription())
                .status("PENDING")
                .build();

        ConsentRecord saved = consentRepository.save(consent);
        auditService.log(currentUser.getId(), "CONSENT_REQUESTED", "CONSENT",
                saved.getId().toString(), null, "SUCCESS");

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /** Patient responds to a consent request */
    @PutMapping("/{consentId}/respond")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Patient approves or denies a consent request — TX hash from Cardano recorded")
    public ResponseEntity<ConsentRecord> respond(
            @PathVariable UUID consentId,
            @RequestBody ConsentResponse response,
            @AuthenticationPrincipal User currentUser) {

        ConsentRecord consent = consentRepository.findById(consentId)
                .orElseThrow(() -> new RuntimeException("Consent not found"));

        String newStatus = response.isApproved() ? "APPROVED" : "DENIED";
        consent.setStatus(newStatus);
        consent.setCardanoTxHash(response.getTxHash());
        consent.setResolvedAt(LocalDateTime.now());

        ConsentRecord saved = consentRepository.save(consent);

        var patient = patientRepository.findById(consent.getPatientId()).orElse(null);
        UUID patientUserId = patient != null ? patient.getUser().getId() : null;
        auditService.log(patientUserId != null ? patientUserId : currentUser.getId(),
                response.isApproved() ? "CONSENT_APPROVED" : "CONSENT_DENIED",
                "CONSENT", consent.getId().toString(), null, "SUCCESS");

        return ResponseEntity.ok(saved);
    }

    /** Get pending consent count for notification badge */
    @GetMapping("/pending/count")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Get count of pending consent requests")
    public ResponseEntity<Map<String, Long>> getPendingCount(
            @AuthenticationPrincipal User currentUser) {
        var patient = patientRepository.findByWalletAddress(currentUser.getWalletAddress())
                .orElse(null);
        long count = patient != null
                ? consentRepository.countByPatientIdAndStatus(patient.getId(), "PENDING")
                : 0;
        return ResponseEntity.ok(Map.of("count", count));
    }

    @Data
    static class ConsentRequest {
        private UUID patientId;
        private String recipientName;
        private String consentType;
        private String title;
        private String description;
    }

    @Data
    static class ConsentResponse {
        private boolean approved;
        private String txHash;
    }
}
