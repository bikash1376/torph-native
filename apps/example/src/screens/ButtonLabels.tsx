import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { IconSwap, TextMorph } from "torph-reactnative";
import { ProgressCheck } from "torph-reactnative/icons";
import { PillButton } from "../ui";

const LABELS = ["Continue", "Confirm", "Confirming…", "Confirmed"];

/** A label that morphs through an action's states, with a spinner that resolves to a check. */
export function ButtonLabels() {
  const [state, setState] = useState(0);
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
    <View style={styles.center}>
      <PillButton tone="dark" onPress={press} style={styles.button}>
        <IconSwap swapKey={state >= 2 ? "progress" : "none"}>
          {state >= 2 ? (
            <ProgressCheck
              state={state === 2 ? "loading" : "success"}
              size={20}
              color="#fff"
              trackColor="rgba(255,255,255,0.25)"
            />
          ) : (
            <View style={{ width: 0, height: 20 }} />
          )}
        </IconSwap>
        <TextMorph style={styles.label}>{LABELS[state]!}</TextMorph>
      </PillButton>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center" },
  button: { height: 60, paddingHorizontal: 30 },
  label: { fontSize: 18, fontWeight: "600", color: "#fff" },
});
