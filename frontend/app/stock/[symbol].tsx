import { useState } from "react";
import {
  View, Text, ScrollView, ActivityIndicator,
  TouchableOpacity, StyleSheet,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect } from "react";
import { useStockDetail, useChart } from "../../hooks/useStock";
import { useStockNews } from "../../hooks/useNews";
import { useWatchlistStore } from "../../store/watchlistStore";
import { ScoreBar } from "../../components/ScoreBar";
import { StockChart } from "../../components/StockChart";
import { NewsItem } from "../../components/NewsItem";
import { ChartPeriod } from "../../services/api";

const PERIODS: ChartPeriod[] = ["1m", "3m", "1y"];
const PERIOD_LABELS: Record<ChartPeriod, string> = { "1m": "1ヶ月", "3m": "3ヶ月", "1y": "1年" };

export default function StockDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const navigation = useNavigation();
  const [period, setPeriod] = useState<ChartPeriod>("3m");

  const { data, isLoading, error } = useStockDetail(symbol);
  const { data: chartData } = useChart(symbol, period);
  const { articles: newsArticles } = useStockNews(symbol);
  const { has, add, remove } = useWatchlistStore();
  const inWatchlist = has(symbol);

  useEffect(() => {
    if (data?.name) navigation.setOptions({ title: data.name });
  }, [data?.name]);

  if (isLoading) {
    return <ActivityIndicator color="#38BDF8" style={{ marginTop: 80 }} />;
  }
  if (error || !data) {
    return <Text style={styles.error}>データを取得できませんでした</Text>;
  }

  const isPositive = (data.change_pct ?? 0) >= 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.market}>{data.market === "jp" ? "🇯🇵 東証" : "🇺🇸 NYSE/NASDAQ"}</Text>
        </View>
        <TouchableOpacity
          style={[styles.watchBtn, inWatchlist && styles.watchBtnActive]}
          onPress={() => (inWatchlist ? remove(symbol) : add(symbol))}
        >
          <Text style={styles.watchBtnText}>{inWatchlist ? "⭐ 登録済み" : "☆ ウォッチ"}</Text>
        </TouchableOpacity>
      </View>

      {/* 価格 */}
      <View style={styles.priceSection}>
        <Text style={styles.price}>{data.price?.toLocaleString() ?? "—"}</Text>
        <Text style={[styles.change, { color: isPositive ? "#22C55E" : "#EF4444" }]}>
          {isPositive ? "▲" : "▼"} {Math.abs(data.change ?? 0).toFixed(2)}{" "}
          ({isPositive ? "+" : ""}{(data.change_pct ?? 0).toFixed(2)}%)
        </Text>
      </View>

      {/* チャート期間選択 */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {PERIOD_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ラインチャート */}
      <StockChart data={chartData} height={200} />

      {/* スコア */}
      <Text style={styles.sectionTitle}>スコアリング</Text>
      <ScoreBar score={data.score} />

      {/* テクニカル指標 */}
      <Text style={styles.sectionTitle}>テクニカル指標</Text>
      <View style={styles.grid}>
        <Stat label="RSI" value={data.rsi?.toFixed(1)} />
        <Stat label="MA50" value={data.ma50?.toLocaleString()} />
        <Stat label="MA200" value={data.ma200?.toLocaleString()} />
        <Stat label="出来高トレンド" value={data.volume_trend != null ? `${(data.volume_trend * 100).toFixed(1)}%` : null} />
      </View>

      {/* ファンダメンタル */}
      <Text style={styles.sectionTitle}>ファンダメンタル</Text>
      <View style={styles.grid}>
        <Stat label="PER" value={data.pe_ratio?.toFixed(1)} />
        <Stat label="PBR" value={data.pb_ratio?.toFixed(2)} />
        <Stat label="ROE" value={data.roe != null ? `${(data.roe * 100).toFixed(1)}%` : null} />
        <Stat label="配当利回り" value={data.dividend_yield != null ? `${(data.dividend_yield * 100).toFixed(2)}%` : null} />
        <Stat label="時価総額" value={data.market_cap != null ? formatMarketCap(data.market_cap) : null} />
        <Stat label="セクター" value={data.sector || null} />
      </View>

      {/* 値動き情報 */}
      <Text style={styles.sectionTitle}>値動き</Text>
      <View style={styles.grid}>
        <Stat label="始値" value={data.open?.toLocaleString()} />
        <Stat label="高値" value={data.high?.toLocaleString()} />
        <Stat label="安値" value={data.low?.toLocaleString()} />
        <Stat label="前日終値" value={data.prev_close?.toLocaleString()} />
        <Stat label="52週高値" value={data["52_week_high"]?.toLocaleString()} />
        <Stat label="52週安値" value={data["52_week_low"]?.toLocaleString()} />
      </View>

      {/* 関連ニュース */}
      {newsArticles.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>関連ニュース</Text>
          {newsArticles.slice(0, 5).map((article) => (
            <NewsItem key={article.id} article={article} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `${(cap / 1e12).toFixed(1)}兆`;
  if (cap >= 1e8) return `${(cap / 1e8).toFixed(0)}億`;
  return cap.toLocaleString();
}

function Stat({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value ?? "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
    padding: 16,
  },
  symbol: { color: "#F1F5F9", fontSize: 22, fontWeight: "800" },
  market: { color: "#94A3B8", fontSize: 13, marginTop: 2 },
  watchBtn: {
    borderWidth: 1, borderColor: "#94A3B8", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  watchBtnActive: { borderColor: "#F59E0B", backgroundColor: "#F59E0B22" },
  watchBtnText: { color: "#F1F5F9", fontSize: 13 },
  priceSection: { paddingHorizontal: 16, marginBottom: 16 },
  price: { color: "#F1F5F9", fontSize: 32, fontWeight: "800" },
  change: { fontSize: 16, marginTop: 4 },
  periodRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  periodBtn: {
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: "#334155",
  },
  periodBtnActive: { borderColor: "#38BDF8", backgroundColor: "#38BDF820" },
  periodText: { color: "#94A3B8", fontSize: 13 },
  periodTextActive: { color: "#38BDF8" },
  sectionTitle: { color: "#64748B", fontSize: 12, paddingHorizontal: 16, marginTop: 16, marginBottom: 4, textTransform: "uppercase" },
  grid: {
    flexDirection: "row", flexWrap: "wrap",
    backgroundColor: "#1E293B", borderRadius: 12,
    marginHorizontal: 16, padding: 4,
  },
  statItem: { width: "50%", padding: 10 },
  statLabel: { color: "#64748B", fontSize: 11 },
  statValue: { color: "#F1F5F9", fontSize: 14, fontWeight: "600", marginTop: 2 },
  error: { color: "#EF4444", textAlign: "center", marginTop: 60 },
});
