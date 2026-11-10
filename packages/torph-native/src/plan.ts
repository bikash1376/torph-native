// The React Native stand-in for torph's DOM measure → reconcile → FLIP pass.
//
// torph lets the browser lay the spans out and then measures them. Here the layout is
// computed from measured glyph widths, so every position is known before anything
// renders and no frame shows the new layout without its correcting transform.

import type { Segment, SegmentKind } from "./core/types";

/** Below this, a run of replaced characters still has a survivor near enough to move from. */
export const GROUP_MIN = 6;

export type Align = "left" | "center" | "right";

export type Point = { x: number; y: number };

export type Phase = "initial" | "persist" | "enter" | "exit";

export interface GlyphPlan {
  id: string;
  string: string;
  kind?: SegmentKind;
  width: number;
  /** Resting position: the layout slot for a live glyph, the last slot it held for an exiting one. */
  x: number;
  y: number;
  phase: Phase;
  /** Live glyphs: where a glyph that mounts this frame starts. Ignored once mounted. */
  from?: Point;
  /** Exiting glyphs: where it drifts while it leaves, following its nearest survivor. */
  to?: Point;
  /** Centre of the run this glyph enters or leaves with, when it goes as part of one. */
  group?: Point;
  /** Exiting glyphs: the frame the exit started in, so a stale removal can't clip a later one. */
  exitFrame?: number;
}

export interface FramePlan {
  frame: number;
  glyphs: GlyphPlan[];
  width: number;
  height: number;
  lineHeight: number;
}

type Placed = {
  id: string;
  string: string;
  kind?: SegmentKind;
  width: number;
  x: number;
  y: number;
};

export function isWhitespace(value: string): boolean {
  return value === " " || value === " " || value === "​";
}

/** Places segments on lines. The root never wraps: a line exists only where the value put one. */
export function layoutSegments(
  segments: Segment[],
  measure: (value: string) => number,
  lineHeight: number,
  align: Align = "left",
): { placed: Placed[]; width: number; height: number } {
  const lines: Placed[][] = [[]];
  const lineWidths: number[] = [0];

  for (const segment of segments) {
    if (segment.string === "\n") {
      lines.push([]);
      lineWidths.push(0);
      continue;
    }
    const line = lines.length - 1;
    const width = measure(segment.string);
    lines[line]!.push({
      id: segment.id,
      string: segment.string,
      kind: segment.kind,
      width,
      x: lineWidths[line]!,
      y: line * lineHeight,
    });
    lineWidths[line]! += width;
  }

  const width = Math.max(0, ...lineWidths);
  const placed: Placed[] = [];
  lines.forEach((line, i) => {
    const slack = width - lineWidths[i]!;
    const offset = align === "center" ? slack / 2 : align === "right" ? slack : 0;
    for (const glyph of line) placed.push({ ...glyph, x: glyph.x + offset });
  });

  return { placed, width, height: lines.length * lineHeight };
}

/** Nearest persisting neighbour by ID. Ported from torph's flip.ts. */
export function findNearestAnchor(
  targetIndex: number,
  ids: string[],
  persistentIds: Set<string>,
  direction: "backward-first" | "forward-first" = "backward-first",
): string | null {
  const backward = () => {
    for (let j = targetIndex - 1; j >= 0; j--) {
      if (persistentIds.has(ids[j]!)) return ids[j]!;
    }
    return null;
  };
  const forward = () => {
    for (let j = targetIndex + 1; j < ids.length; j++) {
      if (persistentIds.has(ids[j]!)) return ids[j]!;
    }
    return null;
  };
  return direction === "backward-first"
    ? (backward() ?? forward())
    : (forward() ?? backward());
}

/**
 * Maximal stretches of `members` adjacent in `all`, at least GROUP_MIN long. A run
 * broken by a survivor is no replacement — that survivor is right there to move from.
 */
export function replacedRuns<T>(all: T[], members: Set<T>): T[][] {
  const runs: T[][] = [];
  let run: T[] = [];
  const flush = () => {
    if (run.length >= GROUP_MIN) runs.push(run);
    run = [];
  };
  for (const item of all) {
    if (members.has(item)) run.push(item);
    else flush();
  }
  flush();
  return runs;
}

function centreOf(glyphs: Placed[], lineHeight: number): Point {
  const left = Math.min(...glyphs.map((g) => g.x));
  const right = Math.max(...glyphs.map((g) => g.x + g.width));
  const top = Math.min(...glyphs.map((g) => g.y));
  const bottom = Math.max(...glyphs.map((g) => g.y + lineHeight));
  return { x: (left + right) / 2, y: (top + bottom) / 2 };
}

export interface PlanInput {
  /** The committed plan this frame morphs from, or null for a first render. */
  prev: FramePlan | null;
  segments: Segment[];
  /** Old word IDs the diff cut into per-character segments. */
  splits: Map<string, Segment[]>;
  measure: (value: string) => number;
  lineHeight: number;
  align?: Align;
}

export function planFrame(input: PlanInput): FramePlan {
  const { prev, segments, splits, measure, lineHeight, align = "left" } = input;
  const frame = (prev?.frame ?? 0) + 1;
  const layout = layoutSegments(segments, measure, lineHeight, align);

  if (!prev) {
    return {
      frame,
      glyphs: layout.placed.map((g) => ({ ...g, phase: "initial" })),
      width: layout.width,
      height: layout.height,
      lineHeight,
    };
  }

  // The old line-up, with any word the diff cut up replaced by its characters.
  const oldOrder: Placed[] = [];
  for (const glyph of prev.glyphs) {
    if (glyph.phase === "exit") continue;
    const chars = splits.get(glyph.id);
    if (!chars) {
      oldOrder.push(glyph);
      continue;
    }
    let offset = 0;
    for (const char of chars) {
      const width = measure(char.string);
      oldOrder.push({
        id: char.id,
        string: char.string,
        kind: char.kind,
        width,
        x: glyph.x + offset,
        y: glyph.y,
      });
      offset += width;
    }
  }

  const prevPos = new Map(oldOrder.map((g) => [g.id, g]));
  const newPos = new Map(layout.placed.map((g) => [g.id, g]));

  // Exits: old glyphs whose IDs the new value no longer holds.
  const oldIds = oldOrder.map((g) => g.id);
  const exiting = new Set(oldOrder.filter((g) => !newPos.has(g.id)));
  const persistentOld = new Set(oldIds.filter((id) => newPos.has(id)));

  const exitGroups = new Map<Placed, Point>();
  for (const run of replacedRuns(oldOrder, exiting)) {
    const centre = centreOf(run, lineHeight);
    for (const glyph of run) exitGroups.set(glyph, centre);
  }

  const exitPlans: GlyphPlan[] = [];
  oldOrder.forEach((glyph, index) => {
    if (!exiting.has(glyph)) return;
    const group = exitGroups.get(glyph);
    let to: Point = { x: glyph.x, y: glyph.y };
    if (!group) {
      const anchor = findNearestAnchor(index, oldIds, persistentOld, "forward-first");
      if (anchor) {
        const before = prevPos.get(anchor)!;
        const after = newPos.get(anchor)!;
        to = { x: glyph.x + after.x - before.x, y: glyph.y + after.y - before.y };
      }
    }
    exitPlans.push({ ...glyph, phase: "exit", to, group, exitFrame: frame });
  });

  // Arrivals: new glyphs with no previous slot.
  const newIds = layout.placed.map((g) => g.id);
  const arriving = new Set(layout.placed.filter((g) => !prevPos.has(g.id)));
  const persistentNew = new Set(newIds.filter((id) => prevPos.has(id)));

  const enterGroups = new Map<Placed, Point>();
  for (const run of replacedRuns(layout.placed, arriving)) {
    const centre = centreOf(run, lineHeight);
    for (const glyph of run) enterGroups.set(glyph, centre);
  }

  const livePlans: GlyphPlan[] = layout.placed.map((glyph, index) => {
    const before = prevPos.get(glyph.id);
    if (before) {
      return { ...glyph, phase: "persist", from: { x: before.x, y: before.y } };
    }

    const group = enterGroups.get(glyph);
    if (group) return { ...glyph, phase: "enter", group };

    // Rides in with its nearest survivor, so it appears to come from where that one was.
    const anchor = findNearestAnchor(index, newIds, persistentNew, "backward-first");
    let from: Point = { x: glyph.x, y: glyph.y };
    if (anchor) {
      const was = prevPos.get(anchor)!;
      const now = newPos.get(anchor)!;
      from = { x: glyph.x + was.x - now.x, y: glyph.y + was.y - now.y };
    }
    return { ...glyph, phase: "enter", from };
  });

  // Exits still in flight from earlier frames carry on unless their ID came back.
  const live = new Set(newIds);
  const fresh = new Set(exitPlans.map((g) => g.id));
  const inFlight = prev.glyphs.filter(
    (g) => g.phase === "exit" && !live.has(g.id) && !fresh.has(g.id),
  );

  return {
    frame,
    glyphs: [...livePlans, ...exitPlans, ...inFlight],
    width: layout.width,
    height: layout.height,
    lineHeight,
  };
}

/** Every distinct string a frame needs a width for, split characters included. */
export function requiredStrings(
  segments: Segment[],
  splits: Map<string, Segment[]>,
): Set<string> {
  const strings = new Set<string>();
  for (const segment of segments) {
    if (segment.string !== "\n") strings.add(segment.string);
  }
  for (const chars of splits.values()) {
    for (const char of chars) strings.add(char.string);
  }
  return strings;
}
