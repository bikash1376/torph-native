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

  it("segments words and morphs between them", () => {
    const start = segmentText("Send money", "en");
    expect(start.map((s) => s.string)).toEqual(["Send", " ", "money"]);

    const { segments } = diffSegments(start, "Sending money", "en");
    const ids = segments.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(segments.map((s) => s.string).join("")).toBe("Sending money");
  });
});
