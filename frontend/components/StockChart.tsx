import { useMemo } from "react";
import { View, Text, StyleSheet, useWindowDimensions } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  Line,
  Text as SvgText,
} from "react-native-svg";
import { ChartCandle } from "../services/api";

interface Props {
  data: ChartCandle[];
  height?: number;
}

const PADDING = { top: 12, right: 16, bottom: 32, left: 56 };

export function StockChart({ data, height = 200 }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const width = windowWidth - 32; // marginHorizontal: 16 * 2

  const { points, fillPath, strokePath, minVal, maxVal, dateLabels, isPositive } =
    useMemo(() => {
      if (data.length < 2) return null;

      const closes = data.map((d) => d.close);
      const min = Math.min(...closes);
      const max = Math.max(...closes);
      const range = max - min || 1;

      const chartW = width - PADDING.left - PADDING.right;
      const chartH = height - PADDING.top - PADDING.bottom;

      const toX = (i: number) => PADDING.left + (i / (data.length - 1)) * chartW;
      const toY = (v: number) => PADDING.top + chartH - ((v - min) / range) * chartH;

      const pts = data.map((d, i) => ({ x: toX(i), y: toY(d.close) }));

      // SVGパス生成
      const stroke = pts
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(" ");

      const bottomY = PADDING.top + chartH;
      const fill =
        stroke +
        ` L${pts[pts.length - 1].x.toFixed(1)},${bottomY} L${PADDING.left},${bottomY} Z`;

      // 日付ラベル（最初・中間・最後）
      const labelIndices = [0, Math.floor(data.length / 2), data.length - 1];
      const labels = labelIndices.map((i) => ({
        x: toX(i),
        text: formatDate(data[i].date),
      }));

      const positive = closes[closes.length - 1] >= closes[0];

      return {
        points: pts,
        fillPath: fill,
        strokePath: stroke,
        minVal: min,
        maxVal: max,
        dateLabels: labels,
        isPositive: positive,
      };
    }, [data, width, height]) ?? {};

  if (!points || data.length < 2) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>チャートデータなし</Text>
      </View>
    );
  }

  const lineColor = isPositive ? "#22C55E" : "#EF4444";
  const gradId = isPositive ? "gradGreen" : "gradRed";
  const gradStop = isPositive ? "#22C55E" : "#EF4444";

  // Y軸ラベル（最高値・中間・最安値）
  const chartH = height - PADDING.top - PADDING.bottom;
  const yLabels = [
    { y: PADDING.top, value: maxVal },
    { y: PADDING.top + chartH / 2, value: (maxVal + minVal) / 2 },
    { y: PADDING.top + chartH, value: minVal },
  ];

  return (
    <View style={styles.wrapper}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={gradStop} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={gradStop} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* グリッド水平線 */}
        {yLabels.map(({ y }) => (
          <Line
            key={y}
            x1={PADDING.left}
            y1={y}
            x2={width - PADDING.right}
            y2={y}
            stroke="#334155"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        {/* グラデーション塗りつぶし */}
        <Path d={fillPath} fill={`url(#${gradId})`} />

        {/* ラインチャート */}
        <Path d={strokePath} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Y軸ラベル */}
        {yLabels.map(({ y, value }) => (
          <SvgText
            key={y}
            x={PADDING.left - 4}
            y={y + 4}
            textAnchor="end"
            fill="#64748B"
            fontSize={10}
          >
            {formatValue(value)}
          </SvgText>
        ))}

        {/* X軸日付ラベル */}
        {dateLabels!.map(({ x, text }) => (
          <SvgText
            key={text}
            x={x}
            y={height - 6}
            textAnchor="middle"
            fill="#64748B"
            fontSize={10}
          >
            {text}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

function formatDate(dateStr: string): string {
  // "2024-01-15" → "1/15"
  const parts = dateStr.split("-");
  if (parts.length >= 3) return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
  return dateStr;
}

function formatValue(v: number): string {
  if (v >= 10000) return `${Math.round(v / 100) / 10}k`;
  if (v >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return v.toFixed(v < 10 ? 2 : 1);
}

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginBottom: 8 },
  empty: {
    marginHorizontal: 16,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { color: "#475569" },
});
