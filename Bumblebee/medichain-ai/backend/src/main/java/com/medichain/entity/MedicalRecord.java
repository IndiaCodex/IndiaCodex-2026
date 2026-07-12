package com.medichain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.medichain.enums.RecordType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "medical_records", indexes = {
    @Index(name = "idx_records_patient", columnList = "patient_id"),
    @Index(name = "idx_records_doctor", columnList = "doctor_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @JsonIgnoreProperties({"patient", "hospital", "prescriptions"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctor_id")
    private Doctor doctor;

    @JsonIgnoreProperties({"doctors", "patients"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id")
    private Hospital hospital;

    @Enumerated(EnumType.STRING)
    @Column(name = "record_type", length = 100)
    private RecordType recordType;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "nft_tx_hash", length = 200)
    private String nftTxHash;

    @Column(name = "nft_asset_id", length = 200)
    private String nftAssetId;

    @Column(name = "record_hash", length = 500)
    private String recordHash;

    @Column(name = "is_shared")
    @Builder.Default
    private Boolean isShared = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
