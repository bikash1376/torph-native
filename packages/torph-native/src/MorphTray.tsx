import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type WithSpringConfig,
} from "react-native-reanimated";

export interface MorphTrayProps {
  /** Which content the tray holds. Changing it crossfades to the new content. */
  step: string | number;
  children: ReactNode;
  /** The tray surface: background, radius, shadow, margins. Don't set a height. */
  style?: StyleProp<ViewStyle>;
  /** Padding and layout for each step's content. */
  contentStyle?: StyleProp<ViewStyle>;
  /** Spring for the height. Default: a firm, barely-bouncy iOS sheet spring. */
  spring?: WithSpringConfig;
}

export const TRAY_SPRING: WithSpringConfig = { damping: 26, stiffness: 280, mass: 1 };

type Layer = { key: string | number; node: ReactNode };

/**
 * A surface whose height follows its content. Change `step` and the tray springs to
 * the new content's height while the old content fades out over the new — one tray
 * becoming the next, not a sheet stacked on a sheet.
 */
export function MorphTray({
  step,
  children,
  style,
  contentStyle,
  spring = TRAY_SPRING,
}: MorphTrayProps) {
  const [layers, setLayers] = useState<Layer[]>([{ key: step, node: children }]);
  const live = useRef(step);
  live.current = step;
  const height = useSharedValue(0);
  const measured = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    setLayers((prev) => {
      if (prev[0]!.key === step) return prev;
      const rest = prev.filter((l) => l.key !== step).slice(0, 1);
      return [{ key: step, node: children }, ...rest];
    });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLayers((prev) => prev.slice(0, 1)), 320);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onLayout = (key: string | number) => (event: LayoutChangeEvent) => {
    if (key !== live.current) return;
    const next = event.nativeEvent.layout.height;
    if (measured.value === 0) {
      height.value = next;
      measured.value = 1;
    } else {
      height.value = withSpring(next, spring);
    }
  };

  const sized = useAnimatedStyle(() =>
    measured.value === 1 ? { height: height.value } : {},
  );

  return (
    <Animated.View style={[styles.tray, style, sized]}>
      {layers.map((layer, index) => (
        <TrayLayer
          key={String(layer.key)}
          outgoing={index > 0}
          appear={layers.length > 1 && index === 0}
          style={contentStyle}
          onLayout={onLayout(layer.key)}
        >
          {layer.key === step ? children : layer.node}
        </TrayLayer>
      ))}
    </Animated.View>
  );
}

function TrayLayer({
  outgoing,
  appear,
  style,
  onLayout,
  children,
}: {
  outgoing: boolean;
  appear: boolean;
  style?: StyleProp<ViewStyle>;
  onLayout: (event: LayoutChangeEvent) => void;
  children: ReactNode;
}) {
  const opacity = useSharedValue(appear ? 0 : 1);
  const scale = useSharedValue(appear ? 0.97 : 1);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    if (outgoing) {
      // The old content clears quickly so the two never read as stacked.
      opacity.value = withTiming(0, { duration: 120, easing: ease });
      scale.value = withTiming(0.97, { duration: 200, easing: ease });
    } else {
      opacity.value = withDelay(60, withTiming(1, { duration: 200, easing: ease }));
      scale.value = withSpring(1, { damping: 22, stiffness: 260 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outgoing]);

  const animated = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      onLayout={onLayout}
      pointerEvents={outgoing ? "none" : "auto"}
      style={[outgoing ? styles.outgoing : null, style, animated]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tray: {
    overflow: "hidden",
  },
  outgoing: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
});
