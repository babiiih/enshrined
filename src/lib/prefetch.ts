import type { PublicClient } from "viem";
import { erc20Abi } from "viem";
import { listAllPairs, readPairMeta } from "@/lib/dex/router";

/**
 * Client-side prefetch cache for expensive on-chain reads. Shared between
 * the AuthGuard prefetch trigger and the destination page — so when the user
 * lands on /pools after login, the reads are already in-flight (or done).
 */

export type PoolRow = {
  pair: `0x${string}`;
  t0: `0x${string}`;
  t1: `0x${string}`;
  s0: string;
  s1: string;
  r0: bigint;
  r1: bigint;
  lp: bigint;
};

let poolsCache:
  | { factory: `0x${string}`; promise: Promise<PoolRow[]> }
  | null = null;

export function prefetchPools(
  pub: PublicClient,
  factory: `0x${string}`,
): Promise<PoolRow[]> {
  if (poolsCache && poolsCache.factory.toLowerCase() === factory.toLowerCase()) {
    return poolsCache.promise;
  }
  const promise = (async () => {
    const pairs = await listAllPairs(pub, factory);
    return Promise.all(
      pairs.map(async (p) => {
        const meta = await readPairMeta(pub, p);
        const [s0, s1] = await Promise.all([
          pub
            .readContract({ address: meta.token0, abi: erc20Abi, functionName: "symbol" })
            .catch(() => "TKN"),
          pub
            .readContract({ address: meta.token1, abi: erc20Abi, functionName: "symbol" })
            .catch(() => "TKN"),
        ]);
        return {
          pair: p,
          t0: meta.token0,
          t1: meta.token1,
          s0: String(s0),
          s1: String(s1),
          r0: meta.reserve0,
          r1: meta.reserve1,
          lp: meta.lpSupply,
        } as PoolRow;
      }),
    );
  })();
  // Drop the cache entry if the fetch rejects so the next caller retries.
  promise.catch(() => {
    if (poolsCache?.promise === promise) poolsCache = null;
  });
  poolsCache = { factory, promise };
  return promise;
}

export function invalidatePoolsCache() {
  poolsCache = null;
}

if (typeof window !== "undefined") {
  // Factory/router changed → drop cached pool list.
  window.addEventListener("ritual:dex", invalidatePoolsCache);
}