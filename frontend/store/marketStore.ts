import { create } from "zustand";
import { api, StockPick, MarketIndex } from "../services/api";

interface MarketStore {
  topPicks: StockPick[];
  indices: Record<string, MarketIndex>;
  isLoading: boolean;
  lastFetched: number | null;
  fetchTopPicks: (market?: "jp" | "us" | "all") => Promise<void>;
  fetchIndices: () => Promise<void>;
}

const CACHE_TTL = 5 * 60 * 1000; // 5分

export const useMarketStore = create<MarketStore>((set, get) => ({
  topPicks: [],
  indices: {},
  isLoading: false,
  lastFetched: null,

  fetchTopPicks: async (market = "all") => {
    const now = Date.now();
    const last = get().lastFetched;
    if (last && now - last < CACHE_TTL && get().topPicks.length > 0) return;

    set({ isLoading: true });
    try {
      const data = await api.getTopPicks(market);
      set({ topPicks: data.picks, lastFetched: now, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchIndices: async () => {
    try {
      const data = await api.getMarketOverview();
      set({ indices: data.indices });
    } catch {
      // インデックス取得失敗は無視
    }
  },
}));
