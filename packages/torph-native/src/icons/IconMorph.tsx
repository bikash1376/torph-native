import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
  type WithSpringConfig,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { pairShapes, strokeOpacity, toShapes, visibleShapes, type Shape } from "./morph";

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
  /** Points per stroke. Higher is smoother on big icons. Default 40. */
  samples?: number;
  /** A spring (default) or a fixed duration in ms. */
  spring?: WithSpringConfig;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

// Critically damped: a morph that overshoots draws strokes past their target shape.
const DEFAULT_SPRING: WithSpringConfig = { damping: 26, stiffness: 220, mass: 1 };

/**
 * Morphs any icon into any other: every stroke is resampled to the same number of
 * points, paired with the stroke of the next icon it is shaped most like, and blended
 * on the UI thread. Strokes without a partner shrink and fade out (or grow and fade
 * in) about their own centre.
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
  const [count, setCount] = useState(target.length);
  const first = useRef(true);

  // A layout effect, so the stroke count and the shared values change in the same frame.
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Pair against what is on screen now, so an interrupted morph carries on.
    const progress = Math.min(1, Math.max(0, t.value));
    const current = visibleShapes(shown.current.from, shown.current.to, progress);
    const paired = pairShapes(current, target);
    shown.current = paired;
    from.value = paired.from;
    to.value = paired.to;
    setCount(paired.to.length);
    t.value = 0;
    t.value =
      duration !== undefined
        ? withTiming(1, { duration, easing: Easing.bezier(0.77, 0, 0.175, 1) })
        : withSpring(1, spring);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  // Faded-out ghosts stay mounted (invisible) until the next morph re-pairs without them.
  return (
    <View
      style={[{ width: size, height: size }, style]}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Svg width={size} height={size} viewBox={`0 0 ${viewBox} ${viewBox}`}>
        {Array.from({ length: count }, (_, i) => (
          <MorphStroke
            key={i}
            index={i}
            from={from}
            to={to}
            t={t}
            color={color}
            strokeWidth={strokeWidth}
            filled={filled}
          />
        ))}
      </Svg>
    </View>
  );
}

function MorphStroke({
  index,
  from,
  to,
  t,
  color,
  strokeWidth,
  filled,
}: {
  index: number;
  from: SharedValue<Shape[]>;
  to: SharedValue<Shape[]>;
  t: SharedValue<number>;
  color: string;
  strokeWidth: number;
  filled: boolean;
}) {
  const animatedProps = useAnimatedProps(() => {
    const b = to.value[index];
    if (!b) return { d: "M0 0", strokeOpacity: 0, fillOpacity: 0 };
    const a = from.value[index];
    const p = t.value;
    const tp = b.points;
    const fp = a ? a.points : tp;
    let path = "";
    for (let k = 0; k < tp.length; k += 2) {
      const x = fp[k]! + (tp[k]! - fp[k]!) * p;
      const y = fp[k + 1]! + (tp[k + 1]! - fp[k + 1]!) * p;
      path += (k === 0 ? "M" : "L") + Math.round(x * 100) / 100 + " " + Math.round(y * 100) / 100;
    }
    const opacity = strokeOpacity(a, b, p);
    return { d: path, strokeOpacity: opacity, fillOpacity: opacity };
  });

  return (
    <AnimatedPath
      animatedProps={animatedProps}
      fill={filled ? color : "none"}
      stroke={filled ? "none" : color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
