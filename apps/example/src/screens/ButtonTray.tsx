import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MorphBox, TextMorph } from "torph-reactnative";
import { LockIcon, ProgressCheck, type ProgressState } from "torph-reactnative/icons";
import { C, PillButton } from "../ui";

/** The button grows into the tray it opens; Cancel folds it back into the button. */
export function ButtonTray({ width }: { width: number }) {
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
  // The stage has 12px of padding on each side.
  const inner = width - 24;

  return (
    <View style={styles.stage}>
      <View style={styles.summary}>
        <Text style={styles.amount}>1 AAVE</Text>
        <Text style={styles.sub}>≈ $114.06</Text>
      </View>
      <MorphBox
        expanded={open}
        collapsedWidth={inner}
        collapsedHeight={54}
        collapsedColor="#FFFFFF"
        expandedColor={C.nightCard}
        expandedRadius={30}
        style={{ alignSelf: "stretch" }}
        collapsed={
          <Pressable onPress={expand} style={styles.fill}>
            <Text style={styles.darkLabel}>Continue</Text>
          </Pressable>
        }
      >
        <View style={styles.tray}>
          <LockIcon locked={!approved} size={38} color="#fff" />
          <Text style={styles.title}>Allow access</Text>
          <Text style={styles.body}>To continue your swap, allow access to the amount below.</Text>
          <View style={styles.request}>
            <ProgressCheck state={approval} size={16} color={C.accent} badge trackColor="rgba(14,165,255,0.25)" />
            <TextMorph style={styles.requestLabel}>{approved ? "Approved" : "Approval request"}</TextMorph>
          </View>
          <View style={styles.buttons}>
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
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 470,
    backgroundColor: C.night,
    borderRadius: 32,
    padding: 12,
    justifyContent: "flex-end",
  },
  summary: { position: "absolute", top: 56, left: 0, right: 0, alignItems: "center" },
  amount: { fontSize: 48, fontWeight: "700", color: "#fff", letterSpacing: -1 },
  sub: { fontSize: 15, color: "#8E8E93", marginTop: 4 },
  fill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  tray: { padding: 20, alignItems: "center" },
  title: { fontSize: 21, fontWeight: "700", color: "#fff", marginTop: 12 },
  body: { fontSize: 14, color: "#9A9AA0", textAlign: "center", marginTop: 6, lineHeight: 19 },
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
  buttons: { flexDirection: "row", gap: 10, marginTop: 20, alignSelf: "stretch" },
  darkLabel: { fontSize: 16, fontWeight: "600", color: C.ink },
  lightLabel: { fontSize: 16, fontWeight: "600", color: "#fff" },
});
