// Text
export { TextMorph } from "./TextMorph";
export type { TextMorphProps } from "./TextMorph";
export type { MorphEase } from "./motion";
export { DEFAULT_DURATION, DEFAULT_EASING } from "./motion";
export type { SpringParams } from "./core/spring";

// Icons and emoji (no SVG needed; animated SVG icons live in "torph-native/icons")
export { IconSwap } from "./IconSwap";
export type { IconSwapProps, IconSwapVariant } from "./IconSwap";

// Surfaces and layout
export { MorphTray, TRAY_SPRING } from "./MorphTray";
export type { MorphTrayProps } from "./MorphTray";
export { MorphBox, BOX_SPRING } from "./MorphBox";
export type { MorphBoxProps } from "./MorphBox";
export { MorphItem } from "./MorphItem";
export type { MorphItemProps } from "./MorphItem";
export { StepIndicator } from "./StepIndicator";
export type { StepIndicatorProps } from "./StepIndicator";

// The engine underneath, for building other renderers (Skia, SVG) on the same diff.
export { segmentText } from "./core/segment";
export type { Segment, SegmentKind } from "./core/types";
export { diffSegments } from "./core/diff";
export type { DiffOptions, DiffResult } from "./core/diff";
export { decimalSeparator, isNumericWord, segmentNumber } from "./core/number";
export type { NumberSegment } from "./core/number";
export { splitGraphemes } from "./core/graphemes";
export { planFrame, layoutSegments, GROUP_MIN } from "./plan";
export type { FramePlan, GlyphPlan, Align, Phase } from "./plan";
