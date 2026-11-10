import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MorphBox, MorphTray, TextMorph } from "torph-reactnative";
import { LockIcon, PlusCloseIcon, ProgressCheck, type ProgressState } from "torph-reactnative/icons";
import { C, PillButton, Section } from "../ui";

type Step = "options" | "key" | "phrase" | "remove";

function TrayHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View style={styles.header}>
      <TextMorph style={styles.trayTitle}>{title}</TextMorph>
      <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
        <PlusCloseIcon open size={16} color="#8E8E93" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

function Row({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.option, danger && styles.danger, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <Text style={[styles.optionLabel, danger && { color: C.red }]}>{label}</Text>
    </Pressable>
  );
}

function Reveal({ title, body, onBack }: { title: string; body: string; onBack: () => void }) {
  return (
    <View>
      <TrayHeader title={title} onClose={onBack} />
      <Text style={styles.trayBody}>{body}</Text>
      {["Keep it safe", "Don't share it with anyone else", "If you lose it, we can't recover it"].map((line) => (
        <Text key={line} style={styles.bullet}>
          • {line}
        </Text>
      ))}
      <View style={styles.buttons}>
        <PillButton tone="grey" style={{ flex: 1 }} onPress={onBack}>
          <Text style={styles.darkLabel}>Cancel</Text>
        </PillButton>
        <PillButton tone="accent" style={{ flex: 1 }} onPress={onBack}>
          <Text style={styles.lightLabel}>Reveal</Text>
        </PillButton>
      </View>
    </View>
  );
}

/** Videos 01 · 05 · 26 · 49: one tray becoming the next — height springs, content crossfades. */
export function TrayDemo() {
  const [step, setStep] = useState<Step>("options");
  const back = () => setStep("options");
  return (
    <Section title="Morphing tray" videos="01 · 05 · 26 · 49" note="Pick an option: the same tray reshapes to its next step, and × brings it back.">
      <MorphTray step={step} style={styles.tray} contentStyle={{ padding: 20 }}>
        {step === "options" ? (
          <View>
            <TrayHeader title="Options" onClose={() => {}} />
            <View style={{ gap: 8, marginTop: 6 }}>
              <Row label="View Private Key" onPress={() => setStep("key")} />
              <Row label="View Recovery Phrase" onPress={() => setStep("phrase")} />
              <Row label="Remove Wallet" danger onPress={() => setStep("remove")} />
            </View>
          </View>
        ) : step === "key" ? (
          <Reveal
            title="Private Key"
            body="Your Private Key is the key used to back up your wallet. Keep it secret and secure at all times."
            onBack={back}
          />
        ) : step === "phrase" ? (
          <Reveal
            title="Secret Recovery Phrase"
            body="Your Secret Recovery Phrase is the key used to back up your wallet. Keep it secret and secure at all times."
            onBack={back}
          />
        ) : (
          <View>
            <TrayHeader title="Are you sure?" onClose={back} />
            <Text style={styles.trayBody}>This wallet will be removed from this device.</Text>
            <PillButton tone="dark" onPress={back} style={{ marginTop: 18, backgroundColor: C.red }}>
              <Text style={styles.lightLabel}>Remove Wallet</Text>
            </PillButton>
          </View>
        )}
      </MorphTray>
    </Section>
  );
}

/** Videos 11 · 28 · 29: the Continue button grows into the approval tray and shrinks back on Cancel. */
export function ButtonToTrayDemo({ width }: { width: number }) {
  const [open, setOpen] = useState(false);
  const [approval, setApproval] = useState<ProgressState>("loading");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const expand = () => {
    setApproval("loading");
    setOpen(true);
    timer.current = setTimeout(() => setApproval("success"), 1500);
  };
  const approved = approval === "success";

  return (
    <Section title="Button → tray" videos="11 · 28 · 29" note="Tap Continue. The button becomes the tray; Cancel folds it back into the button." dark>
      <View style={styles.stage}>
        <Text style={styles.swapAmount}>1</Text>
        <Text style={styles.swapSub}>≈ $114.06</Text>
        <MorphBox
          expanded={open}
          collapsedWidth={width - 32}
          collapsedHeight={52}
          collapsedColor="#FFFFFF"
          expandedColor={C.nightCard}
          expandedRadius={30}
          style={styles.boxSlot}
          collapsed={
            <Pressable onPress={expand} style={styles.fill}>
              <Text style={styles.darkLabel}>Continue</Text>
            </Pressable>
          }
        >
          <View style={{ padding: 20, alignItems: "center" }}>
            <LockIcon locked={!approved} size={36} color="#fff" />
            <Text style={styles.allow}>Allow Access</Text>
            <Text style={styles.allowBody}>To continue your swap, allow access to the AAVE amount below.</Text>
            <View style={styles.request}>
              <ProgressCheck state={approval} size={16} color={C.accent} badge trackColor="rgba(14,165,255,0.25)" />
              <TextMorph style={styles.requestLabel}>{approved ? "Approved" : "Approval Request"}</TextMorph>
            </View>
            <View style={[styles.buttons, { alignSelf: "stretch" }]}>
              <PillButton tone="dark" style={{ flex: 1, backgroundColor: "#2C2C2E" }} onPress={() => setOpen(false)}>
                <Text style={styles.lightLabel}>Cancel</Text>
              </PillButton>
              <PillButton tone="light" style={{ flex: 1 }} disabled={!approved} onPress={() => setOpen(false)}>
                <TextMorph style={styles.darkLabel}>{approved ? "Confirm" : "Waiting…"}</TextMorph>
              </PillButton>
            </View>
          </View>
        </MorphBox>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  tray: {
    backgroundColor: "#fff",
    borderRadius: 30,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  trayTitle: { fontSize: 18, fontWeight: "700", color: C.ink },
  close: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F2F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  option: { backgroundColor: "#F4F4F6", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16 },
  danger: { backgroundColor: "#FFECEC" },
  optionLabel: { fontSize: 15, fontWeight: "600", color: C.ink },
  trayBody: { fontSize: 15, color: C.muted, lineHeight: 21, marginBottom: 12 },
  bullet: { fontSize: 13, color: "#6B6B70", marginTop: 6 },
  buttons: { flexDirection: "row", gap: 10, marginTop: 18 },
  darkLabel: { fontSize: 16, fontWeight: "600", color: C.ink },
  lightLabel: { fontSize: 16, fontWeight: "600", color: "#fff" },
  stage: { height: 430, justifyContent: "flex-end" },
  swapAmount: { position: "absolute", top: 40, alignSelf: "center", fontSize: 64, fontWeight: "700", color: "#fff" },
  swapSub: { position: "absolute", top: 124, alignSelf: "center", fontSize: 15, color: "#8E8E93" },
  boxSlot: { alignSelf: "stretch" },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  allow: { fontSize: 20, fontWeight: "700", color: "#fff", marginTop: 10 },
  allowBody: { fontSize: 14, color: "#9A9AA0", textAlign: "center", marginTop: 6, lineHeight: 19 },
  request: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    backgroundColor: "rgba(14,165,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  requestLabel: { fontSize: 13, fontWeight: "600", color: C.accent },
});
