package com.medichain.repository;

import com.medichain.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PatientRepository extends JpaRepository<Patient, UUID> {
    Optional<Patient> findByWalletAddress(String walletAddress);
    Optional<Patient> findByUserId(UUID userId);

    @Query("SELECT p FROM Patient p JOIN FETCH p.user WHERE p.id = :id")
    Optional<Patient> findByIdWithUser(UUID id);
}
