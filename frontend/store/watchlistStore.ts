import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "watchlist";

interface WatchlistStore {
  symbols: string[];
  isLoaded: boolean;
  load: () => Promise<void>;
  add: (symbol: string) => Promise<void>;
  remove: (symbol: string) => Promise<void>;
  has: (symbol: string) => boolean;
}

export const useWatchlistStore = create<WatchlistStore>((set, get) => ({
  symbols: [],
  isLoaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const symbols: string[] = raw ? JSON.parse(raw) : [];
      set({ symbols, isLoaded: true });
    } catch {
      set({ symbols: [], isLoaded: true });
    }
  },

  add: async (symbol: string) => {
    const current = get().symbols;
    if (current.includes(symbol)) return;
    const next = [...current, symbol];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    set({ symbols: next });
  },

  remove: async (symbol: string) => {
    const next = get().symbols.filter((s) => s !== symbol);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    set({ symbols: next });
  },

  has: (symbol: string) => get().symbols.includes(symbol),
}));
