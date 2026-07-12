package com.medichain.controller;

import com.medichain.midnight.MidnightService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/zkp")
@RequiredArgsConstructor
@Tag(name = "ZKP / Midnight", description = "Zero Knowledge Proof operations via Midnight Network")
public class ZKPController {

    private final MidnightService midnightService;

    @PostMapping("/patient-kyc/verify")
    @Operation(summary = "Verify patient KYC using ZKP — no personal data stored")
    public ResponseEntity<Map<String, Object>> verifyPatientKyc(
            @Valid @RequestBody ZkpVerifyRequest req) {

        boolean verified = midnightService.verifyProof(req.getZkpProof(), "verify_patient_kyc");
        return ResponseEntity.ok(Map.of(
            "verified", verified,
            "proofHash", req.getZkpProof(),
            "circuit", "verify_patient_kyc",
            "message", verified
                ? "Identity verified. No personal data stored."
                : "ZKP proof is invalid.",
            "privacyNote", "Aadhaar and personal documents were NOT seen or stored by MediChain AI"
        ));
    }

    @PostMapping("/claim-eligibility/verify")
    @Operation(summary = "Verify insurance claim eligibility using ZKP — no medical history revealed")
    public ResponseEntity<Map<String, Object>> verifyClaimEligibility(
            @Valid @RequestBody ZkpVerifyRequest req) {

        boolean verified = midnightService.verifyProof(req.getZkpProof(), "verify_claim_eligibility");
        return ResponseEntity.ok(Map.of(
            "verified", verified,
            "proofHash", req.getZkpProof(),
            "circuit", "verify_claim_eligibility",
            "message", verified
                ? "Claim eligibility verified. Medical history NOT revealed to insurance company."
                : "ZKP eligibility proof is invalid.",
            "privacyNote", "Full medical history was NOT shared. Only eligibility status was verified."
        ));
    }

    @PostMapping("/doctor-credentials/verify")
    @Operation(summary = "Verify doctor credentials using ZKP — college/marks not revealed")
    public ResponseEntity<Map<String, Object>> verifyDoctorCredentials(
            @Valid @RequestBody ZkpVerifyRequest req) {

        boolean verified = midnightService.verifyProof(req.getZkpProof(), "verify_doctor_credentials");
        return ResponseEntity.ok(Map.of(
            "verified", verified,
            "proofHash", req.getZkpProof(),
            "circuit", "verify_doctor_credentials",
            "message", verified
                ? "Doctor credentials verified. College name and marks NOT revealed."
                : "Doctor credential proof is invalid."
        ));
    }

    @PostMapping("/age/verify")
    @Operation(summary = "Verify age is above minimum — date of birth not revealed")
    public ResponseEntity<Map<String, Object>> verifyAge(
            @Valid @RequestBody AgeVerifyRequest req) {

        boolean verified = midnightService.verifyProof(req.getZkpProof(), "verify_age");
        return ResponseEntity.ok(Map.of(
            "verified", verified,
            "ageCategory", verified ? (req.getMinimumAge() >= 60 ? "SENIOR" : "ADULT") : "UNKNOWN",
            "privacyNote", "Exact date of birth was NOT revealed. Only age category verified."
        ));
    }

    @Data static class ZkpVerifyRequest {
        @NotBlank private String zkpProof;
        private String walletAddress;
    }

    @Data static class AgeVerifyRequest {
        @NotBlank private String zkpProof;
        private int minimumAge = 18;
    }
}
