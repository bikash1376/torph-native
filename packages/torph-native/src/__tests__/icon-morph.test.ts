import { describe, expect, it } from "vitest";
import {
  blendShapes,
  circlePath,
  flattenPath,
  pairShapes,
  rectPath,
  resampleShape,
  toShapes,
} from "../icons/morph";

describe("flattenPath", () => {
  it("reads absolute and relative lines, H and V", () => {
    const [sub] = flattenPath("M2 2L10 2h4v6l-2 2");
    expect(sub!.points).toEqual([
      [2, 2],
      [10, 2],
      [14, 2],
      [14, 8],
      [12, 10],
    ]);
    expect(sub!.closed).toBe(false);
  });

  it("splits subpaths at each move and marks closed ones", () => {
    const subs = flattenPath("M0 0h4v4z M10 10l2 2");
    expect(subs).toHaveLength(2);
    expect(subs[0]!.closed).toBe(true);
    expect(subs[1]!.closed).toBe(false);
  });

  it("treats numbers after a move as implicit lines", () => {
    const [sub] = flattenPath("M0 0 5 0 5 5");
    expect(sub!.points).toEqual([
      [0, 0],
      [5, 0],
      [5, 5],
    ]);
  });

  it("parses arcs with packed flags and lands on the endpoint", () => {
    const [sub] = flattenPath("M16 7a4 4 0 00-8 0");
    const last = sub!.points[sub!.points.length - 1]!;
    expect(last[0]).toBeCloseTo(8);
    expect(last[1]).toBeCloseTo(7);
    // The arc bulges upward to y = 3.
    expect(Math.min(...sub!.points.map((p) => p[1]))).toBeCloseTo(3, 0);
  });

  it("flattens curves through their endpoints", () => {
    const [sub] = flattenPath("M0 0C0 10 10 10 10 0S20 -10 20 0Q25 5 30 0T40 0");
    const last = sub!.points[sub!.points.length - 1]!;
    expect(last).toEqual([40, 0]);
  });

  it("builds a circle that stays on its radius", () => {
    const [sub] = flattenPath(circlePath(12, 12, 9));
    for (const [x, y] of sub!.points) expect(Math.hypot(x - 12, y - 12)).toBeCloseTo(9, 4);
    expect(sub!.closed).toBe(true);
  });

  it("builds rounded rects", () => {
    const [sub] = flattenPath(rectPath(5, 11, 14, 10, 2));
    const xs = sub!.points.map((p) => p[0]);
    expect(Math.min(...xs)).toBeCloseTo(5);
    expect(Math.max(...xs)).toBeCloseTo(19);
  });
});

describe("resampleShape", () => {
  it("spaces points evenly by length", () => {
    const out = resampleShape(
      [
        [0, 0],
        [10, 0],
      ],
      false,
      3,
    );
    expect(out).toEqual([0, 0, 5, 0, 10, 0]);
  });

  it("does not repeat the start of a closed loop", () => {
    const out = resampleShape(
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
      ],
      true,
      4,
    );
    expect(out).toEqual([0, 0, 4, 0, 4, 4, 0, 4]);
  });

  it("collapses a zero-length path to a dot", () => {
    expect(resampleShape([[3, 3]], false, 2)).toEqual([3, 3, 3, 3]);
  });
});

describe("pairShapes", () => {
  const menu = toShapes(["M4 6h16", "M4 12h16", "M4 18h16"], 8);
  const close = toShapes(["M6 6l12 12", "M18 6L6 18"], 8);

  it("pads the side with fewer strokes so both have the same count", () => {
    const { from, to } = pairShapes(menu, close);
    expect(from).toHaveLength(3);
    expect(to).toHaveLength(3);
    for (const s of [...from, ...to]) expect(s.points).toHaveLength(16);
  });

  it("shrinks an unpaired stroke into its own centre", () => {
    const { to } = pairShapes(menu, close);
    const collapsed = to.find((s) => new Set(s.points).size <= 2);
    expect(collapsed).toBeDefined();
  });

  it("lands exactly on the target at t = 1 and on the source at t = 0", () => {
    const { from, to } = pairShapes(menu, close);
    expect(blendShapes(from, to, 1).map((s) => s.points)).toEqual(to.map((s) => s.points));
    expect(blendShapes(from, to, 0).map((s) => s.points)).toEqual(from.map((s) => s.points));
  });

  it("reverses an open stroke when that is the shorter way", () => {
    const a = toShapes("M0 0L10 0", 4);
    const b = toShapes("M10 0L0 0", 4);
    const { to } = pairShapes(a, b);
    to[0]!.points.forEach((v, i) => expect(v).toBeCloseTo(a[0]!.points[i]!, 6));
  });
});
