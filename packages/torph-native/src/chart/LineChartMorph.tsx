import { useEffect, useMemo, useRef } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  type EasingFunction,
  type EasingFunctionFactory,
} from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { lerpSeries, resample, smoothPath, toY, xAt } from "./path";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface LineChartMorphProps {
  /** The series to draw. Any length; it is resampled to `samples` points. */
  data: readonly number[];
  width: number;
  height: number;
  color?: string;
  strokeWidth?: number;
  /** Points the line is resampled to. More is smoother and costs more per frame. Default 72. */
  samples?: number;
  /** Space kept above and below the line. Default 10. */
  padding?: number;
  /** Space kept left and right, so the end dot isn't clipped. Default 6. */
  inset?: number;
  /** Draw a dot on the latest value. Default true. */
  showDot?: boolean;
  /** Morph duration in ms. Default 520. */
  duration?: number;
  /** Default: a strong ease-in-out, since the line moves in place on screen. */
  easing?: EasingFunction | EasingFunctionFactory;
  style?: StyleProp<ViewStyle>;
}

/**
 * A line chart that reshapes itself when its data changes — switching 1H → 1D → 1W
 * redraws one line into the next instead of swapping charts.
 */
export function LineChartMorph({
  data,
  width,
  height,
  color = "#0A84FF",
  strokeWidth = 2.5,
  samples = 72,
  padding = 10,
  inset = 6,
  showDot = true,
  duration = 520,
  easing = Easing.bezier(0.77, 0, 0.175, 1),
  style,
}: LineChartMorphProps) {
  const target = useMemo(
    () => toY(resample(data, samples), height, padding),
    [data, samples, height, padding],
  );
  const from = useSharedValue<number[]>(target);
  const to = useSharedValue<number[]>(target);
  const t = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    // Start from wherever the line is now, so a quick second tap continues the motion.
    from.value = lerpSeries(from.value, to.value, t.value);
    to.value = target;
    t.value = 0;
    t.value = withTiming(1, { duration, easing });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const line = useAnimatedProps(() => ({
    d: smoothPath(lerpSeries(from.value, to.value, t.value), width, inset),
  }));
  const dot = useAnimatedProps(() => {
    const a = from.value;
    const b = to.value;
    const last = b.length - 1;
    const y = (a[last] ?? b[last]!) + (b[last]! - (a[last] ?? b[last]!)) * t.value;
    return { cx: xAt(last, b.length, width, inset), cy: y };
  });

  return (
    <View style={[{ width, height }, style]} accessible accessibilityRole="image">
      <Svg width={width} height={height}>
        <AnimatedPath
          animatedProps={line}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {showDot ? <AnimatedCircle r={strokeWidth * 1.9} fill={color} animatedProps={dot} /> : null}
      </Svg>
    </View>
  );
}
