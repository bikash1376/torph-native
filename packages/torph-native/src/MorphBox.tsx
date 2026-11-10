import { useEffect, useState, type ReactNode } from "react";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type WithSpringConfig,
} from "react-native-reanimated";

export interface MorphBoxProps {
  /** Show the expanded content (the tray) instead of the collapsed one (the button). */
  expanded: boolean;
  /** What the box shows collapsed — usually a button label. */
  collapsed: ReactNode;
  /** What the box shows expanded. Its height is measured. */
  children: ReactNode;
  /** The collapsed box's size. Expanded, the box fills the available width. */
  collapsedWidth: number;
  collapsedHeight: number;
  /** Corner radius collapsed. Default: a pill (half the height). */
  collapsedRadius?: number;
  /** Corner radius expanded. Default 32. */
  expandedRadius?: number;
  collapsedColor?: string;
  expandedColor?: string;
  /** Outer wrapper: position it where the box should grow from. */
  style?: StyleProp<ViewStyle>;
  spring?: WithSpringConfig;
}

export const BOX_SPRING: WithSpringConfig = { damping: 24, stiffness: 230, mass: 1 };

/**
 * A box that morphs between a small control and a full surface — a "Continue" button
 * that grows into the tray it opens and shrinks back into the button on dismiss.
 * Size, corner radius and colour travel on one spring; contents crossfade.
 */
export function MorphBox({
  expanded,
  collapsed,
  children,
  collapsedWidth,
  collapsedHeight,
  collapsedRadius = collapsedHeight / 2,
  expandedRadius = 32,
  collapsedColor = "#ffffff",
  expandedColor = "#ffffff",
  style,
  spring = BOX_SPRING,
}: MorphBoxProps) {
  const progress = useSharedValue(expanded ? 1 : 0);
  const fullWidth = useSharedValue(0);
  const fullHeight = useSharedValue(0);
  const [available, setAvailable] = useState(0);

  useEffect(() => {
    progress.value = withSpring(expanded ? 1 : 0, spring);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  const onOuterLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    fullWidth.value = width;
    setAvailable(width);
  };
  const onContentLayout = (event: LayoutChangeEvent) => {
    fullHeight.value = event.nativeEvent.layout.height;
  };

  const box = useAnimatedStyle(() => {
    const p = progress.value;
    const w = fullWidth.value || collapsedWidth;
    const h = fullHeight.value || collapsedHeight;
    return {
      width: interpolate(p, [0, 1], [collapsedWidth, w]),
      height: interpolate(p, [0, 1], [collapsedHeight, h]),
      borderRadius: interpolate(p, [0, 1], [collapsedRadius, expandedRadius]),
      backgroundColor: interpolateColor(p, [0, 1], [collapsedColor, expandedColor]),
    };
  });

  // The button label clears early; the tray content arrives once there is room for it.
  const collapsedLayer = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.3], [1, 0], "clamp"),
    transform: [{ scale: interpolate(progress.value, [0, 0.3], [1, 0.92], "clamp") }],
  }));
  const expandedLayer = useAnimatedStyle(() => {
    const w = fullWidth.value || collapsedWidth;
    const current = interpolate(progress.value, [0, 1], [collapsedWidth, w]);
    return {
      opacity: interpolate(progress.value, [0.35, 1], [0, 1], "clamp"),
      transform: [
        // Centre the full-width content in the box while the box is narrower.
        { translateX: (current - w) / 2 },
        { scale: interpolate(progress.value, [0.35, 1], [0.96, 1], "clamp") },
      ],
    };
  });

  return (
    <View style={style} onLayout={onOuterLayout}>
      <Animated.View style={[styles.box, box]}>
        <Animated.View
          pointerEvents={expanded ? "none" : "auto"}
          style={[styles.collapsed, collapsedLayer]}
        >
          {collapsed}
        </Animated.View>
        <Animated.View
          onLayout={onContentLayout}
          pointerEvents={expanded ? "auto" : "none"}
          style={[styles.expanded, { width: available || undefined }, expandedLayer]}
        >
          {children}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignSelf: "center",
    overflow: "hidden",
  },
  collapsed: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  expanded: {
    position: "absolute",
    left: 0,
    bottom: 0,
  },
});
