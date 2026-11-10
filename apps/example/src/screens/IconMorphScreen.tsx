import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { IconMorph, circlePath, rectPath } from "torph-reactnative/icons";
import { C, Chip } from "../ui";

// Plain SVG path data on a 24 grid. Paths from any icon set work the same way.
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
type Name = keyof typeof SHAPES;
const NAMES = Object.keys(SHAPES) as Name[];

/** Any icon into any other. Tap the icon to step through, or pick one. */
export function IconMorphScreen() {
  const [shape, setShape] = useState<Name>("menu");
  return (
    <View>
      <Pressable
        onPress={() => setShape((s) => NAMES[(NAMES.indexOf(s) + 1) % NAMES.length]!)}
        style={styles.stage}
      >
        <IconMorph d={SHAPES[shape]} size={120} strokeWidth={1.7} />
      </Pressable>
      <View style={styles.chips}>
        {NAMES.map((name) => (
          <Chip key={name} label={name} active={shape === name} onPress={() => setShape(name)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    height: 220,
    backgroundColor: C.card,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 18, justifyContent: "center" },
});
