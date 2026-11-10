import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MorphItem, TextMorph } from "torph-reactnative";
import { LineChartMorph } from "torph-reactnative/chart";
import { StarIcon } from "torph-reactnative/icons";
import { C, Chip, Section } from "../ui";

// Deterministic pseudo-random series, so every range always draws the same line.
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
  "1D": { data: series(7, 40, 3, 0.05), change: 3.08 },
  "1W": { data: series(19, 60, 5, 0.2), change: 4.93 },
  "1M": { data: series(42, 80, 6, 0.1), change: 5.79 },
  "1Y": { data: series(77, 100, 7, 0.6), change: 87.66 },
  ALL: { data: series(3, 120, 4, 1.2), change: 53360.5 },
  "1H": { data: series(11, 30, 2, -0.06), change: -0.11 },
} as const;
type Range = keyof typeof RANGES;

/** Videos 53 · 54: switching range reshapes the line and rolls the percentage. */
export function ChartDemo({ width }: { width: number }) {
  const [range, setRange] = useState<Range>("1D");
  const { data, change } = RANGES[range];
  const up = change >= 0;
  const color = up ? C.green : C.red;
  return (
    <Section title="Chart ranges" videos="53 · 54" note="The line redraws into the next range; the change rolls digit by digit.">
      <Text style={styles.ticker}>Netflix</Text>
      <TextMorph style={[styles.change, { color }]}>
        {`${up ? "↑" : "↓"} ${Math.abs(change).toLocaleString("en-US", { minimumFractionDigits: 2 })}%`}
      </TextMorph>
      <LineChartMorph data={data} width={width - 32} height={150} color={color} style={{ marginTop: 12 }} />
      <View style={styles.ranges}>
        {(Object.keys(RANGES) as Range[]).map((r) => (
          <Chip key={r} label={r} active={range === r} onPress={() => setRange(r)} />
        ))}
      </View>
    </Section>
  );
}

const TOKENS = [
  { id: "eth", name: "Ethereum", amount: "0.1061 ETH", value: "$352.95", color: "#111" },
  { id: "usdt", name: "Tether", amount: "33.722 USDT", value: "$33.76", color: "#26A17B" },
  { id: "aave", name: "Aave", amount: "1.044 AAVE", value: "$119.29", color: "#B6509E" },
  { id: "op", name: "Optimism", amount: "1.01 OP", value: "$2.92", color: "#FF0420" },
  { id: "matic", name: "Polygon", amount: "14.272 MATIC", value: "$12.68", color: "#8247E5" },
  { id: "wld", name: "Worldcoin", amount: "1 WLD", value: "$6.95", color: "#333" },
];

/** Video 43: starring a token lifts it to the top; every row glides to its new place. */
export function ReorderDemo() {
  const [starred, setStarred] = useState<string[]>(["eth"]);
  const ordered = useMemo(() => {
    const top = starred.map((id) => TOKENS.find((t) => t.id === id)!);
    return [...top, ...TOKENS.filter((t) => !starred.includes(t.id))];
  }, [starred]);
  const toggle = (id: string) =>
    setStarred((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <Section
      title="Reorder"
      videos="30 · 31 · 43"
      note="Star a token: it moves up and the others make room. Rows glide without overshooting and stay inside the card."
      style={{ overflow: "hidden" }}
    >
      {ordered.map((t) => (
        <MorphItem key={t.id} style={styles.tokenRow}>
          <View style={[styles.avatar, { backgroundColor: t.color }]}>
            <Text style={styles.avatarText}>{t.name[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tokenName}>{t.name}</Text>
            <Text style={styles.tokenAmount}>{t.amount}</Text>
          </View>
          <Text style={styles.tokenValue}>{t.value}</Text>
          <Pressable onPress={() => toggle(t.id)} hitSlop={10} style={{ marginLeft: 12 }}>
            <StarIcon filled={starred.includes(t.id)} size={22} color={C.faint} />
          </Pressable>
        </MorphItem>
      ))}
    </Section>
  );
}

const styles = StyleSheet.create({
  ticker: { fontSize: 22, fontWeight: "700", color: C.ink },
  change: { fontSize: 18, fontWeight: "700", fontVariant: ["tabular-nums"], marginTop: 2 },
  ranges: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: C.card,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  tokenName: { fontSize: 15, fontWeight: "600", color: C.ink },
  tokenAmount: { fontSize: 12, color: C.muted, marginTop: 2 },
  tokenValue: { fontSize: 15, fontWeight: "600", color: C.ink, fontVariant: ["tabular-nums"] },
});
