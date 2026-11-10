import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

export const C = {
  bg: "#FFFFFF",
  ink: "#111111",
  muted: "#8E8E93",
  faint: "#C7C7CC",
  line: "#EDEDF0",
  card: "#F6F6F8",
  accent: "#0EA5FF",
  red: "#FF3B30",
  green: "#16A34A",
  night: "#0B0B0C",
  nightCard: "#1C1C1E",
  nightLine: "#2C2C2E",
};

export const PAGE = 20;

export function Section({
  title,
  videos,
  note,
  children,
  dark,
  style,
}: {
  title: string;
  /** Which Family videos the demo recreates. */
  videos: string;
  note?: string;
  children: ReactNode;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.videos}>{videos}</Text>
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <View style={[styles.card, dark && styles.darkCard, style]}>{children}</View>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  dark,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  dark?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        dark && styles.chipDark,
        active && (dark ? styles.chipActiveDark : styles.chipActive),
        pressed && { transform: [{ scale: 0.97 }] },
      ]}
    >
      <Text style={[styles.chipText, dark && { color: "#aaa" }, active && { color: dark ? C.ink : "#fff" }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function PillButton({
  children,
  onPress,
  tone = "dark",
  style,
  disabled,
}: {
  children: ReactNode;
  onPress: () => void;
  tone?: "dark" | "light" | "accent" | "grey";
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const bg =
    tone === "dark" ? C.ink : tone === "light" ? "#FFFFFF" : tone === "accent" ? C.accent : "#EFEFF2";
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: bg, opacity: disabled ? 0.45 : 1 },
        pressed && { transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 36 },
  heading: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 },
  title: { fontSize: 20, fontWeight: "700", color: C.ink, letterSpacing: -0.3 },
  videos: { fontSize: 12, color: C.muted, fontWeight: "500" },
  note: { fontSize: 13, color: C.muted, marginBottom: 12, lineHeight: 18 },
  card: { backgroundColor: C.card, borderRadius: 28, padding: 16, marginTop: 8 },
  darkCard: { backgroundColor: C.night },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  chipDark: { backgroundColor: C.nightCard },
  chipActive: { backgroundColor: C.ink },
  chipActiveDark: { backgroundColor: "#FFFFFF" },
  chipText: { fontSize: 13, fontWeight: "600", color: C.ink },
  pill: {
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
  },
});
