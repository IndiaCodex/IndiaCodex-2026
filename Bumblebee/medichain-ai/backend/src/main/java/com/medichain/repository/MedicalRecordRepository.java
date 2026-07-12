package com.medichain.repository;

import com.medichain.entity.MedicalRecord;
import com.medichain.enums.RecordType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, UUID> {

    @Query("SELECT r FROM MedicalRecord r WHERE r.patient.id = :patientId ORDER BY r.createdAt DESC")
    List<MedicalRecord> findByPatientIdOrderByCreatedAtDesc(UUID patientId);

    List<MedicalRecord> findByPatientIdAndRecordType(UUID patientId, RecordType recordType);

    @Query("SELECT r FROM MedicalRecord r WHERE r.doctor.id = :doctorId ORDER BY r.createdAt DESC")
    List<MedicalRecord> findByDoctorIdOrderByCreatedAtDesc(UUID doctorId);
}
