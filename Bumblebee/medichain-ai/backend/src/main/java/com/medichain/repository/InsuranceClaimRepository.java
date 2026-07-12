package com.medichain.repository;

import com.medichain.entity.InsuranceClaim;
import com.medichain.enums.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InsuranceClaimRepository extends JpaRepository<InsuranceClaim, UUID> {
    List<InsuranceClaim> findByPatientIdOrderByCreatedAtDesc(UUID patientId);
    List<InsuranceClaim> findByStatus(ClaimStatus status);

    @Query("SELECT COUNT(c) FROM InsuranceClaim c WHERE c.status = :status")
    long countByStatus(ClaimStatus status);

    @Query("SELECT AVG(c.fraudScore) FROM InsuranceClaim c WHERE c.fraudScore IS NOT NULL")
    Double avgFraudScore();
}
