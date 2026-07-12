package com.medichain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "agent_logs", indexes = {
    @Index(name = "idx_agent_logs_type", columnList = "agent_type"),
    @Index(name = "idx_agent_logs_workflow", columnList = "workflow_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AgentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "agent_type", length = 100)
    private String agentType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "request_data", columnDefinition = "jsonb")
    private String requestData;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "response_data", columnDefinition = "jsonb")
    private String responseData;

    @Column(name = "masumi_tx_hash", length = 200)
    private String masumiTxHash;

    @Column(name = "charged_ada", precision = 18, scale = 6)
    private BigDecimal chargedAda;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(length = 50)
    private String status;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "workflow_id", length = 200)
    private String workflowId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
