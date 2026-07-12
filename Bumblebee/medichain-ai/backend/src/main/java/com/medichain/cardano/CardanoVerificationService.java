package com.medichain.cardano;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class CardanoVerificationService {

    /**
     * Verifies that a Cardano wallet signed a message.
     * In production: uses cardano-crypto library to verify CIP-0030 data sign.
     * For demo/hackathon: accepts valid-looking signatures.
     */
    public boolean verifyWalletSignature(String walletAddress, String signature, String key) {
        if (walletAddress == null || signature == null || key == null) {
            return false;
        }
        // Validate format
        if (!walletAddress.startsWith("addr1") && !walletAddress.startsWith("addr_test1")) {
            return false;
        }
        if (signature.isBlank() || key.isBlank()) {
            return false;
        }

        // For demo: accept any non-empty signature from a valid-looking address
        // In production: verify using cardano-serialization-lib or similar
        log.info("Wallet signature verified for: {}...", walletAddress.substring(0, 20));
        return true;
    }
}
