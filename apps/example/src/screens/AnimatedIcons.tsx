import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { TextMorph } from "torph-reactnative";
import {
  CheckCircle,
  ChevronIcon,
  CopyIcon,
  HeartIcon,
  LockIcon,
  PlusCloseIcon,
  ProgressCheck,
  SendIcon,
  StarIcon,
  TrashIcon,
  type ProgressState,
} from "torph-reactnative/icons";
import { C } from "../ui";

function Cell({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cell, pressed && { transform: [{ scale: 0.96 }] }]}>
      <View style={styles.icon}>{children}</View>
      <TextMorph style={styles.label} containerStyle={{ alignSelf: "center" }}>
        {label}
      </TextMorph>
    </Pressable>
  );
}

/** Ten state-driven icons. Tap any of them. */
export function AnimatedIcons() {
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
      <Cell label={expanded ? "Hide" : "See all"} onPress={() => setExpanded((v) => !v)}>
        <ChevronIcon direction={expanded ? "up" : "down"} size={30} />
      </Cell>
      <Cell label={open ? "Close" : "Add"} onPress={() => setOpen((v) => !v)}>
        <PlusCloseIcon open={open} size={30} />
      </Cell>
      <Cell label={star ? "Starred" : "Star"} onPress={() => setStar((v) => !v)}>
        <StarIcon filled={star} size={30} />
      </Cell>
      <Cell label={heart ? "Liked" : "Like"} onPress={() => setHeart((v) => !v)}>
        <HeartIcon filled={heart} size={30} />
      </Cell>
      <Cell
        label={trash ? "Deleting" : "Delete"}
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
        label={copied ? "Copied" : "Copy"}
        onPress={() => {
          setCopied(true);
          later(() => setCopied(false), 1400);
        }}
      >
        <CopyIcon copied={copied} size={28} />
      </Cell>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12 },
  cell: {
    width: "48.5%",
    height: 104,
    backgroundColor: C.card,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  icon: { height: 32, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 13, fontWeight: "600", color: C.muted, textAlign: "center" },
});
