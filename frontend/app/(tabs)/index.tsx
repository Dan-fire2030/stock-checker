import { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from "react-native";
import { useMarketStore } from "../../store/marketStore";
import { StockCard } from "../../components/StockCard";
import { MarketOverview } from "../../components/MarketOverview";

type MarketFilter = "all" | "jp" | "us";

export default function DashboardScreen() {
  const { topPicks, indices, isLoading, fetchTopPicks, fetchIndices } = useMarketStore();
  const [filter, setFilter] = useState<MarketFilter>("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTopPicks();
    fetchIndices();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchTopPicks(filter), fetchIndices()]);
    setRefreshing(false);
  };

  const filtered = filter === "all" ? topPicks : topPicks.filter((s) => s.market === filter);

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.symbol}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />}
        ListHeaderComponent={
          <>
            <MarketOverview indices={indices} />
            <View style={styles.filterRow}>
              {(["all", "jp", "us"] as MarketFilter[]).map((f) => (
                <Text
                  key={f}
                  style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                  onPress={() => setFilter(f)}
                >
                  {f === "all" ? "全て" : f === "jp" ? "日本株" : "米国株"}
                </Text>
              ))}
            </View>
            <Text style={styles.sectionTitle}>トップピック</Text>
          </>
        }
        renderItem={({ item }) => <StockCard stock={item} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color="#38BDF8" style={{ marginTop: 40 }} />
          ) : (
            <Text style={styles.empty}>データがありません</Text>
          )
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterBtn: {
    color: "#94A3B8",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#334155",
    fontSize: 13,
  },
  filterBtnActive: {
    color: "#38BDF8",
    borderColor: "#38BDF8",
    backgroundColor: "#38BDF820",
  },
  sectionTitle: { color: "#94A3B8", fontSize: 13, paddingHorizontal: 16, marginBottom: 4 },
  empty: { color: "#64748B", textAlign: "center", marginTop: 40 },
});
