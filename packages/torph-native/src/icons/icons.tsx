import { useEffect, useRef } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { IconSwap } from "../IconSwap";

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface IconProps {
  /** Pixel size of the square icon. Default 24. */
  size?: number;
  /** Stroke colour. Default near-black. */
  color?: string;
  /** Stroke width in the 24-unit grid. Default 2. */
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
}

const INK = "#111111";
const SNAPPY = { damping: 16, stiffness: 260, mass: 0.9 };
const SETTLE = { damping: 22, stiffness: 240 };

function Glyph({
  size,
  color,
  strokeWidth,
  children,
}: Required<Pick<IconProps, "size" | "color" | "strokeWidth">> & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

const hidden = { importantForAccessibility: "no-hide-descendants" as const, accessibilityElementsHidden: true };

// ─── Lock ──────────────────────────────────────────────────────────────────────

export interface LockIconProps extends IconProps {
  locked: boolean;
}

/** A padlock whose shackle lifts and frees its left leg when unlocked. */
export function LockIcon({ locked, size = 24, color = INK, strokeWidth = 2, style }: LockIconProps) {
  const open = useSharedValue(locked ? 0 : 1);
  useEffect(() => {
    open.value = withSpring(locked ? 0 : 1, SNAPPY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  const shackle = useAnimatedProps(() => {
    const u = open.value;
    const top = 7 - 2 * u;
    // The right leg stays seated; the left one rises out of the body.
    const leg = 11 - top - 3 * u;
    return { d: `M16 11V${top}a4 4 0 0 0-8 0v${leg}` };
  });

  return (
    <View style={style} {...hidden}>
      <Glyph size={size} color={color} strokeWidth={strokeWidth}>
        <AnimatedPath animatedProps={shackle} />
        <Rect x={5} y={11} width={14} height={10} rx={2.5} />
        <Circle cx={12} cy={16} r={1} fill={color} />
      </Glyph>
    </View>
  );
}

// ─── Progress → check ─────────────────────────────────────────────────────────

export type ProgressState = "idle" | "loading" | "success";

export interface ProgressCheckProps extends IconProps {
  state: ProgressState;
  /** On success, fill the circle and draw the check in `checkColor` — a verified badge. */
  badge?: boolean;
  /** Check colour when `badge` is on. Default white. */
  checkColor?: string;
  /** Faint ring colour while idle. */
  trackColor?: string;
}

const R = 9;
const C = 2 * Math.PI * R;
const CHECK_LENGTH = 12;

/**
 * A spinner that completes its ring and draws a check when the work is done — the
 * "Approval Request" pill going from pending to verified.
 */
export function ProgressCheck({
  state,
  size = 24,
  color = "#0EA5FF",
  strokeWidth = 2,
  badge = false,
  checkColor = "#ffffff",
  trackColor = "rgba(127,127,127,0.25)",
  style,
}: ProgressCheckProps) {
  const arc = useSharedValue(state === "success" ? 1 : state === "loading" ? 0.28 : 0);
  const rotation = useSharedValue(0);
  const check = useSharedValue(state === "success" ? 1 : 0);
  const fill = useSharedValue(state === "success" && badge ? 1 : 0);

  useEffect(() => {
    if (state === "loading") {
      check.value = withTiming(0, { duration: 120 });
      fill.value = withTiming(0, { duration: 120 });
      arc.value = withTiming(0.28, { duration: 220 });
      rotation.value = rotation.value % 360;
      rotation.value = withRepeat(
        withTiming(rotation.value + 360, { duration: 750, easing: Easing.linear }),
        -1,
      );
    } else {
      cancelAnimation(rotation);
      // Finish the turn rather than snapping back to the top.
      rotation.value = withSpring(Math.ceil(rotation.value / 360) * 360, SETTLE);
      if (state === "success") {
        arc.value = withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) });
        fill.value = badge ? withTiming(1, { duration: 220 }) : 0;
        check.value = withSequence(
          withTiming(0, { duration: 140 }),
          withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) }),
        );
      } else {
        arc.value = withTiming(0, { duration: 200 });
        check.value = withTiming(0, { duration: 120 });
        fill.value = withTiming(0, { duration: 120 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, badge]);

  const ring = useAnimatedProps(() => ({
    strokeDashoffset: C * (1 - arc.value),
    fillOpacity: fill.value,
  }));
  const tick = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - check.value),
  }));
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

  return (
    <View style={[{ width: size, height: size }, style]} {...hidden}>
      <Animated.View style={[{ position: "absolute", width: size, height: size }, spin]}>
        <Glyph size={size} color={color} strokeWidth={strokeWidth}>
          <Circle cx={12} cy={12} r={R} stroke={trackColor} />
          <AnimatedCircle
            cx={12}
            cy={12}
            r={R}
            fill={color}
            strokeDasharray={[C, C]}
            animatedProps={ring}
            transform="rotate(-90 12 12)"
          />
        </Glyph>
      </Animated.View>
      <View style={{ position: "absolute" }}>
        <Glyph size={size} color={badge ? checkColor : color} strokeWidth={strokeWidth}>
          <AnimatedPath
            d="M8 12.5l2.7 2.7L16 9.5"
            strokeDasharray={[CHECK_LENGTH, CHECK_LENGTH]}
            animatedProps={tick}
          />
        </Glyph>
      </View>
    </View>
  );
}

// ─── Check circle ─────────────────────────────────────────────────────────────

export interface CheckCircleProps extends IconProps {
  checked: boolean;
  /** Ring colour when unchecked. */
  emptyColor?: string;
  /** Check colour. Default white. */
  checkColor?: string;
}

/** A selection circle that fills and draws its check with a small pop. */
export function CheckCircle({
  checked,
  size = 24,
  color = "#0EA5FF",
  emptyColor = "rgba(127,127,127,0.45)",
  checkColor = "#ffffff",
  strokeWidth = 1.75,
  style,
}: CheckCircleProps) {
  const p = useSharedValue(checked ? 1 : 0);
  const pop = useSharedValue(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    p.value = withTiming(checked ? 1 : 0, { duration: 200, easing: Easing.out(Easing.cubic) });
    if (checked) pop.value = withSequence(withTiming(0.86, { duration: 80 }), withSpring(1, SNAPPY));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  const disc = useAnimatedProps(() => ({ fillOpacity: p.value, strokeOpacity: 1 - p.value }));
  const tick = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LENGTH * (1 - p.value) }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <Animated.View style={[{ width: size, height: size }, style, popStyle]} {...hidden}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <AnimatedCircle cx={12} cy={12} r={10} fill={color} stroke={emptyColor} strokeWidth={strokeWidth} animatedProps={disc} />
        <AnimatedPath
          d="M8 12.5l2.7 2.7L16 9.5"
          stroke={checkColor}
          strokeWidth={2.2}
          strokeDasharray={[CHECK_LENGTH, CHECK_LENGTH]}
          animatedProps={tick}
        />
      </Svg>
    </Animated.View>
  );
}

// ─── Chevron ──────────────────────────────────────────────────────────────────

export interface ChevronIconProps extends IconProps {
  direction: "up" | "down" | "left" | "right";
}

const TURN = { down: 0, left: 90, up: 180, right: -90 } as const;

/** A chevron that turns to point where it's told — "See All" ⌄ becoming "Hide" ⌃. */
export function ChevronIcon({ direction, size = 24, color = INK, strokeWidth = 2, style }: ChevronIconProps) {
  const angle = useSharedValue<number>(TURN[direction]);
  useEffect(() => {
    angle.value = withSpring(TURN[direction], SETTLE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction]);
  const turn = useAnimatedStyle(() => ({ transform: [{ rotate: `${angle.value}deg` }] }));
  return (
    <Animated.View style={[style, turn]} {...hidden}>
      <Glyph size={size} color={color} strokeWidth={strokeWidth}>
        <Path d="M6 9l6 6 6-6" />
      </Glyph>
    </Animated.View>
  );
}

// ─── Plus ↔ close ─────────────────────────────────────────────────────────────

export interface PlusCloseIconProps extends IconProps {
  open: boolean;
}

/** A plus that turns an eighth into a close mark. */
export function PlusCloseIcon({ open, size = 24, color = INK, strokeWidth = 2, style }: PlusCloseIconProps) {
  const p = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(open ? 1 : 0, SNAPPY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const turn = useAnimatedStyle(() => ({ transform: [{ rotate: `${p.value * 45}deg` }] }));
  return (
    <Animated.View style={[style, turn]} {...hidden}>
      <Glyph size={size} color={color} strokeWidth={strokeWidth}>
        <Path d="M12 5v14M5 12h14" />
      </Glyph>
    </Animated.View>
  );
}

// ─── Fill toggles: star, heart ────────────────────────────────────────────────

export interface ToggleIconProps extends IconProps {
  filled: boolean;
  /** Fill colour when on. */
  fillColor?: string;
}

function useFillPop(filled: boolean) {
  const p = useSharedValue(filled ? 1 : 0);
  const pop = useSharedValue(1);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    p.value = withTiming(filled ? 1 : 0, { duration: 160 });
    pop.value = filled
      ? withSequence(withTiming(0.78, { duration: 90 }), withSpring(1, { damping: 9, stiffness: 300 }))
      : withSequence(withTiming(0.9, { duration: 80 }), withSpring(1, SETTLE));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filled]);
  const fillProps = useAnimatedProps(() => ({ fillOpacity: p.value }));
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return { fillProps, popStyle, p };
}

function FillToggle({
  d,
  filled,
  size = 24,
  color = INK,
  fillColor,
  strokeWidth = 2,
  style,
}: ToggleIconProps & { d: string; fillColor: string }) {
  const { fillProps, popStyle, p } = useFillPop(filled);
  // Two outlines crossfading, so the stroke takes the fill colour without animating a colour prop.
  const offStroke = useAnimatedProps(() => ({ strokeOpacity: interpolate(p.value, [0, 1], [1, 0]) }));
  const onStroke = useAnimatedProps(() => ({ strokeOpacity: p.value }));
  return (
    <Animated.View style={[style, popStyle]} {...hidden}>
      <Glyph size={size} color={color} strokeWidth={strokeWidth}>
        <AnimatedPath d={d} fill={fillColor} animatedProps={fillProps} stroke="none" />
        <AnimatedPath d={d} animatedProps={offStroke} />
        <AnimatedPath d={d} stroke={fillColor} animatedProps={onStroke} />
      </Glyph>
    </Animated.View>
  );
}

const STAR =
  "M12 2.8l2.84 5.76 6.36.92-4.6 4.49 1.09 6.33L12 17.3l-5.69 2.99 1.09-6.33-4.6-4.49 6.36-.92z";
const HEART =
  "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7z";

/** A star that fills with a springy pop — favouriting a token. */
export function StarIcon({ fillColor = "#FFB800", ...props }: ToggleIconProps) {
  return <FillToggle d={STAR} fillColor={fillColor} {...props} />;
}

/** A heart that fills with a springy pop. */
export function HeartIcon({ fillColor = "#FF3B5C", ...props }: ToggleIconProps) {
  return <FillToggle d={HEART} fillColor={fillColor} {...props} />;
}

// ─── Trash ────────────────────────────────────────────────────────────────────

export interface TrashIconProps extends IconProps {
  /** Lift the lid — while something is being dragged or dropped in. */
  open: boolean;
}

/** A bin whose lid tips open about its left end. */
export function TrashIcon({ open, size = 24, color = INK, strokeWidth = 2, style }: TrashIconProps) {
  const p = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(open ? 1 : 0, SNAPPY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const lid = useAnimatedStyle(() => ({
    transform: [{ translateY: -2 * p.value * (size / 24) }, { rotate: `${-28 * p.value}deg` }],
  }));
  return (
    <View style={[{ width: size, height: size }, style]} {...hidden}>
      <View style={{ position: "absolute" }}>
        <Glyph size={size} color={color} strokeWidth={strokeWidth}>
          <Path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M10 11v6M14 11v6" />
        </Glyph>
      </View>
      <Animated.View
        style={[
          { position: "absolute", width: size, height: size, transformOrigin: [(3 / 24) * size, (6 / 24) * size, 0] },
          lid,
        ]}
      >
        <Glyph size={size} color={color} strokeWidth={strokeWidth}>
          <Path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </Glyph>
      </Animated.View>
    </View>
  );
}

// ─── Send ─────────────────────────────────────────────────────────────────────

export interface SendIconProps extends IconProps {
  /** Change this (a counter, an id) to fly the plane off and bring it back. */
  sendKey: string | number;
}

/** A paper plane that flies out up-right and glides back in from the lower left. */
export function SendIcon({ sendKey, size = 24, color = INK, strokeWidth = 2, style }: SendIconProps) {
  const t = useSharedValue(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    t.value = 0;
    t.value = withSequence(
      withTiming(1, { duration: 220, easing: Easing.in(Easing.quad) }),
      withTiming(-1, { duration: 0 }),
      withSpring(0, SETTLE),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendKey]);
  const fly = useAnimatedStyle(() => {
    const d = t.value * size * 0.9;
    return {
      opacity: 1 - Math.abs(t.value) * 0.9,
      transform: [{ translateX: d }, { translateY: -d }],
    };
  });
  return (
    <View style={[{ width: size, height: size, overflow: "hidden" }, style]} {...hidden}>
      <Animated.View style={fly}>
        <Glyph size={size} color={color} strokeWidth={strokeWidth}>
          <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />
        </Glyph>
      </Animated.View>
    </View>
  );
}

// ─── Copy → check ─────────────────────────────────────────────────────────────

export interface CopyIconProps extends IconProps {
  copied: boolean;
  /** Check colour once copied. Default green. */
  doneColor?: string;
}

/** The copy glyph swaps to a check while the "copied" state lasts. */
export function CopyIcon({ copied, size = 24, color = INK, doneColor = "#16A34A", strokeWidth = 2, style }: CopyIconProps) {
  return (
    <IconSwap swapKey={copied ? "done" : "copy"} style={[{ width: size, height: size }, style]}>
      {copied ? (
        <Glyph size={size} color={doneColor} strokeWidth={strokeWidth}>
          <Path d="M20 6L9 17l-5-5" />
        </Glyph>
      ) : (
        <Glyph size={size} color={color} strokeWidth={strokeWidth}>
          <Rect x={8} y={8} width={13} height={13} rx={2.5} />
          <Path d="M4 16c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h9c1.1 0 2 .9 2 2" />
        </Glyph>
      )}
    </IconSwap>
  );
}
