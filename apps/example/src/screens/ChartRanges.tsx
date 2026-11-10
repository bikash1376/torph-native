import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { TextMorph } from "torph-reactnative";
import { LineChartMorph } from "torph-reactnative/chart";
import { C, Chip } from "../ui";

// Deterministic pseudo-random series, so each range always draws the same line.
function series(seed: number, count: number, volatility: number, drift: number): number[] {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647 - 0.5;
  };
  const out = [100];
  for (let i = 1; i < count; i++) out.push(out[i - 1]! + rand() * volatility + drift);
  return out;
}

const RANGES = {
  "1H": { data: series(11, 30, 2, -0.06), change: -0.11 },
  "1D": { data: series(7, 40, 3, 0.05), change: 3.08 },
  "1W": { data: series(19, 60, 5, 0.2), change: 4.93 },
  "1M": { data: series(42, 80, 6, 0.1), change: 5.79 },
  "1Y": { data: series(77, 100, 7, 0.6), change: 87.66 },
  All: { data: series(3, 120, 4, 1.2), change: 1360.5 },
} as const;
type Range = keyof typeof RANGES;

/** Switching range redraws the line into the next one and rolls the change. */
export function ChartRanges({ width }: { width: number }) {
  const [range, setRange] = useState<Range>("1D");
  const { data, change } = RANGES[range];
  const up = change >= 0;
  const color = up ? C.green : C.red;

  return (
    <View>
      <Text style={styles.ticker}>Acme Inc.</Text>
      <TextMorph style={[styles.change, { color }]}>
        {`${up ? "↑" : "↓"} ${Math.abs(change).toLocaleString("en-US", { minimumFractionDigits: 2 })}%`}
      </TextMorph>
      <LineChartMorph data={data} width={width} height={200} color={color} style={{ marginTop: 20 }} />
      <View style={styles.ranges}>
        {(Object.keys(RANGES) as Range[]).map((r) => (
          <Chip key={r} label={r} active={range === r} onPress={() => setRange(r)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ticker: { fontSize: 24, fontWeight: "700", color: C.ink },
  change: { fontSize: 20, fontWeight: "700", fontVariant: ["tabular-nums"], marginTop: 4 },
  ranges: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
});
