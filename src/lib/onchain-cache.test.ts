import { describe, it, expect, beforeEach, vi } from "vitest";
import { cachedRead, invalidateCache } from "./onchain-cache";

describe("onchain-cache", () => {
  beforeEach(() => invalidateCache());

  it("caches a value within TTL", async () => {
    const loader = vi.fn(async () => 42);
    expect(await cachedRead("k", 1000, loader)).toBe(42);
    expect(await cachedRead("k", 1000, loader)).toBe(42);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("re-reads after TTL expires", async () => {
    const loader = vi.fn(async () => Math.random());
    const a = await cachedRead("k", 1, loader);
    await new Promise((r) => setTimeout(r, 5));
    const b = await cachedRead("k", 1, loader);
    expect(loader).toHaveBeenCalledTimes(2);
    expect(a).not.toBe(b);
  });

  it("dedupes concurrent inflight reads", async () => {
    const loader = vi.fn(
      () => new Promise<number>((r) => setTimeout(() => r(1), 10)),
    );
    const [a, b, c] = await Promise.all([
      cachedRead("k", 1000, loader),
      cachedRead("k", 1000, loader),
      cachedRead("k", 1000, loader),
    ]);
    expect([a, b, c]).toEqual([1, 1, 1]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("invalidates by prefix", async () => {
    const l1 = vi.fn(async () => "a");
    const l2 = vi.fn(async () => "b");
    await cachedRead("bal:1", 5000, l1);
    await cachedRead("nft:1", 5000, l2);
    invalidateCache("bal:");
    await cachedRead("bal:1", 5000, l1);
    await cachedRead("nft:1", 5000, l2);
    expect(l1).toHaveBeenCalledTimes(2);
    expect(l2).toHaveBeenCalledTimes(1);
  });
});
