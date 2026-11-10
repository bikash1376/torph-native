import { describe, expect, it } from "vitest";
import { lerpSeries, resample, smoothPath, toY } from "../chart/path";
import { graphemesFallback } from "../core/graphemes";
import { fitScale } from "../fit";

describe("resample", () => {
  it("returns exactly n points spanning the first and last values", () => {
    const out = resample([0, 10, 20], 5);
    expect(out).toEqual([0, 5, 10, 15, 20]);
  });

  it("handles empty and single-value series", () => {
    expect(resample([], 3)).toEqual([0, 0, 0]);
    expect(resample([7], 3)).toEqual([7, 7, 7]);
  });
});

describe("toY", () => {
  it("puts the max at the top padding and the min at the bottom", () => {
    expect(toY([0, 5, 10], 100, 10)).toEqual([90, 50, 10]);
  });

  it("centres a flat series", () => {
    expect(toY([3, 3], 80)).toEqual([40, 40]);
  });
});

describe("smoothPath / lerpSeries", () => {
  it("starts and ends on the first and last points", () => {
    const d = smoothPath([10, 20, 30], 100);
    expect(d.startsWith("M0 10")).toBe(true);
    expect(d.endsWith("L100 30")).toBe(true);
  });

  it("blends two series point-wise", () => {
    expect(lerpSeries([0, 10], [10, 30], 0.5)).toEqual([5, 20]);
  });
});

describe("graphemesFallback", () => {
  it("joins ZWJ sequences, modifiers, flags and keycaps", () => {
    expect(graphemesFallback("👩‍💻👋🏾🇯🇵#️⃣x")).toEqual(["👩‍💻", "👋🏾", "🇯🇵", "#️⃣", "x"]);
  });
});

describe("fitScale", () => {
  it("only ever shrinks", () => {
    expect(fitScale(100, 200)).toBe(1);
    expect(fitScale(400, 200)).toBe(0.5);
    expect(fitScale(400)).toBe(1);
  });
});
