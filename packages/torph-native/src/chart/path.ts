// Pure helpers for morphing a line between datasets. Every series is resampled to the
// same number of points, so any two shapes interpolate point-for-point.

/** Linear resample of `data` to exactly `n` evenly spaced values. */
export function resample(data: readonly number[], n: number): number[] {
  if (n <= 0) return [];
  if (data.length === 0) return new Array(n).fill(0);
  if (data.length === 1) return new Array(n).fill(data[0]!);
  const out: number[] = [];
  const last = data.length - 1;
  for (let i = 0; i < n; i++) {
    const pos = (i / (n - 1)) * last;
    const lo = Math.floor(pos);
    const hi = Math.min(last, lo + 1);
    const f = pos - lo;
    out.push(data[lo]! + (data[hi]! - data[lo]!) * f);
  }
  return out;
}

/** Maps values to y pixels in [padding, height - padding], larger values higher up. */
export function toY(values: readonly number[], height: number, padding = 0): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const usable = Math.max(0, height - padding * 2);
  return values.map((v) =>
    span === 0 ? height / 2 : padding + usable * (1 - (v - min) / span),
  );
}

/** x pixel of point `i` of `count`, inset by `inset` on both sides. */
export function xAt(i: number, count: number, width: number, inset = 0): number {
  "worklet";
  return count <= 1 ? width / 2 : inset + ((width - inset * 2) * i) / (count - 1);
}

/**
 * A smooth path through the points: quadratic curves between segment midpoints,
 * which passes near every point without overshooting between them.
 */
export function smoothPath(ys: readonly number[], width: number, inset = 0): string {
  "worklet";
  const n = ys.length;
  if (n === 0) return "";
  if (n === 1) return `M${xAt(0, 1, width, inset)} ${ys[0]}`;
  let d = `M${xAt(0, n, width, inset)} ${ys[0]}`;
  for (let i = 1; i < n - 1; i++) {
    const x = xAt(i, n, width, inset);
    const nx = xAt(i + 1, n, width, inset);
    const midX = (x + nx) / 2;
    const midY = (ys[i]! + ys[i + 1]!) / 2;
    d += ` Q${x} ${ys[i]} ${midX} ${midY}`;
  }
  d += ` L${xAt(n - 1, n, width, inset)} ${ys[n - 1]}`;
  return d;
}

/** Point-wise blend of two equally long series. */
export function lerpSeries(a: readonly number[], b: readonly number[], t: number): number[] {
  "worklet";
  const out: number[] = [];
  for (let i = 0; i < b.length; i++) {
    const from = a[i] ?? b[i]!;
    out.push(from + (b[i]! - from) * t);
  }
  return out;
}
