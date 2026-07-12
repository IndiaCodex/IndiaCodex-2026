package com.medichain.service;

import com.medichain.config.OllamaConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * Ollama AI Service — local LLM integration
 * Used by AI agents as backend for all medical intelligence.
 * No API key, no internet, no cost.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OllamaService {

    @Qualifier("ollamaWebClient")
    private final WebClient ollamaWebClient;
    private final ObjectMapper objectMapper;

    /**
     * Call Ollama and get raw text response
     */
    public String chat(String model, String systemPrompt, String userMessage) {
        try {
            Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userMessage)
                ),
                "stream", false,
                "options", Map.of("temperature", 0.1, "num_predict", 1024)
            );

            String response = ollamaWebClient.post()
                .uri("/api/chat")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(java.time.Duration.ofSeconds(60))
                .block();

            JsonNode json = objectMapper.readTree(response);
            String content = json.path("message").path("content").asText();
            log.info("Ollama [{}] responded: {}...", model, content.substring(0, Math.min(80, content.length())));
            return content;

        } catch (Exception e) {
            log.warn("Ollama unavailable ({}): using fallback response", e.getMessage());
            return null;
        }
    }

    /**
     * Call Ollama and parse JSON from response
     */
    public <T> T chatJson(String model, String systemPrompt, String userMessage, Class<T> responseType) {
        String jsonInstruction = "\n\nIMPORTANT: Respond with ONLY valid JSON. No markdown, no code blocks, just raw JSON.";
        String raw = chat(model, systemPrompt + jsonInstruction, userMessage);

        if (raw == null) return null;

        // Clean markdown if present
        raw = raw.trim();
        if (raw.startsWith("```json")) raw = raw.substring(7);
        if (raw.startsWith("```")) raw = raw.substring(3);
        if (raw.endsWith("```")) raw = raw.substring(0, raw.length() - 3);
        raw = raw.trim();

        try {
            return objectMapper.readValue(raw, responseType);
        } catch (Exception e) {
            log.warn("Failed to parse Ollama JSON response: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Medical diagnosis using Ollama
     */
    public Map<String, Object> getDiagnosis(List<String> symptoms, int age, String gender, String history) {
        String systemPrompt = """
                You are MediChain AI Diagnosis Assistant powered by Ollama local LLM on Cardano blockchain.
                Analyse symptoms and suggest diagnoses. Return ONLY valid JSON.
                Format: {"diagnoses":[{"condition":"...","icd10_code":"...","confidence":0.8,"urgency":"MODERATE","recommended_tests":["ECG"],"recommended_medicines":["Aspirin"]}],"overall_urgency":"MODERATE","summary":"...","disclaimer":"AI suggestions only"}
                """;

        String userMsg = String.format(
            "Patient: Age %d, Gender %s\nSymptoms: %s\nHistory: %s\nProvide 3 diagnosis suggestions in JSON.",
            age, gender, String.join(", ", symptoms), history != null ? history : "None"
        );

        Map result = chatJson(OllamaConfig.DIAGNOSIS_MODEL, systemPrompt, userMsg, Map.class);
        if (result == null) {
            return getFallbackDiagnosis(symptoms);
        }
        // Use mutable map to allow adding fields
        Map<String, Object> mutableResult = new java.util.HashMap<>(result);
        mutableResult.put("powered_by", "Ollama/" + OllamaConfig.DIAGNOSIS_MODEL);
        return mutableResult;
    }

    /**
     * Insurance claim assessment using Ollama
     */
    public Map<String, Object> assessClaim(String claimType, double amountAda, boolean zkpVerified) {
        String systemPrompt = """
                You are MediChain Insurance Claims Processor on Cardano. Assess claims for fraud.
                Return ONLY valid JSON: {"decision":"APPROVED","fraud_score":0.05,"confidence":0.94,"reasoning":"...","fraud_indicators":[]}
                """;

        String userMsg = String.format(
            "Claim: %s, Amount: ₳%.2f, ZKP Verified: %s. Assess for fraud and return decision.",
            claimType, amountAda, zkpVerified
        );

        Map result = chatJson(OllamaConfig.CLAIMS_MODEL, systemPrompt, userMsg, Map.class);
        if (result == null) {
            return Map.of("decision", "APPROVED", "fraud_score", 0.02, "confidence", 0.95,
                "reasoning", "Auto-approved (Ollama unavailable — fallback mode)", "fraud_indicators", List.of());
        }
        result.put("powered_by", "Ollama/" + OllamaConfig.CLAIMS_MODEL);
        return result;
    }

    /**
     * Patient support chat using Ollama
     */
    public String getSupportResponse(String patientMessage, String context) {
        String systemPrompt = """
                You are MediChain AI Patient Support powered by Ollama. Help patients with:
                - Insurance claim status
                - Prescription queries
                - Appointment questions
                - Medical record access
                Never give specific medical advice. Keep responses under 100 words. Be empathetic.
                """;

        String userMsg = String.format("Patient: %s\nContext: %s", patientMessage, context);
        String response = chat(OllamaConfig.SUPPORT_MODEL, systemPrompt, userMsg);
        return response != null ? response : "I'm here to help! For urgent medical queries, please contact your doctor directly.";
    }

    /**
     * Medical records summary using Ollama
     */
    public String summarizeRecords(String records, String focusArea) {
        String systemPrompt = "Summarize patient medical records in under 150 words. Focus on key diagnoses, medications, and recent visits. Be clinical and precise.";
        String userMsg = String.format("Records:\n%s\nFocus: %s", records, focusArea);
        String response = chat(OllamaConfig.DIAGNOSIS_MODEL, systemPrompt, userMsg);
        return response != null ? response : "Medical records summarization pending.";
    }

    /**
     * Check if Ollama is available
     */
    public boolean isAvailable() {
        try {
            String response = ollamaWebClient.get()
                .uri("/api/tags")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(java.time.Duration.ofSeconds(3))
                .block();
            return response != null;
        } catch (Exception e) {
            return false;
        }
    }

    private Map<String, Object> getFallbackDiagnosis(List<String> symptoms) {
        // Use HashMap (mutable) — not Map.of() which is immutable
        Map<String, Object> result = new java.util.HashMap<>();
        result.put("diagnoses", List.of(
            Map.of("condition", "Requires Clinical Evaluation", "icd10_code", "Z00.00",
                "confidence", 0.5, "urgency", "MODERATE",
                "recommended_tests", List.of("Complete Blood Count", "ECG"),
                "recommended_medicines", List.of("Consult doctor"))
        ));
        result.put("overall_urgency", "MODERATE");
        result.put("summary", "Symptoms: " + String.join(", ", symptoms) + ". Clinical evaluation recommended.");
        result.put("disclaimer", "AI suggestions only. Doctor must make final decision.");
        result.put("powered_by", "Fallback (Ollama unavailable)");
        return result;
    }
}
