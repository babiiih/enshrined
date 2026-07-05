/**
 * Ritual testnet token registry.
 *
 * All tokens are deployed on Ritual Testnet (Chain 1979) with real liquidity pairs.
 * DEX: Uniswap V2-style AMM with 0.3% fee.
 */

export type RitualToken = {
  symbol: string;
  name: string;
  address: `0x${string}` | "native";
  decimals: number;
  color: string;
  logo: string;
  isReal: boolean;
  note?: string;
};

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
    symbol: "USDR",
    name: "USD Ritual",
    address: "0x9Be498b02cA7AFCF3eaC175aa4b40D39195b0085",
    decimals: 18,
    color: "#4ade80",
    logo: "$",
    isReal: true,
    note: "Stablecoin · live pairs with AIR & COMPUTE",
  },
  {
    symbol: "AIR",
    name: "Ritual Agent Inference",
    address: "0x6E4028fC0aAbCe5aFfDf7ee50b7f872262E49DC1",
    decimals: 18,
    color: "#60a5fa",
    logo: "A",
    isReal: true,
    note: "Pays for LLM/ONNX precompile usage",
  },
  {
    symbol: "COMPUTE",
    name: "Compute Credits",
    address: "0xA193705b36eCa87D010e29417c9A296D7eB082bD",
    decimals: 18,
    color: "#f472b6",
    logo: "C",
    isReal: true,
    note: "GPU/TEE inference credit",
  },
];

export const ROUTER_ADDRESS = "0x89a1bc4F5F6563134D66259aA8326aBc4B4D6888" as const;
export const FACTORY_ADDRESS = "0x8fa5d9717533286c1af4b0e829b884b7ea581cc6" as const;

export type PairInfo = {
  token0: string;
  token1: string;
  address: `0x${string}`;
};

export const PAIRS: PairInfo[] = [
  {
    token0: "USDR",
    token1: "AIR",
    address: "0xC432Eaf3f2dd5271F0dA6Ad11a53ae90410722cB",
  },
  {
    token0: "USDR",
    token1: "COMPUTE",
    address: "0x194AC8d266d76d22cD5F67348fFAAeAc3ba4CE78",
  },
  {
    token0: "AIR",
    token1: "COMPUTE",
    address: "0xd177D0a013260cb5b126b57D56af1bB15b938a7f",
  },
];

export const tokenBySymbol = (s: string) => TOKENS.find((t) => t.symbol === s)!;
