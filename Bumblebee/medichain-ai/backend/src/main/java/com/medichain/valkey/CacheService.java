package com.medichain.valkey;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CacheService {

    private final RedisTemplate<String, Object> redisTemplate;

    public void set(String key, Object value, Duration ttl) {
        redisTemplate.opsForValue().set(key, value, ttl);
    }

    public <T> Optional<T> get(String key, Class<T> type) {
        Object value = redisTemplate.opsForValue().get(key);
        if (value == null) return Optional.empty();
        try {
            return Optional.of(type.cast(value));
        } catch (ClassCastException e) {
            log.warn("Cache type mismatch for key {}: {}", key, e.getMessage());
            return Optional.empty();
        }
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }

    public boolean exists(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public void blacklistToken(String token, Duration ttl) {
        set("jwt:blacklist:" + token, "revoked", ttl);
    }

    public boolean isTokenBlacklisted(String token) {
        return exists("jwt:blacklist:" + token);
    }

    public void cachePatientProfile(String patientId, Object profile) {
        set("patient:profile:" + patientId, profile, Duration.ofMinutes(5));
    }

    public void cacheAiResponse(String requestHash, Object response) {
        set("ai:response:" + requestHash, response, Duration.ofHours(1));
    }

    public void incrementRateLimit(String key, Duration window) {
        Long count = redisTemplate.opsForValue().increment("rate:limit:" + key);
        if (count != null && count == 1) {
            redisTemplate.expire("rate:limit:" + key, window);
        }
    }

    public Long getRateLimit(String key) {
        Object val = redisTemplate.opsForValue().get("rate:limit:" + key);
        return val != null ? Long.parseLong(val.toString()) : 0L;
    }
}
