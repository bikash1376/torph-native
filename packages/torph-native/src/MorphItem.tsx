import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";

export interface MorphItemProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Spring damping for the move. Default 22. */
  damping?: number;
  /** Spring stiffness for the move. Default 220. */
  stiffness?: number;
}

/**
 * An item that glides to its new place when its list or grid reorders, regroups or
 * reflows, and fades in and out as it is added or removed. Give each one a stable key.
 */
export function MorphItem({ children, style, damping = 22, stiffness = 220 }: MorphItemProps) {
  return (
    <Animated.View
      style={style}
      layout={LinearTransition.springify().damping(damping).stiffness(stiffness)}
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(120)}
    >
      {children}
    </Animated.View>
  );
}
