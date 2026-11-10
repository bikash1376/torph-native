import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Easing } from "react-native-reanimated";
import { TextMorph, type MorphEase } from "torph-reactnative";
import { C, Chip } from "../ui";

const PHRASES = [
  "Send money",
  "Sending money",
  "Money sent",
  "Swap approved\nWaiting for confirmation",
  "Your recovery phrase is the key to your wallet",
  "Hello world",
];

const EASES: Record<string, MorphEase | undefined> = {
  default: undefined,
  "ease-out": Easing.bezier(0.23, 1, 0.32, 1),
  "in-out": Easing.bezier(0.77, 0, 0.175, 1),
  spring: { stiffness: 220, damping: 22 },
  bouncy: { stiffness: 260, damping: 12 },
};
const ALIGNS = ["left", "center", "right"] as const;
const DURATIONS = [200, 400, 800, 1600];

/** Tap the phrase to morph it; every chip below is a TextMorph prop. */
export function TextMorphPlayground() {
  const [i, setI] = useState(0);
  const [ease, setEase] = useState("default");
  const [duration, setDuration] = useState(400);
  const [align, setAlign] = useState<(typeof ALIGNS)[number]>("left");
  const [scale, setScale] = useState(true);
  const [animateSize, setAnimateSize] = useState(true);

  return (
    <View>
      <Pressable onPress={() => setI((n) => (n + 1) % PHRASES.length)} style={styles.stage}>
        <TextMorph
          style={[styles.phrase, { textAlign: align }]}
          wrap
          containerStyle={{ alignSelf: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center" }}
          ease={EASES[ease]}
          duration={duration}
          scale={scale}
          animateSize={animateSize}
        >
          {PHRASES[i]!}
        </TextMorph>
      </Pressable>

      <Text style={styles.group}>Easing</Text>
      <View style={styles.chips}>
        {Object.keys(EASES).map((k) => (
          <Chip key={k} label={k} active={ease === k} onPress={() => setEase(k)} />
        ))}
      </View>
      <Text style={styles.group}>Duration</Text>
      <View style={styles.chips}>
        {DURATIONS.map((d) => (
          <Chip key={d} label={`${d}ms`} active={duration === d} onPress={() => setDuration(d)} />
        ))}
      </View>
      <Text style={styles.group}>Alignment</Text>
      <View style={styles.chips}>
        {ALIGNS.map((a) => (
          <Chip key={a} label={a} active={align === a} onPress={() => setAlign(a)} />
        ))}
      </View>
      <Text style={styles.group}>Options</Text>
      <View style={styles.chips}>
        <Chip label="Shrink on exit" active={scale} onPress={() => setScale((v) => !v)} />
        <Chip label="Animate size" active={animateSize} onPress={() => setAnimateSize((v) => !v)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { backgroundColor: C.card, borderRadius: 24, padding: 20, minHeight: 120, justifyContent: "center" },
  phrase: { fontSize: 26, fontWeight: "700", color: C.ink, letterSpacing: -0.4 },
  group: { fontSize: 13, fontWeight: "600", color: C.muted, marginTop: 18, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
