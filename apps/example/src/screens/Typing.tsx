import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { TextMorph } from "torph-reactnative";
import { C } from "../ui";

const MAX_DIGITS = 12;

function group(digits: string): string {
  return Number(digits || "0").toLocaleString("en-US");
}

/** Where `digitsBefore` digits have passed in `formatted`: the caret's place once commas are in. */
function caretIn(formatted: string, digitsBefore: number): number {
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (seen === digitsBefore) return i;
    if (/\d/.test(formatted[i]!)) seen++;
  }
  return formatted.length;
}

/**
 * The field holds bare digits; the amount above regroups them with commas on every
 * keystroke. cursorIndex keeps the morph at the caret, and maxWidth="auto" shrinks a
 * long amount to stay on screen.
 */
export function Typing() {
  const [digits, setDigits] = useState("1250");
  const [caret, setCaret] = useState<number>();
  const display = `$${group(digits)}`;

  return (
    <View style={styles.wrap}>
      <TextMorph
        style={styles.amount}
        maxWidth="auto"
        containerStyle={{ alignSelf: "center" }}
        cursorIndex={caret === undefined ? undefined : caretIn(display, caret)}
      >
        {display}
      </TextMorph>
      <TextInput
        value={digits}
        maxLength={MAX_DIGITS}
        keyboardType="number-pad"
        onChangeText={(text) =>
          setDigits(text.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, MAX_DIGITS))
        }
        onSelectionChange={(e) => setCaret(e.nativeEvent.selection.end)}
        style={styles.input}
        placeholder="0"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 28 },
  amount: { fontSize: 64, fontWeight: "700", color: C.ink, letterSpacing: -1.5, fontVariant: ["tabular-nums"] },
  input: {
    backgroundColor: C.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: C.ink,
    textAlign: "center",
  },
});
