import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { StockPick } from "../services/api";

interface Props {
  stock: StockPick;
}

export function StockCard({ stock }: Props) {
  const router = useRouter();
  const isPositive = stock.change_pct >= 0;
  const scoreColor =
    stock.score >= 70 ? "#22C55E" : stock.score >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/stock/${stock.symbol}`)}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Text style={styles.symbol}>{stock.display_symbol ?? stock.symbol}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {stock.name}
        </Text>
        <Text style={styles.sector}>{stock.sector}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>
          {stock.price != null ? stock.price.toLocaleString() : "—"}
        </Text>
        <Text style={[styles.change, { color: isPositive ? "#22C55E" : "#EF4444" }]}>
          {isPositive ? "+" : ""}
          {stock.change_pct.toFixed(2)}%
        </Text>
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor + "33" }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>
            {stock.score}点
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: { flex: 1, marginRight: 12 },
  symbol: { color: "#F1F5F9", fontSize: 16, fontWeight: "700" },
  name: { color: "#94A3B8", fontSize: 13, marginTop: 2 },
  sector: { color: "#64748B", fontSize: 11, marginTop: 2 },
  right: { alignItems: "flex-end" },
  price: { color: "#F1F5F9", fontSize: 16, fontWeight: "600" },
  change: { fontSize: 13, marginTop: 2 },
  scoreBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  scoreText: { fontSize: 12, fontWeight: "700" },
});
