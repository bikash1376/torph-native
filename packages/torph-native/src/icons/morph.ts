// Turns any SVG path data into evenly sampled point lists, then pairs two icons'
// subpaths so they can be blended point for point. Pure and dependency-free: the
// per-frame blend in IconMorph is just arithmetic on what this produces.

/**
 * One stroke as a flat [x0, y0, x1, y1, …] list. A closed stroke repeats its first
 * point at the end, so it needs no "Z" — and never snaps shut mid-morph.
 * `ghost` marks a collapsed stand-in for a stroke the other icon doesn't have.
 */
export type Shape = { points: number[]; closed: boolean; ghost?: "in" | "out" };

type Pt = [number, number];

// ─── Parsing ──────────────────────────────────────────────────────────────────

class Reader {
  i = 0;
  constructor(private s: string) {}

  private skip() {
    while (this.i < this.s.length && /[\s,]/.test(this.s[this.i]!)) this.i++;
  }
  done() {
    this.skip();
    return this.i >= this.s.length;
  }
  command(): string | null {
    this.skip();
    const c = this.s[this.i];
    if (c && /[a-zA-Z]/.test(c)) {
      this.i++;
      return c;
    }
    return null;
  }
  hasNumber() {
    this.skip();
    return this.i < this.s.length && /[-+.\d]/.test(this.s[this.i]!);
  }
  number(): number {
    this.skip();
    const m = /^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/.exec(this.s.slice(this.i));
    if (!m) throw new Error(`Bad path data near "${this.s.slice(this.i, this.i + 12)}"`);
    this.i += m[0].length;
    return parseFloat(m[0]);
  }
  /** Arc flags may be written without separators ("a4 4 0 01-8 0"), one digit each. */
  flag(): number {
    this.skip();
    const c = this.s[this.i];
    if (c !== "0" && c !== "1") throw new Error("Bad arc flag in path data");
    this.i++;
    return c === "1" ? 1 : 0;
  }
}

const CURVE_STEPS = 16;

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, out: Pt[]) {
  for (let k = 1; k <= CURVE_STEPS; k++) {
    const t = k / CURVE_STEPS;
    const u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
}

function quad(p0: Pt, p1: Pt, p2: Pt, out: Pt[]) {
  for (let k = 1; k <= CURVE_STEPS; k++) {
    const t = k / CURVE_STEPS;
    const u = 1 - t;
    out.push([
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ]);
  }
}

function vecAngle(ux: number, uy: number, vx: number, vy: number) {
  return Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
}

// SVG arc, endpoint → centre parameterisation (SVG 1.1 implementation notes F.6.5).
function arc(
  p0: Pt,
  rxIn: number,
  ryIn: number,
  rotation: number,
  large: number,
  sweep: number,
  p1: Pt,
  out: Pt[],
) {
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (rx === 0 || ry === 0) {
    out.push(p1);
    return;
  }
  const phi = (rotation * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (p0[0] - p1[0]) / 2;
  const dy = (p0[1] - p1[1]) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = (large !== sweep ? 1 : -1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (p0[0] + p1[0]) / 2;
  const cy = sin * cxp + cos * cyp + (p0[1] + p1[1]) / 2;
  const theta = vecAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = vecAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  const steps = Math.max(4, Math.ceil((Math.abs(delta) / (Math.PI * 2)) * 32));
  for (let k = 1; k <= steps; k++) {
    const a = theta + (delta * k) / steps;
    out.push([
      cx + rx * Math.cos(a) * cos - ry * Math.sin(a) * sin,
      cy + rx * Math.cos(a) * sin + ry * Math.sin(a) * cos,
    ]);
  }
}

/** Flattens path data into subpaths of points. Handles every SVG path command. */
export function flattenPath(d: string): { points: Pt[]; closed: boolean }[] {
  const r = new Reader(d);
  const subs: { points: Pt[]; closed: boolean }[] = [];
  let cur: Pt = [0, 0];
  let start: Pt = [0, 0];
  let points: Pt[] | null = null;
  let lastCtrl: Pt | null = null;
  let lastCmd = "";
  let cmd: string | null = null;

  const begin = (p: Pt) => {
    if (points && points.length) subs.push({ points, closed: false });
    points = [p];
    start = p;
  };

  while (!r.done()) {
    const next = r.command();
    if (next) cmd = next;
    else if (!cmd) throw new Error("Path data must start with a command");
    else if (cmd === "M") cmd = "L";
    else if (cmd === "m") cmd = "l";

    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? cur[0] : 0;
    const oy = rel ? cur[1] : 0;
    if (!points && C !== "M") begin(cur);
    const out = points as unknown as Pt[];

    switch (C) {
      case "M": {
        const p: Pt = [ox + r.number(), oy + r.number()];
        begin(p);
        cur = p;
        lastCtrl = null;
        break;
      }
      case "L": {
        const p: Pt = [ox + r.number(), oy + r.number()];
        points!.push(p);
        cur = p;
        lastCtrl = null;
        break;
      }
      case "H": {
        const p: Pt = [(rel ? cur[0] : 0) + r.number(), cur[1]];
        out.push(p);
        cur = p;
        lastCtrl = null;
        break;
      }
      case "V": {
        const p: Pt = [cur[0], (rel ? cur[1] : 0) + r.number()];
        out.push(p);
        cur = p;
        lastCtrl = null;
        break;
      }
      case "C": {
        const c1: Pt = [ox + r.number(), oy + r.number()];
        const c2: Pt = [ox + r.number(), oy + r.number()];
        const p: Pt = [ox + r.number(), oy + r.number()];
        cubic(cur, c1, c2, p, out);
        lastCtrl = c2;
        cur = p;
        break;
      }
      case "S": {
        const c1: Pt =
          lastCtrl && /[CcSs]/.test(lastCmd) ? [2 * cur[0] - lastCtrl[0], 2 * cur[1] - lastCtrl[1]] : cur;
        const c2: Pt = [ox + r.number(), oy + r.number()];
        const p: Pt = [ox + r.number(), oy + r.number()];
        cubic(cur, c1, c2, p, out);
        lastCtrl = c2;
        cur = p;
        break;
      }
      case "Q": {
        const c: Pt = [ox + r.number(), oy + r.number()];
        const p: Pt = [ox + r.number(), oy + r.number()];
        quad(cur, c, p, out);
        lastCtrl = c;
        cur = p;
        break;
      }
      case "T": {
        const c: Pt =
          lastCtrl && /[QqTt]/.test(lastCmd) ? [2 * cur[0] - lastCtrl[0], 2 * cur[1] - lastCtrl[1]] : cur;
        const p: Pt = [ox + r.number(), oy + r.number()];
        quad(cur, c, p, out);
        lastCtrl = c;
        cur = p;
        break;
      }
      case "A": {
        const rx = r.number();
        const ry = r.number();
        const rot = r.number();
        const large = r.flag();
        const sweep = r.flag();
        const p: Pt = [ox + r.number(), oy + r.number()];
        arc(cur, rx, ry, rot, large, sweep, p, out);
        cur = p;
        lastCtrl = null;
        break;
      }
      case "Z": {
        if (points) {
          subs.push({ points, closed: true });
          points = null;
        }
        cur = start;
        lastCtrl = null;
        break;
      }
      default:
        throw new Error(`Unsupported path command "${cmd}"`);
    }
    lastCmd = cmd;
    // Z takes no arguments, so it can never repeat implicitly.
    if (C === "Z") cmd = null;
  }
  if (points && (points as Pt[]).length) subs.push({ points, closed: false });
  return subs;
}

// ─── Resampling ───────────────────────────────────────────────────────────────

/** `n` points evenly spaced by length along the polyline (around the loop, back to the start, if closed). */
export function resampleShape(pts: Pt[], closed: boolean, n: number): number[] {
  const ring = closed && pts.length > 1 ? [...pts, pts[0]!] : pts;
  const lengths = [0];
  for (let i = 1; i < ring.length; i++) {
    const dx = ring[i]![0] - ring[i - 1]![0];
    const dy = ring[i]![1] - ring[i - 1]![1];
    lengths.push(lengths[i - 1]! + Math.hypot(dx, dy));
  }
  const total = lengths[lengths.length - 1]!;
  const out: number[] = [];
  if (total === 0) {
    for (let k = 0; k < n; k++) out.push(ring[0]![0], ring[0]![1]);
    return out;
  }
  // Closed loops end on their start point, so the seam is drawn without a "Z".
  const divisions = n - 1;
  let seg = 1;
  for (let k = 0; k < n; k++) {
    const target = (total * k) / divisions;
    while (seg < lengths.length - 1 && lengths[seg]! < target) seg++;
    const l0 = lengths[seg - 1]!;
    const l1 = lengths[seg]!;
    const f = l1 === l0 ? 0 : (target - l0) / (l1 - l0);
    const a = ring[seg - 1]!;
    const b = ring[seg] ?? a;
    out.push(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
  }
  return out;
}

/** Every subpath of every path, resampled to `samples` points. */
export function toShapes(paths: string | readonly string[], samples = 40): Shape[] {
  const list = typeof paths === "string" ? [paths] : paths;
  const shapes: Shape[] = [];
  for (const d of list) {
    for (const sub of flattenPath(d)) {
      shapes.push({ points: resampleShape(sub.points, sub.closed, samples), closed: sub.closed });
    }
  }
  return shapes;
}

// ─── Pairing ──────────────────────────────────────────────────────────────────

function centroid(points: number[]): Pt {
  let x = 0;
  let y = 0;
  const n = points.length / 2;
  for (let i = 0; i < points.length; i += 2) {
    x += points[i]!;
    y += points[i + 1]!;
  }
  return [x / n, y / n];
}

/** A stroke squeezed to one point: where an unpartnered stroke grows from or shrinks to. */
function collapsed(at: Pt, n: number, closed: boolean, ghost: "in" | "out"): Shape {
  const points: number[] = [];
  for (let k = 0; k < n; k++) points.push(at[0], at[1]);
  return { points, closed, ghost };
}

function distance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i]! - b[i]!;
    sum += d * d;
  }
  return sum;
}

function reversed(points: number[]): number[] {
  const out: number[] = [];
  for (let i = points.length - 2; i >= 0; i -= 2) out.push(points[i]!, points[i + 1]!);
  return out;
}

/**
 * Rotates a loop's starting point. A closed shape stores its start again at the end,
 * so the unique points rotate and the seam is re-appended.
 */
function rotated(points: number[], by: number, closed: boolean): number[] {
  const n = points.length / 2 - (closed ? 1 : 0);
  const out: number[] = [];
  for (let k = 0; k < n; k++) {
    const j = ((k + by) % n) * 2;
    out.push(points[j]!, points[j + 1]!);
  }
  if (closed) out.push(out[0]!, out[1]!);
  return out;
}

/** Re-orders `to` so its points travel the shortest way from `from`'s, and says how far that is. */
function align(from: Shape, to: Shape): { shape: Shape; cost: number } {
  let best = to.points;
  let bestDist = distance(from.points, best);
  const candidates: number[][] = [reversed(to.points)];
  if (to.closed && from.closed) {
    const n = to.points.length / 2 - 1;
    for (const dir of [to.points, reversed(to.points)]) {
      for (let by = 1; by < n; by++) candidates.push(rotated(dir, by, true));
    }
  }
  for (const c of candidates) {
    const d = distance(from.points, c);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return { shape: { points: best, closed: to.closed }, cost: bestDist };
}

/** Cheapest one-to-one matching of the smaller side into the larger. Exact up to 7 strokes. */
function assign(cost: number[][], rows: number, cols: number): [number, number][] {
  const transpose = rows > cols;
  const small = transpose ? cols : rows;
  const large = transpose ? rows : cols;
  const at = (i: number, j: number) => (transpose ? cost[j]![i]! : cost[i]![j]!);

  if (small <= 7) {
    let best: number[] = [];
    let bestCost = Infinity;
    const used = new Array<boolean>(large).fill(false);
    const pick: number[] = [];
    const search = (i: number, sum: number) => {
      if (sum >= bestCost) return;
      if (i === small) {
        bestCost = sum;
        best = [...pick];
        return;
      }
      for (let j = 0; j < large; j++) {
        if (used[j]) continue;
        used[j] = true;
        pick.push(j);
        search(i + 1, sum + at(i, j));
        pick.pop();
        used[j] = false;
      }
    };
    search(0, 0);
    return best.map((j, i) => (transpose ? [j, i] : [i, j]));
  }

  // Larger icons: greedy by cost is close enough and stays fast.
  const all: [number, number, number][] = [];
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) all.push([cost[i]![j]!, i, j]);
  all.sort((a, b) => a[0] - b[0]);
  const usedR = new Set<number>();
  const usedC = new Set<number>();
  const pairs: [number, number][] = [];
  for (const [, i, j] of all) {
    if (usedR.has(i) || usedC.has(j)) continue;
    usedR.add(i);
    usedC.add(j);
    pairs.push([i, j]);
  }
  return pairs;
}

/**
 * Pairs two icons' strokes so the total distance travelled is smallest — each stroke
 * turns into the stroke whose shape it is nearest, not merely whose centre is. A
 * stroke with no partner grows from (or shrinks into) its own centre and is marked
 * as a ghost, so the renderer fades it rather than leaving a dot behind.
 */
export function pairShapes(from: Shape[], to: Shape[]): { from: Shape[]; to: Shape[] } {
  const n = from[0]?.points.length ?? to[0]?.points.length ?? 0;
  const samples = n / 2;
  const aligned = from.map((f) => to.map((t) => align(f, t)));
  const cost = aligned.map((row) => row.map((a) => a.cost));
  const pairs = from.length && to.length ? assign(cost, from.length, to.length) : [];
  const usedF = new Set(pairs.map((p) => p[0]));
  const usedT = new Set(pairs.map((p) => p[1]));

  const outFrom: Shape[] = [];
  const outTo: Shape[] = [];
  // Keep the target's order, so the drawn result stacks the way the new icon does.
  pairs.sort((a, b) => a[1] - b[1]);
  for (const [i, j] of pairs) {
    outFrom.push({ points: from[i]!.points, closed: from[i]!.closed });
    outTo.push(aligned[i]![j]!.shape);
  }
  to.forEach((s, j) => {
    if (usedT.has(j)) return;
    outFrom.push(collapsed(centroid(s.points), samples, s.closed, "in"));
    outTo.push({ points: s.points, closed: s.closed });
  });
  from.forEach((s, i) => {
    if (usedF.has(i)) return;
    outFrom.push({ points: s.points, closed: s.closed });
    outTo.push(collapsed(centroid(s.points), samples, s.closed, "out"));
  });
  return { from: outFrom, to: outTo };
}

/**
 * How visible paired stroke `i` is at progress `t`. A ghost growing in fades up over
 * the last part of the morph; one shrinking out fades over the first part — so it is
 * gone well before it could collapse into a dot.
 */
export function strokeOpacity(from: Shape | undefined, to: Shape | undefined, t: number): number {
  "worklet";
  if (from && from.ghost === "in") return Math.min(1, Math.max(0, (t - 0.35) / 0.45));
  if (to && to.ghost === "out") return Math.min(1, Math.max(0, 1 - t / 0.45));
  return 1;
}

/** Point-wise blend of two paired shape lists. */
export function blendShapes(from: Shape[], to: Shape[], t: number): Shape[] {
  return to.map((target, i) => {
    const source = from[i] ?? target;
    const points = target.points.map((v, k) => {
      const a = source.points[k] ?? v;
      return a + (v - a) * t;
    });
    return { points, closed: target.closed };
  });
}

/**
 * What is on screen at progress `t`, minus strokes that are faded out — the starting
 * point for a morph that interrupts this one. Ghosts never carry into the next pairing.
 */
export function visibleShapes(from: Shape[], to: Shape[], t: number): Shape[] {
  const out: Shape[] = [];
  const blended = blendShapes(from, to, t);
  blended.forEach((shape, i) => {
    if (strokeOpacity(from[i], to[i], t) >= 0.5) out.push(shape);
  });
  return out;
}

// ─── Shape helpers for icons drawn with <circle>, <rect>, <line> ─────────────

export function circlePath(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
}

export function rectPath(x: number, y: number, w: number, h: number, rx = 0): string {
  const r = Math.min(rx, w / 2, h / 2);
  if (r === 0) return `M${x} ${y}h${w}v${h}h${-w}Z`;
  return (
    `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}` +
    `a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}` +
    `v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}Z`
  );
}

export function linePath(x1: number, y1: number, x2: number, y2: number): string {
  return `M${x1} ${y1}L${x2} ${y2}`;
}
