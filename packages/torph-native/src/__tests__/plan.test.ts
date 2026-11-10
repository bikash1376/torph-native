import { describe, expect, it } from "vitest";
import { diffSegments } from "../core/diff";
import { segmentText } from "../core/segment";
import type { Segment } from "../core/types";
import {
  GROUP_MIN,
  layoutSegments,
  planFrame,
  requiredStrings,
  type FramePlan,
} from "../plan";

// Every grapheme is 10 wide, so positions are easy to read.
const measure = (value: string) => [...value].length * 10;
const LINE = 20;

type State = { plan: FramePlan; segments: Segment[] };

function first(text: string): State {
  const segments = segmentText(text, "en");
  const plan = planFrame({
    prev: null,
    segments,
    splits: new Map(),
    measure,
    lineHeight: LINE,
  });
  return { plan, segments };
}

function morph(from: State, text: string): State {
  const { segments, splits } =
    from.segments.length > 0
      ? diffSegments(from.segments, text, "en")
      : { segments: segmentText(text, "en"), splits: new Map<string, Segment[]>() };
  const plan = planFrame({ prev: from.plan, segments, splits, measure, lineHeight: LINE });
  return { plan, segments };
}

const find = (plan: FramePlan, value: string, phase: string) =>
  plan.glyphs.find((g) => g.string === value && g.phase === phase)!;

describe("layoutSegments", () => {
  it("places glyphs left to right and sizes the box", () => {
    const { placed, width, height } = layoutSegments(segmentText("abc", "en"), measure, LINE);
    expect(placed.map((g) => g.x)).toEqual([0, 10, 20]);
    expect(width).toBe(30);
    expect(height).toBe(LINE);
  });

  it("starts a new line at each newline and centres lines within the widest", () => {
    const { placed, width, height } = layoutSegments(
      segmentText("abcd\nef", "en"),
      measure,
      LINE,
      "center",
    );
    expect(width).toBe(40);
    expect(height).toBe(LINE * 2);
    expect(placed.find((g) => g.string === "ef")).toMatchObject({ x: 10, y: LINE });
  });

  it("right-aligns", () => {
    const { placed } = layoutSegments(segmentText("abcd\nef", "en"), measure, LINE, "right");
    expect(placed.find((g) => g.string === "ef")!.x).toBe(20);
  });

  it("gives an empty value one line of height and no width", () => {
    expect(layoutSegments([], measure, LINE)).toMatchObject({ width: 0, height: LINE });
  });
});

describe("planFrame", () => {
  it("renders a first value without animation", () => {
    const { plan } = first("Continue");
    expect(plan.glyphs.every((g) => g.phase === "initial")).toBe(true);
    expect(plan.width).toBe(80);
  });

  it("keeps shared letters and moves them from where they were (Continue → Confirm)", () => {
    const next = morph(first("Continue"), "Confirm").plan;

    for (const letter of ["C", "o", "n", "i"]) {
      expect(find(next, letter, "persist")).toBeDefined();
    }
    const i = find(next, "i", "persist");
    expect(i.from).toEqual({ x: 40, y: 0 });
    expect(i.x).toBe(40);

    const exits = next.glyphs.filter((g) => g.phase === "exit").map((g) => g.string);
    expect(exits.sort()).toEqual(["e", "n", "t", "u"]);

    const enters = next.glyphs.filter((g) => g.phase === "enter").map((g) => g.string);
    expect(enters.sort()).toEqual(["f", "m", "r"]);
    expect(next.width).toBe(70);
  });

  it("starts an arriving glyph where its nearest survivor was", () => {
    // "b" survives and shifts right by 10; the new "x" after it rides in with it.
    const next = morph(first("bc"), "abxc").plan;
    const b = find(next, "b", "persist");
    expect(b.x - b.from!.x).toBe(10);
    const x = find(next, "x", "enter");
    expect(x.from).toEqual({ x: x.x - 10, y: 0 });
  });

  it("drifts an exiting glyph with its nearest survivor", () => {
    // "c" leaves; the "d" after it moves left by 10, so "c" drifts left with it.
    const next = morph(first("abcd"), "abd").plan;
    const c = find(next, "c", "exit");
    expect(c.x).toBe(20);
    expect(c.to).toEqual({ x: 10, y: 0 });
  });

  it("starts the characters of a split word at their place inside the old word", () => {
    const start = first("Safe Mode");
    const { segments, splits } = diffSegments(start.segments, "Safe Model", "en");
    expect(splits.size).toBe(1);

    const next = planFrame({ prev: start.plan, segments, splits, measure, lineHeight: LINE });
    const word = start.plan.glyphs.find((g) => g.string === "Mode")!;
    const d = find(next, "d", "persist");
    expect(d.from).toEqual({ x: word.x + 20, y: 0 });
    // The whole-word glyph is replaced by its characters, not animated out.
    expect(next.glyphs.some((g) => g.id === word.id)).toBe(false);
  });

  it("collapses a long run of wholly replaced glyphs as a group", () => {
    const next = morph(first("abcdefgh"), "zyxwvuts").plan;
    const exits = next.glyphs.filter((g) => g.phase === "exit");
    const enters = next.glyphs.filter((g) => g.phase === "enter");
    expect(exits.length).toBeGreaterThanOrEqual(GROUP_MIN);
    expect(exits.every((g) => g.group)).toBe(true);
    expect(enters.every((g) => g.group)).toBe(true);
    expect(exits[0]!.group).toEqual({ x: 40, y: LINE / 2 });
    // A grouped exit recedes in place instead of drifting.
    expect(exits.every((g) => g.to!.x === g.x)).toBe(true);
  });

  it("does not group a short replacement", () => {
    const next = morph(first("abc"), "xyz").plan;
    expect(next.glyphs.some((g) => g.group)).toBe(false);
  });

  it("marks number glyphs so they roll", () => {
    const next = morph(first("$1,204"), "$1,318").plan;
    const entering = next.glyphs.filter((g) => g.phase === "enter");
    const exiting = next.glyphs.filter((g) => g.phase === "exit");
    expect(entering.length).toBeGreaterThan(0);
    expect(entering.every((g) => g.kind === "digit" || g.kind === "symbol")).toBe(true);
    expect(exiting.every((g) => g.kind)).toBe(true);
    // The thousands place is untouched.
    expect(find(next, "1", "persist")).toBeDefined();
  });

  it("carries an in-flight exit into the next frame, stamped with the frame it began in", () => {
    const b = morph(first("abcd"), "abd");
    const c = morph(b, "ab");
    expect(c.plan.glyphs.find((g) => g.string === "c")).toMatchObject({
      phase: "exit",
      exitFrame: b.plan.frame,
    });
    expect(c.plan.glyphs.find((g) => g.string === "d")).toMatchObject({
      phase: "exit",
      exitFrame: c.plan.frame,
    });
  });

  it("revives a glyph whose ID comes back while it is still leaving", () => {
    const b = morph(first("abcd"), "abd");
    const c = morph(b, "abcd");
    const glyphs = c.plan.glyphs.filter((g) => g.string === "c");
    expect(glyphs).toHaveLength(1);
    expect(glyphs[0]!.phase).not.toBe("exit");
  });

  it("keeps IDs unique across live and exiting glyphs through a run of morphs", () => {
    let state = first("Hello world");
    for (const text of [
      "Hello there world",
      "Help",
      "",
      "12,000",
      "12,500.50",
      "Line one\nLine two",
      "Hello world",
    ]) {
      state = morph(state, text);
      const ids = state.plan.glyphs.map((g) => g.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("requiredStrings", () => {
  it("includes the characters of split words and skips newlines", () => {
    const start = segmentText("Safe Mode\nok", "en");
    const { segments, splits } = diffSegments(start, "Safe Model\nok", "en");
    const strings = requiredStrings(segments, splits);
    expect(strings.has("\n")).toBe(false);
    for (const char of "Mode") expect(strings.has(char)).toBe(true);
  });
});
