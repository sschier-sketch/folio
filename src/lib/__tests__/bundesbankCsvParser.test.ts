import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { parseBundesbankCsv, stableStringify } from "../bundesbankCsvParser";

const fixturePath = resolve(__dirname, "fixtures/bundesbank-sample.csv");
const fixtureContent = readFileSync(fixturePath, "utf-8");

describe("parseBundesbankCsv", () => {
  it("parses the sample CSV fixture correctly", () => {
    const points = parseBundesbankCsv(fixtureContent);

    expect(points.length).toBe(8);
    expect(points[0]).toEqual({ date: "2003-01", value: 5.38 });
    expect(points[1]).toEqual({ date: "2003-02", value: 5.19 });
    expect(points[2]).toEqual({ date: "2003-03", value: 5.12 });
  });

  it("handles German comma decimal separator", () => {
    const points = parseBundesbankCsv(fixtureContent);
    const dec2024 = points.find((p) => p.date === "2024-12");
    expect(dec2024).toEqual({ date: "2024-12", value: 3.34 });
  });

  it("ignores metadata, comments, and empty lines", () => {
    const points = parseBundesbankCsv(fixtureContent);
    const dates = points.map((p) => p.date);
    expect(dates.every((d) => /^\d{4}-\d{2}$/.test(d))).toBe(true);
  });

  it("ignores annotation columns (Bemerkung, Vorlaeufiger Wert)", () => {
    const points = parseBundesbankCsv(fixtureContent);
    const jun2010 = points.find((p) => p.date === "2010-06");
    expect(jun2010).toEqual({ date: "2010-06", value: 3.88 });
    const dec2025 = points.find((p) => p.date === "2025-12");
    expect(dec2025).toEqual({ date: "2025-12", value: 3.73 });
  });

  it("returns points sorted chronologically", () => {
    const points = parseBundesbankCsv(fixtureContent);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].date >= points[i - 1].date).toBe(true);
    }
  });

  it("returns empty array for non-data input", () => {
    expect(parseBundesbankCsv("")).toEqual([]);
    expect(parseBundesbankCsv("just some random text")).toEqual([]);
    expect(parseBundesbankCsv("Dezimalstellen;2;\nEinheit;% p.a.;")).toEqual([]);
  });

  it("handles dot decimal separator as well", () => {
    const csv = "2024-01;3.55;\n2024-02;3.61;";
    const points = parseBundesbankCsv(csv);
    expect(points).toEqual([
      { date: "2024-01", value: 3.55 },
      { date: "2024-02", value: 3.61 },
    ]);
  });

  it("determines correct start/end periods", () => {
    const points = parseBundesbankCsv(fixtureContent);
    const dates = points.map((p) => p.date).sort();
    expect(dates[0]).toBe("2003-01");
    expect(dates[dates.length - 1]).toBe("2025-12");
  });
});

describe("stableStringify", () => {
  it("produces identical output regardless of key insertion order", () => {
    const a = { z: 1, a: 2, m: 3 };
    const b = { a: 2, m: 3, z: 1 };
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it("handles nested objects", () => {
    const obj = { b: { d: 1, c: 2 }, a: 3 };
    const result = stableStringify(obj);
    expect(result).toBe('{"a":3,"b":{"c":2,"d":1}}');
  });

  it("handles arrays", () => {
    const obj = { items: [{ b: 1, a: 2 }] };
    const result = stableStringify(obj);
    expect(result).toBe('{"items":[{"a":2,"b":1}]}');
  });

  it("handles primitives", () => {
    expect(stableStringify(null)).toBe("null");
    expect(stableStringify(42)).toBe("42");
    expect(stableStringify("hello")).toBe('"hello"');
  });
});
