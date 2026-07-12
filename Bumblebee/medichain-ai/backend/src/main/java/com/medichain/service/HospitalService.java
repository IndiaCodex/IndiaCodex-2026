package com.medichain.service;

import com.medichain.entity.Hospital;
import com.medichain.exception.ResourceNotFoundException;
import com.medichain.repository.HospitalRepository;
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
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final AuditService auditService;

    @Transactional
    public Hospital createHospital(String name, String walletAddress,
                                    String address, String city, String state, String licenseNumber) {
        Hospital hospital = Hospital.builder()
            .name(name)
            .walletAddress(walletAddress)
            .address(address)
            .city(city)
            .state(state)
            .licenseNumber(licenseNumber)
            .build();
        hospital = hospitalRepository.save(hospital);
        log.info("Hospital created: {} - {}", hospital.getId(), hospital.getName());
        return hospital;
    }

    @Transactional(readOnly = true)
    public Hospital getById(UUID id) {
        return hospitalRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Hospital not found"));
    }

    @Transactional(readOnly = true)
    public List<Hospital> getAll() {
        return hospitalRepository.findAll();
    }
}
