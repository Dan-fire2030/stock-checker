import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useWatchlistStore } from "../../store/watchlistStore";
import { api, StockDetail } from "../../services/api";

export default function WatchlistScreen() {
  const router = useRouter();
  const { symbols, remove, isLoaded } = useWatchlistStore();
  const [stocks, setStocks] = useState<StockDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded || symbols.length === 0) {
      setStocks([]);
      return;
    }
    setIsLoading(true);
    Promise.allSettled(symbols.map((s) => api.getStockDetail(s))).then((results) => {
      const loaded = results
        .filter((r): r is PromiseFulfilledResult<StockDetail> => r.status === "fulfilled")
        .map((r) => r.value);
      setStocks(loaded);
      setIsLoading(false);
    });
  }, [symbols, isLoaded]);

  if (!isLoaded || isLoading) {
    return <ActivityIndicator color="#38BDF8" style={{ marginTop: 60 }} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={stocks}
        keyExtractor={(item) => item.symbol}
        renderItem={({ item }) => {
          const isPositive = (item.change_pct ?? 0) >= 0;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/stock/${item.symbol}`)}
            >
              <View style={styles.left}>
                <Text style={styles.symbol}>{item.symbol}</Text>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.price}>
                  {item.price != null ? item.price.toLocaleString() : "—"}
                </Text>
                <Text style={[styles.change, { color: isPositive ? "#22C55E" : "#EF4444" }]}>
                  {isPositive ? "+" : ""}{(item.change_pct ?? 0).toFixed(2)}%
                </Text>
              </View>
              <TouchableOpacity onPress={() => remove(item.symbol)} style={styles.removeBtn}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>⭐</Text>
            <Text style={styles.emptyText}>ウォッチリストは空です</Text>
            <Text style={styles.emptyHint}>銘柄詳細画面からお気に入りに追加できます</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1E293B", borderRadius: 12,
    padding: 14, marginHorizontal: 16, marginVertical: 4,
  },
  left: { flex: 1 },
  symbol: { color: "#F1F5F9", fontSize: 15, fontWeight: "700" },
  name: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
  right: { alignItems: "flex-end", marginRight: 12 },
  price: { color: "#F1F5F9", fontSize: 15, fontWeight: "600" },
  change: { fontSize: 12, marginTop: 2 },
  removeBtn: { padding: 4 },
  removeText: { color: "#EF4444", fontSize: 16 },
  emptyContainer: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#94A3B8", fontSize: 16, marginBottom: 8 },
  emptyHint: { color: "#475569", fontSize: 13 },
});
