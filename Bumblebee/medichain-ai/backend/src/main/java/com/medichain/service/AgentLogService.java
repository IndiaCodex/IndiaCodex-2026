package com.medichain.service;

import com.medichain.entity.AgentLog;
import com.medichain.repository.AgentLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Handles AI agent task lifecycle:
 * - Saves agent logs to DB (SPEC-004 acceptance criteria)
 * - Caches async results in Valkey so frontend can poll
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AgentLogService {

    private final AgentLogRepository agentLogRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    @Async
    public void logAgentTask(String workflowId, String agentType,
                              Object request, Object response,
                              String masumiTxHash, BigDecimal chargedAda,
                              long durationMs, String status, UUID userId) {
        try {
            AgentLog log = AgentLog.builder()
                .workflowId(workflowId)
                .agentType(agentType)
                .requestData(objectMapper.writeValueAsString(request))
                .responseData(objectMapper.writeValueAsString(response))
                .masumiTxHash(masumiTxHash)
                .chargedAda(chargedAda)
                .durationMs((int) durationMs)
                .status(status)
                .userId(userId)
                .build();
            agentLogRepository.save(log);
        } catch (Exception e) {
            log.warn("Failed to save agent log: {}", e.getMessage());
        }
    }

    /** Cache async result in Valkey — frontend polls this */
    public void cacheWorkflowResult(String workflowId, Object result) {
        try {
            String key = "workflow:result:" + workflowId;
            redisTemplate.opsForValue().set(key, result, Duration.ofMinutes(30));
        } catch (Exception e) {
            log.warn("Failed to cache workflow result: {}", e.getMessage());
        }
    }

    /** Frontend polls this endpoint via GET /ai/diagnosis/{workflowId} */
    public Map<String, Object> getWorkflowResult(String workflowId) {
        String key = "workflow:result:" + workflowId;
        Object result = redisTemplate.opsForValue().get(key);
        if (result == null) {
            return Map.of("status", "PROCESSING", "workflowId", workflowId);
        }
        return Map.of("status", "COMPLETED", "workflowId", workflowId, "result", result);
    }
}
