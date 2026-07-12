package com.medichain.repository;

import com.medichain.entity.User;
import com.medichain.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByWalletAddress(String walletAddress);
    boolean existsByWalletAddress(String walletAddress);
    boolean existsByEmail(String email);
}
