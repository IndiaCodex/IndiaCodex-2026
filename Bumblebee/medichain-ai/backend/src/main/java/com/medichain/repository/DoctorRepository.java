package com.medichain.repository;
import com.medichain.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, UUID> {
    Optional<Doctor> findByWalletAddress(String walletAddress);
    Optional<Doctor> findByUserId(UUID userId);
    List<Doctor> findByHospitalId(UUID hospitalId);
    List<Doctor> findBySpecializationAndIsAvailable(String specialization, Boolean isAvailable);
}
