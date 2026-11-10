import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { diffSegments } from "../core/diff";
import { segmentText } from "../core/segment";

// Hermes builds without Intl.Segmenter take the fallback path; it must stay usable.
describe("without Intl.Segmenter", () => {
  const original = Intl.Segmenter;

  beforeEach(() => {
    // @ts-expect-error simulating an engine without it
    delete Intl.Segmenter;
  });

  afterEach(() => {
    Object.defineProperty(Intl, "Segmenter", { value: original, configurable: true, writable: true });
  });

  it("keeps astral characters whole instead of splitting surrogate pairs", () => {
    const segments = segmentText("hi🚀", "en");
    expect(segments.map((s) => s.string)).toEqual(["h", "i", "🚀"]);
  });

  it("keeps multi-code-point emoji whole", () => {
    expect(segmentText("a👨‍👩‍👧b", "en").map((s) => s.string)).toEqual(["a", "👨‍👩‍👧", "b"]);
    expect(segmentText("👍🏽🇮🇳1️⃣", "en").map((s) => s.string)).toEqual(["👍🏽", "🇮🇳", "1️⃣"]);
    expect(segmentText("café", "en").map((s) => s.string)).toEqual(["c", "a", "f", "é"]);
  });

  it("morphs emoji inside a phrase without splitting them", () => {
    const start = segmentText("Not enough ETH", "en");
    const { segments } = diffSegments(start, "Still not enough ETH 😳", "en");
    expect(segments.map((s) => s.string)).toContain("😳");
  });

  it("segments words and morphs between them", () => {
    const start = segmentText("Send money", "en");
    expect(start.map((s) => s.string)).toEqual(["Send", " ", "money"]);

    const { segments } = diffSegments(start, "Sending money", "en");
    const ids = segments.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(segments.map((s) => s.string).join("")).toBe("Sending money");
  });
});
