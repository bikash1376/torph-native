import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Easing } from "react-native-reanimated";
import { TextMorph, type MorphEase } from "torph-reactnative";
import { C, Chip, Section } from "../ui";

const PHRASES = [
  "Send money",
  "Sending money",
  "Money sent",
  "Swap approved\nWaiting for confirmation",
  "Your Secret Recovery Phrase is the key used to back up your wallet",
  "Speed Up\nTrying to Speed Up",
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

function Toggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return <Chip label={`${label}: ${on ? "on" : "off"}`} active={on} onPress={() => set(!on)} />;
}

/** Every TextMorph option on one card — tap the text to morph, change options under it. */
export function PlaygroundDemo() {
  const [i, setI] = useState(0);
  const [ease, setEase] = useState("default");
  const [duration, setDuration] = useState(400);
  const [align, setAlign] = useState<(typeof ALIGNS)[number]>("left");
  const [scale, setScale] = useState(true);
  const [animateSize, setAnimateSize] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [numbers, setNumbers] = useState(true);
  const [events, setEvents] = useState({ start: 0, complete: 0, cancel: 0 });

  const [value, setValue] = useState(1234.5);
  const [locale, setLocale] = useState("en-US");

  return (
    <Section title="TextMorph playground" videos="all options" note="Tap the phrase (tap fast to interrupt). Every switch below is a TextMorph prop.">
      <Pressable onPress={() => setI((n) => (n + 1) % PHRASES.length)} style={styles.stage}>
        <TextMorph
          style={[styles.phrase, { textAlign: align }]}
          wrap
          containerStyle={{ alignSelf: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center" }}
          ease={EASES[ease]}
          duration={duration}
          scale={scale}
          animateSize={animateSize}
          disabled={disabled}
          onAnimationStart={() => setEvents((e) => ({ ...e, start: e.start + 1 }))}
          onAnimationComplete={() => setEvents((e) => ({ ...e, complete: e.complete + 1 }))}
          onAnimationCancel={() => setEvents((e) => ({ ...e, cancel: e.cancel + 1 }))}
        >
          {PHRASES[i]!}
        </TextMorph>
      </Pressable>
      <TextMorph style={styles.events}>
        {`start ${events.start} · complete ${events.complete} · cancel ${events.cancel}`}
      </TextMorph>

      <Text style={styles.group}>ease</Text>
      <View style={styles.chips}>
        {Object.keys(EASES).map((k) => (
          <Chip key={k} label={k} active={ease === k} onPress={() => setEase(k)} />
        ))}
      </View>
      <Text style={styles.group}>duration (timing only)</Text>
      <View style={styles.chips}>
        {DURATIONS.map((d) => (
          <Chip key={d} label={`${d}ms`} active={duration === d} onPress={() => setDuration(d)} />
        ))}
      </View>
      <Text style={styles.group}>textAlign</Text>
      <View style={styles.chips}>
        {ALIGNS.map((a) => (
          <Chip key={a} label={a} active={align === a} onPress={() => setAlign(a)} />
        ))}
      </View>
      <Text style={styles.group}>switches</Text>
      <View style={styles.chips}>
        <Toggle label="scale" on={scale} set={setScale} />
        <Toggle label="animateSize" on={animateSize} set={setAnimateSize} />
        <Toggle label="disabled" on={disabled} set={setDisabled} />
      </View>

      <View style={styles.divider} />

      <Text style={styles.group}>numbers · locale · decimals</Text>
      <Pressable onPress={() => setValue((v) => Math.round((v + Math.random() * 900 - 300) * 100) / 100)} style={styles.stage}>
        <TextMorph style={styles.number} maxWidth="auto" numbers={numbers} locale={locale} decimals={2}>
          {value}
        </TextMorph>
      </Pressable>
      <View style={styles.chips}>
        <Toggle label="numbers" on={numbers} set={setNumbers} />
        {["en-US", "de-DE", "en-IN", "fr-FR"].map((l) => (
          <Chip key={l} label={l} active={locale === l} onPress={() => setLocale(l)} />
        ))}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  stage: { backgroundColor: "#fff", borderRadius: 20, padding: 18, minHeight: 96, justifyContent: "center" },
  phrase: { fontSize: 24, fontWeight: "700", color: C.ink, letterSpacing: -0.4 },
  events: { fontSize: 11, color: C.muted, marginTop: 8, fontVariant: ["tabular-nums"] },
  group: { fontSize: 12, fontWeight: "600", color: C.muted, marginTop: 14, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  divider: { height: 1, backgroundColor: C.line, marginVertical: 18 },
  number: { fontSize: 40, fontWeight: "700", color: C.ink, fontVariant: ["tabular-nums"] },
});
