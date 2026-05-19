import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { parse, format } from "../src/index.js";

describe("property: parse(format(x)) round-trips for round multiples", () => {
  it("hours", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000 }), (h) => {
        const ms = h * 3_600_000;
        expect(parse(format(ms))).toBe(ms);
      }),
    );
  });

  it("minutes", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100_000 }), (m) => {
        const ms = m * 60_000;
        expect(parse(format(ms))).toBe(ms);
      }),
    );
  });

  it("seconds", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), (s) => {
        const ms = s * 1000;
        expect(parse(format(ms))).toBe(ms);
      }),
    );
  });
});

describe("property: parse never throws", () => {
  it("on any string input", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const r = parse(s);
        expect(r === null || typeof r === "number").toBe(true);
      }),
    );
  });
});

describe("property: format never throws on finite numbers", () => {
  it("on positive ms", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 365 * 86_400_000 }), (ms) => {
        const r = format(ms);
        expect(typeof r).toBe("string");
        expect(r.length).toBeGreaterThan(0);
      }),
    );
  });

  it("on negative ms", () => {
    fc.assert(
      fc.property(fc.integer({ min: -86_400_000, max: -1 }), (ms) => {
        const r = format(ms);
        expect(r.startsWith("-")).toBe(true);
      }),
    );
  });
});
