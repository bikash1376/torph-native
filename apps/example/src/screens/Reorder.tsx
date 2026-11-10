import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MorphItem, MorphList } from "torph-reactnative";
import { StarIcon } from "torph-reactnative/icons";
import { C, Card } from "../ui";

const TOKENS = [
  { id: "eth", name: "Ethereum", amount: "0.1061 ETH", value: "$352.95", color: "#111" },
  { id: "usdt", name: "Tether", amount: "33.722 USDT", value: "$33.76", color: "#26A17B" },
  { id: "aave", name: "Aave", amount: "1.044 AAVE", value: "$119.29", color: "#B6509E" },
  { id: "op", name: "Optimism", amount: "1.01 OP", value: "$2.92", color: "#FF0420" },
  { id: "matic", name: "Polygon", amount: "14.272 MATIC", value: "$12.68", color: "#8247E5" },
  { id: "wld", name: "Worldcoin", amount: "1 WLD", value: "$6.95", color: "#333" },
];

/** Starred rows move to the top with a bounce that never leaves the card. */
export function Reorder() {
  const [starred, setStarred] = useState<string[]>(["eth"]);
  const ordered = useMemo(() => {
    const top = starred.map((id) => TOKENS.find((t) => t.id === id)!);
    return [...top, ...TOKENS.filter((t) => !starred.includes(t.id))];
  }, [starred]);
  const toggle = (id: string) =>
    setStarred((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <Card>
      <MorphList>
        {ordered.map((t) => (
          <MorphItem key={t.id} bounce style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: t.color }]}>
              <Text style={styles.avatarText}>{t.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{t.name}</Text>
              <Text style={styles.amount}>{t.amount}</Text>
            </View>
            <Text style={styles.value}>{t.value}</Text>
            <Pressable onPress={() => toggle(t.id)} hitSlop={12} style={{ marginLeft: 14 }}>
              <StarIcon filled={starred.includes(t.id)} size={24} color={C.faint} />
            </Pressable>
          </MorphItem>
        ))}
      </MorphList>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 11, backgroundColor: C.card },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  name: { fontSize: 16, fontWeight: "600", color: C.ink },
  amount: { fontSize: 13, color: C.muted, marginTop: 2 },
  value: { fontSize: 16, fontWeight: "600", color: C.ink, fontVariant: ["tabular-nums"] },
});
