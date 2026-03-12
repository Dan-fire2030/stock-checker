import { useState } from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { api, StockSearchResult, Market } from "../../services/api";

type MarketFilter = Market;

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState<MarketFilter>("all");
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setSearched(true);
    try {
      const data = await api.searchStocks(query.trim(), market);
      setResults(data.results);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="銘柄名・コードで検索"
          placeholderTextColor="#64748B"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={doSearch}
          returnKeyType="search"
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={doSearch}>
          <Text style={styles.searchBtnText}>検索</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(["all", "jp", "us"] as MarketFilter[]).map((f) => (
          <Text
            key={f}
            style={[styles.filterBtn, market === f && styles.filterBtnActive]}
            onPress={() => setMarket(f)}
          >
            {f === "all" ? "全て" : f === "jp" ? "日本株" : "米国株"}
          </Text>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color="#38BDF8" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.symbol}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultItem}
              onPress={() => router.push(`/stock/${item.symbol}`)}
            >
              <View style={styles.resultLeft}>
                <Text style={styles.resultSymbol}>{item.display_symbol}</Text>
                <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
              </View>
              <Text style={styles.marketTag}>
                {item.market === "jp" ? "🇯🇵 JP" : "🇺🇸 US"}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            searched ? (
              <Text style={styles.empty}>検索結果がありません</Text>
            ) : (
              <Text style={styles.hint}>銘柄名またはティッカーを入力してください{"\n"}例: Toyota / AAPL / 7203</Text>
            )
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  searchRow: { flexDirection: "row", margin: 16, gap: 8 },
  input: {
    flex: 1, backgroundColor: "#1E293B", color: "#F1F5F9",
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, borderWidth: 1, borderColor: "#334155",
  },
  searchBtn: {
    backgroundColor: "#38BDF8", borderRadius: 10,
    paddingHorizontal: 16, justifyContent: "center",
  },
  searchBtnText: { color: "#0F172A", fontWeight: "700", fontSize: 14 },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterBtn: {
    color: "#94A3B8", paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: "#334155", fontSize: 13,
  },
  filterBtnActive: { color: "#38BDF8", borderColor: "#38BDF8", backgroundColor: "#38BDF820" },
  resultItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#1E293B", marginHorizontal: 16, marginVertical: 4,
    borderRadius: 10, padding: 14,
  },
  resultLeft: { flex: 1, marginRight: 8 },
  resultSymbol: { color: "#F1F5F9", fontSize: 15, fontWeight: "700" },
  resultName: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
  marketTag: { color: "#64748B", fontSize: 12 },
  empty: { color: "#64748B", textAlign: "center", marginTop: 40 },
  hint: { color: "#475569", textAlign: "center", marginTop: 60, lineHeight: 22 },
});
