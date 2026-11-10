import {
  Easing,
  ReduceMotion,
  withDelay,
  withSpring,
  withTiming,
  type EasingFunction,
  type EasingFunctionFactory,
} from "react-native-reanimated";
import { springDuration, type SpringParams } from "./core/spring";

export type MorphEase = EasingFunction | EasingFunctionFactory | SpringParams;

/** torph's default curve — a strong ease-out, so motion starts the moment the value changes. */
export const DEFAULT_EASING = Easing.bezier(0.19, 1, 0.22, 1);
export const DEFAULT_DURATION = 400;

export type Motion =
  | { type: "timing"; duration: number; easing: EasingFunction | EasingFunctionFactory }
  | { type: "spring"; duration: number; spring: Required<SpringParams> };

function isSpring(ease: MorphEase): ease is SpringParams {
  return typeof ease === "object" && ease !== null && !("factory" in ease);
}

export function resolveMotion(ease: MorphEase | undefined, duration: number): Motion {
  if (ease && isSpring(ease)) {
    const spring = {
      stiffness: ease.stiffness ?? 100,
      damping: ease.damping ?? 10,
      mass: ease.mass ?? 1,
      precision: ease.precision ?? 0.001,
    };
    // A spring settles on its own physics, so it decides the duration the fades share.
    return { type: "spring", duration: springDuration(spring), spring };
  }
  return { type: "timing", duration, easing: ease ?? DEFAULT_EASING };
}

/**
 * Movement, scale and container size. Reduced motion is handled one level up (the
 * component swaps to a crossfade), so the system setting must not also zero these.
 */
export function move(target: number, motion: Motion): number {
  if (motion.type === "spring") {
    return withSpring(target, {
      stiffness: motion.spring.stiffness,
      damping: motion.spring.damping,
      mass: motion.spring.mass,
      reduceMotion: ReduceMotion.Never,
    });
  }
  return withTiming(target, {
    duration: motion.duration,
    easing: motion.easing,
    reduceMotion: ReduceMotion.Never,
  });
}

/** Opacity runs linear over a share of the morph, as in torph. */
export function fade(
  target: number,
  motion: Motion,
  share: number,
  delayShare = 0,
): number {
  const timing = withTiming(target, {
    duration: motion.duration * share,
    easing: Easing.linear,
    reduceMotion: ReduceMotion.Never,
  });
  return delayShare > 0
    ? withDelay(motion.duration * delayShare, timing, ReduceMotion.Never)
    : timing;
}

// Shares of the morph, from torph. Outgoing number glyphs fade slower because a digit
// that has already left is a hole in the number.
export const FADE = {
  enter: 0.5,
  enterDelay: 0.25,
  exit: 0.25,
  revive: 0.25,
  numberEnter: 0.25,
  numberExit: 0.45,
  groupEnter: 0.35,
  groupExit: 0.45,
} as const;

/** How far below its rest a glyph shrinks on the way in or out. Never from zero. */
export const GLYPH_SCALE = 0.95;
/** Deeper than a glyph's 0.95, so a replaced run reads as receding, not settling. */
export const GROUP_SCALE = 0.8;

/** Long enough for every exit fade to finish, after which exiting glyphs unmount. */
export function exitLifetime(motion: Motion): number {
  return Math.ceil(motion.duration * FADE.numberExit) + 34;
}
