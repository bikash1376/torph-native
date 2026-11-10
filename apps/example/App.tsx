// torph-native example: a gallery recreating the motion in Benji Taylor's "Family Values"
// with nothing but torph-native components. Each section names the videos it follows.
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { ChartDemo, ReorderDemo } from "./src/demos/DataDemos";
import { AnimatedIconsDemo, EmojiDemo, IconMorphDemo } from "./src/demos/IconDemos";
import { PlaygroundDemo } from "./src/demos/PlaygroundDemo";
import { ButtonToTrayDemo, TrayDemo } from "./src/demos/SurfaceDemos";
import {
  AmountDemo,
  ButtonLabelDemo,
  EmptyStateDemo,
  FlowTitleDemo,
  TypingDemo,
} from "./src/demos/TextDemos";
import { C, PAGE } from "./src/ui";

export default function App() {
  const { width } = useWindowDimensions();
  // Inner width of a section card: page gutters and card padding taken off.
  const inner = width - PAGE * 2;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>torph-native</Text>
        <Text style={styles.heading}>Family values, in React Native</Text>
        <Text style={styles.lede}>
          Text, number, emoji and icon morphs, trays, charts and layout — every demo below is built
          only from the library.
        </Text>

        <Text style={styles.chapter}>Text</Text>
        <ButtonLabelDemo />
        <FlowTitleDemo />
        <AmountDemo />
        <EmptyStateDemo />
        <TypingDemo />
        <PlaygroundDemo />

        <Text style={styles.chapter}>Icons & emoji</Text>
        <AnimatedIconsDemo />
        <IconMorphDemo />
        <EmojiDemo />

        <Text style={styles.chapter}>Surfaces</Text>
        <TrayDemo />
        <ButtonToTrayDemo width={inner} />

        <Text style={styles.chapter}>Data & layout</Text>
        <ChartDemo width={inner} />
        <ReorderDemo />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: PAGE, paddingTop: 72, paddingBottom: 80 },
  kicker: { fontSize: 13, fontWeight: "700", color: C.accent, letterSpacing: 0.4 },
  heading: { fontSize: 32, fontWeight: "800", color: C.ink, letterSpacing: -0.8, marginTop: 6 },
  lede: { fontSize: 15, color: C.muted, lineHeight: 21, marginTop: 8, marginBottom: 12 },
  chapter: {
    fontSize: 13,
    fontWeight: "700",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 14,
  },
});
