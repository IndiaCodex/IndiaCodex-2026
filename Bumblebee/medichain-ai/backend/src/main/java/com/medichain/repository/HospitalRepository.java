package com.medichain.repository;
import com.medichain.entity.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, UUID> {
    Optional<Hospital> findByWalletAddress(String walletAddress);
    Optional<Hospital> findByLicenseNumber(String licenseNumber);
}
