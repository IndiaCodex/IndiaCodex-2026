package com.medichain.controller;

import com.medichain.entity.*;
import com.medichain.enums.RecordType;
import com.medichain.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctors", description = "Doctor management and actions")
public class DoctorController {

    private final DoctorService doctorService;
    private final PrescriptionService prescriptionService;
    private final MedicalRecordService recordService;

    @PostMapping("/register")
    @Operation(summary = "Register doctor with ZKP credential verification")
    public ResponseEntity<Doctor> register(
            @Valid @RequestBody DoctorRegisterRequest req,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            doctorService.registerDoctor(
                currentUser.getWalletAddress(),
                req.getSpecialization(),
                req.getLicenseNumber(),
                req.getZkpCredentialHash()
            ));
    }

    @GetMapping("/me")
    @Operation(summary = "Get my doctor profile")
    public ResponseEntity<Doctor> getMyProfile(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(doctorService.getMyProfile(currentUser.getWalletAddress()));
    }

    @PostMapping("/prescriptions")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Issue prescription as NFT on Cardano")
    public ResponseEntity<Prescription> issuePrescription(
            @Valid @RequestBody PrescriptionRequest req,
            @AuthenticationPrincipal User currentUser) {
        Doctor doctor = doctorService.getMyProfile(currentUser.getWalletAddress());
        return ResponseEntity.status(HttpStatus.CREATED).body(
            prescriptionService.issuePrescription(
                doctor.getId(),
                req.getPatientId(),
                req.getMedicines(),
                req.getNotes(),
                req.getValidUntil()
            ));
    }

    @PostMapping("/records")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Create medical record (minted as NFT on Cardano)")
    public ResponseEntity<MedicalRecord> createRecord(
            @Valid @RequestBody RecordRequest req,
            @AuthenticationPrincipal User currentUser) {
        Doctor doctor = doctorService.getMyProfile(currentUser.getWalletAddress());
        return ResponseEntity.status(HttpStatus.CREATED).body(
            recordService.createRecord(
                req.getPatientId(), doctor.getId(),
                req.getRecordType(), req.getDiagnosis(), req.getNotes()
            ));
    }

    @GetMapping("/patients/{patientId}/records")
    @PreAuthorize("hasAnyRole('DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN', 'PATIENT')")
    @Operation(summary = "Get patient records — accessible by doctor or the patient themselves")
    public ResponseEntity<List<MedicalRecord>> getPatientRecords(
            @PathVariable UUID patientId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(recordService.getPatientRecords(patientId, currentUser.getId()));
    }

    @GetMapping
    @Operation(summary = "List all available doctors (for appointment booking)")
    public ResponseEntity<List<Doctor>> listDoctors() {
        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    @Data static class DoctorRegisterRequest {
        private String specialization;
        private String licenseNumber;
        private String zkpCredentialHash;
    }

    @Data static class PrescriptionRequest {
        private UUID patientId;
        private Object medicines;
        private String notes;
        private LocalDate validUntil;
    }

    @Data static class RecordRequest {
        private UUID patientId;
        private RecordType recordType;
        private String diagnosis;
        private String notes;
    }
}
