package com.medichain.controller;

import com.medichain.entity.Prescription;
import com.medichain.entity.User;
import com.medichain.service.PrescriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/prescriptions")
@RequiredArgsConstructor
@Tag(name = "Prescriptions", description = "Prescription NFT management")
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get all prescriptions for a patient")
    public ResponseEntity<List<Prescription>> getPatientPrescriptions(@PathVariable UUID patientId) {
        return ResponseEntity.ok(prescriptionService.getPatientPrescriptions(patientId));
    }

    @PostMapping("/verify/{nftAssetId}")
    @Operation(summary = "Verify and dispense prescription NFT (Pharmacy)")
    public ResponseEntity<Prescription> verifyAndDispense(@PathVariable String nftAssetId) {
        return ResponseEntity.ok(prescriptionService.verifyAndDispense(nftAssetId));
    }
}
