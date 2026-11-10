import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { IconSwap, StepIndicator, TextMorph } from "torph-native";
import { ProgressCheck } from "torph-native/icons";
import { C, Chip, PillButton, Section } from "../ui";

const STEPS = [
  { title: "Choose Wallet Group", body: "Choose a wallet group to create your new wallet within." },
  { title: "Name Your Wallet", body: "Choose a nickname for your wallet." },
  { title: "Accept Terms", body: "Please read and agree to the following terms before you continue." },
  { title: "Creating Your Wallet", body: "Doing some cryptographic magic…" },
  { title: "Your wallet is ready.", body: "Let's back up your wallet." },
];

/** Videos 03 · 21 · 36: a multi-step flow whose title morphs and whose dashes track the step. */
export function FlowTitleDemo() {
  const [step, setStep] = useState(0);
  return (
    <Section title="Flow titles" videos="03 · 21 · 36" note="The title morphs letter by letter, the step dashes stretch to the current step.">
      <StepIndicator count={STEPS.length} index={step} style={{ alignSelf: "center", marginBottom: 20 }} />
      <TextMorph style={styles.flowTitle} wrap>
        {STEPS[step]!.title}
      </TextMorph>
      <TextMorph style={styles.flowBody} wrap containerStyle={{ marginTop: 6 }}>
        {STEPS[step]!.body}
      </TextMorph>
      <View style={styles.row}>
        <PillButton tone="grey" style={{ flex: 1 }} onPress={() => setStep((s) => Math.max(0, s - 1))}>
          <Text style={styles.greyLabel}>Back</Text>
        </PillButton>
        <PillButton tone="accent" style={{ flex: 1 }} onPress={() => setStep((s) => (s + 1) % STEPS.length)}>
          <Text style={styles.lightLabel}>Continue</Text>
        </PillButton>
      </View>
    </Section>
  );
}

type ButtonState = 0 | 1 | 2 | 3;
const LABELS = ["Continue", "Confirm", "Confirming…", "Confirmed"];

/** Videos 11 · 20 · 34: a button whose label morphs as the action progresses, with a spinner that resolves to a check. */
export function ButtonLabelDemo() {
  const [state, setState] = useState<ButtonState>(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const press = () => {
    if (state === 0) setState(1);
    else if (state === 1) {
      setState(2);
      timer.current = setTimeout(() => setState(3), 1600);
    } else if (state === 3) setState(0);
  };

  return (
    <Section title="Button labels" videos="11 · 20 · 34" note="Tap through: shared letters stay put, the spinner completes into a check.">
      <PillButton tone="dark" onPress={press}>
        <IconSwap swapKey={state >= 2 ? "progress" : "none"} variant="scale">
          {state >= 2 ? (
            <ProgressCheck state={state === 2 ? "loading" : "success"} size={20} color="#fff" trackColor="rgba(255,255,255,0.25)" />
          ) : (
            <View style={{ width: 0, height: 20 }} />
          )}
        </IconSwap>
        <TextMorph style={styles.lightLabel}>{LABELS[state]!}</TextMorph>
      </PillButton>
    </Section>
  );
}

const TABS = {
  Tokens: { title: "There's nothing here, yet", body: "Deposit tokens to your address or buy Ethereum to start using your wallet." },
  Collectibles: { title: "Nothing to see here, for now", body: "When collectibles are sent to your wallet address, they'll appear here." },
} as const;

/** Video 25: switching tabs morphs the empty-state copy instead of swapping it. */
export function EmptyStateDemo() {
  const [tab, setTab] = useState<keyof typeof TABS>("Tokens");
  return (
    <Section title="Empty states" videos="25">
      <View style={[styles.row, { marginTop: 0, marginBottom: 18 }]}>
        {(Object.keys(TABS) as (keyof typeof TABS)[]).map((t) => (
          <Chip key={t} label={t} active={tab === t} onPress={() => setTab(t)} />
        ))}
      </View>
      <TextMorph style={styles.emptyTitle} wrap containerStyle={{ alignSelf: "center" }}>
        {TABS[tab].title}
      </TextMorph>
      <TextMorph style={styles.emptyBody} wrap containerStyle={{ alignSelf: "center", marginTop: 6 }}>
        {TABS[tab].body}
      </TextMorph>
    </Section>
  );
}

function formatAmount(raw: string): string {
  const [int = "0", dec] = raw.split(".");
  const grouped = Number(int || "0").toLocaleString("en-US");
  return dec !== undefined ? `${grouped}.${dec}` : grouped;
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];
const ETH_PRICE = 3319.38;
const BALANCE = 705.358 * ETH_PRICE;

/** Videos 39 · 40: amount entry — digits roll into place, commas arrive, the value shrinks to fit, and the warning morphs. */
export function AmountDemo() {
  const [raw, setRaw] = useState("100");
  const value = Number(raw || "0");
  const eth = (value / ETH_PRICE).toFixed(8).replace(/\.?0+$/, "") || "0";
  const warning =
    value > BALANCE * 100 ? "Still not enough ETH 😳" : value > BALANCE ? "Not enough ETH" : "";

  const press = (key: string) => {
    setRaw((r) => {
      if (key === "⌫") return r.length > 1 ? r.slice(0, -1) : "0";
      if (key === ".") return r.includes(".") ? r : `${r}.`;
      if (r.includes(".") && r.split(".")[1]!.length >= 2) return r;
      if (r.replace(".", "").length >= 13) return r;
      return r === "0" ? key : r + key;
    });
  };

  return (
    <Section title="Amount entry" videos="39 · 40" note="Type a big number: digits roll by place value and the amount scales down to fit." dark>
      <View style={{ alignItems: "center", paddingTop: 12, height: 150 }}>
        <TextMorph style={styles.amount} maxWidth="auto" containerStyle={{ alignSelf: "center" }}>
          {`$${formatAmount(raw)}`}
        </TextMorph>
        <TextMorph style={[styles.eth, warning ? styles.warning : null]} containerStyle={{ marginTop: 6 }}>
          {warning || `Ξ ${eth}`}
        </TextMorph>
      </View>
      <View style={styles.keypad}>
        {KEYS.map((k) => (
          <PillButton key={k} tone="dark" style={styles.key} onPress={() => press(k)}>
            <Text style={styles.keyLabel}>{k}</Text>
          </PillButton>
        ))}
      </View>
    </Section>
  );
}

const MAX_DIGITS = 12;

/** Where `digitsBefore` digits have passed in `formatted` — the caret's place once commas are added. */
function caretInFormatted(formatted: string, digitsBefore: number): number {
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (seen === digitsBefore) return i;
    if (/\d/.test(formatted[i]!)) seen++;
  }
  return formatted.length;
}

/**
 * Typing into a field: the field holds bare digits, the display regroups them with
 * commas on every keystroke, and cursorIndex keeps the morph at the caret — so a
 * typed or deleted digit slides in or out where you edited, and the commas move.
 */
export function TypingDemo() {
  const [digits, setDigits] = useState("1250");
  const [caret, setCaret] = useState<number>();
  const display = `$${formatAmount(digits || "0")}`;
  return (
    <Section
      title="Typing"
      videos="cursorIndex"
      note="Insert or delete digits anywhere (up to 12): commas regroup, the change morphs at your caret, and the amount shrinks to stay inside the card."
    >
      <TextInput
        value={digits}
        maxLength={MAX_DIGITS}
        onChangeText={(text) =>
          setDigits(text.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, MAX_DIGITS))
        }
        onSelectionChange={(e) => setCaret(e.nativeEvent.selection.end)}
        keyboardType="number-pad"
        style={styles.input}
      />
      <TextMorph
        style={styles.typed}
        maxWidth="auto"
        cursorIndex={caret === undefined ? undefined : caretInFormatted(display, caret)}
        containerStyle={{ marginTop: 12 }}
      >
        {display}
      </TextMorph>
    </Section>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, marginTop: 20 },
  flowTitle: { fontSize: 26, fontWeight: "700", color: C.ink, letterSpacing: -0.5 },
  flowBody: { fontSize: 15, color: C.muted, lineHeight: 21 },
  greyLabel: { fontSize: 16, fontWeight: "600", color: C.ink },
  lightLabel: { fontSize: 16, fontWeight: "600", color: "#fff" },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: C.ink, textAlign: "center" },
  emptyBody: { fontSize: 13, color: C.muted, textAlign: "center", lineHeight: 18 },
  amount: { fontSize: 60, fontWeight: "700", color: "#fff", letterSpacing: -1.5, fontVariant: ["tabular-nums"] },
  eth: { fontSize: 15, color: "#9A9AA0", fontVariant: ["tabular-nums"] },
  warning: { fontSize: 15, color: C.red, fontWeight: "600" },
  keypad: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 6 },
  key: { width: "31%", height: 50, backgroundColor: "transparent" },
  keyLabel: { fontSize: 24, fontWeight: "500", color: "#fff" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    color: C.ink,
  },
  typed: { fontSize: 36, fontWeight: "700", color: C.ink, fontVariant: ["tabular-nums"] },
});
