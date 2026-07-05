/**
 * Ritual liquid staking helper.
 * Reads pool APR / total staked from the xRITUAL contract when its address
 * is provided via `VITE_XRITUAL_ADDRESS`. Otherwise returns demo values so
 * the UI never breaks.
 */
import type { Address } from "viem";

export const STAKING_ABI = [
  {
    type: "function",
    name: "previewTotalAssets",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalAssets",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "totalShares",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "rewardPot",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "rewardRate",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "pricePerShare",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "convertToShares",
    stateMutability: "view",
    inputs: [{ type: "uint256", name: "assets" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "convertToAssets",
    stateMutability: "view",
    inputs: [{ type: "uint256", name: "shares" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [{ type: "address", name: "receiver" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [
      { type: "uint256", name: "shares" },
      { type: "address", name: "receiver" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ type: "address", name: "owner" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "fundRewards",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
] as const;

export const XRITUAL_ADDRESS =
  (import.meta.env.VITE_XRITUAL_ADDRESS as Address | undefined) ?? undefined;

export const STAKING_DEMO = {
  apr: "6.42%",
  totalStaked: "412,880.31",
  xRitualRate: "1.0421",
  unbonding: "instant",
};

/** Compute annualized reward APR from vault state. */
export function computeAprBps(rewardRate: bigint, totalAssets: bigint): number {
  if (totalAssets === 0n || rewardRate === 0n) return 0;
  // rewardRate wei/sec → year = 31_536_000 sec
  const yearly = rewardRate * 31_536_000n;
  // bps = yearly / totalAssets * 10000
  return Number((yearly * 10000n) / totalAssets);
}
