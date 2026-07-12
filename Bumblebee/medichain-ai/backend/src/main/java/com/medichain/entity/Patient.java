package com.medichain.entity;

import com.medichain.enums.KycStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "patients", indexes = {
    @Index(name = "idx_patients_user", columnList = "user_id"),
    @Index(name = "idx_patients_wallet", columnList = "wallet_address")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "wallet_address", unique = true, nullable = false, length = 200)
    private String walletAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status", length = 50)
    @Builder.Default
    private KycStatus kycStatus = KycStatus.PENDING;

    @Column(name = "zkp_proof_hash", length = 500)
    private String zkpProofHash;

    @Column(name = "identity_nft_tx_hash", length = 200)
    private String identityNftTxHash;

    @Column(name = "identity_nft_asset_id", length = 200)
    private String identityNftAssetId;

    @Column(name = "blood_group", length = 10)
    private String bloodGroup;

    @Column(name = "emergency_contact", length = 20)
    private String emergencyContact;

    @Column(name = "abha_id", length = 50)
    private String abhaId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
