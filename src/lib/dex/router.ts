import type { PublicClient } from "viem";
import { RitualFactory, RitualPair, RitualRouter } from "@/lib/contracts";

/**
 * Pure DEX math + on-chain read helpers for the RitualRouter deployed by
 * the user. All amounts are bigints in raw wei. Fee is 0.30% (matches
 * canonical UniswapV2).
 */

export const FEE_NUM = 997n;
export const FEE_DEN = 1000n;
export const MAX_UINT256 = (1n << 256n) - 1n;

export function getAmountOut(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0n;
  const amtInFee = amountIn * FEE_NUM;
  return (amtInFee * reserveOut) / (reserveIn * FEE_DEN + amtInFee);
}

export function priceImpactBps(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): number {
  if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) return 0;
  const out = getAmountOut(amountIn, reserveIn, reserveOut);
  // spot: reserveOut/reserveIn ; effective: out/amountIn
  const spot = Number(reserveOut) / Number(reserveIn);
  const effective = Number(out) / Number(amountIn);
  if (spot <= 0) return 0;
  return Math.max(0, Math.round((1 - effective / spot) * 10_000));
}

export function applySlippageMin(amountOut: bigint, slippageBps: number): bigint {
  // slippageBps: 50 = 0.5%
  const bps = BigInt(Math.max(0, Math.min(5000, slippageBps)));
  return (amountOut * (10_000n - bps)) / 10_000n;
}

export function deadlineFromNow(ms = 20 * 60 * 1000): bigint {
  // Ritual chain uses millisecond timestamps
  return BigInt(Date.now() + ms);
}

export function sortTokens(a: `0x${string}`, b: `0x${string}`): [`0x${string}`, `0x${string}`] {
  return a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
}

export async function getPairAddress(
  client: PublicClient,
  factory: `0x${string}`,
  a: `0x${string}`,
  b: `0x${string}`,
): Promise<`0x${string}` | null> {
  const pair = (await client.readContract({
    address: factory,
    abi: RitualFactory.abi,
    functionName: "getPair",
    args: [a, b],
  })) as `0x${string}`;
  return pair && pair !== "0x0000000000000000000000000000000000000000" ? pair : null;
}

export async function readReserves(
  client: PublicClient,
  pair: `0x${string}`,
  tokenA: `0x${string}`,
): Promise<{ rA: bigint; rB: bigint; token0: `0x${string}` }> {
  const [reserves, token0] = await Promise.all([
    client.readContract({ address: pair, abi: RitualPair.abi, functionName: "getReserves" }) as Promise<
      [bigint, bigint]
    >,
    client.readContract({ address: pair, abi: RitualPair.abi, functionName: "token0" }) as Promise<`0x${string}`>,
  ]);
  const [r0, r1] = reserves;
  const aIs0 = tokenA.toLowerCase() === token0.toLowerCase();
  return { rA: aIs0 ? r0 : r1, rB: aIs0 ? r1 : r0, token0 };
}

export async function listAllPairs(
  client: PublicClient,
  factory: `0x${string}`,
): Promise<`0x${string}`[]> {
  const len = (await client.readContract({
    address: factory,
    abi: RitualFactory.abi,
    functionName: "allPairsLength",
  })) as bigint;
  const n = Number(len);
  if (n === 0) return [];
  const results = await Promise.all(
    Array.from({ length: n }, (_, i) =>
      client.readContract({
        address: factory,
        abi: RitualFactory.abi,
        functionName: "allPairs",
        args: [BigInt(i)],
      }),
    ),
  );
  return results as `0x${string}`[];
}

export async function readPairMeta(client: PublicClient, pair: `0x${string}`) {
  const [t0, t1, res, lpSupply] = await Promise.all([
    client.readContract({ address: pair, abi: RitualPair.abi, functionName: "token0" }) as Promise<`0x${string}`>,
    client.readContract({ address: pair, abi: RitualPair.abi, functionName: "token1" }) as Promise<`0x${string}`>,
    client.readContract({ address: pair, abi: RitualPair.abi, functionName: "getReserves" }) as Promise<
      [bigint, bigint]
    >,
    client.readContract({ address: pair, abi: RitualPair.abi, functionName: "totalSupply" }) as Promise<bigint>,
  ]);
  return { token0: t0, token1: t1, reserve0: res[0], reserve1: res[1], lpSupply };
}

export { RitualFactory, RitualPair, RitualRouter };