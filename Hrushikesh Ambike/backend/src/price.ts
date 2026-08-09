// Free-exchange ADA/USD price fetch for the Ouro oracle.
//
// Ouro has no liquidation path, so this price only sizes borrow limits and
// harvest self-repay amounts — it is not safety-critical. A simple
// unauthenticated free-exchange fetch (Kraken primary, Coinbase fallback) is
// an intentional, already-approved design choice for this hackathon
// prototype.

const KRAKEN_URL = "https://api.kraken.com/0/public/Ticker?pair=ADAUSD";
const COINBASE_URL = "https://api.coinbase.com/v2/prices/ADA-USD/spot";

const MICRO_USD_SCALE = 1_000_000;

export interface AdaUsdPrice {
  priceMicroUsd: number;
  source: string;
}

interface KrakenTickerResponse {
  result?: {
    ADAUSD?: {
      c?: [string, string];
    };
  };
}

interface CoinbaseSpotResponse {
  data?: {
    amount?: string;
  };
}

function usdStringToMicroUsd(usd: string): number {
  const parsed = Number.parseFloat(usd);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid USD price value: "${usd}"`);
  }
  return Math.round(parsed * MICRO_USD_SCALE);
}

async function fetchFromKraken(): Promise<AdaUsdPrice> {
  const response = await fetch(KRAKEN_URL);
  if (!response.ok) {
    throw new Error(`Kraken request failed with status ${response.status}`);
  }

  const body = (await response.json()) as KrakenTickerResponse;
  const lastTradePrice = body.result?.ADAUSD?.c?.[0];
  if (!lastTradePrice) {
    throw new Error("Kraken response missing result.ADAUSD.c[0]");
  }

  return { priceMicroUsd: usdStringToMicroUsd(lastTradePrice), source: "kraken" };
}

async function fetchFromCoinbase(): Promise<AdaUsdPrice> {
  const response = await fetch(COINBASE_URL);
  if (!response.ok) {
    throw new Error(`Coinbase request failed with status ${response.status}`);
  }

  const body = (await response.json()) as CoinbaseSpotResponse;
  const amount = body.data?.amount;
  if (!amount) {
    throw new Error("Coinbase response missing data.amount");
  }

  return { priceMicroUsd: usdStringToMicroUsd(amount), source: "coinbase" };
}

/**
 * Fetches the current ADA/USD price as an integer in micro-USD
 * (e.g. $0.40 -> 400000), trying Kraken first and falling back to Coinbase
 * if Kraken is unavailable. Neither exchange requires an API key.
 */
export async function fetchAdaUsd(): Promise<AdaUsdPrice> {
  try {
    return await fetchFromKraken();
  } catch (krakenError: unknown) {
    try {
      return await fetchFromCoinbase();
    } catch (coinbaseError: unknown) {
      const krakenMessage =
        krakenError instanceof Error ? krakenError.message : String(krakenError);
      const coinbaseMessage =
        coinbaseError instanceof Error
          ? coinbaseError.message
          : String(coinbaseError);
      throw new Error(
        `Failed to fetch ADA/USD price from both Kraken and Coinbase. ` +
          `Kraken: ${krakenMessage}. Coinbase: ${coinbaseMessage}.`,
      );
    }
  }
}
