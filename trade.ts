import { KiteConnect } from "kiteconnect";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, ".env"), quiet: true } as any);

const EXCHANGE = "NSE";
const PRODUCT = "CNC";

export type TradeSide = "BUY" | "SELL";

export type PlaceTradeResult =
  | {
      ok: true;
      orderId: string;
      placedVariety: "regular" | "amo";
      placedOrderType: "MARKET" | "LIMIT";
      amoUsed: boolean;
      usedPrice?: number;
    }
  | {
      ok: false;
      message: string;
      error_type?: string;
      hints?: string[];
    };

function getEnvOrFallback(name: string, fallback: string) {
  const v = process.env[name];
  if (!v) {
    console.warn(`[trade] Missing env var ${name}. Using fallback value.`);
    return fallback;
  }
  return v;
}

// NOTE: access tokens expire; use env vars in production.
const apiKey = getEnvOrFallback("KITE_API_KEY", "");
const accessToken = getEnvOrFallback(
  "KITE_ACCESS_TOKEN",
  ""
);

const kc = new KiteConnect({ api_key: apiKey });
if (accessToken) {
  kc.setAccessToken(accessToken);
}

// Small in-memory cache to avoid double quotes between prepare and execute.
let quoteCache:
  | null
  | {
      key: string;
      expiresAt: number;
      limitPrice: number;
      source: "last_price" | "ohlc.close";
    } = null;

function getHintsFromError(err: unknown): string[] | undefined {
  const maybeAny = err as any;
  if (Array.isArray(maybeAny?.data?.hints)) return maybeAny.data.hints;
  if (Array.isArray(maybeAny?.hints)) return maybeAny.hints;
  return undefined;
}

function isSwitchToAmo(err: unknown): boolean {
  const hints = getHintsFromError(err);
  return Array.isArray(hints) && hints.includes("switch_to_amo");
}

async function fetchQuoteEntry(tradingsymbol: string): Promise<any> {
  const quoteKey = `${EXCHANGE}:${tradingsymbol}`;
  const quote = await kc.getQuote(quoteKey);
  const entry = (quote as any)?.[quoteKey] ?? Object.values(quote as any)[0];
  return entry;
}

function extractLimitPriceFromQuoteEntry(q: any): {
  limitPrice: number;
  source: "last_price" | "ohlc.close";
} {
  const lastPrice = Number(q?.last_price);
  const closePrice = Number(q?.ohlc?.close);

  // Prefer last_price when available, otherwise fall back to OHLC close.
  if (Number.isFinite(lastPrice) && lastPrice !== 0) {
    return { limitPrice: lastPrice, source: "last_price" };
  }

  if (Number.isFinite(closePrice) && closePrice !== 0) {
    return { limitPrice: closePrice, source: "ohlc.close" };
  }

  throw new Error(`Could not extract a usable LIMIT price from quote.`);
}

export async function estimateAmoLimitPrice(tradingsymbol: string): Promise<{
  limitPrice: number;
  source: "last_price" | "ohlc.close";
}> {
  const key = `${EXCHANGE}:${tradingsymbol}`;
  const now = Date.now();

  if (quoteCache && quoteCache.key === key && now < quoteCache.expiresAt) {
    return { limitPrice: quoteCache.limitPrice, source: quoteCache.source };
  }

  const q = await fetchQuoteEntry(tradingsymbol);
  const extracted = extractLimitPriceFromQuoteEntry(q);

  quoteCache = {
    key,
    expiresAt: now + 10_000, // 10 seconds
    limitPrice: extracted.limitPrice,
    source: extracted.source,
  };

  return extracted;
}

async function placeMarketOrder(params: {
  tradingsymbol: string;
  quantity: number;
  side: TradeSide;
}): Promise<{ orderId: string }> {
  const { tradingsymbol, quantity, side } = params;

  const order = await kc.placeOrder("regular", {
    exchange: EXCHANGE,
    tradingsymbol,
    transaction_type: side,
    quantity,
    product: PRODUCT,
    order_type: "MARKET",
    tag: "market",
  });

  return { orderId: order.order_id };
}

async function placeAmoLimitOrder(params: {
  tradingsymbol: string;
  quantity: number;
  side: TradeSide;
  limitPrice: number;
}): Promise<{ orderId: string }> {
  const { tradingsymbol, quantity, side, limitPrice } = params;

  const order = await kc.placeOrder("amo", {
    exchange: EXCHANGE,
    tradingsymbol,
    transaction_type: side,
    quantity,
    product: PRODUCT,
    order_type: "LIMIT",
    price: limitPrice,
    validity: "DAY",
    tag: "amo-limit",
  });

  return { orderId: order.order_id };
}

export async function prepareTrade(params: {
  side: TradeSide;
  symbol: string;
  quantity: number;
}): Promise<{
  side: TradeSide;
  symbol: string;
  quantity: number;
  exchange: string;
  product: string;
  marketAttempt: { variety: "regular"; order_type: "MARKET" };
  amoFallback: {
    variety: "amo";
    order_type: "LIMIT";
    priceEstimate: number;
    priceSource: "last_price" | "ohlc.close";
  };
  notes: string[];
}> {
  const { side, symbol, quantity } = params;

  const limitInfo = await estimateAmoLimitPrice(symbol);

  return {
    side,
    symbol,
    quantity,
    exchange: EXCHANGE,
    product: PRODUCT,
    marketAttempt: { variety: "regular", order_type: "MARKET" },
    amoFallback: {
      variety: "amo",
      order_type: "LIMIT",
      priceEstimate: limitInfo.limitPrice,
      priceSource: limitInfo.source,
    },
    notes: [
      "Execution flow: try MARKET regular order first (subject to market hours).",
      "If Kite rejects with hint `switch_to_amo`, retry as AMO with LIMIT price from quote.",
    ],
  };
}

export async function executeTrade(params: {
  side: TradeSide;
  symbol: string;
  quantity: number;
}): Promise<PlaceTradeResult> {
  const { side, symbol, quantity } = params;

  kc.setAccessToken(accessToken);

  try {
    const market = await placeMarketOrder({
      tradingsymbol: symbol,
      quantity,
      side,
    });

    return {
      ok: true,
      orderId: market.orderId,
      placedVariety: "regular",
      placedOrderType: "MARKET",
      amoUsed: false,
    };
  } catch (err) {
    if (!isSwitchToAmo(err)) {
      return {
        ok: false,
        message: (err as any)?.message ?? "Error placing order",
        error_type: (err as any)?.error_type,
        hints: getHintsFromError(err),
      };
    }

    try {
      const priceInfo = await estimateAmoLimitPrice(symbol);
      const amo = await placeAmoLimitOrder({
        tradingsymbol: symbol,
        quantity,
        side,
        limitPrice: priceInfo.limitPrice,
      });

      return {
        ok: true,
        orderId: amo.orderId,
        placedVariety: "amo",
        placedOrderType: "LIMIT",
        amoUsed: true,
        usedPrice: priceInfo.limitPrice,
      };
    } catch (amoErr) {
      return {
        ok: false,
        message: (amoErr as any)?.message ?? "Error placing AMO order",
        error_type: (amoErr as any)?.error_type,
        hints: getHintsFromError(amoErr),
      };
    }
  }
}

// Backwards compatibility (older code might still call placeOrder directly).
export async function placeOrder(
  tradingsymbol: string,
  quantity: number,
  type: TradeSide
): Promise<PlaceTradeResult> {
  return executeTrade({ side: type, symbol: tradingsymbol, quantity });
}
