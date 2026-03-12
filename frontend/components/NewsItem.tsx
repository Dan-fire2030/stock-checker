import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { NewsArticle } from "../services/api";

interface Props {
  article: NewsArticle;
}

function formatTime(published: number | string): string {
  const ts = typeof published === "number" ? published * 1000 : Date.parse(published);
  if (!ts) return "";
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function NewsItem({ article }: Props) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => article.url && Linking.openURL(article.url)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.source}>{article.source}</Text>
        <Text style={styles.time}>{formatTime(article.published_at)}</Text>
      </View>
      <Text style={styles.headline} numberOfLines={3}>
        {article.headline}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    marginVertical: 4,
    marginHorizontal: 16,
  },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  source: { color: "#38BDF8", fontSize: 11, fontWeight: "600" },
  time: { color: "#64748B", fontSize: 11 },
  headline: { color: "#E2E8F0", fontSize: 14, lineHeight: 20 },
});
