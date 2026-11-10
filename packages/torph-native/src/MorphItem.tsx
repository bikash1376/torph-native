import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

export interface MorphItemProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Let the move overshoot and settle. Default false: items glide straight to their
   * place, so a long move never swings past the end of its list.
   */
  bounce?: boolean;
  /** Spring damping for the move. Default 30 (22 with `bounce`). */
  damping?: number;
  /** Spring stiffness for the move. Default 260. */
  stiffness?: number;
}

/**
 * An item that glides to its new place when its list or grid reorders, regroups or
 * reflows, and fades in and out as it is added or removed. Give each one a stable key.
 */
export function MorphItem({ children, style, bounce = false, damping, stiffness = 260 }: MorphItemProps) {
  const layout = LinearTransition.springify()
    .damping(damping ?? (bounce ? 22 : 30))
    .stiffness(stiffness)
    // Clamp overshoot so nothing slides past where it is going.
    .overshootClamping(bounce ? 0 : 1);
  return (
    <Animated.View
      style={style}
      layout={layout}
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(120)}
    >
      {children}
    </Animated.View>
  );
}
