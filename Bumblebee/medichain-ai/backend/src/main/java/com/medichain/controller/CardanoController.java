package com.medichain.controller;

import com.medichain.cardano.CardanoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/cardano")
@RequiredArgsConstructor
@Tag(name = "Cardano", description = "Cardano blockchain operations — NFTs, escrow, transactions")
public class CardanoController {

    private final CardanoService cardanoService;

    @PostMapping("/escrow/create")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Create ADA escrow smart contract for insurance payout")
    public ResponseEntity<Map<String, Object>> createEscrow(
            @Valid @RequestBody EscrowRequest req) {

        String escrowTxHash = cardanoService.createEscrow(
            req.getPayerWallet(), req.getPayeeWallet(), req.getAmountAda());

        return ResponseEntity.ok(Map.of(
            "escrowTxHash", escrowTxHash,
            "payerWallet", req.getPayerWallet(),
            "payeeWallet", req.getPayeeWallet(),
            "amountAda", req.getAmountAda(),
            "status", "LOCKED",
            "message", "ADA locked in smart contract. Will auto-release on AI approval."
        ));
    }

    @PostMapping("/escrow/release")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Release ADA from escrow after approval")
    public ResponseEntity<Map<String, Object>> releaseEscrow(
            @Valid @RequestBody EscrowReleaseRequest req) {

        String txHash = cardanoService.releaseEscrow(
            req.getEscrowTxHash(), req.getPayeeWallet(), req.getAmountAda());

        return ResponseEntity.ok(Map.of(
            "txHash", txHash,
            "payeeWallet", req.getPayeeWallet(),
            "amountAda", req.getAmountAda(),
            "status", "RELEASED",
            "message", "ADA successfully released to patient wallet"
        ));
    }

    @GetMapping("/tx/{txHash}")
    @Operation(summary = "Get Cardano transaction details")
    public ResponseEntity<Map<String, Object>> getTransaction(@PathVariable String txHash) {
        return ResponseEntity.ok(cardanoService.getTransactionDetails(txHash));
    }

    @Data static class EscrowRequest {
        @NotBlank private String payerWallet;
        @NotBlank private String payeeWallet;
        @Positive private double amountAda;
        private String releaseCondition = "AI_APPROVAL";
    }

    @Data static class EscrowReleaseRequest {
        @NotBlank private String escrowTxHash;
        @NotBlank private String payeeWallet;
        @Positive private double amountAda;
        private String workflowId;
    }
}
