import { describe, expect, it } from "vitest";
import { springDuration } from "../core/spring";

describe("springDuration", () => {
  it("settles faster when stiffer and better damped", () => {
    expect(springDuration({ stiffness: 300, damping: 30 })).toBeLessThan(
      springDuration({ stiffness: 100, damping: 10 }),
    );
  });

  it("is finite and positive", () => {
    const duration = springDuration();
    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThanOrEqual(10_000);
  });
});
