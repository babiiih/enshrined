/**
 * Ritual testnet token registry.
 *
 * Honest labeling:
 *  - `isReal: true`  → token exists onchain at `address`, actions can be wired.
 *  - `isReal: false` → mock token for UI demo only; swap/wrap flows are simulated.
 *
 * At the time of writing, the only real value primitive on chain 1979 is native
 * RITUAL. xRITUAL exists as a real product at ritual-lst.vercel.app but its
 * deployed address is not public in docs — treated as `demo` until env supplies
 * VITE_XRITUAL_ADDRESS. wRITUAL is a placeholder wrap ERC20 (not deployed).
 */

export type RitualToken = {
  symbol: string;
  name: string;
  address: `0x${string}` | "native";
  decimals: number;
  color: string;
  logo: string; // single letter or emoji
  isReal: boolean;
  note?: string;
};

const XRITUAL_ADDRESS =
  (import.meta.env.VITE_XRITUAL_ADDRESS as `0x${string}` | undefined) ?? undefined;
function readActiveWrap(): `0x${string}` | undefined {
  const env = import.meta.env.VITE_WRITUAL_ADDRESS as `0x${string}` | undefined;
  if (env) return env;
  if (typeof window === "undefined") return undefined;
  return (window.localStorage.getItem("ritual.wrap.active") as `0x${string}` | null) ?? undefined;
}
const WRITUAL_ADDRESS = readActiveWrap();

export const TOKENS: RitualToken[] = [
  {
    symbol: "RITUAL",
    name: "Ritual (native)",
    address: "native",
    decimals: 18,
    color: "#22d3b1",
    logo: "R",
    isReal: true,
    note: "Native gas token · faucet available",
  },
  {
    symbol: "xRITUAL",
    name: "Liquid Staked RITUAL",
    address: XRITUAL_ADDRESS ?? "0x0000000000000000000000000000000000000000",
    decimals: 18,
    color: "#a78bfa",
    logo: "x",
    isReal: !!XRITUAL_ADDRESS,
    note: XRITUAL_ADDRESS
      ? "Liquid staking token (1:1 mint on stake)"
      : "Live at ritual-lst.vercel.app — address pending in env",
  },
  {
    symbol: "wRITUAL",
    name: "Wrapped RITUAL",
    address: WRITUAL_ADDRESS ?? "0x0000000000000000000000000000000000000000",
    decimals: 18,
    color: "#f7c948",
    logo: "w",
    isReal: !!WRITUAL_ADDRESS,
    note: "WETH-style 1:1 wrap (demo)",
  },
  {
    symbol: "USDR",
    name: "USD Ritual",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 6,
    color: "#4ade80",
    logo: "$",
    isReal: false,
    note: "Concept stablecoin — not deployed",
  },
  {
    symbol: "AIR",
    name: "Ritual Agent Inference",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    color: "#60a5fa",
    logo: "A",
    isReal: false,
    note: "Concept — pays for LLM/ONNX precompile usage",
  },
  {
    symbol: "COMPUTE",
    name: "Compute Credits",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    color: "#f472b6",
    logo: "C",
    isReal: false,
    note: "Concept — GPU/TEE inference credit",
  },
];

export const tokenBySymbol = (s: string) => TOKENS.find((t) => t.symbol === s)!;

/**
 * Mock swap quote — honest exchange-rate table between concept tokens.
 * Real routes (RITUAL ↔ wRITUAL, RITUAL ↔ xRITUAL) always return exactly 1:1.
 */
export function mockQuote(fromSym: string, toSym: string, amount: number) {
  if (!amount || amount <= 0) return { out: 0, rate: 0, impact: 0, route: [fromSym, toSym] };

  // 1:1 for wrap / stake pairs (both directions)
  const parity = new Set(["RITUAL:wRITUAL", "wRITUAL:RITUAL", "RITUAL:xRITUAL", "xRITUAL:RITUAL"]);
  if (parity.has(`${fromSym}:${toSym}`)) {
    return { out: amount, rate: 1, impact: 0, route: [fromSym, toSym] };
  }

  const RATES: Record<string, number> = {
    RITUAL: 1,
    wRITUAL: 1,
    xRITUAL: 1.04, // yield-bearing, slightly appreciating
    USDR: 0.42, // 1 RITUAL ≈ 0.42 USDR (concept)
    AIR: 3.2,
    COMPUTE: 12.5,
  };
  const fromUsd = RATES[fromSym] ?? 1;
  const toUsd = RATES[toSym] ?? 1;
  const rate = fromUsd / toUsd;

  // Route through wRITUAL for realism
  const route =
    fromSym === "wRITUAL" || toSym === "wRITUAL"
      ? [fromSym, toSym]
      : [fromSym, "wRITUAL", toSym];

  // Fake price impact — grows with sqrt(amount)
  const impact = Math.min(0.08, Math.sqrt(amount) * 0.0035);
  const out = amount * rate * (1 - impact);
  return { out, rate, impact, route };
}
