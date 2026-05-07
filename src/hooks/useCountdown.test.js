import { describe, it, expect } from "vitest";
import { calculateCountdown } from "./useCountdown";

describe("calculateCountdown", () => {
  it('returns all "00" when diff is zero', () => {
    const target = new Date("2026-06-20T08:00:00");
    const result = calculateCountdown(target, target.getTime());
    expect(result).toEqual({ days: "00", hours: "00", mins: "00", secs: "00" });
  });

  it('returns all "00" when diff is negative', () => {
    const target = new Date("2026-06-20T08:00:00");
    const result = calculateCountdown(target, target.getTime() + 1000);
    expect(result).toEqual({ days: "00", hours: "00", mins: "00", secs: "00" });
  });

  it("calculates 1 day correctly", () => {
    const target = new Date("2026-06-20T08:00:00");
    const now = target.getTime() - 86400000; // exactly 1 day before
    const result = calculateCountdown(target, now);
    expect(result.days).toBe("01");
    expect(result.hours).toBe("00");
    expect(result.mins).toBe("00");
    expect(result.secs).toBe("00");
  });

  it("calculates hours correctly", () => {
    const target = new Date("2026-06-20T08:00:00");
    const now = target.getTime() - 3 * 3600000; // 3 hours before
    const result = calculateCountdown(target, now);
    expect(result.days).toBe("00");
    expect(result.hours).toBe("03");
    expect(result.mins).toBe("00");
    expect(result.secs).toBe("00");
  });

  it("zero-pads single digit values", () => {
    const target = new Date("2026-06-20T08:00:00");
    const now =
      target.getTime() - (1 * 86400000 + 2 * 3600000 + 3 * 60000 + 4 * 1000);
    const result = calculateCountdown(target, now);
    expect(result.days).toBe("01");
    expect(result.hours).toBe("02");
    expect(result.mins).toBe("03");
    expect(result.secs).toBe("04");
  });
});
