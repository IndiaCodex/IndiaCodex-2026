package com.medichain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Entity
@Table(name = "prescriptions", indexes = {
    @Index(name = "idx_prescriptions_patient", columnList = "patient_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "prescriptions", "records", "claims"})
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "hospital", "appointments"})
    @JoinColumn(name = "doctor_id", nullable = false)
    private Doctor doctor;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb", nullable = false)
    private String medicines;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "nft_tx_hash", length = 200)
    private String nftTxHash;

    @Column(name = "nft_asset_id", length = 200)
    private String nftAssetId;

    @Column(name = "prescription_hash", length = 500)
    private String prescriptionHash;

    @Column(name = "is_dispensed")
    @Builder.Default
    private Boolean isDispensed = false;

    @Column(name = "dispensed_at")
    private LocalDateTime dispensedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
