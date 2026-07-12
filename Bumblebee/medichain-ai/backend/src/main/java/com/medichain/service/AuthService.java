package com.medichain.service;

import com.medichain.cardano.CardanoVerificationService;
import com.medichain.entity.User;
import com.medichain.enums.UserRole;
import com.medichain.exception.InvalidSignatureException;
import com.medichain.repository.UserRepository;
import com.medichain.security.JwtTokenProvider;
import com.medichain.service.audit.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;
    private final CardanoVerificationService cardanoVerificationService;
    private final AuditService auditService;

    @Transactional
    public Map<String, Object> connectWallet(
            String walletAddress,
            String signature,
            String key,
            String ipAddress) {
        return connectWallet(walletAddress, signature, key, ipAddress, null);
    }

    @Transactional
    public Map<String, Object> connectWallet(
            String walletAddress,
            String signature,
            String key,
            String ipAddress,
            String requestedRole) {

        // Verify wallet signature
        boolean valid = cardanoVerificationService.verifyWalletSignature(
            walletAddress, signature, key);

        if (!valid) {
            auditService.log(null, "WALLET_CONNECT_FAILED", "USER", walletAddress, ipAddress, "FAILURE");
            throw new InvalidSignatureException("Wallet signature verification failed");
        }

        // Parse requested role if provided (real wallet + role picker)
        UserRole forcedRole = null;
        if (requestedRole != null && !requestedRole.isBlank()) {
            try { forcedRole = UserRole.valueOf(requestedRole.toUpperCase()); } catch (Exception ignored) {}
        }
        final UserRole roleOverride = forcedRole;

        // Get or create user
        User user = userRepository.findByWalletAddress(walletAddress)
            .orElseGet(() -> {
                UserRole role = roleOverride != null ? roleOverride : detectDemoRole(walletAddress);
                User newUser = User.builder()
                    .walletAddress(walletAddress)
                    .role(role)
                    .name(getDemoName(role))
                    .isActive(true)
                    .build();
                return userRepository.save(newUser);
            });

        // If existing user switches role (real wallet demo), update it
        if (roleOverride != null && user.getRole() != roleOverride) {
            user.setRole(roleOverride);
            user.setName(getDemoName(roleOverride));
        }

        if (!user.getIsActive()) {
            throw new IllegalStateException("Account is deactivated");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = tokenProvider.generateToken(
            user.getId(), walletAddress, user.getRole().name());
        String refreshToken = tokenProvider.generateRefreshToken(user.getId());

        auditService.log(user.getId(), "WALLET_CONNECT_SUCCESS", "USER",
            user.getId().toString(), ipAddress, "SUCCESS");

        log.info("User {} connected wallet: {} as {}", user.getId(),
            walletAddress.substring(0, Math.min(20, walletAddress.length())) + "...", user.getRole());

        return Map.of(
            "token", accessToken,
            "refreshToken", refreshToken,
            "role", user.getRole().name(),
            "userId", user.getId().toString(),
            "walletAddress", walletAddress,
            "isNewUser", user.getCreatedAt() == null || user.getUpdatedAt() == null
                || user.getCreatedAt().equals(user.getUpdatedAt())
        );
    }

    public Map<String, Object> refreshToken(String refreshToken) {
        if (!tokenProvider.isTokenValid(refreshToken)) {
            throw new InvalidSignatureException("Invalid refresh token");
        }

        String userId = tokenProvider.extractUserId(refreshToken);
        User user = userRepository.findById(java.util.UUID.fromString(userId))
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String newAccessToken = tokenProvider.generateToken(
            user.getId(), user.getWalletAddress(), user.getRole().name());

        return Map.of("token", newAccessToken);
    }

    private UserRole detectDemoRole(String walletAddress) {
        if (walletAddress.contains("hospital_admin") || walletAddress.contains("admin")) return UserRole.HOSPITAL_ADMIN;
        if (walletAddress.contains("doctor"))    return UserRole.DOCTOR;
        if (walletAddress.contains("insurance")) return UserRole.INSURANCE_OFFICER;
        if (walletAddress.contains("pharmacist") || walletAddress.contains("pharmacy")) return UserRole.PHARMACIST;
        if (walletAddress.contains("patient"))   return UserRole.PATIENT;
        // Real Cardano wallet (addr_test1... or addr1...) → Hospital Admin by default
        return UserRole.HOSPITAL_ADMIN;
    }

    private String getDemoName(UserRole role) {
        return switch (role) {
            case HOSPITAL_ADMIN     -> "Hospital Admin";
            case DOCTOR             -> "Dr. Demo";
            case INSURANCE_OFFICER  -> "Insurance Officer";
            case PHARMACIST         -> "Pharmacist";
            default                 -> "Patient";
        };
    }
}
