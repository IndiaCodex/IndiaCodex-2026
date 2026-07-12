package com.medichain.repository;
import com.medichain.entity.AgentLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface AgentLogRepository extends JpaRepository<AgentLog, UUID> {
    Page<AgentLog> findByAgentTypeOrderByCreatedAtDesc(String agentType, Pageable pageable);
    Page<AgentLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT SUM(a.chargedAda) FROM AgentLog a WHERE a.status = 'SUCCESS'")
    java.math.BigDecimal totalAdaEarned();

    @Query("SELECT COUNT(a) FROM AgentLog a WHERE a.agentType = :type AND a.status = 'SUCCESS'")
    long countSuccessfulByType(String type);
}
