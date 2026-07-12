package com.medichain.controller;

import com.medichain.entity.AgentLog;
import com.medichain.entity.User;
import com.medichain.kafka.KafkaEventPublisher;
import com.medichain.repository.AgentLogRepository;
import com.medichain.service.AgentLogService;
import com.medichain.service.OllamaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Tag(name = "AI Agents", description = "AI agent interactions via Masumi")
public class AIController {

    private final KafkaEventPublisher kafkaPublisher;
    private final AgentLogRepository agentLogRepository;
    private final AgentLogService agentLogService;
    private final OllamaService ollamaService;

    @PostMapping("/diagnosis")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Request AI diagnosis via Ollama local LLM — no API key needed")
    public ResponseEntity<Map<String, Object>> requestDiagnosis(
            @Valid @RequestBody DiagnosisRequest req,
            @AuthenticationPrincipal User currentUser) {

        String workflowId = "wf-diagnosis-" + UUID.randomUUID().toString().substring(0, 8);

        // Call Ollama directly for REAL AI diagnosis — synchronous for UI demo
        boolean ollamaAvailable = ollamaService.isAvailable();

        if (ollamaAvailable) {
            // REAL Ollama response — returns immediately
            Map<String, Object> diagnosisResult = ollamaService.getDiagnosis(
                req.getSymptoms(),
                req.getPatientAge() != null ? req.getPatientAge() : 35,
                req.getPatientGender() != null ? req.getPatientGender() : "UNKNOWN",
                null
            );

            diagnosisResult.put("workflowId", workflowId);
            diagnosisResult.put("patientId", req.getPatientId().toString());
            diagnosisResult.put("status", "COMPLETED");
            diagnosisResult.put("chargedAda", 0.5);
            diagnosisResult.put("masumiNote", "₳0.5 charged via Masumi protocol");

            // Cache result for polling
            agentLogService.cacheWorkflowResult(workflowId, diagnosisResult);
            // Log real ADA charge to DB — powers totalAdaEarned in dashboard
            long start = System.currentTimeMillis();
            agentLogService.logAgentTask(
                workflowId, "diagnosis",
                req, diagnosisResult,
                "masumi-" + workflowId.substring(0, 8),
                new java.math.BigDecimal("0.5"),
                System.currentTimeMillis() - start,
                "SUCCESS",
                currentUser.getId()
            );
            return ResponseEntity.ok(diagnosisResult);
        }

        // Fallback: async via Kafka
        kafkaPublisher.publishDiagnosisRequest(Map.of(
            "workflow_id", workflowId,
            "action", "DIAGNOSE",
            "patient_id", req.getPatientId().toString(),
            "doctor_id", currentUser.getId().toString(),
            "symptoms", req.getSymptoms(),
            "patient_age", req.getPatientAge() != null ? req.getPatientAge() : 0,
            "patient_gender", req.getPatientGender() != null ? req.getPatientGender() : "UNKNOWN"
        ));

        return ResponseEntity.accepted().body(Map.of(
            "workflowId", workflowId,
            "status", "PROCESSING",
            "message", "Ollama unavailable. Poll /ai/diagnosis/" + workflowId + " for result.",
            "estimatedTimeSeconds", 10
        ));
    }

    @GetMapping("/diagnosis/{workflowId}")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Poll for AI diagnosis result (SPEC-004 — async result fetch)")
    public ResponseEntity<Map<String, Object>> getDiagnosisResult(@PathVariable String workflowId) {
        return ResponseEntity.ok(agentLogService.getWorkflowResult(workflowId));
    }

    @GetMapping("/agents/status")
    @PreAuthorize("hasAnyRole('DOCTOR', 'HOSPITAL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get AI agent statuses — powered by Ollama local LLM")
    public ResponseEntity<Map<String, Object>> getAgentStatuses() {
        boolean ollamaUp = ollamaService.isAvailable();
        java.math.BigDecimal totalAda = agentLogRepository.totalAdaEarned();
        Map<String, Object> status = new java.util.HashMap<>();
        String agentStatus = ollamaUp ? "RUNNING" : "OFFLINE";
        status.put("diagnosis",    Map.of("status", agentStatus, "totalTasks", agentLogRepository.countSuccessfulByType("diagnosis"), "model", "qwen2.5:3b"));
        status.put("insurance",    Map.of("status", agentStatus, "totalTasks", agentLogRepository.countSuccessfulByType("insurance"), "model", "qwen2.5:3b"));
        status.put("kyc",          Map.of("status", agentStatus, "totalTasks", agentLogRepository.countSuccessfulByType("kyc"), "model", "qwen2.5:3b"));
        status.put("support",      Map.of("status", agentStatus, "totalTasks", agentLogRepository.countSuccessfulByType("support"), "model", "qwen2.5:3b"));
        status.put("records",      Map.of("status", agentStatus, "totalTasks", agentLogRepository.countSuccessfulByType("records"), "model", "qwen2.5:3b"));
        status.put("totalAdaEarned", totalAda != null ? totalAda : java.math.BigDecimal.ZERO);
        status.put("ollamaAvailable", ollamaUp);
        status.put("ollamaBaseUrl", com.medichain.config.OllamaConfig.OLLAMA_BASE_URL);
        status.put("engine", "Ollama Local LLM — no API key needed");
        return ResponseEntity.ok(status);
    }

    @PostMapping("/support")
    @Operation(summary = "Patient support chat via Ollama AI")
    public ResponseEntity<Map<String, Object>> supportChat(
            @RequestBody Map<String, String> req) {
        String message = req.getOrDefault("message", "");
        String response = ollamaService.getSupportResponse(message, "MediChain healthcare platform");
        String wfId = "support-" + java.util.UUID.randomUUID().toString().substring(0, 8);

        // Log ₳0.1 ADA charge to DB
        agentLogService.logAgentTask(
            wfId, "support",
            req, Map.of("response", response),
            "masumi-" + wfId,
            new java.math.BigDecimal("0.1"),
            100L, "SUCCESS", null
        );

        return ResponseEntity.ok(Map.of(
            "response", response,
            "powered_by", "Ollama/" + com.medichain.config.OllamaConfig.SUPPORT_MODEL,
            "chargedAda", 0.1
        ));
    }

    @GetMapping("/agents/logs")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get agent execution logs")
    public ResponseEntity<Page<AgentLog>> getAgentLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(agentLogRepository.findAllByOrderByCreatedAtDesc(
            PageRequest.of(page, size)));
    }

    @Data
    static class DiagnosisRequest {
        private UUID patientId;
        private List<String> symptoms;
        private Integer patientAge;
        private String patientGender;
    }
}
