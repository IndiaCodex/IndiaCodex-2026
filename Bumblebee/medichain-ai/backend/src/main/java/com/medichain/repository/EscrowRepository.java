package com.medichain.repository;
import com.medichain.entity.EscrowContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EscrowRepository extends JpaRepository<EscrowContract, UUID> {
    Optional<EscrowContract> findByLockTxHash(String lockTxHash);
    java.util.List<EscrowContract> findByStatus(String status);
}
