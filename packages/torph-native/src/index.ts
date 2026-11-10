export { TextMorph } from "./TextMorph";
export type { TextMorphProps } from "./TextMorph";
export type { MorphEase } from "./motion";
export { DEFAULT_DURATION, DEFAULT_EASING } from "./motion";
export type { SpringParams } from "./core/spring";

// The engine underneath, for building other renderers (Skia, SVG) on the same diff.
export { segmentText } from "./core/segment";
export type { Segment, SegmentKind } from "./core/types";
export { diffSegments } from "./core/diff";
export type { DiffOptions, DiffResult } from "./core/diff";
export { decimalSeparator, isNumericWord, segmentNumber } from "./core/number";
export type { NumberSegment } from "./core/number";
export { planFrame, layoutSegments, GROUP_MIN } from "./plan";
export type { FramePlan, GlyphPlan, Align, Phase } from "./plan";
