import { useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from "react-native";
import { useNews } from "../../hooks/useNews";
import { NewsItem } from "../../components/NewsItem";
import { Market } from "../../services/api";

export default function NewsScreen() {
  const [market, setMarket] = useState<Market>("all");
  const { articles, isLoading, refetch } = useNews(market);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    refetch();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {(["all", "jp", "us"] as Market[]).map((f) => (
          <Text
            key={f}
            style={[styles.filterBtn, market === f && styles.filterBtnActive]}
            onPress={() => setMarket(f)}
          >
            {f === "all" ? "全て" : f === "jp" ? "🇯🇵 日本" : "🇺🇸 米国"}
          </Text>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color="#38BDF8" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NewsItem article={item} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38BDF8" />}
          ListEmptyComponent={<Text style={styles.empty}>ニュースがありません</Text>}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  filterRow: { flexDirection: "row", padding: 16, gap: 8 },
  filterBtn: {
    color: "#94A3B8", paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "#334155", fontSize: 13,
  },
  filterBtnActive: { color: "#38BDF8", borderColor: "#38BDF8", backgroundColor: "#38BDF820" },
  empty: { color: "#64748B", textAlign: "center", marginTop: 40 },
});
