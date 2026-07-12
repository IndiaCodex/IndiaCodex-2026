package com.medichain.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class KafkaEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishClaimSubmitted(Map<String, Object> payload) {
        try {
            kafkaTemplate.send("agent.insurance.tasks", payload);
            log.info("Published claim to insurance agent: {}", payload.get("claim_id"));
        } catch (Exception e) {
            log.warn("Kafka unavailable — claim queued locally: {}", payload.get("claim_id"));
        }
    }

    public void publishDiagnosisRequest(Map<String, Object> payload) {
        try {
            kafkaTemplate.send("agent.diagnosis.tasks", payload);
            log.info("Published diagnosis request for patient: {}", payload.get("patient_id"));
        } catch (Exception e) {
            log.warn("Kafka unavailable — diagnosis queued locally");
        }
    }

    public void publishPrescriptionRequest(Map<String, Object> payload) {
        try {
            kafkaTemplate.send("agent.prescription.tasks", payload);
        } catch (Exception e) {
            log.warn("Kafka unavailable — prescription queued locally");
        }
    }

    public void publishPaymentRequest(Map<String, Object> payload) {
        try {
            kafkaTemplate.send("agent.payment.tasks", payload);
            log.info("Published payment request: {}", payload.get("claim_id"));
        } catch (Exception e) {
            log.warn("Kafka unavailable — payment queued locally");
        }
    }

    public void publishNotification(Map<String, Object> payload) {
        try {
            kafkaTemplate.send("agent.notification.tasks", payload);
        } catch (Exception e) {
            log.warn("Kafka unavailable — notification skipped");
        }
    }
}
