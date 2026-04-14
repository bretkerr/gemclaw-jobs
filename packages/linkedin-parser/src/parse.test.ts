import { describe, it, expect } from "vitest";
import { parseCSV } from "./parse.js";

describe("parseCSV", () => {
  it("parses a simple CSV with headers", () => {
    const csv = `Name,Age,City
Alice,30,Portland
Bob,25,Seattle`;

    const rows = parseCSV<{ Name: string; Age: string; City: string }>(csv);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ Name: "Alice", Age: "30", City: "Portland" });
    expect(rows[1]).toEqual({ Name: "Bob", Age: "25", City: "Seattle" });
  });

  it("returns all values as strings (no dynamic typing)", () => {
    const csv = `Score,Active
42,true`;

    const rows = parseCSV<{ Score: string; Active: string }>(csv);
    expect(rows[0]!.Score).toBe("42");
    expect(rows[0]!.Active).toBe("true");
  });

  it("skips empty lines", () => {
    const csv = `A,B
1,2

3,4
`;

    const rows = parseCSV<{ A: string; B: string }>(csv);
    expect(rows).toHaveLength(2);
  });

  it("returns an empty array for header-only CSV", () => {
    const csv = `Name,Email`;
    const rows = parseCSV(csv);
    expect(rows).toEqual([]);
  });

  it("returns an empty array for empty string", () => {
    const rows = parseCSV("");
    expect(rows).toEqual([]);
  });

  it("handles fields with commas in quotes", () => {
    const csv = `Name,Location
"Doe, Jane","Portland, OR"`;

    const rows = parseCSV<{ Name: string; Location: string }>(csv);
    expect(rows[0]).toEqual({ Name: "Doe, Jane", Location: "Portland, OR" });
  });
});
