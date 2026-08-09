import { InMemoryStorage } from "../src/in-memory-storage.js";
import { runStoragePortContractTests } from "../src/contract.js";

runStoragePortContractTests("InMemoryStorage", () => new InMemoryStorage());
