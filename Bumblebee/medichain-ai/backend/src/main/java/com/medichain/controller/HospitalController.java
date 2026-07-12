package com.medichain.controller;

import com.medichain.entity.Hospital;
import com.medichain.service.HospitalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/hospitals")
@RequiredArgsConstructor
@Tag(name = "Hospitals", description = "Hospital management")
public class HospitalController {

    private final HospitalService hospitalService;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Create a new hospital")
    public ResponseEntity<Hospital> create(@Valid @RequestBody HospitalRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
            hospitalService.createHospital(req.getName(), req.getWalletAddress(),
                req.getAddress(), req.getCity(), req.getState(), req.getLicenseNumber()));
    }

    @GetMapping
    @Operation(summary = "Get all hospitals")
    public ResponseEntity<List<Hospital>> getAll() {
        return ResponseEntity.ok(hospitalService.getAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get hospital by ID")
    public ResponseEntity<Hospital> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(hospitalService.getById(id));
    }

    @Data
    static class HospitalRequest {
        @NotBlank private String name;
        private String walletAddress;
        private String address;
        private String city;
        private String state;
        private String licenseNumber;
    }
}
