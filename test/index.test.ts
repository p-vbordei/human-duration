import { describe, it, expect } from "vitest";
import { parse, format } from "../src/index.js";

describe("parse", () => {
  it.each([
    ["1ms", 1],
    ["500ms", 500],
    ["1s", 1000],
    ["90s", 90_000],
    ["1.5h", 5_400_000],
    ["1h30m", 5_400_000],
    ["1h 30m", 5_400_000],
    ["1 hour 30 minutes", 5_400_000],
    ["2 days 5 hours", 2 * 86_400_000 + 5 * 3_600_000],
    ["1w", 604_800_000],
    ["1d 2h 3m 4s 5ms", 86_400_000 + 7_200_000 + 180_000 + 4_000 + 5],
    ["100", 100],          // bare number = ms
    ["1000ms", 1000],
    ["-30s", -30_000],
  ])("%s → %d", (input, expected) => {
    expect(parse(input)).toBeCloseTo(expected, 5);
  });

  it.each([
    "",
    "abc",
    "1h xyz",
    "garbage",
    "1foo",
  ])("rejects %s", (input) => {
    expect(parse(input)).toBeNull();
  });

  it("case insensitive", () => {
    expect(parse("1H 30M")).toBe(5_400_000);
  });

  it("accepts comma separators", () => {
    expect(parse("1h, 30m")).toBe(5_400_000);
  });
});

describe("format", () => {
  it.each([
    [0, "0ms"],
    [1, "1ms"],
    [999, "999ms"],
    [1000, "1s"],
    [1500, "1s 500ms"],
    [60_000, "1m"],
    [5_400_000, "1h 30m"],
    [86_400_000, "1d"],
    [86_400_000 + 3_600_000, "1d 1h"],
    [604_800_000, "1w"],
    [-5_400_000, "-1h 30m"],
  ])("%d → %s", (input, expected) => {
    expect(format(input)).toBe(expected);
  });

  it("compact mode", () => {
    expect(format(5_400_000, { compact: true })).toBe("1h30m");
    expect(format(86_400_000 + 3_600_000 + 60_000, { compact: true })).toBe("1d1h1m");
  });

  it("maxComponents", () => {
    expect(format(5_400_000 + 30_000, { maxComponents: 1 })).toBe("2h");
    expect(format(5_400_000 + 30_000, { maxComponents: 2 })).toBe("1h 31m");
  });

  it("largestUnit / smallestUnit", () => {
    expect(format(604_800_000 + 86_400_000, { largestUnit: "d" })).toBe("8d");
    expect(format(5_400_000 + 250, { smallestUnit: "s" })).toBe("1h 30m 0s");
  });
});

describe("round-trip", () => {
  it("parse(format(x)) === x for round multiples", () => {
    const values = [1000, 60_000, 3_600_000, 86_400_000, 5_400_000];
    for (const v of values) {
      expect(parse(format(v))).toBe(v);
    }
  });
});
