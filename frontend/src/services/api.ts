/**
 * Felix Finance — API service layer.
 * All network calls go through here so swapping the backend URL
 * or adding a new exchange never touches page/component code.
 */

const BASE = process.env.REACT_APP_API_URL ?? "/api";

export type Exchange = "BRVM" | "NSE" | "GSE";

export interface QuoteDTO {
  ticker: string;
  exchange_code: string;
  price: number;
  open: number | null;
  high: number | null;
  low: number | null;
  prev_close: number | null;
  change_pct: number | null;
  volume: number | null;
  volume_xof: number | null;
  scraped_at: string;
}

export interface HistoryPoint {
  trade_date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number;
  volume: number | null;
}

export interface IntradayPoint {
  ts: string;
  price: number;
  change_pct: number | null;
  volume: number | null;
}

export interface MarketStats {
  exchange_code: string;
  currency: string;
  total: number;
  up: number;
  down: number;
  unchanged: number;
  total_volume_xof: number | null;
  computed_at: string;
}

export interface AIInsightDTO {
  ticker: string;
  exchange_code: string;
  sentiment: 'bullish' | 'neutral' | 'bearish';
  insight_text: string;
  insight_text_en?: string | null;
  buy_pct: number;
  hold_pct: number;
  sell_pct: number;
  provider: string | null;
  generated_at: string;
  valid_until: string;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  /** Latest quotes for every stock on an exchange */
  quotes: (exchange: Exchange = "BRVM") =>
    get<QuoteDTO[]>(`/v1/${exchange}/quotes`),

  /** Single stock latest quote */
  quote: (exchange: Exchange = "BRVM", ticker: string) =>
    get<QuoteDTO>(`/v1/${exchange}/quotes/${ticker}`),

  /** Intraday snapshots for a given day (defaults to today) */
  intraday: (exchange: Exchange = "BRVM", ticker: string, date?: string) => {
    const qs = date ? `?date=${date}` : "";
    return get<IntradayPoint[]>(`/v1/${exchange}/stocks/${ticker}/intraday${qs}`);
  },

  /** Historical OHLCV: range = 1D | 1W | 1M | 6M | 1Y | 5Y */
  history: (exchange: Exchange = "BRVM", ticker: string, range = "1Y") =>
    get<HistoryPoint[]>(
      `/v1/${exchange}/stocks/${ticker}/history?range=${range}`
    ),

  /** Aggregate market statistics */
  marketStats: (exchange: Exchange = "BRVM") =>
    get<MarketStats>(`/v1/${exchange}/market-stats`),

  /** AI-generated weekly insight for a stock */
  aiInsight: (exchange: Exchange = "BRVM", ticker: string) =>
    get<AIInsightDTO>(`/v1/${exchange}/stocks/${ticker}/ai-insight`),
};
