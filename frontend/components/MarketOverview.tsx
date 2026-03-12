import { View, Text, ScrollView, StyleSheet } from "react-native";
import { MarketIndex } from "../services/api";

const INDEX_LABELS: Record<string, string> = {
  sp500: "S&P500",
  nikkei: "日経225",
  topix: "TOPIX",
  nasdaq: "NASDAQ",
  dow: "DOW",
};

interface Props {
  indices: Record<string, MarketIndex>;
}

export function MarketOverview({ indices }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {Object.entries(indices).map(([key, idx]) => {
        const isPositive = (idx.change_pct ?? 0) >= 0;
        return (
          <View key={key} style={styles.card}>
            <Text style={styles.label}>{INDEX_LABELS[key] ?? key}</Text>
            <Text style={styles.price}>
              {idx.price != null ? idx.price.toLocaleString() : "—"}
            </Text>
            <Text style={[styles.change, { color: isPositive ? "#22C55E" : "#EF4444" }]}>
              {isPositive ? "+" : ""}
              {idx.change_pct != null ? idx.change_pct.toFixed(2) : "0.00"}%
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 12, paddingLeft: 16 },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    minWidth: 100,
    alignItems: "center",
  },
  label: { color: "#94A3B8", fontSize: 11, marginBottom: 4 },
  price: { color: "#F1F5F9", fontSize: 14, fontWeight: "700" },
  change: { fontSize: 12, marginTop: 2 },
});
