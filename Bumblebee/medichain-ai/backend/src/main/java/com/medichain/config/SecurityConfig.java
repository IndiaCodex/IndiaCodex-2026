package com.medichain.config;

import com.medichain.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    // Completely bypass security for React static files
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.ignoring()
            .requestMatchers(
                "/", "/index.html", "/favicon.ico",
                "/assets/**", "/*.js", "/*.css", "/*.ico", "/*.png", "/*.svg"
            );
    }

    private static final String[] PUBLIC_ENDPOINTS = {
        "/auth/**",
        "/actuator/health",
        "/actuator/info",
        "/actuator/prometheus",
        "/swagger-ui/**",
        "/api-docs/**",
        "/v3/api-docs/**",
    };

    // Static React frontend resources — always public
    private static final String[] STATIC_RESOURCES = {
        "/", "/index.html", "/favicon.ico",
        "/assets/**", "/*.js", "/*.css", "/*.ico", "/*.png", "/*.svg", "/*.json",
        "/login", "/unauthorized",
        "/patient/**", "/doctor/**", "/admin/**", "/insurance/**", "/pharmacy/**", "/agent/**"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(STATIC_RESOURCES).permitAll()
                .requestMatchers(PUBLIC_ENDPOINTS).permitAll()
                .requestMatchers("/patients/**").hasAnyRole("PATIENT", "DOCTOR", "HOSPITAL_ADMIN", "SUPER_ADMIN")
                .requestMatchers("/doctors/**").hasAnyRole("PATIENT", "DOCTOR", "HOSPITAL_ADMIN", "SUPER_ADMIN")
                .requestMatchers("/appointments/**").hasAnyRole("PATIENT", "DOCTOR", "HOSPITAL_ADMIN", "SUPER_ADMIN")
                .requestMatchers("/consent/**").hasAnyRole("PATIENT", "DOCTOR", "HOSPITAL_ADMIN", "SUPER_ADMIN")
                .requestMatchers("/admin/audit-trail/**").hasAnyRole("PATIENT", "DOCTOR", "HOSPITAL_ADMIN", "INSURANCE_OFFICER", "SUPER_ADMIN")
                .requestMatchers("/admin/**").hasAnyRole("HOSPITAL_ADMIN", "SUPER_ADMIN")
                .requestMatchers("/insurance/**").hasAnyRole("PATIENT", "INSURANCE_OFFICER", "SUPER_ADMIN")
                .requestMatchers("/pharmacy/**").hasAnyRole("PHARMACIST", "SUPER_ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .headers(headers -> headers
                .frameOptions(f -> f.deny())
                .contentTypeOptions(c -> {})
                .httpStrictTransportSecurity(h -> h.maxAgeInSeconds(31536000))
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://*.medichain.ai"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
