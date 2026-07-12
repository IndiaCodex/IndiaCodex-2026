package com.medichain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "escrow_contracts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EscrowContract {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "payer_wallet", length = 200)
    private String payerWallet;

    @Column(name = "payee_wallet", length = 200)
    private String payeeWallet;

    @Column(name = "amount_ada", precision = 18, scale = 6)
    private BigDecimal amountAda;

    @Column(name = "contract_address", length = 200)
    private String contractAddress;

    @Column(name = "lock_tx_hash", length = 200)
    private String lockTxHash;

    @Column(name = "release_condition", length = 100)
    @Builder.Default
    private String releaseCondition = "AI_APPROVAL";

    @Column(length = 50)
    @Builder.Default
    private String status = "LOCKED";

    @Column(name = "release_tx_hash", length = 200)
    private String releaseTxHash;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
