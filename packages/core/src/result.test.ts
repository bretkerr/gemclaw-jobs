import { describe, it, expect } from "vitest";
import { ok, err, map, flatMap, unwrap, unwrapOr, tryCatch } from "./result.js";

describe("Result", () => {
  it("ok wraps a value", () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(42);
  });

  it("err wraps an error", () => {
    const r = err("fail");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("fail");
  });

  it("map transforms ok values", () => {
    const r = map(ok(5), (x) => x * 2);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(10);
  });

  it("map passes through errors", () => {
    const r = map(err("oops"), (x: number) => x * 2);
    expect(r.ok).toBe(false);
  });

  it("flatMap chains results", () => {
    const r = flatMap(ok(5), (x) => (x > 3 ? ok(x * 2) : err("too small")));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(10);
  });

  it("flatMap short-circuits on error", () => {
    const r = flatMap(ok(1), (x) => (x > 3 ? ok(x * 2) : err("too small")));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("too small");
  });

  it("unwrap returns value from ok", () => {
    expect(unwrap(ok(42))).toBe(42);
  });

  it("unwrap throws on err", () => {
    expect(() => unwrap(err(new Error("bad")))).toThrow("bad");
  });

  it("unwrapOr returns value from ok", () => {
    expect(unwrapOr(ok(42), 0)).toBe(42);
  });

  it("unwrapOr returns fallback from err", () => {
    expect(unwrapOr(err("fail"), 0)).toBe(0);
  });

  it("tryCatch catches async errors", async () => {
    const r = await tryCatch(async () => {
      throw new Error("async fail");
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe("async fail");
  });

  it("tryCatch wraps async success", async () => {
    const r = await tryCatch(async () => 42);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(42);
  });
});
