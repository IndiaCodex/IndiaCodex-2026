package com.medichain.controller;

import com.medichain.entity.AuditLog;
import com.medichain.entity.Doctor;
import com.medichain.entity.User;
import com.medichain.repository.AuditLogRepository;
import com.medichain.repository.DoctorRepository;
import com.medichain.repository.InsuranceClaimRepository;
import com.medichain.repository.PatientRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('HOSPITAL_ADMIN', 'SUPER_ADMIN')")
@Tag(name = "Admin", description = "Hospital administration")
public class AdminController {

    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final InsuranceClaimRepository claimRepository;
    private final AuditLogRepository auditLogRepository;

    @GetMapping("/staff")
    @Operation(summary = "Get all hospital staff")
    public ResponseEntity<List<Doctor>> getStaff(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(doctorRepository.findAll());
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get hospital analytics dashboard data")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        Map<String, Object> data = new java.util.HashMap<>();
        data.put("totalPatients", patientRepository.count());
        data.put("totalDoctors", doctorRepository.count());
        data.put("totalClaims", claimRepository.count());
        data.put("claimsApproved", claimRepository.countByStatus(com.medichain.enums.ClaimStatus.APPROVED));
        data.put("claimsPending", claimRepository.countByStatus(com.medichain.enums.ClaimStatus.SUBMITTED));
        Double avgFraud = claimRepository.avgFraudScore();
        data.put("avgFraudScore", avgFraud != null ? avgFraud : 0.0);
        return ResponseEntity.ok(data);
    }

    @GetMapping("/audit-logs")
    @Operation(summary = "Get immutable audit logs")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(auditLogRepository.findAll(
            PageRequest.of(page, size, Sort.by("createdAt").descending())));
    }

    @GetMapping("/audit-trail/user/{userId}")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN', 'SUPER_ADMIN', 'PATIENT', 'DOCTOR', 'INSURANCE_OFFICER')")
    @Operation(summary = "Get blockchain audit trail for a specific user")
    public ResponseEntity<java.util.List<AuditLog>> getUserAuditTrail(
            @PathVariable java.util.UUID userId,
            @RequestParam(defaultValue = "50") int limit) {
        var pageable = PageRequest.of(0, limit, Sort.by("createdAt").descending());
        return ResponseEntity.ok(auditLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).getContent());
    }
}
