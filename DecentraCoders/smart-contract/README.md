# LaunchNest — IdeaProofRegistry Smart Contract

This directory contains the Cardano smart contract for **LaunchNest**, built using the **Aiken** smart contract development language.

## Purpose

The `IdeaProofRegistry` contract allows a student founder to lock a small amount of Preview Testnet ADA at a script address alongside an **inline datum** containing a cryptographic SHA-256 hash of their startup idea.

This hash serves as a timestamped proof of existence. If another party claims ownership or alleges theft, the founder can present the original startup idea content, rehash it canonically, and verify that it matches the hash locked on the blockchain.

## Smart Contract Details

- **Language:** Aiken v1.1.x
- **Validator Name:** `idea_proof_registry`
- **Purpose:** Spend validator

### Inline Datum Structure

The datum represents the metadata associated with the idea proof:

```aiken
type Datum {
  idea_id: ByteArray,                // Unique identifier for the idea
  idea_hash: ByteArray,              // SHA-256 hash of the normalized idea payload (32 bytes)
  owner_public_key_hash: ByteArray,  // Wallet public key hash of the student founder (28 bytes)
  submitted_at: Int,                 // UNIX timestamp of submission
  app_name: ByteArray,               // Name of the registering application ("LaunchNest")
  version: ByteArray,                // Version of the application ("1.0")
}
```

### Validator Safety Rules

The validator implements the following safety guards before allowing script UTxOs to be spent:
1. **Hash Existence:** Asserts that the `idea_hash` is not empty.
2. **Hash Integrity:** Asserts that the `idea_hash` is exactly 32 bytes (valid SHA-256).
3. **Owner Address Integrity:** Asserts that the `owner_public_key_hash` is exactly 28 bytes (valid Cardano Verification Key Hash).
4. **Authorization check:** Asserts that the transaction is signed by the registered owner (the key hash must exist in `tx.extra_signatories`).

---

## Local Development & Compilation

To build and test this smart contract locally, you need the [Aiken CLI](https://aiken-lang.org/installation-guide) installed.

### 1. Verification (Check & Test)

Run the unit tests to verify that all signature checks and hash validation rules function correctly:

```bash
aiken check
```

### 2. Compilation (Build Blueprint)

Compile the contract into a Plutus JSON blueprint:

```bash
aiken build
```

This command generates `plutus.json` in the root of the contract directory. The blueprint contains the compiled Plutus Core code and script definitions, which the Mesh SDK reads to build transactions.
