// Real local Yaci DevKit devnet connection. The Yaci Store component
// exposes a Blockfrost-compatible API, so Mesh's own BlockfrostProvider
// class works against it directly by pointing at a custom base URL.
import { BlockfrostProvider } from "@meshsdk/provider";

const LOCAL_PROVIDER_URL = "http://localhost:8080/api/v1/";

export function getDevnetProvider(): BlockfrostProvider {
  return new BlockfrostProvider(LOCAL_PROVIDER_URL);
}
