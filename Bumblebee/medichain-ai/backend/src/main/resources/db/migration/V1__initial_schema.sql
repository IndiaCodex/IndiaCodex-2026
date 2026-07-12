-- MediChain AI — Initial Database Schema
-- Flyway Migration V1

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address  VARCHAR(200) UNIQUE NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'PATIENT',
    name            VARCHAR(200),
    email           VARCHAR(200),
    phone           VARCHAR(20),
    is_active       BOOLEAN DEFAULT TRUE,
    last_login_at   TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_wallet ON users(wallet_address);

-- HOSPITALS
CREATE TABLE IF NOT EXISTS hospitals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(300) NOT NULL,
    wallet_address  VARCHAR(200) UNIQUE,
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    license_number  VARCHAR(100),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- PATIENTS
CREATE TABLE IF NOT EXISTS patients (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id),
    wallet_address          VARCHAR(200) UNIQUE NOT NULL,
    kyc_status              VARCHAR(50) DEFAULT 'PENDING',
    zkp_proof_hash          VARCHAR(500),
    identity_nft_tx_hash    VARCHAR(200),
    identity_nft_asset_id   VARCHAR(200),
    blood_group             VARCHAR(10),
    emergency_contact       VARCHAR(20),
    abha_id                 VARCHAR(50),
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_patients_user ON patients(user_id);
CREATE INDEX idx_patients_wallet ON patients(wallet_address);

-- DOCTORS
CREATE TABLE IF NOT EXISTS doctors (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     UUID NOT NULL REFERENCES users(id),
    wallet_address              VARCHAR(200) UNIQUE NOT NULL,
    specialization              VARCHAR(200),
    hospital_id                 UUID REFERENCES hospitals(id),
    credentials_verified        BOOLEAN DEFAULT FALSE,
    credential_zkp_proof_hash   VARCHAR(500),
    license_number              VARCHAR(100),
    nmc_registration            VARCHAR(100),
    is_available                BOOLEAN DEFAULT TRUE,
    created_at                  TIMESTAMP DEFAULT NOW(),
    updated_at                  TIMESTAMP DEFAULT NOW()
);

-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id),
    doctor_id       UUID NOT NULL REFERENCES doctors(id),
    hospital_id     UUID REFERENCES hospitals(id),
    scheduled_at    TIMESTAMP NOT NULL,
    status          VARCHAR(50) DEFAULT 'SCHEDULED',
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- MEDICAL RECORDS
CREATE TABLE IF NOT EXISTS medical_records (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id      UUID NOT NULL REFERENCES patients(id),
    doctor_id       UUID REFERENCES doctors(id),
    hospital_id     UUID REFERENCES hospitals(id),
    record_type     VARCHAR(100),
    diagnosis       TEXT,
    notes           TEXT,
    nft_tx_hash     VARCHAR(200),
    nft_asset_id    VARCHAR(200),
    record_hash     VARCHAR(500),
    is_shared       BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_records_patient ON medical_records(patient_id);
CREATE INDEX idx_records_doctor ON medical_records(doctor_id);

-- PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS prescriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id          UUID NOT NULL REFERENCES patients(id),
    doctor_id           UUID NOT NULL REFERENCES doctors(id),
    medicines           JSONB NOT NULL,
    notes               TEXT,
    valid_until         DATE,
    nft_tx_hash         VARCHAR(200),
    nft_asset_id        VARCHAR(200),
    prescription_hash   VARCHAR(500),
    is_dispensed        BOOLEAN DEFAULT FALSE,
    dispensed_at        TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);

-- INSURANCE CLAIMS
CREATE TABLE IF NOT EXISTS insurance_claims (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id              UUID NOT NULL REFERENCES patients(id),
    insurance_company_id    UUID,
    claim_type              VARCHAR(100),
    claim_amount_ada        DECIMAL(18,6),
    zkp_eligibility_hash    VARCHAR(500),
    supporting_doc_hash     VARCHAR(500),
    status                  VARCHAR(50) DEFAULT 'SUBMITTED',
    ai_decision             VARCHAR(50),
    ai_confidence           DECIMAL(5,4),
    fraud_score             DECIMAL(5,4),
    masumi_tx_hash          VARCHAR(200),
    escrow_tx_hash          VARCHAR(200),
    payout_tx_hash          VARCHAR(200),
    ada_released            DECIMAL(18,6),
    rejection_reason        TEXT,
    processed_at            TIMESTAMP,
    created_at              TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_claims_patient ON insurance_claims(patient_id);
CREATE INDEX idx_claims_status ON insurance_claims(status);

-- ESCROW CONTRACTS
CREATE TABLE IF NOT EXISTS escrow_contracts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payer_wallet        VARCHAR(200),
    payee_wallet        VARCHAR(200),
    amount_ada          DECIMAL(18,6),
    contract_address    VARCHAR(200),
    lock_tx_hash        VARCHAR(200),
    release_condition   VARCHAR(100),
    status              VARCHAR(50) DEFAULT 'LOCKED',
    release_tx_hash     VARCHAR(200),
    expires_at          TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- AGENT LOGS
CREATE TABLE IF NOT EXISTS agent_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_type      VARCHAR(100),
    request_data    JSONB,
    response_data   JSONB,
    masumi_tx_hash  VARCHAR(200),
    charged_ada     DECIMAL(18,6),
    duration_ms     INTEGER,
    status          VARCHAR(50),
    user_id         UUID,
    workflow_id     VARCHAR(200),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_logs_type ON agent_logs(agent_type);
CREATE INDEX idx_agent_logs_workflow ON agent_logs(workflow_id);

-- AUDIT LOGS (immutable — no delete permitted)
CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID,
    action          VARCHAR(200) NOT NULL,
    resource_type   VARCHAR(100),
    resource_id     VARCHAR(200),
    ip_address      VARCHAR(50),
    user_agent      TEXT,
    result          VARCHAR(50),
    error_message   TEXT,
    trace_id        VARCHAR(100),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- Revoke DELETE on audit_logs (security measure)
REVOKE DELETE ON audit_logs FROM PUBLIC;

-- Seed default super admin hospital
INSERT INTO hospitals (name, city, state, license_number)
VALUES ('MediChain Demo Hospital', 'Hyderabad', 'Telangana', 'DEMO-HOSP-001')
ON CONFLICT DO NOTHING;
