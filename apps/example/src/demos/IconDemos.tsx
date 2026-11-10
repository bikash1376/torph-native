import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { IconSwap, TextMorph, type IconSwapVariant } from "torph-reactnative";
import {
  CheckCircle,
  ChevronIcon,
  CopyIcon,
  HeartIcon,
  IconMorph,
  LockIcon,
  PlusCloseIcon,
  ProgressCheck,
  SendIcon,
  StarIcon,
  TrashIcon,
  circlePath,
  rectPath,
  type ProgressState,
} from "torph-reactnative/icons";
import { C, Chip, Section } from "../ui";

function Cell({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cell, pressed && { transform: [{ scale: 0.96 }] }]}>
      <View style={styles.cellIcon}>{children}</View>
      <TextMorph style={styles.cellLabel} containerStyle={{ alignSelf: "center" }}>
        {label}
      </TextMorph>
    </Pressable>
  );
}

/** Videos 11 · 34 · 35 · 42 · 43: the animated icons Family uses — tap each one. */
export function AnimatedIconsDemo() {
  const [locked, setLocked] = useState(true);
  const [progress, setProgress] = useState<ProgressState>("idle");
  const [checked, setChecked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(false);
  const [star, setStar] = useState(false);
  const [heart, setHeart] = useState(true);
  const [trash, setTrash] = useState(false);
  const [sent, setSent] = useState(0);
  const [copied, setCopied] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  return (
    <Section title="Animated icons" videos="11 · 34 · 35 · 42 · 43" note="Built from scratch with react-native-svg + Reanimated. Tap any icon.">
      <View style={styles.grid}>
        <Cell label={locked ? "Locked" : "Unlocked"} onPress={() => setLocked((v) => !v)}>
          <LockIcon locked={locked} size={30} />
        </Cell>
        <Cell
          label={progress === "loading" ? "Pending" : progress === "success" ? "Approved" : "Request"}
          onPress={() => {
            setProgress("loading");
            later(() => setProgress("success"), 1500);
            later(() => setProgress("idle"), 3600);
          }}
        >
          <ProgressCheck state={progress} size={30} badge />
        </Cell>
        <Cell label={checked ? "Selected" : "Select"} onPress={() => setChecked((v) => !v)}>
          <CheckCircle checked={checked} size={28} />
        </Cell>
        <Cell label={expanded ? "Hide" : "See All"} onPress={() => setExpanded((v) => !v)}>
          <ChevronIcon direction={expanded ? "up" : "down"} size={30} />
        </Cell>
        <Cell label={open ? "Close" : "Add"} onPress={() => setOpen((v) => !v)}>
          <PlusCloseIcon open={open} size={30} />
        </Cell>
        <Cell label={star ? "Starred" : "Star"} onPress={() => setStar((v) => !v)}>
          <StarIcon filled={star} size={30} />
        </Cell>
        <Cell label={heart ? "BFF" : "Friend"} onPress={() => setHeart((v) => !v)}>
          <HeartIcon filled={heart} size={30} />
        </Cell>
        <Cell
          label={trash ? "Trashing" : "Trash"}
          onPress={() => {
            setTrash(true);
            later(() => setTrash(false), 900);
          }}
        >
          <TrashIcon open={trash} size={30} />
        </Cell>
        <Cell label="Send" onPress={() => setSent((n) => n + 1)}>
          <SendIcon sendKey={sent} size={28} />
        </Cell>
        <Cell
          label={copied ? "Copied" : "Copy Address"}
          onPress={() => {
            setCopied(true);
            later(() => setCopied(false), 1400);
          }}
        >
          <CopyIcon copied={copied} size={28} />
        </Cell>
      </View>
    </Section>
  );
}

// Icons as plain path data on a 24 grid — any icon set's paths work the same way.
const SHAPES = {
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  close: ["M6 6l12 12", "M18 6L6 18"],
  check: ["M5 12.5l4.5 4.5L19 7"],
  arrow: ["M5 12h14", "M13 6l6 6-6 6"],
  plus: ["M12 5v14", "M5 12h14"],
  play: ["M8 5.5v13l10.5-6.5z"],
  pause: [rectPath(6.5, 5, 4, 14, 1.2), rectPath(13.5, 5, 4, 14, 1.2)],
  circle: [circlePath(12, 12, 8)],
  lock: [rectPath(5, 11, 14, 10, 2.5), "M8 11V7a4 4 0 0 1 8 0v4"],
  heart: [
    "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z",
  ],
} as const;
type ShapeName = keyof typeof SHAPES;
const ORDER = Object.keys(SHAPES) as ShapeName[];

/** Any icon into any icon: path morphing written from scratch, no flubber. */
export function IconMorphDemo() {
  const [shape, setShape] = useState<ShapeName>("menu");
  return (
    <Section title="Icon morph" videos="any → any" note="Pick any two: each stroke is resampled, paired with its nearest stroke, and blended on the UI thread.">
      <Pressable
        onPress={() => setShape((s) => ORDER[(ORDER.indexOf(s) + 1) % ORDER.length]!)}
        style={styles.morphStage}
      >
        <IconMorph d={SHAPES[shape]} size={88} strokeWidth={1.8} />
      </Pressable>
      <View style={styles.chips}>
        {ORDER.map((name) => (
          <Chip key={name} label={name} active={shape === name} onPress={() => setShape(name)} />
        ))}
      </View>
    </Section>
  );
}

const EMOJI = ["😀", "😳", "🎉", "👀", "🔥", "👨‍👩‍👧", "🇮🇳", "👍🏽"];
const VARIANTS: IconSwapVariant[] = ["scale", "slide-up", "slide-down", "rotate"];

/** Emoji and glyph swaps — the replace transition, including multi-code-point emoji. */
export function EmojiDemo() {
  const [i, setI] = useState(0);
  const [variant, setVariant] = useState<IconSwapVariant>("scale");
  const [mood, setMood] = useState(0);
  const moods = ["Still not enough ETH 😳", "Feedback Shared 🎉", "gm ☀️", "gn 🌙"];
  return (
    <Section title="Emoji & icon swap" videos="40 · 04" note="Tap the emoji. Family-, flag- and skin-tone emoji stay whole, in swaps and inside morphing text.">
      <Pressable onPress={() => setI((n) => (n + 1) % EMOJI.length)} style={styles.emojiStage}>
        <IconSwap swapKey={i} variant={variant}>
          <Text style={styles.emoji}>{EMOJI[i]}</Text>
        </IconSwap>
      </Pressable>
      <View style={styles.chips}>
        {VARIANTS.map((v) => (
          <Chip key={v} label={v} active={variant === v} onPress={() => setVariant(v)} />
        ))}
      </View>
      <Pressable onPress={() => setMood((m) => (m + 1) % moods.length)} style={{ marginTop: 18 }}>
        <TextMorph style={[styles.moodText, { textAlign: "center" }]} wrap containerStyle={{ alignSelf: "center" }}>
          {moods[mood]!}
        </TextMorph>
        <Text style={[styles.hint, { textAlign: "center" }]}>tap the line</Text>
      </Pressable>
    </Section>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  cell: {
    width: "31.5%",
    height: 92,
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cellIcon: { height: 32, alignItems: "center", justifyContent: "center" },
  cellLabel: { fontSize: 12, fontWeight: "600", color: C.muted, textAlign: "center" },
  morphStage: {
    height: 150,
    backgroundColor: "#fff",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  emojiStage: {
    height: 120,
    backgroundColor: "#fff",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 56 },
  moodText: { fontSize: 18, fontWeight: "600", color: C.ink },
  hint: { fontSize: 11, color: C.faint, marginTop: 4 },
});
