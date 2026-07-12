package com.medichain.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

/**
 * Ollama configuration — local LLM integration
 * No API key needed. Runs completely locally.
 * Default model: qwen2.5:3b (fast)
 * For better accuracy: deepseek-r1:8b
 */
@Configuration
public class OllamaConfig {

    public static final String OLLAMA_BASE_URL = "http://localhost:11434";
    public static final String DIAGNOSIS_MODEL = "qwen2.5:3b";
    public static final String CLAIMS_MODEL = "qwen2.5:3b";
    public static final String SUPPORT_MODEL = "qwen2.5:3b";

    @Bean(name = "ollamaWebClient")
    public WebClient ollamaWebClient() {
        return WebClient.builder()
            .baseUrl(OLLAMA_BASE_URL)
            .codecs(c -> c.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
            .build();
    }
}
