import { describe, test, expect } from "bun:test";
import { TtlCache } from "@/lib/ttl-cache";

const clock = (start = 0) => {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
};

describe("TtlCache", () => {
  test("returns what was set while it is fresh", () => {
    const c = clock();
    const cache = new TtlCache<string, number>(1000, c.now);
    cache.set("a", 1);
    c.advance(999);
    expect(cache.get("a")).toBe(1);
  });

  test("forgets an entry once its ttl has passed", () => {
    const c = clock();
    const cache = new TtlCache<string, number>(1000, c.now);
    cache.set("a", 1);
    c.advance(1000);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  test("setting again restarts the clock", () => {
    const c = clock();
    const cache = new TtlCache<string, number>(1000, c.now);
    cache.set("a", 1);
    c.advance(900);
    cache.set("a", 2);
    c.advance(900);
    expect(cache.get("a")).toBe(2);
  });

  test("delete removes immediately", () => {
    const cache = new TtlCache<string, number>(1000);
    cache.set("a", 1);
    cache.delete("a");
    expect(cache.get("a")).toBeUndefined();
  });
});
