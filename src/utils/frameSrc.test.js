import { describe, it, expect } from "vitest";
import { frameSrc } from "./frameSrc";

describe("frameSrc", () => {
  it("returns correct path for index 0", () => {
    expect(frameSrc(0)).toBe("/assets/frames/frame_0001.webp");
  });

  it("returns correct path for index 9", () => {
    expect(frameSrc(9)).toBe("/assets/frames/frame_0010.webp");
  });

  it("returns correct path for index 99", () => {
    expect(frameSrc(99)).toBe("/assets/frames/frame_0100.webp");
  });

  it("zero-pads to 4 digits", () => {
    expect(frameSrc(0)).toMatch(/frame_\d{4}\.webp$/);
    expect(frameSrc(99)).toMatch(/frame_\d{4}\.webp$/);
  });
});
