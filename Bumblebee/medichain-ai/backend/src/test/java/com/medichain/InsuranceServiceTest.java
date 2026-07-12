package com.medichain.service;

import com.medichain.entity.InsuranceClaim;
import com.medichain.entity.Patient;
import com.medichain.enums.ClaimStatus;
import com.medichain.enums.ClaimType;
import com.medichain.exception.ResourceNotFoundException;
import com.medichain.kafka.KafkaEventPublisher;
import com.medichain.midnight.MidnightService;
import com.medichain.repository.InsuranceClaimRepository;
import com.medichain.repository.PatientRepository;
import com.medichain.service.audit.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InsuranceServiceTest {

    @Mock InsuranceClaimRepository claimRepository;
    @Mock PatientRepository patientRepository;
    @Mock MidnightService midnightService;
    @Mock KafkaEventPublisher kafkaPublisher;
    @Mock AuditService auditService;

    @InjectMocks InsuranceService insuranceService;

    private UUID patientId;
    private Patient mockPatient;

    @BeforeEach
    void setUp() {
        patientId = UUID.randomUUID();
        mockPatient = new Patient();
        mockPatient.setId(patientId);
        mockPatient.setWalletAddress("addr1qx_test_wallet");
        var user = new com.medichain.entity.User();
        user.setId(UUID.randomUUID());
        mockPatient.setUser(user);
    }

    @Test
    void shouldSubmitClaimWhenZkpIsValid() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(mockPatient));
        when(midnightService.verifyProof(anyString(), eq("verify_claim_eligibility"))).thenReturn(true);
        when(claimRepository.save(any())).thenAnswer(inv -> {
            InsuranceClaim claim = inv.getArgument(0);
            claim.setId(UUID.randomUUID());
            return claim;
        });

        InsuranceClaim result = insuranceService.submitClaim(
            patientId, ClaimType.HOSPITALISATION,
            new BigDecimal("500.0"), "valid_zkp_proof", "doc_hash", "addr1qx_wallet"
        );

        assertThat(result.getStatus()).isEqualTo(ClaimStatus.AI_PROCESSING);
        assertThat(result.getClaimAmountAda()).isEqualByComparingTo("500.0");
        verify(kafkaPublisher).publishClaimSubmitted(any());
        verify(auditService).log(any(), eq("CLAIM_SUBMITTED"), any(), any(), any(), eq("SUCCESS"));
    }

    @Test
    void shouldThrowWhenZkpIsInvalid() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.of(mockPatient));
        when(midnightService.verifyProof(anyString(), anyString())).thenReturn(false);

        assertThatThrownBy(() -> insuranceService.submitClaim(
            patientId, ClaimType.OPD, new BigDecimal("100.0"),
            "invalid_zkp", null, "addr1qx"
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("ZKP eligibility proof is invalid");

        verify(claimRepository, never()).save(any());
        verify(kafkaPublisher, never()).publishClaimSubmitted(any());
    }

    @Test
    void shouldThrowWhenPatientNotFound() {
        when(patientRepository.findById(patientId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> insuranceService.submitClaim(
            patientId, ClaimType.OPD, new BigDecimal("100.0"),
            "some_zkp", null, "addr1qx"
        )).isInstanceOf(ResourceNotFoundException.class)
          .hasMessageContaining("Patient not found");
    }
}
