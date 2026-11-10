// Ported from torph's spring.ts. Reanimated runs the spring itself; this only answers
// "how long until it settles", which the fades and exit removal are measured against.

export interface SpringParams {
  stiffness?: number;
  damping?: number;
  mass?: number;
  /** Threshold for treating the spring as settled. */
  precision?: number;
}

function springPosition(t: number, omega0: number, zeta: number): number {
  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
    return (
      1 -
      Math.exp(-zeta * omega0 * t) *
        (Math.cos(omegaD * t) +
          ((zeta * omega0) / omegaD) * Math.sin(omegaD * t))
    );
  }

  // Overdamped (includes near-critically-damped)
  const s = Math.sqrt(zeta * zeta - 1);
  const r1 = -omega0 * (zeta + s);
  const r2 = -omega0 * (zeta - s);
  const B = -r1 / (r2 - r1);
  const A = 1 - B;
  return 1 - A * Math.exp(r1 * t) - B * Math.exp(r2 * t);
}

const cache = new Map<string, number>();

export const SPRING_DEFAULTS = {
  stiffness: 100,
  damping: 10,
  mass: 1,
  precision: 0.001,
} as const;

/** Milliseconds until the spring stays within `precision` of rest. */
export function springDuration(params: SpringParams = {}): number {
  const { stiffness, damping, mass, precision } = { ...SPRING_DEFAULTS, ...params };
  const key = `${stiffness}:${damping}:${mass}:${precision}`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const omega0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));

  const step = 0.001;
  const maxDuration = 10;
  let settledSince = 0;
  let result = Math.ceil(maxDuration * 1000);

  for (let t = 0; t < maxDuration; t += step) {
    if (Math.abs(springPosition(t, omega0, zeta) - 1) > precision) {
      settledSince = 0;
    } else {
      settledSince += step;
      if (settledSince > 0.1) {
        result = Math.ceil((t - settledSince + step) * 1000);
        break;
      }
    }
  }

  cache.set(key, result);
  return result;
}
