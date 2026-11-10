// torph-reactnative example: one component per page. Swipe sideways to move between them.
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { StepIndicator } from "torph-reactnative";
import { AnimatedIcons } from "./src/screens/AnimatedIcons";
import { ButtonLabels } from "./src/screens/ButtonLabels";
import { ButtonTray } from "./src/screens/ButtonTray";
import { ChartRanges } from "./src/screens/ChartRanges";
import { IconMorphScreen } from "./src/screens/IconMorphScreen";
import { Reorder } from "./src/screens/Reorder";
import { TextMorphPlayground } from "./src/screens/TextMorphPlayground";
import { Typing } from "./src/screens/Typing";
import { C, PAGE, Screen } from "./src/ui";

type Page = { title: string; subtitle?: string; render: (inner: number) => React.ReactNode };

const PAGES: Page[] = [
  { title: "Button labels", subtitle: "Tap the button to step through its states.", render: () => <ButtonLabels /> },
  { title: "Typing", subtitle: "Commas regroup and digits slide in where you type.", render: () => <Typing /> },
  { title: "Text morph", subtitle: "Tap the text to change it.", render: () => <TextMorphPlayground /> },
  { title: "Animated icons", subtitle: "Tap any icon.", render: () => <AnimatedIcons /> },
  { title: "Icon morph", subtitle: "Any icon turns into any other.", render: () => <IconMorphScreen /> },
  { title: "Button to tray", subtitle: "Tap continue.", render: (inner) => <ButtonTray width={inner} /> },
  { title: "Chart ranges", subtitle: "Pick a range.", render: (inner) => <ChartRanges width={inner} /> },
  { title: "Reorder", subtitle: "Star a row to move it up.", render: () => <Reorder /> },
];

export default function App() {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const inner = width - PAGE * 2;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next !== page) setPage(next);
  };

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        keyboardShouldPersistTaps="handled"
      >
        {PAGES.map((p) => (
          <Screen key={p.title} title={p.title} subtitle={p.subtitle} width={width}>
            {p.render(inner)}
          </Screen>
        ))}
      </ScrollView>
      <View style={styles.dots} pointerEvents="none">
        <StepIndicator count={PAGES.length} index={page} activeColor={C.ink} inactiveColor="#D9D9DE" height={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: C.bg },
  dots: { position: "absolute", bottom: 44, left: 0, right: 0, alignItems: "center" },
});
