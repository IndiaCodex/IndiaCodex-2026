package com.medichain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "consent_records", indexes = {
    @Index(name = "idx_consent_patient", columnList = "patient_id"),
    @Index(name = "idx_consent_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ConsentRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "patient_id", nullable = false)
    private UUID patientId;

    @Column(name = "requested_by_id")
    private UUID requestedById;

    @Column(name = "requested_by_name", length = 200)
    private String requestedByName;

    @Column(name = "recipient_name", length = 200)
    private String recipientName;

    @Column(name = "consent_type", length = 100)
    @Builder.Default
    private String consentType = "SHARE_WITH_INSURANCE";

    @Column(length = 300)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "cardano_tx_hash", length = 200)
    private String cardanoTxHash;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
