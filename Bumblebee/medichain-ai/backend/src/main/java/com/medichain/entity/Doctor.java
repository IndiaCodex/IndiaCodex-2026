package com.medichain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "doctors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "wallet_address", unique = true, nullable = false, length = 200)
    private String walletAddress;

    @Column(length = 200)
    private String specialization;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "doctors"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    @Column(name = "credentials_verified")
    @Builder.Default
    private Boolean credentialsVerified = false;

    @Column(name = "credential_zkp_proof_hash", length = 500)
    private String credentialZkpProofHash;

    @Column(name = "license_number", length = 100)
    private String licenseNumber;

    @Column(name = "nmc_registration", length = 100)
    private String nmcRegistration;

    @Column(name = "is_available")
    @Builder.Default
    private Boolean isAvailable = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
