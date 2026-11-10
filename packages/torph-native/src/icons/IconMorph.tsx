import { useEffect, useMemo, useRef } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withTiming,
  type WithSpringConfig,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { blendShapes, pairShapes, toShapes, type Shape } from "./morph";

const AnimatedPath = Animated.createAnimatedComponent(Path);

export interface IconMorphProps {
  /**
   * The icon as SVG path data — one `d` string or several (one per <path>). Use
   * `circlePath`, `rectPath` and `linePath` for icons drawn with other elements.
   * Changing it morphs the drawing into the new icon.
   */
  d: string | readonly string[];
  /** Pixel size. Default 24. */
  size?: number;
  /** The icons' coordinate space. Default 24 (Lucide, Feather, Tabler, Heroicons outline). */
  viewBox?: number;
  color?: string;
  strokeWidth?: number;
  /** Fill the shapes instead of stroking them (for solid icon sets). */
  filled?: boolean;
  /** Points per subpath. Higher is smoother on big icons. Default 40. */
  samples?: number;
  /** A spring (default) or a fixed duration in ms. */
  spring?: WithSpringConfig;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

const DEFAULT_SPRING: WithSpringConfig = { damping: 20, stiffness: 210, mass: 0.9 };

/**
 * Morphs any icon into any other: every stroke is resampled to the same number of
 * points, paired with the nearest stroke of the next icon, and blended on the UI
 * thread. Strokes without a partner grow from, or shrink into, their own centre.
 */
export function IconMorph({
  d,
  size = 24,
  viewBox = 24,
  color = "#111111",
  strokeWidth = 2,
  filled = false,
  samples = 40,
  spring = DEFAULT_SPRING,
  duration,
  style,
}: IconMorphProps) {
  const key = typeof d === "string" ? d : d.join("\u0000");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const target = useMemo(() => toShapes(d, samples), [key, samples]);

  const from = useSharedValue<Shape[]>(target);
  const to = useSharedValue<Shape[]>(target);
  const t = useSharedValue(1);
  const shown = useRef({ from: target, to: target });
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Pair against what is on screen now, so an interrupted morph carries on.
    const current = blendShapes(shown.current.from, shown.current.to, Math.min(1, t.value));
    const paired = pairShapes(current, target);
    shown.current = paired;
    from.value = paired.from;
    to.value = paired.to;
    t.value = 0;
    t.value =
      duration !== undefined
        ? withTiming(1, { duration, easing: Easing.bezier(0.77, 0, 0.175, 1) })
        : withSpring(1, spring);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const animatedProps = useAnimatedProps(() => {
    const a = from.value;
    const b = to.value;
    const p = t.value;
    let path = "";
    for (let s = 0; s < b.length; s++) {
      const tp = b[s]!.points;
      const fp = a[s] ? a[s]!.points : tp;
      for (let k = 0; k < tp.length; k += 2) {
        const x = fp[k]! + (tp[k]! - fp[k]!) * p;
        const y = fp[k + 1]! + (tp[k + 1]! - fp[k + 1]!) * p;
        path += (k === 0 ? "M" : "L") + Math.round(x * 100) / 100 + " " + Math.round(y * 100) / 100;
      }
      const closed = p < 0.5 ? (a[s] ? a[s]!.closed : b[s]!.closed) : b[s]!.closed;
      if (closed) path += "Z";
    }
    return { d: path };
  });

  return (
    <View
      style={[{ width: size, height: size }, style]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Svg width={size} height={size} viewBox={`0 0 ${viewBox} ${viewBox}`}>
        <AnimatedPath
          animatedProps={animatedProps}
          fill={filled ? color : "none"}
          stroke={filled ? "none" : color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
