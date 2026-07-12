package com.medichain.service;

import com.medichain.entity.*;
import com.medichain.exception.ResourceNotFoundException;
import com.medichain.repository.*;
import com.medichain.cardano.CardanoService;
import com.medichain.service.audit.AuditService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CardanoService cardanoService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional
    public Prescription issuePrescription(
            UUID doctorId,
            UUID patientId,
            Object medicines,
            String notes,
            LocalDate validUntil) {

        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        if (!doctor.getCredentialsVerified()) {
            throw new IllegalStateException("Doctor credentials not verified — cannot issue prescription");
        }

        String medicinesJson;
        try {
            medicinesJson = objectMapper.writeValueAsString(medicines);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid medicines data");
        }

        String prescriptionHash = String.valueOf(
            (patientId.toString() + doctorId.toString() + medicinesJson + System.currentTimeMillis()).hashCode());

        Prescription prescription = Prescription.builder()
            .patient(patient)
            .doctor(doctor)
            .medicines(medicinesJson)
            .notes(notes)
            .validUntil(validUntil)
            .prescriptionHash(prescriptionHash)
            .build();

        prescription = prescriptionRepository.save(prescription);

        // Mint NFT asynchronously
        final UUID prescId = prescription.getId();
        cardanoService.mintPrescriptionNftAsync(
            patient.getWalletAddress(), prescId, prescriptionHash)
            .thenAccept(txHash -> {
                prescriptionRepository.findById(prescId).ifPresent(p -> {
                    p.setNftTxHash(txHash);
                    p.setNftAssetId("medichain_presc_" + prescId.toString().substring(0, 8));
                    prescriptionRepository.save(p);
                });
            });

        auditService.log(doctor.getUser().getId(), "PRESCRIPTION_ISSUED", "PRESCRIPTION",
            prescription.getId().toString(), null, "SUCCESS");

        log.info("Prescription issued: {} for patient {}", prescription.getId(), patientId);
        return prescription;
    }

    @Transactional(readOnly = true)
    public List<Prescription> getPatientPrescriptions(UUID patientId) {
        return prescriptionRepository.findByPatientIdOrderByCreatedAtDesc(patientId);
    }

    @Transactional
    public Prescription verifyAndDispense(String nftAssetId) {
        Prescription prescription = prescriptionRepository.findByNftAssetId(nftAssetId)
            .orElseThrow(() -> new ResourceNotFoundException("Prescription NFT not found"));

        if (prescription.getIsDispensed()) {
            throw new IllegalStateException("Prescription already dispensed");
        }

        if (prescription.getValidUntil() != null &&
            prescription.getValidUntil().isBefore(LocalDate.now())) {
            throw new IllegalStateException("Prescription has expired");
        }

        prescription.setIsDispensed(true);
        prescription.setDispensedAt(java.time.LocalDateTime.now());
        return prescriptionRepository.save(prescription);
    }
}
