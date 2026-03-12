import { View, Text, StyleSheet } from "react-native";
import { StockScore } from "../services/api";

interface Props {
  score: StockScore;
}

const LABELS: Record<string, string> = {
  rsi: "RSI",
  golden_cross: "ゴールデンクロス",
  volume_trend: "出来高トレンド",
  per: "PER",
  pbr: "PBR",
  roe: "ROE",
};

export function ScoreBar({ score }: Props) {
  const pct = (score.total / score.max) * 100;
  const barColor = pct >= 70 ? "#22C55E" : pct >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <View style={styles.container}>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>総合スコア</Text>
        <Text style={[styles.totalValue, { color: barColor }]}>
          {score.total} / {score.max}
        </Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>

      <View style={styles.breakdown}>
        {Object.entries(score.breakdown).map(([key, item]) => {
          const itemPct = item.max > 0 ? (item.score / item.max) * 100 : 0;
          const color = itemPct >= 70 ? "#22C55E" : itemPct >= 40 ? "#F59E0B" : "#EF4444";
          return (
            <View key={key} style={styles.row}>
              <Text style={styles.rowLabel}>{LABELS[key] ?? key}</Text>
              <View style={styles.rowBarBg}>
                <View style={[styles.rowBarFill, { width: `${itemPct}%`, backgroundColor: color }]} />
              </View>
              <Text style={[styles.rowScore, { color }]}>
                {item.score}/{item.max}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#1E293B", borderRadius: 12, padding: 16, margin: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  totalLabel: { color: "#94A3B8", fontSize: 14 },
  totalValue: { fontSize: 18, fontWeight: "800" },
  barBg: { height: 8, backgroundColor: "#334155", borderRadius: 4, marginBottom: 16 },
  barFill: { height: 8, borderRadius: 4 },
  breakdown: { gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowLabel: { color: "#94A3B8", fontSize: 12, width: 110 },
  rowBarBg: { flex: 1, height: 6, backgroundColor: "#334155", borderRadius: 3 },
  rowBarFill: { height: 6, borderRadius: 3 },
  rowScore: { fontSize: 11, width: 32, textAlign: "right" },
});
