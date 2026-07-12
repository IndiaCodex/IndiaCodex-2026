package com.medichain.service;

import com.medichain.entity.Appointment;
import com.medichain.entity.Doctor;
import com.medichain.entity.Patient;
import com.medichain.exception.ResourceNotFoundException;
import com.medichain.repository.AppointmentRepository;
import com.medichain.repository.DoctorRepository;
import com.medichain.repository.PatientRepository;
import com.medichain.service.audit.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AuditService auditService;

    @Transactional
    public Appointment schedule(UUID patientId, UUID doctorId, LocalDateTime scheduledAt, String notes) {
        Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        Appointment appointment = Appointment.builder()
            .patient(patient)
            .doctor(doctor)
            .scheduledAt(scheduledAt)
            .notes(notes)
            .status("SCHEDULED")
            .build();

        appointment = appointmentRepository.save(appointment);
        auditService.log(patient.getUser().getId(), "APPOINTMENT_SCHEDULED",
            "APPOINTMENT", appointment.getId().toString(), null, "SUCCESS");
        log.info("Appointment scheduled: {} for patient {} with doctor {}", appointment.getId(), patientId, doctorId);
        return appointment;
    }

    @Transactional
    public Appointment updateStatus(UUID appointmentId, String status) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        appointment.setStatus(status);
        return appointmentRepository.save(appointment);
    }

    @Transactional(readOnly = true)
    public List<Appointment> getPatientAppointments(UUID patientId) {
        return appointmentRepository.findByPatientIdOrderByScheduledAtDesc(patientId);
    }

    @Transactional(readOnly = true)
    public List<Appointment> getDoctorAppointments(UUID doctorId) {
        return appointmentRepository.findByDoctorIdOrderByScheduledAtDesc(doctorId);
    }

    @Transactional(readOnly = true)
    public List<Appointment> getTodaysAppointments() {
        return appointmentRepository.findByStatusOrderByScheduledAtAsc("SCHEDULED");
    }
}
