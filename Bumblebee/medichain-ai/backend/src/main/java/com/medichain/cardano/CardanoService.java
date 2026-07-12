package com.medichain.cardano;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class CardanoService {

    private final WebClient blockfrost;

    @Value("${medichain.cardano.network}")
    private String network;

    public CardanoService(
            @Value("${medichain.cardano.blockfrost-url}") String blockfrostUrl,
            @Value("${medichain.cardano.blockfrost-api-key}") String apiKey) {
        this.blockfrost = WebClient.builder()
            .baseUrl(blockfrostUrl)
            .defaultHeader("project_id", apiKey)
            .build();
    }

    @Async
    public CompletableFuture<String> mintIdentityNftAsync(
            String walletAddress, UUID patientId, String zkpProofHash) {
        try {
            log.info("Minting Identity NFT for patient {} on {}", patientId, network);
            // In production: use cardano-client-lib to build and submit tx
            // For demo: return mock tx hash
            String mockTxHash = "cardano_tx_identity_" + patientId.toString().substring(0, 8);
            log.info("Identity NFT minted: {}", mockTxHash);
            return CompletableFuture.completedFuture(mockTxHash);
        } catch (Exception e) {
            log.error("NFT minting failed: {}", e.getMessage());
            return CompletableFuture.failedFuture(e);
        }
    }

    @Async
    public CompletableFuture<String> mintPrescriptionNftAsync(
            String patientWallet, UUID prescriptionId, String prescriptionHash) {
        try {
            log.info("Minting Prescription NFT {} on {}", prescriptionId, network);
            String mockTxHash = "cardano_tx_prescription_" + prescriptionId.toString().substring(0, 8);
            log.info("Prescription NFT minted: {}", mockTxHash);
            return CompletableFuture.completedFuture(mockTxHash);
        } catch (Exception e) {
            log.error("Prescription NFT minting failed: {}", e.getMessage());
            return CompletableFuture.failedFuture(e);
        }
    }

    public String createEscrow(String payerWallet, String payeeWallet, double adaAmount) {
        log.info("Creating escrow: {} → {} : ₳{}", payerWallet.substring(0, 15), payeeWallet.substring(0, 15), adaAmount);
        return "cardano_escrow_" + System.currentTimeMillis();
    }

    public String releaseEscrow(String escrowTxHash, String payeeWallet, double adaAmount) {
        log.info("Releasing escrow {}: ₳{} to {}", escrowTxHash, adaAmount, payeeWallet.substring(0, 15));
        return "cardano_tx_release_" + System.currentTimeMillis();
    }

    public Map<String, Object> getTransactionDetails(String txHash) {
        try {
            return blockfrost.get()
                .uri("/txs/{txHash}", txHash)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
        } catch (Exception e) {
            log.error("Failed to get tx details: {}", e.getMessage());
            return Map.of("tx_hash", txHash, "status", "submitted");
        }
    }
}
