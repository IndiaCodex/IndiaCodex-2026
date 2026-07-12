package com.medichain.controller;

import com.medichain.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Cardano wallet authentication")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/wallet/connect")
    @Operation(summary = "Connect Cardano wallet and get JWT token. Pass requestedRole to override auto-detection.")
    public ResponseEntity<Map<String, Object>> connectWallet(
            @Valid @RequestBody WalletConnectRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        Map<String, Object> response = authService.connectWallet(
            request.getWalletAddress(),
            request.getSignature(),
            request.getKey(),
            ipAddress,
            request.getRequestedRole()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<Map<String, Object>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request.getRefreshToken()));
    }

    @Data
    static class WalletConnectRequest {
        @NotBlank private String walletAddress;
        @NotBlank private String signature;
        @NotBlank private String key;
        private String requestedRole; // Optional: PATIENT | DOCTOR | HOSPITAL_ADMIN | INSURANCE_OFFICER | PHARMACIST
    }

    @Data
    static class RefreshTokenRequest {
        @NotBlank private String refreshToken;
    }
}
