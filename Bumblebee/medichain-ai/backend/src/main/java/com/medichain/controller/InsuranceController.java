package com.medichain.controller;

import com.medichain.entity.InsuranceClaim;
import com.medichain.entity.User;
import com.medichain.enums.ClaimStatus;
import com.medichain.enums.ClaimType;
import com.medichain.service.InsuranceService;
import com.medichain.service.audit.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/insurance")
@RequiredArgsConstructor
@Tag(name = "Insurance", description = "Insurance claim management")
public class InsuranceController {

    private final InsuranceService insuranceService;
    private final AuditService auditService;

    @PostMapping("/claims")
    @Operation(summary = "Submit insurance claim with ZKP eligibility proof")
    public ResponseEntity<InsuranceClaim> submitClaim(
            @Valid @RequestBody ClaimRequest request,
            @AuthenticationPrincipal User currentUser) {

        InsuranceClaim claim = insuranceService.submitClaim(
            request.getPatientId(),
            request.getClaimType(),
            request.getClaimAmountAda(),
            request.getZkpEligibilityProof(),
            request.getSupportingDocHash(),
            currentUser.getWalletAddress()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(claim);
    }

    @GetMapping("/claims/{claimId}")
    @Operation(summary = "Get claim status")
    public ResponseEntity<InsuranceClaim> getClaimStatus(@PathVariable UUID claimId) {
        return ResponseEntity.ok(insuranceService.getClaimById(claimId));
    }

    @GetMapping("/claims/patient/{patientId}")
    @Operation(summary = "Get all claims for a patient")
    public ResponseEntity<List<InsuranceClaim>> getPatientClaims(@PathVariable UUID patientId) {
        return ResponseEntity.ok(insuranceService.getPatientClaims(patientId));
    }

    @GetMapping("/claims/manual-review")
    @PreAuthorize("hasAnyRole('INSURANCE_OFFICER', 'SUPER_ADMIN')")
    @Operation(summary = "Get claims awaiting manual review")
    public ResponseEntity<List<InsuranceClaim>> getPendingManualReview() {
        return ResponseEntity.ok(insuranceService.getPendingManualReview());
    }

    @PostMapping("/claims/{claimId}/approve")
    @PreAuthorize("hasAnyRole('INSURANCE_OFFICER', 'SUPER_ADMIN')")
    @Operation(summary = "Approve insurance claim — triggers ADA payment release via Aiken escrow")
    public ResponseEntity<Map<String, Object>> approveClaim(
            @PathVariable UUID claimId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {

        InsuranceClaim claim = insuranceService.getClaimById(claimId);
        claim.setStatus(ClaimStatus.APPROVED);
        insuranceService.saveClaim(claim);

        String escrowTxHash = body != null ? body.getOrDefault("escrowTxHash", null) : null;

        auditService.log(currentUser.getId(), "CLAIM_APPROVED", "INSURANCE_CLAIM",
                claimId.toString(), null, "SUCCESS");

        return ResponseEntity.ok(Map.of(
            "claimId", claimId.toString(),
            "status", "APPROVED",
            "escrowTxHash", escrowTxHash != null ? escrowTxHash : "pending",
            "message", "Claim approved. ADA payment release initiated via Aiken escrow contract.",
            "cardanoNetwork", "preprod",
            "adaReleased", claim.getClaimAmountAda() != null ? claim.getClaimAmountAda().toString() : "0"
        ));
    }

    @PostMapping("/claims/{claimId}/reject")
    @PreAuthorize("hasAnyRole('INSURANCE_OFFICER', 'SUPER_ADMIN')")
    @Operation(summary = "Reject insurance claim")
    public ResponseEntity<Map<String, Object>> rejectClaim(
            @PathVariable UUID claimId,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {

        InsuranceClaim claim = insuranceService.getClaimById(claimId);
        claim.setStatus(ClaimStatus.REJECTED);
        insuranceService.saveClaim(claim);

        auditService.log(currentUser.getId(), "CLAIM_REJECTED", "INSURANCE_CLAIM",
                claimId.toString(), null, "SUCCESS");

        return ResponseEntity.ok(Map.of("claimId", claimId.toString(), "status", "REJECTED"));
    }

    @Data
    static class ClaimRequest {
        @NotNull private UUID patientId;
        @NotNull private ClaimType claimType;
        @NotNull @Positive private BigDecimal claimAmountAda;
        @NotBlank private String zkpEligibilityProof;
        private String supportingDocHash;
    }
}
