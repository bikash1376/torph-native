/** Numeric segments slide instead of fading, and digits and symbols slide opposite ways. */
export type SegmentKind = "digit" | "symbol";

export type Segment = {
  id: string;
  string: string;
  /** Absent for ordinary text. */
  kind?: SegmentKind;
};
