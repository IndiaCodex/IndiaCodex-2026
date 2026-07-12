package com.medichain.repository;

import com.medichain.entity.ConsentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ConsentRepository extends JpaRepository<ConsentRecord, UUID> {
    List<ConsentRecord> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
    List<ConsentRecord> findByPatientIdAndStatusOrderByCreatedAtDesc(UUID patientId, String status);
    long countByPatientIdAndStatus(UUID patientId, String status);
}
