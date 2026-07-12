package com.medichain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.medichain.enums.ClaimStatus;
import com.medichain.enums.ClaimType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "insurance_claims", indexes = {
    @Index(name = "idx_claims_patient", columnList = "patient_id"),
    @Index(name = "idx_claims_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InsuranceClaim {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @JsonIgnoreProperties({"records", "prescriptions", "claims"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(name = "insurance_company_id")
    private UUID insuranceCompanyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "claim_type", length = 100)
    private ClaimType claimType;

    @Column(name = "claim_amount_ada", precision = 18, scale = 6)
    private BigDecimal claimAmountAda;

    @Column(name = "zkp_eligibility_hash", length = 500)
    private String zkpEligibilityHash;

    @Column(name = "supporting_doc_hash", length = 500)
    private String supportingDocHash;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    @Builder.Default
    private ClaimStatus status = ClaimStatus.SUBMITTED;

    @Column(name = "ai_decision", length = 50)
    private String aiDecision;

    @Column(name = "ai_confidence", precision = 5, scale = 4)
    private BigDecimal aiConfidence;

    @Column(name = "fraud_score", precision = 5, scale = 4)
    private BigDecimal fraudScore;

    @Column(name = "masumi_tx_hash", length = 200)
    private String masumiTxHash;

    @Column(name = "escrow_tx_hash", length = 200)
    private String escrowTxHash;

    @Column(name = "payout_tx_hash", length = 200)
    private String payoutTxHash;

    @Column(name = "ada_released", precision = 18, scale = 6)
    private BigDecimal adaReleased;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
