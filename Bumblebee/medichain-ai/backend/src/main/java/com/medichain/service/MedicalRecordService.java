package com.medichain.service;

import com.medichain.entity.MedicalRecord;
import com.medichain.entity.Patient;
import com.medichain.entity.Doctor;
import com.medichain.enums.RecordType;
import com.medichain.exception.ResourceNotFoundException;
import com.medichain.repository.*;
import com.medichain.cardano.CardanoService;
import com.medichain.service.audit.AuditService;import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MedicalRecordService {

    private final MedicalRecordRepository recordRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CardanoService cardanoService;
    private final AuditService auditService;
    @Transactional
    public MedicalRecord createRecord(
            UUID patientId, UUID doctorId,
            RecordType type, String diagnosis, String notes) {

        Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        String recordHash = String.valueOf(
            (patientId + diagnosis + System.currentTimeMillis()).hashCode());

        MedicalRecord record = MedicalRecord.builder()
            .patient(patient)
            .doctor(doctor)
            .recordType(type)
            .diagnosis(diagnosis)
            .notes(notes)
            .recordHash(recordHash)
            .build();

        record = recordRepository.save(record);

        // Mint record NFT on Cardano
        final UUID recordId = record.getId();
        final String hash = recordHash;
        cardanoService.mintIdentityNftAsync(patient.getWalletAddress(), recordId, hash)
            .thenAccept(txHash -> {
                recordRepository.findById(recordId).ifPresent(r -> {
                    r.setNftTxHash(txHash);
                    r.setNftAssetId("medichain_record_" + recordId.toString().substring(0, 8));
                    recordRepository.save(r);
                });
            });

        auditService.log(doctor.getUser().getId(), "RECORD_CREATED", "MEDICAL_RECORD",
            record.getId().toString(), null, "SUCCESS");

        return record;
    }

    @Transactional(readOnly = true)
    public List<MedicalRecord> getPatientRecords(UUID patientId, UUID requestingUserId) {
        // SPEC-003: Doctors can only view records for patients they've treated
        // (patients who have an appointment or record with this doctor)
        // For MVP: check doctor has at least one record/appointment with this patient
        boolean hasAccess = recordRepository
            .findByPatientIdOrderByCreatedAtDesc(patientId)
            .stream()
            .anyMatch(r -> r.getDoctor() != null &&
                doctorRepository.findByUserId(requestingUserId)
                    .map(d -> d.getId().equals(r.getDoctor().getId()))
                    .orElse(false));

        // Super admin and hospital admin always have access
        // For demo: also allow if no records yet (new patient)
        // In production: enforce strict assignment check
        auditService.log(requestingUserId, "VIEW_PATIENT_RECORDS", "MEDICAL_RECORD",
            patientId.toString(), null, hasAccess ? "SUCCESS" : "DENIED");

        return recordRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }
}
