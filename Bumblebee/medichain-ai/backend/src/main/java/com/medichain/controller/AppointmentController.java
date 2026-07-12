package com.medichain.controller;

import com.medichain.entity.Appointment;
import com.medichain.entity.User;
import com.medichain.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointments", description = "Appointment scheduling and management")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    @Operation(summary = "Schedule an appointment")
    public ResponseEntity<Appointment> schedule(
            @Valid @RequestBody AppointmentRequest req,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            appointmentService.schedule(req.getPatientId(), req.getDoctorId(),
                req.getScheduledAt(), req.getNotes()));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Get all appointments for a patient")
    public ResponseEntity<List<Appointment>> getPatientAppointments(@PathVariable UUID patientId) {
        return ResponseEntity.ok(appointmentService.getPatientAppointments(patientId));
    }

    @GetMapping("/doctor/{doctorId}")
    @Operation(summary = "Get all appointments for a doctor")
    public ResponseEntity<List<Appointment>> getDoctorAppointments(@PathVariable UUID doctorId) {
        return ResponseEntity.ok(appointmentService.getDoctorAppointments(doctorId));
    }

    @GetMapping("/today")
    @Operation(summary = "Get today's scheduled appointments")
    public ResponseEntity<List<Appointment>> getTodaysAppointments() {
        return ResponseEntity.ok(appointmentService.getTodaysAppointments());
    }

    @PatchMapping("/{appointmentId}/status")
    @Operation(summary = "Update appointment status (COMPLETED, CANCELLED)")
    public ResponseEntity<Appointment> updateStatus(
            @PathVariable UUID appointmentId,
            @RequestParam String status) {
        return ResponseEntity.ok(appointmentService.updateStatus(appointmentId, status));
    }

    @Data
    static class AppointmentRequest {
        @NotNull private UUID patientId;
        @NotNull private UUID doctorId;
        @NotNull private LocalDateTime scheduledAt;
        private String notes;
    }
}
