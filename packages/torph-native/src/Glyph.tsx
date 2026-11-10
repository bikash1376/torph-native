import { memo, useEffect, useRef } from "react";
import { Text, type TextStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import {
  FADE,
  GLYPH_SCALE,
  GROUP_SCALE,
  fade,
  move,
  type Motion,
} from "./motion";
import type { GlyphPlan } from "./plan";

export interface GlyphProps {
  glyph: GlyphPlan;
  frame: number;
  lineHeight: number;
  motion: Motion;
  /** Shrink exiting glyphs slightly as they fade. */
  scaleOnExit: boolean;
  textStyle: TextStyle;
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
}

type Start = { x: number; y: number; slide: number; scale: number; opacity: number };

/** Where a glyph is on the frame it mounts. Set synchronously, so the first paint is already right. */
function startOf(glyph: GlyphPlan, lineHeight: number): Start {
  const at = glyph.from ?? { x: glyph.x, y: glyph.y };
  switch (glyph.phase) {
    case "persist":
      // Mounting while persisting: a character cut out of a word that was whole.
      return { x: at.x, y: at.y, slide: 0, scale: 1, opacity: 1 };
    case "enter":
      if (glyph.group) {
        return { x: glyph.x, y: glyph.y, slide: 0, scale: GROUP_SCALE, opacity: 0 };
      }
      if (glyph.kind) {
        // Digits arrive from above, separators from below, so each reads as its own event.
        const slide = glyph.kind === "digit" ? -lineHeight : lineHeight;
        return { x: at.x, y: at.y, slide, scale: 1, opacity: 0 };
      }
      return { x: at.x, y: at.y, slide: 0, scale: GLYPH_SCALE, opacity: 0 };
    default:
      return { x: glyph.x, y: glyph.y, slide: 0, scale: 1, opacity: 1 };
  }
}

function GlyphImpl({
  glyph,
  frame,
  lineHeight,
  motion,
  scaleOnExit,
  textStyle,
  allowFontScaling,
  maxFontSizeMultiplier,
}: GlyphProps) {
  const start = useRef<Start | null>(null);
  if (start.current === null) start.current = startOf(glyph, lineHeight);
  const s = start.current;

  // The slot takes the layout correction; slide is the number roll on top of it.
  const x = useSharedValue(s.x);
  const y = useSharedValue(s.y);
  const slide = useSharedValue(s.slide);
  const scale = useSharedValue(s.scale);
  const opacity = useSharedValue(s.opacity);
  // Scaling about a run's centre rather than the glyph's own.
  const originX = useSharedValue(glyph.group?.x ?? 0);
  const originY = useSharedValue(glyph.group?.y ?? 0);
  const grouped = useSharedValue(glyph.group ? 1 : 0);

  const width = glyph.width;

  useEffect(() => {
    if (glyph.group) {
      originX.value = glyph.group.x;
      originY.value = glyph.group.y;
      grouped.value = 1;
    } else {
      grouped.value = 0;
    }

    // Every animation retargets from where the value is now, so an interrupted
    // morph carries on from the screen instead of restarting.
    switch (glyph.phase) {
      case "initial":
        return;

      case "persist":
        x.value = move(glyph.x, motion);
        y.value = move(glyph.y, motion);
        slide.value = move(0, motion);
        scale.value = move(1, motion);
        if (opacity.value < 1) opacity.value = fade(1, motion, FADE.revive);
        return;

      case "enter":
        x.value = move(glyph.x, motion);
        y.value = move(glyph.y, motion);
        slide.value = move(0, motion);
        scale.value = move(1, motion);
        if (glyph.group) {
          opacity.value = fade(1, motion, FADE.groupEnter);
        } else if (glyph.kind) {
          opacity.value = fade(1, motion, FADE.numberEnter);
        } else {
          opacity.value = fade(1, motion, FADE.enter, FADE.enterDelay);
        }
        return;

      case "exit": {
        // An exit carried over from an earlier frame is already on its way.
        if (glyph.exitFrame !== frame) return;
        if (glyph.group) {
          scale.value = move(GROUP_SCALE, motion);
          opacity.value = fade(0, motion, FADE.groupExit);
          return;
        }
        const to = glyph.to ?? { x: glyph.x, y: glyph.y };
        x.value = move(to.x, motion);
        y.value = move(to.y, motion);
        if (glyph.kind) {
          slide.value = move(lineHeight, motion);
          opacity.value = fade(0, motion, FADE.numberExit);
        } else {
          if (scaleOnExit) scale.value = move(GLYPH_SCALE, motion);
          opacity.value = fade(0, motion, FADE.exit);
        }
        return;
      }
    }
    // Keyed on the frame: a glyph's plan only changes when a new frame is committed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, glyph.phase]);

  const animatedStyle = useAnimatedStyle(() => {
    let offsetX = 0;
    let offsetY = 0;
    if (grouped.value === 1) {
      // Scaling about point C moves the glyph's centre G to C + s(G − C).
      const k = 1 - scale.value;
      offsetX = (originX.value - (x.value + width / 2)) * k;
      offsetY = (originY.value - (y.value + lineHeight / 2)) * k;
    }
    return {
      opacity: opacity.value,
      transform: [
        { translateX: x.value + offsetX },
        { translateY: y.value + slide.value + offsetY },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[
        {
          position: "absolute",
          left: 0,
          top: 0,
          // A hair of slack so rounding never wraps or clips the glyph.
          width: Math.ceil(width) + 1,
          height: lineHeight,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={textStyle}
        numberOfLines={1}
        ellipsizeMode="clip"
        allowFontScaling={allowFontScaling}
        maxFontSizeMultiplier={maxFontSizeMultiplier}
      >
        {glyph.string}
      </Text>
    </Animated.View>
  );
}

export const Glyph = memo(GlyphImpl);
