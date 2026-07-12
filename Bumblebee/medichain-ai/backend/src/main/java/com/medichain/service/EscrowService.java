package com.medichain.service;

import com.medichain.entity.EscrowContract;
import com.medichain.repository.EscrowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EscrowService {

    private final EscrowRepository escrowRepository;

    @Transactional
    public EscrowContract create(String payerWallet, String payeeWallet,
                                  BigDecimal amountAda, String lockTxHash) {
        EscrowContract escrow = EscrowContract.builder()
            .payerWallet(payerWallet)
            .payeeWallet(payeeWallet)
            .amountAda(amountAda)
            .lockTxHash(lockTxHash)
            .status("LOCKED")
            .expiresAt(LocalDateTime.now().plusDays(30))
            .build();
        escrow = escrowRepository.save(escrow);
        log.info("Escrow created: {} — ₳{}", escrow.getId(), amountAda);
        return escrow;
    }

    @Transactional
    public EscrowContract release(String lockTxHash, String releaseTxHash) {
        EscrowContract escrow = escrowRepository.findByLockTxHash(lockTxHash)
            .orElseThrow(() -> new IllegalArgumentException("Escrow not found: " + lockTxHash));
        escrow.setStatus("RELEASED");
        escrow.setReleaseTxHash(releaseTxHash);
        log.info("Escrow released: {} — Tx: {}", escrow.getId(), releaseTxHash);
        return escrowRepository.save(escrow);
    }

    @Transactional(readOnly = true)
    public List<EscrowContract> getActive() {
        return escrowRepository.findByStatus("LOCKED");
    }
}
