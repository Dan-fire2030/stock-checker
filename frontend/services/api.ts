const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

// --- 型定義 ---
export type Market = "jp" | "us" | "all";
export type ChartPeriod = "1m" | "3m" | "1y";

export interface StockSearchResult {
  symbol: string;
  display_symbol: string;
  name: string;
  market: "jp" | "us";
}

export interface StockPick {
  symbol: string;
  display_symbol?: string;
  name: string;
  market: "jp" | "us";
  price: number | null;
  change_pct: number;
  score: number;
  sector: string;
}

export interface ScoreBreakdownItem {
  value: number | boolean | null;
  score: number;
  max: number;
}

export interface StockScore {
  total: number;
  max: number;
  breakdown: {
    rsi: ScoreBreakdownItem;
    golden_cross: ScoreBreakdownItem;
    volume_trend: ScoreBreakdownItem;
    per: ScoreBreakdownItem;
    pbr: ScoreBreakdownItem;
    roe: ScoreBreakdownItem;
  };
}

export interface StockDetail {
  symbol: string;
  name: string;
  market: "jp" | "us";
  sector: string;
  industry: string;
  price: number | null;
  change: number | null;
  change_pct: number | null;
  high: number | null;
  low: number | null;
  open: number | null;
  prev_close: number | null;
  market_cap: number | null;
  pe_ratio: number | null;
  pb_ratio: number | null;
  roe: number | null;
  dividend_yield: number | null;
  "52_week_high": number | null;
  "52_week_low": number | null;
  rsi: number | null;
  ma50: number | null;
  ma200: number | null;
  volume_trend: number | null;
  score: StockScore;
}

export interface ChartCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  published_at: number | string;
  market: "jp" | "us";
  image: string;
}

export interface MarketIndex {
  symbol: string;
  price: number | null;
  change_pct: number | null;
}

// --- API関数 ---
export const api = {
  searchStocks: (q: string, market: Market = "all") =>
    request<{ results: StockSearchResult[] }>(
      `/api/stocks/search?q=${encodeURIComponent(q)}&market=${market}`
    ),

  getTopPicks: (market: Market = "all", limit = 20) =>
    request<{ picks: StockPick[] }>(
      `/api/stocks/top-picks?market=${market}&limit=${limit}`
    ),

  getStockDetail: (symbol: string) =>
    request<StockDetail>(`/api/stocks/${encodeURIComponent(symbol)}`),

  getChart: (symbol: string, period: ChartPeriod = "3m") =>
    request<{ symbol: string; period: string; data: ChartCandle[] }>(
      `/api/stocks/${encodeURIComponent(symbol)}/chart?period=${period}`
    ),

  getNews: (market: Market = "all", limit = 30) =>
    request<{ articles: NewsArticle[] }>(
      `/api/news?market=${market}&limit=${limit}`
    ),

  getStockNews: (symbol: string, limit = 10) =>
    request<{ symbol: string; articles: NewsArticle[] }>(
      `/api/news/stock/${encodeURIComponent(symbol)}?limit=${limit}`
    ),

  getMarketOverview: () =>
    request<{ indices: Record<string, MarketIndex> }>("/api/market-overview"),
};
