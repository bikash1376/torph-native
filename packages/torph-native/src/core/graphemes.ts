// User-perceived characters. Intl.Segmenter when the engine has it; otherwise a small
// splitter that keeps the clusters UI text actually contains in one piece: ZWJ emoji
// (👨‍👩‍👧), skin tones (👍🏽), flags (🇮🇳), keycaps (1️⃣), tag sequences (🏴󠁧󠁢󠁳󠁣󠁴󠁿),
// variation selectors and combining marks (é written as e + ◌́).

const ZWJ = 0x200d;

function isExtender(cp: number): boolean {
  return (
    (cp >= 0x0300 && cp <= 0x036f) || // combining diacritics
    (cp >= 0x1ab0 && cp <= 0x1aff) ||
    (cp >= 0x1dc0 && cp <= 0x1dff) ||
    (cp >= 0x20d0 && cp <= 0x20ff) || // combining marks for symbols, incl. keycap U+20E3
    (cp >= 0xfe00 && cp <= 0xfe0f) || // variation selectors
    (cp >= 0xfe20 && cp <= 0xfe2f) ||
    (cp >= 0x1f3fb && cp <= 0x1f3ff) || // skin tone modifiers
    (cp >= 0xe0020 && cp <= 0xe007f) || // tag characters
    (cp >= 0x0900 && cp <= 0x0903) || // Devanagari signs
    (cp >= 0x093a && cp <= 0x094f) ||
    (cp >= 0x0951 && cp <= 0x0957) ||
    (cp >= 0x0962 && cp <= 0x0963)
  );
}

function isRegionalIndicator(cp: number): boolean {
  return cp >= 0x1f1e6 && cp <= 0x1f1ff;
}

export function graphemesFallback(value: string): string[] {
  const points = Array.from(value);
  const out: string[] = [];
  let i = 0;
  while (i < points.length) {
    let cluster = points[i]!;
    const first = cluster.codePointAt(0)!;
    i++;

    // A flag is a pair of regional indicators.
    if (isRegionalIndicator(first) && i < points.length) {
      const next = points[i]!.codePointAt(0)!;
      if (isRegionalIndicator(next)) {
        cluster += points[i]!;
        i++;
      }
    }

    while (i < points.length) {
      const cp = points[i]!.codePointAt(0)!;
      if (isExtender(cp)) {
        cluster += points[i]!;
        i++;
      } else if (cp === ZWJ && i + 1 < points.length) {
        cluster += points[i]! + points[i + 1]!;
        i += 2;
      } else {
        break;
      }
    }
    out.push(cluster);
  }
  return out;
}

let segmenter: Intl.Segmenter | undefined;

export function splitGraphemes(value: string): string[] {
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter !== "undefined") {
    segmenter ??= new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(value), (s) => s.segment);
  }
  return graphemesFallback(value);
}
