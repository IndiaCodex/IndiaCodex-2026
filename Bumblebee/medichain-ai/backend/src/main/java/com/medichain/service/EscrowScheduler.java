package com.medichain.service;

import com.medichain.entity.EscrowContract;
import com.medichain.repository.EscrowRepository;
import com.medichain.cardano.CardanoService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * SPEC-007 Acceptance Criteria: "Auto-refund works after timeout"
 * Runs every hour to check for expired escrow contracts and auto-refund.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EscrowScheduler {

    private final EscrowRepository escrowRepository;
    private final CardanoService cardanoService;
    private final NotificationService notificationService;

    @Scheduled(fixedDelay = 3600000) // Run every hour
    @Transactional
    public void processExpiredEscrows() {
        List<EscrowContract> active = escrowRepository.findByStatus("LOCKED");

        for (EscrowContract escrow : active) {
            if (escrow.getExpiresAt() != null && escrow.getExpiresAt().isBefore(LocalDateTime.now())) {
                try {
                    // Refund to payer
                    String refundTxHash = cardanoService.releaseEscrow(
                        escrow.getLockTxHash(),
                        escrow.getPayerWallet(),
                        escrow.getAmountAda().doubleValue()
                    );

                    escrow.setStatus("REFUNDED");
                    escrow.setReleaseTxHash(refundTxHash);
                    escrowRepository.save(escrow);

                    log.info("Escrow {} auto-refunded to payer — Tx: {}", escrow.getId(), refundTxHash);
                } catch (Exception e) {
                    log.error("Failed to auto-refund escrow {}: {}", escrow.getId(), e.getMessage());
                }
            }
        }
    }
}
