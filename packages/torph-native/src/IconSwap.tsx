import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export type IconSwapVariant = "scale" | "slide-up" | "slide-down" | "rotate";

export interface IconSwapProps {
  /** Identity of the current icon. Changing it plays the swap. */
  swapKey: string | number;
  /** The icon, emoji or any small view for `swapKey`. */
  children: ReactNode;
  /**
   * How the old icon leaves and the new one arrives.
   * - `scale`: shrinks out, grows in (SF Symbols' replace). Default.
   * - `slide-up` / `slide-down`: the new icon pushes the old one along the axis.
   * - `rotate`: a quarter turn while crossfading, for related glyphs (+ → ×).
   */
  variant?: IconSwapVariant;
  /** Milliseconds for the outgoing fade; the incoming spring settles on its own. Default 180. */
  duration?: number;
  style?: StyleProp<ViewStyle>;
  /** Crossfade only when the OS asks for reduced motion. Default true. */
  respectReducedMotion?: boolean;
}

type Layer = { key: string | number; node: ReactNode };

/**
 * Swaps one icon for another with a short replace animation. The outgoing icon is
 * kept until it has faded, layered over the new one, so the swap never jumps.
 */
export function IconSwap({
  swapKey,
  children,
  variant = "scale",
  duration = 180,
  style,
  respectReducedMotion = true,
}: IconSwapProps) {
  const reduced = useReducedMotion() && respectReducedMotion;
  const [layers, setLayers] = useState<Layer[]>([{ key: swapKey, node: children }]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    setLayers((prev) => {
      if (prev[0]!.key === swapKey) return prev;
      // A key coming back while it is still leaving is revived, not duplicated.
      const rest = prev.filter((l) => l.key !== swapKey).slice(0, 2);
      return [{ key: swapKey, node: children }, ...rest];
    });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLayers((prev) => prev.slice(0, 1)), duration + 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapKey]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <View style={style}>
      {layers.map((layer, index) => (
        <SwapLayer
          key={String(layer.key)}
          outgoing={index > 0}
          appear={layers.length > 1 || index > 0}
          variant={reduced ? "fade" : variant}
          duration={duration}
        >
          {/* The live layer always shows the latest children, so prop changes land. */}
          {layer.key === swapKey ? children : layer.node}
        </SwapLayer>
      ))}
    </View>
  );
}

const OUT_SCALE = 0.5;
const IN_SCALE = 0.6;
const SPRING = { damping: 18, stiffness: 320, mass: 0.8, reduceMotion: ReduceMotion.Never };

function SwapLayer({
  outgoing,
  appear,
  variant,
  duration,
  children,
}: {
  outgoing: boolean;
  appear: boolean;
  variant: IconSwapVariant | "fade";
  duration: number;
  children: ReactNode;
}) {
  const enterFrom = enterOffset(variant);
  const progress = useSharedValue(appear && !outgoing ? 0 : 1);
  const opacity = useSharedValue(appear && !outgoing ? 0 : 1);
  const leaving = useSharedValue(0);

  useEffect(() => {
    const timing = { duration, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.Never };
    if (outgoing) {
      leaving.value = withTiming(1, timing);
      opacity.value = withTiming(0, { ...timing, duration: duration * 0.8 });
    } else {
      leaving.value = withTiming(0, timing);
      progress.value = variant === "fade" ? withTiming(1, timing) : withSpring(1, SPRING);
      opacity.value = withTiming(1, { ...timing, duration: duration * 0.7 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outgoing]);

  const animated = useAnimatedStyle(() => {
    const p = progress.value;
    const l = leaving.value;
    if (variant === "fade") return { opacity: opacity.value };
    if (variant === "scale") {
      const s = (IN_SCALE + (1 - IN_SCALE) * p) * (1 - (1 - OUT_SCALE) * l);
      return { opacity: opacity.value, transform: [{ scale: s }] };
    }
    if (variant === "rotate") {
      const deg = -90 * (1 - p) + 90 * l;
      const s = 0.8 + 0.2 * p - 0.2 * l;
      return { opacity: opacity.value, transform: [{ rotate: `${deg}deg` }, { scale: s }] };
    }
    // Slides: arrive from enterFrom, leave the opposite way.
    const y = enterFrom * (1 - p) - enterFrom * l;
    return { opacity: opacity.value, transform: [{ translateY: y }] };
  });

  return (
    <Animated.View
      pointerEvents={outgoing ? "none" : "auto"}
      style={[outgoing ? styles.overlay : null, animated]}
    >
      {children}
    </Animated.View>
  );
}

function enterOffset(variant: IconSwapVariant | "fade"): number {
  if (variant === "slide-up") return 14;
  if (variant === "slide-down") return -14;
  return 0;
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
