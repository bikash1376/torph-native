// Demo screen for torph-native. Tap each row to morph it.
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { TextMorph } from "torph-native";

const LABELS = ["Continue", "Confirm", "Confirming…", "Confirmed"];
const PHRASES = ["Send money", "Sending money", "Money sent", "Send again"];

export default function App() {
  const [label, setLabel] = useState(0);
  const [phrase, setPhrase] = useState(0);
  const [balance, setBalance] = useState(1204.5);
  const [typed, setTyped] = useState("120");
  const [caret, setCaret] = useState<number>();

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <Section title="Button label">
        <Pressable
          style={styles.button}
          onPress={() => setLabel((i) => (i + 1) % LABELS.length)}
        >
          <TextMorph style={styles.buttonText}>{LABELS[label]!}</TextMorph>
        </Pressable>
      </Section>

      <Section title="Phrase (spring)">
        <Pressable onPress={() => setPhrase((i) => (i + 1) % PHRASES.length)}>
          <TextMorph style={styles.body} ease={{ stiffness: 220, damping: 24 }}>
            {PHRASES[phrase]!}
          </TextMorph>
        </Pressable>
      </Section>

      <Section title="Number">
        <Pressable onPress={() => setBalance((b) => b + Math.round(Math.random() * 400 - 150))}>
          <TextMorph style={styles.number} decimals={2}>
            {balance}
          </TextMorph>
        </Pressable>
      </Section>

      <Section title="Typing (cursorIndex)">
        <TextInput
          value={typed}
          keyboardType="number-pad"
          style={styles.input}
          onSelectionChange={(e) => setCaret(e.nativeEvent.selection.end)}
          onChangeText={setTyped}
        />
        <TextMorph style={styles.number} cursorIndex={caret}>
          {`$${typed}`}
        </TextMorph>
      </Section>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.caption}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", padding: 24, gap: 32, backgroundColor: "#fff" },
  section: { gap: 10, alignItems: "flex-start" },
  caption: { fontSize: 13, color: "#8a8a8a" },
  button: {
    backgroundColor: "#111",
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  body: { fontSize: 22, fontWeight: "500", color: "#111" },
  number: { fontSize: 34, fontWeight: "700", color: "#111", fontVariant: ["tabular-nums"] },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 160,
    fontSize: 17,
  },
});
