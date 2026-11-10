import { useEffect } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export interface StepIndicatorProps {
  /** Number of steps. */
  count: number;
  /** The current step, from 0. */
  index: number;
  activeColor?: string;
  inactiveColor?: string;
  /** Width of an inactive dash. Default 10. */
  dashWidth?: number;
  /** Width of the active dash. Default 22. */
  activeWidth?: number;
  /** Thickness. Default 3. */
  height?: number;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}

/** A row of dashes where the current step stretches and takes the accent colour. */
export function StepIndicator({
  count,
  index,
  activeColor = "#0EA5FF",
  inactiveColor = "#D9DEE5",
  dashWidth = 10,
  activeWidth = 22,
  height = 3,
  gap = 4,
  style,
}: StepIndicatorProps) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: count, now: index + 1 }}
      style={[{ flexDirection: "row", alignItems: "center", gap }, style]}
    >
      {Array.from({ length: count }, (_, i) => (
        <Dash
          key={i}
          active={i === index}
          activeColor={activeColor}
          inactiveColor={inactiveColor}
          dashWidth={dashWidth}
          activeWidth={activeWidth}
          height={height}
        />
      ))}
    </View>
  );
}

function Dash({
  active,
  activeColor,
  inactiveColor,
  dashWidth,
  activeWidth,
  height,
}: {
  active: boolean;
  activeColor: string;
  inactiveColor: string;
  dashWidth: number;
  activeWidth: number;
  height: number;
}) {
  const p = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(active ? 1 : 0, { damping: 20, stiffness: 240 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const animated = useAnimatedStyle(() => ({
    width: interpolate(p.value, [0, 1], [dashWidth, activeWidth]),
    backgroundColor: interpolateColor(p.value, [0, 1], [inactiveColor, activeColor]),
  }));

  return <Animated.View style={[{ height, borderRadius: height / 2 }, animated]} />;
}
