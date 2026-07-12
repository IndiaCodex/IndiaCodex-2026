package com.medichain.service;

import com.medichain.entity.Doctor;
import com.medichain.entity.User;
import com.medichain.enums.UserRole;
import com.medichain.exception.ResourceNotFoundException;
import com.medichain.midnight.MidnightService;
import com.medichain.repository.DoctorRepository;
import com.medichain.repository.HospitalRepository;
import com.medichain.repository.UserRepository;
import com.medichain.service.audit.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final HospitalRepository hospitalRepository;
    private final MidnightService midnightService;
    private final AuditService auditService;

    @Transactional
    public Doctor registerDoctor(String walletAddress, String specialization,
                                  String licenseNumber, String zkpCredentialHash) {

        User user = userRepository.findByWalletAddress(walletAddress)
            .orElseThrow(() -> new ResourceNotFoundException("User not found — connect wallet first"));

        user.setRole(UserRole.DOCTOR);
        userRepository.save(user);

        boolean credValid = midnightService.verifyProof(zkpCredentialHash, "verify_doctor_credentials");

        Doctor doctor = Doctor.builder()
            .user(user)
            .walletAddress(walletAddress)
            .specialization(specialization)
            .licenseNumber(licenseNumber)
            .credentialZkpProofHash(zkpCredentialHash)
            .credentialsVerified(credValid)
            .build();

        doctor = doctorRepository.save(doctor);
        auditService.log(user.getId(), "DOCTOR_REGISTERED", "DOCTOR",
            doctor.getId().toString(), null, "SUCCESS");

        log.info("Doctor registered: {} (credentials: {})", doctor.getId(), credValid);
        return doctor;
    }

    @Transactional(readOnly = true)
    public Doctor getMyProfile(String walletAddress) {
        return doctorRepository.findByWalletAddress(walletAddress)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
    }

    @Transactional(readOnly = true)
    public List<Doctor> getDoctorsByHospital(UUID hospitalId) {
        return doctorRepository.findByHospitalId(hospitalId);
    }

    @Transactional(readOnly = true)
    public List<Doctor> getAllDoctors() {
        return doctorRepository.findAll();
    }
}
