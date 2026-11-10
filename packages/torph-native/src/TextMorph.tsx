import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
} from "react-native-reanimated";
import { diffSegments } from "./core/diff";
import { segmentText } from "./core/segment";
import type { Segment } from "./core/types";
import { Glyph } from "./Glyph";
import {
  DEFAULT_DURATION,
  exitLifetime,
  fade,
  move,
  resolveMotion,
  type MorphEase,
  type Motion,
} from "./motion";
import {
  isWhitespace,
  planFrame,
  requiredStrings,
  type Align,
  type FramePlan,
} from "./plan";

export interface TextMorphProps {
  /** The value to show. Numbers are formatted with `locale` and `decimals`. */
  children: string | number;
  /** Text appearance: font, size, weight, color, letter spacing, line height, `textAlign`. */
  style?: StyleProp<TextStyle>;
  /** Layout of the morphing box itself: margins, background, alignment within its parent. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Milliseconds for a timing curve. Ignored when `ease` is a spring. Default 400. */
  duration?: number;
  /**
   * A Reanimated easing (`Easing.bezier(...)`, `Easing.out(...)`) or spring parameters
   * (`{ stiffness, damping, mass }`). Default `Easing.bezier(0.19, 1, 0.22, 1)`.
   */
  ease?: MorphEase;
  /** Locale for segmentation and number formatting. Default `"en"`. */
  locale?: string;
  /** Fraction digits when `children` is a number. */
  decimals?: number;
  /** Morph numeric words by place value (odometer roll). Default true. */
  numbers?: boolean;
  /** Shrink exiting characters slightly as they fade. Default true. */
  scale?: boolean;
  /**
   * Ease the box's width and height to the new value's so neighbours don't jump.
   * Default true. Off, the box snaps to its new size and only the glyphs move.
   */
  animateSize?: boolean;
  /** Caret position, for values being typed: matches by position instead of place value. */
  cursorIndex?: number;
  /** Render plain text with no animation. */
  disabled?: boolean;
  /** Swap movement for a crossfade when the OS asks for reduced motion. Default true. */
  respectReducedMotion?: boolean;
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  /** Called when a running morph is interrupted by a newer value. */
  onAnimationCancel?: () => void;
  testID?: string;
}

// What a glyph's <Text> takes. Layout keys would apply to every glyph, so they stay out.
const TEXT_KEYS = [
  "color",
  "fontFamily",
  "fontSize",
  "fontStyle",
  "fontWeight",
  "fontVariant",
  "letterSpacing",
  "lineHeight",
  "textDecorationLine",
  "textDecorationColor",
  "textDecorationStyle",
  "textShadowColor",
  "textShadowOffset",
  "textShadowRadius",
  "textTransform",
  "includeFontPadding",
  "writingDirection",
] as const;

// The subset that changes how wide a glyph is. Changing any of these re-measures.
const METRIC_KEYS = [
  "fontFamily",
  "fontSize",
  "fontStyle",
  "fontWeight",
  "fontVariant",
  "letterSpacing",
  "lineHeight",
  "textTransform",
  "includeFontPadding",
] as const;

function pick(style: TextStyle, keys: readonly string[]): TextStyle {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    const value = (style as Record<string, unknown>)[key];
    if (value !== undefined) out[key] = value;
  }
  return out as TextStyle;
}

function alignOf(style: TextStyle): Align {
  return style.textAlign === "center" || style.textAlign === "right"
    ? style.textAlign
    : "left";
}

function format(value: string | number, locale: string, decimals?: number): string {
  if (typeof value !== "number") return value == null ? "" : String(value);
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Animated text that morphs between values: shared characters slide to their new
 * places, the rest fade out and in, and numbers roll by place value.
 */
export function TextMorph(props: TextMorphProps) {
  const {
    children,
    style,
    duration = DEFAULT_DURATION,
    ease,
    locale = "en",
    decimals,
    disabled = false,
    respectReducedMotion = true,
  } = props;

  const reducedMotion = useReducedMotion();
  const flat = StyleSheet.flatten(style) ?? {};
  const styleKey = JSON.stringify(flat);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const textStyle = useMemo(() => pick(flat, TEXT_KEYS), [styleKey]);
  const align = alignOf(flat);
  const text = format(children, locale, decimals);

  // An inline `{ stiffness, damping }` is a new object every render; only its contents count.
  const easeKey = ease && typeof ease === "object" && !("factory" in ease) ? JSON.stringify(ease) : ease;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const motion = useMemo(() => resolveMotion(ease, duration), [easeKey, duration]);

  const shared = { ...props, text, textStyle, align, motion };

  if (disabled) return <StaticText {...shared} />;
  if (respectReducedMotion && reducedMotion) return <CrossfadeText {...shared} />;
  return <MorphText {...shared} />;
}

type InnerProps = TextMorphProps & {
  text: string;
  textStyle: TextStyle;
  align: Align;
  motion: Motion;
};

function a11y(props: InnerProps) {
  return {
    accessible: true,
    accessibilityRole: "text" as const,
    accessibilityLabel: props.text,
    testID: props.testID,
  };
}

function StaticText(props: InnerProps) {
  return (
    <View style={props.containerStyle} testID={props.testID}>
      <Text
        style={[props.textStyle, { textAlign: props.align }]}
        allowFontScaling={props.allowFontScaling}
        maxFontSizeMultiplier={props.maxFontSizeMultiplier}
      >
        {props.text}
      </Text>
    </View>
  );
}

const LINE_PROBE = "​";

function MorphText(props: InnerProps) {
  const {
    text,
    cursorIndex,
    textStyle,
    align,
    motion,
    numbers = true,
    locale = "en",
    scale = true,
    allowFontScaling,
    maxFontSizeMultiplier,
  } = props;

  const { fontScale } = useWindowDimensions();
  const metricsKey = JSON.stringify([
    pick(textStyle, METRIC_KEYS),
    allowFontScaling,
    maxFontSizeMultiplier,
    fontScale,
  ]);

  const widths = useRef(new Map<string, number>());
  const lineHeight = useRef<number | null>(null);
  const committed = useRef<{ plan: FramePlan | null; segments: Segment[] }>({
    plan: null,
    segments: [],
  });
  const [plan, setPlan] = useState<FramePlan | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const missingRef = useRef<string[]>([]);

  // Read at commit time, so the commit callback never goes stale.
  const latest = useRef(props);
  latest.current = props;

  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const exits = exitTimers.current;
    return () => {
      if (completeTimer.current) clearTimeout(completeTimer.current);
      exits.forEach(clearTimeout);
      exits.clear();
    };
  }, []);

  const requestMeasure = useCallback((strings: string[]) => {
    missingRef.current = strings;
    setMissing(strings);
  }, []);

  const commit = useCallback(() => {
    const current = latest.current;
    const value = current.text;
    const isNumbers = current.numbers !== false;
    const loc = current.locale ?? "en";
    const prev = committed.current;

    const { segments, splits } =
      prev.segments.length > 0
        ? diffSegments(prev.segments, value, loc, {
            numbers: isNumbers,
            cursorIndex: current.cursorIndex,
          })
        : { segments: segmentText(value, loc, isNumbers), splits: new Map<string, Segment[]>() };

    const lack = [...requiredStrings(segments, splits)].filter(
      (s) => !widths.current.has(s),
    );
    if (lineHeight.current === null && !lack.includes(LINE_PROBE)) lack.push(LINE_PROBE);
    if (lack.length > 0) {
      // Not everything has a width yet: hold the current frame and measure first.
      requestMeasure(lack);
      return;
    }
    if (missingRef.current.length > 0) requestMeasure([]);

    const next = planFrame({
      prev: prev.plan,
      segments,
      splits,
      measure: (s) => widths.current.get(s) ?? 0,
      lineHeight: lineHeight.current!,
      align: current.align,
    });
    committed.current = { plan: next, segments };
    setPlan(next);

    if (!prev.plan) return;

    const m = current.motion;
    if (completeTimer.current) {
      clearTimeout(completeTimer.current);
      current.onAnimationCancel?.();
    }
    current.onAnimationStart?.();
    completeTimer.current = setTimeout(() => {
      completeTimer.current = null;
      latest.current.onAnimationComplete?.();
    }, m.duration);

    if (next.glyphs.some((g) => g.phase === "exit" && g.exitFrame === next.frame)) {
      const timer = setTimeout(() => {
        exitTimers.current.delete(timer);
        const live = committed.current.plan;
        if (!live) return;
        const kept = live.glyphs.filter(
          (g) => !(g.phase === "exit" && g.exitFrame === next.frame),
        );
        if (kept.length === live.glyphs.length) return;
        const pruned = { ...live, glyphs: kept };
        committed.current = { ...committed.current, plan: pruned };
        setPlan(pruned);
      }, exitLifetime(m));
      exitTimers.current.add(timer);
    }
  }, [requestMeasure]);

  const onMeasured = useCallback(
    (value: string, event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      widths.current.set(value, value === LINE_PROBE ? 0 : width);
      if (value === LINE_PROBE) {
        // An invisible character is exactly one line tall in the current font.
        const fontSize = latest.current.textStyle.fontSize ?? 14;
        lineHeight.current = height > 0 ? height : fontSize * 1.2;
      }
      const done =
        lineHeight.current !== null &&
        missingRef.current.every((s) => widths.current.has(s));
      if (done) commit();
    },
    [commit],
  );

  // New fonts mean new widths: drop every measurement and lay out again without a morph.
  const lastMetrics = useRef(metricsKey);
  useLayoutEffect(() => {
    if (lastMetrics.current === metricsKey) return;
    lastMetrics.current = metricsKey;
    widths.current.clear();
    lineHeight.current = null;
    committed.current = { plan: null, segments: [] };
    setPlan(null);
    commit();
  }, [metricsKey, commit]);

  // A layout effect, so a value whose widths are all known commits before paint.
  useLayoutEffect(() => {
    commit();
  }, [text, cursorIndex, align, numbers, locale, commit]);

  const measurer =
    missing.length > 0 ? (
      <View pointerEvents="none" style={styles.measurer} importantForAccessibility="no-hide-descendants">
        {missing.map((value) => (
          <Text
            key={value}
            style={textStyle}
            numberOfLines={1}
            allowFontScaling={allowFontScaling}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
            onLayout={(event) => onMeasured(value, event)}
          >
            {value}
          </Text>
        ))}
      </View>
    ) : null;

  if (!plan) {
    // First paint, before any width is known: plain text in the same place.
    return (
      <View style={props.containerStyle} {...a11y(props)}>
        <Text
          style={[textStyle, { textAlign: align }]}
          allowFontScaling={allowFontScaling}
          maxFontSizeMultiplier={maxFontSizeMultiplier}
        >
          {text}
        </Text>
        {measurer}
      </View>
    );
  }

  return (
    <MorphFrame
      plan={plan}
      motion={motion}
      animateSize={props.animateSize !== false}
      style={props.containerStyle}
      {...a11y(props)}
    >
      {plan.glyphs.map((glyph) =>
        isWhitespace(glyph.string) ? null : (
          <Glyph
            key={glyph.id}
            glyph={glyph}
            frame={plan.frame}
            lineHeight={plan.lineHeight}
            motion={motion}
            scaleOnExit={scale}
            textStyle={textStyle}
            allowFontScaling={allowFontScaling}
            maxFontSizeMultiplier={maxFontSizeMultiplier}
          />
        ),
      )}
      {measurer}
    </MorphFrame>
  );
}

/** The box around the glyphs. Its size eases to the new value's so neighbours don't jump. */
function MorphFrame({
  plan,
  motion,
  animateSize,
  style,
  children,
  ...rest
}: {
  plan: FramePlan;
  motion: Motion;
  animateSize: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
} & ReturnType<typeof a11y>) {
  const width = useSharedValue(plan.width);
  const height = useSharedValue(plan.height);
  const mounted = useRef(plan.frame);

  useEffect(() => {
    if (mounted.current === plan.frame) return;
    width.value = animateSize ? move(plan.width, motion) : plan.width;
    height.value = animateSize ? move(plan.height, motion) : plan.height;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.frame, plan.width, plan.height]);

  const size = useAnimatedStyle(() => ({ width: width.value, height: height.value }));

  return (
    <Animated.View style={[style, styles.frame, size]} {...rest}>
      {children}
    </Animated.View>
  );
}

/**
 * Reduced motion: no movement, but the change still reads as one — the old value
 * fades out over the new one instead of snapping.
 */
function CrossfadeText(props: InnerProps) {
  const { text, motion } = props;
  const [layers, setLayers] = useState([{ key: 0, text }]);
  const first = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setLayers((current) => [{ key: current[0]!.key + 1, text }, current[0]!]);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setLayers((current) => current.slice(0, 1));
    }, motion.duration);
  }, [text, motion.duration]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <View style={props.containerStyle} {...a11y(props)}>
      {layers.map((layer, index) => (
        <FadeLayer
          {...props}
          key={layer.key}
          text={layer.text}
          outgoing={index > 0}
          appear={layer.key > 0}
        />
      ))}
    </View>
  );
}

function FadeLayer({
  text,
  outgoing,
  appear,
  motion,
  textStyle,
  align,
  allowFontScaling,
  maxFontSizeMultiplier,
}: InnerProps & { outgoing: boolean; appear: boolean }) {
  const opacity = useSharedValue(appear ? 0 : 1);

  useEffect(() => {
    opacity.value = fade(outgoing ? 0 : 1, motion, 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outgoing]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const label = (
    <Animated.Text
      style={[textStyle, { textAlign: align }, animated]}
      allowFontScaling={allowFontScaling}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
    >
      {text}
    </Animated.Text>
  );

  if (!outgoing) return label;

  // Out of flow and given room on both sides, so it neither moves the box nor rewraps.
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      style={[styles.overlay, overlayAlign[align]]}
    >
      {label}
    </View>
  );
}

const ROOM = 10000;

const overlayAlign = {
  left: { left: 0, right: -ROOM, alignItems: "flex-start" },
  center: { left: -ROOM, right: -ROOM, alignItems: "center" },
  right: { left: -ROOM, right: 0, alignItems: "flex-end" },
} as const;

const styles = StyleSheet.create({
  frame: {
    overflow: "visible",
  },
  overlay: {
    position: "absolute",
    top: 0,
  },
  measurer: {
    position: "absolute",
    left: 0,
    top: 0,
    // Wide enough that nothing being measured ever wraps.
    width: ROOM,
    alignItems: "flex-start",
    opacity: 0,
  },
});
