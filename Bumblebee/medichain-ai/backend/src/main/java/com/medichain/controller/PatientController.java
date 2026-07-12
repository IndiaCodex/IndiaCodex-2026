package com.medichain.controller;

import com.medichain.entity.Patient;
import com.medichain.entity.User;
import com.medichain.service.PatientService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
@Tag(name = "Patients", description = "Patient management")
public class PatientController {

    private final PatientService patientService;

    @PostMapping("/register")
    @Operation(summary = "Register patient with ZKP KYC")
    public ResponseEntity<Patient> register(
            @Valid @RequestBody PatientRegisterRequest request,
            @AuthenticationPrincipal User currentUser) {

        Patient patient = patientService.registerPatient(
            currentUser.getWalletAddress(),
            request.getZkpProofHash(),
            request.getName(),
            request.getPhone()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(patient);
    }

    @GetMapping("/me")
    @Operation(summary = "Get my patient profile")
    public ResponseEntity<Patient> getMyProfile(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(patientService.getMyProfile(currentUser.getWalletAddress()));
    }

    @GetMapping("/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get patient by ID")
    public ResponseEntity<Patient> getPatient(
            @PathVariable UUID patientId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(patientService.getPatientById(patientId, currentUser.getId()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "List all patients")
    public ResponseEntity<java.util.List<Patient>> listAllPatients() {
        return ResponseEntity.ok(patientService.getAllPatients());
    }

    @Data
    static class PatientRegisterRequest {
        @NotBlank private String zkpProofHash;
        @NotBlank private String name;
        private String phone;
    }
}
