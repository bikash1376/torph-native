import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

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

/** Side margin of every screen. */
export const PAGE = 24;

/** One full-width page of the pager: a title, an optional sentence, and the demo centred below. */
export function Screen({
  title,
  subtitle,
  width,
  children,
}: {
  title: string;
  subtitle?: string;
  width: number;
  children: ReactNode;
}) {
  return (
    <View style={{ width, flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.stage}>{children}</View>
      </ScrollView>
    </View>
  );
}

/** A rounded panel for demos that need a surface behind them. */
export function Card({ children, dark, style }: { children: ReactNode; dark?: boolean; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, dark && styles.darkCard, style]}>{children}</View>;
}

/** Earlier gallery sections (kept in demos/unused) still use this. */
export function Section({
  title,
  note,
  children,
  dark,
  style,
}: {
  title: string;
  videos?: string;
  note?: string;
  children: ReactNode;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={{ marginBottom: 36 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {note ? <Text style={styles.subtitle}>{note}</Text> : null}
      <Card dark={dark} style={style}>
        {children}
      </Card>
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
  screen: { flexGrow: 1, paddingHorizontal: PAGE, paddingTop: 88, paddingBottom: 96 },
  title: { fontSize: 32, fontWeight: "800", color: C.ink, letterSpacing: -0.8 },
  subtitle: { fontSize: 16, color: C.muted, lineHeight: 22, marginTop: 6 },
  stage: { flex: 1, justifyContent: "center", paddingVertical: 24 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: C.ink, letterSpacing: -0.3 },
  card: { backgroundColor: C.card, borderRadius: 28, padding: 16 },
  darkCard: { backgroundColor: C.night },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: C.card,
  },
  chipDark: { backgroundColor: C.nightCard },
  chipActive: { backgroundColor: C.ink },
  chipActiveDark: { backgroundColor: "#FFFFFF" },
  chipText: { fontSize: 13, fontWeight: "600", color: C.ink },
  pill: {
    height: 54,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 22,
  },
});
