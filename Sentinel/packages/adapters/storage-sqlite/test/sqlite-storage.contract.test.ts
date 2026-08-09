import { runStoragePortContractTests } from "@sentinel/storage-memory/contract";
import { SqliteStorage } from "../src/sqlite-storage.js";

// Same suite @sentinel/storage-memory validates itself against — proof
// that the two adapters are genuinely interchangeable (ADR-0003), not
// just structurally similar.
runStoragePortContractTests("SqliteStorage", () => new SqliteStorage(":memory:"));
