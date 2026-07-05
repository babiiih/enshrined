/**
 * Ritual testnet token registry - Full DEX with 7 tokens and 14 pairs
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
    address: "0xF72bdc719455326D66e214abBbeDBad2889252F4",
    decimals: 18,
    color: "#4ade80",
    logo: "$",
    isReal: true,
    note: "Stablecoin",
  },
  {
    symbol: "AIR",
    name: "Ritual Agent Inference",
    address: "0x6c367ca1592B49AD8A49f4C8F75187C880ee8a60",
    decimals: 18,
    color: "#60a5fa",
    logo: "A",
    isReal: true,
    note: "LLM/ONNX precompile usage",
  },
  {
    symbol: "COMPUTE",
    name: "Compute Credits",
    address: "0xD74d4E3AE5cFAC8Cf7948547753FEe71a648665E",
    decimals: 18,
    color: "#f472b6",
    logo: "C",
    isReal: true,
    note: "GPU/TEE inference credit",
  },
  {
    symbol: "RMEME",
    name: "Ritual Meme",
    address: "0x51B4CB64C149aa288849eca8635916d0f79560FA",
    decimals: 18,
    color: "#fbbf24",
    logo: "M",
    isReal: true,
    note: "Community meme token",
  },
  {
    symbol: "AGENT",
    name: "Agent Token",
    address: "0x70D6B4eF00525042282978CADD1Ae03bE8882b65",
    decimals: 18,
    color: "#a78bfa",
    logo: "G",
    isReal: true,
    note: "Autonomous agent governance",
  },
  {
    symbol: "DEFI",
    name: "DeFi Token",
    address: "0xA9D3B2ADfb9848b995ccf4844cD9DcB30a3D470C",
    decimals: 18,
    color: "#34d399",
    logo: "D",
    isReal: true,
    note: "DeFi protocol token",
  },
  {
    symbol: "NFTX",
    name: "NFT Token",
    address: "0xf3a773Bbe0eAfd56659D216B4927F3C2a241c3a4",
    decimals: 18,
    color: "#f87171",
    logo: "N",
    isReal: true,
    note: "NFT marketplace token",
  },
];

export const ROUTER_ADDRESS = "0x2447Af688de736C701561D872c05E8a5c0f0d1D3" as const;
export const FACTORY_ADDRESS = "0x93bD4E331b29657235Ac2ea3984f986399162FFa" as const;

export type PairInfo = {
  token0: string;
  token1: string;
  address: `0x${string}`;
};

export const PAIRS: PairInfo[] = [
  { token0: "USDR", token1: "AIR", address: "0x552bdF23E5a238179a660BFBb0f12d2145809c67" },
  { token0: "USDR", token1: "COMPUTE", address: "0x6181811981b02b7B7a6A2628a96Cb55eaC8f9867" },
  { token0: "USDR", token1: "RMEME", address: "0xDbfBbB53dC91e34f134Dd19F53c209E337b50fc8" },
  { token0: "USDR", token1: "AGENT", address: "0xF4526eEa37E47074a5F8e51aC15b67B725B42dF8" },
  { token0: "USDR", token1: "DEFI", address: "0x253Dd1c5C4c0bb47B2e6b0572BB095Dba47dC229" },
  { token0: "USDR", token1: "NFTX", address: "0x7f30805D70E2B3dF846b88b93E68C85e7ea4CBf2" },
  { token0: "AIR", token1: "COMPUTE", address: "0x04291F21448582fC34040E418fc142C1B3414CC5" },
  { token0: "AIR", token1: "RMEME", address: "0xfD29B3a19a4B4265431D040fE130216A9DaA02Be" },
  { token0: "AIR", token1: "AGENT", address: "0xe1d8E40ed1D91180078cc69E0B70C4bB97E081c8" },
  { token0: "AIR", token1: "DEFI", address: "0x889F8A141B80d1Ce586A5248B2956C0fEa7f521b" },
  { token0: "COMPUTE", token1: "RMEME", address: "0xc10f3Df3BBDa680ee23DfcbE960595834d5E7117" },
  { token0: "COMPUTE", token1: "AGENT", address: "0xeA116010E2bfc5BA3dBd10D199ff2B8Ab320AbFa" },
  { token0: "RMEME", token1: "AGENT", address: "0xAdc035097a332E6Cd47c4210194dC34f742159A4" },
  { token0: "DEFI", token1: "NFTX", address: "0xbf70b4b02a3394A95c51A45842C1F7C0829AF099" },
];

export const tokenBySymbol = (s: string) => TOKENS.find((t) => t.symbol === s)!;

/**
 * Mock swap quote — fallback for pairs without onchain liquidity.
 * Real pairs use the AMM router directly.
 */
export function mockQuote(fromSym: string, toSym: string, amount: number) {
  if (!amount || amount <= 0) return { out: 0, rate: 0, impact: 0, route: [fromSym, toSym] };

  const RATES: Record<string, number> = {
    RITUAL: 1,
    USDR: 1,
    AIR: 3.2,
    COMPUTE: 12.5,
    RMEME: 0.001,
    AGENT: 5,
    DEFI: 2.5,
    NFTX: 0.8,
  };
  const fromUsd = RATES[fromSym] ?? 1;
  const toUsd = RATES[toSym] ?? 1;
  const rate = fromUsd / toUsd;
  const impact = Math.min(0.08, Math.sqrt(amount) * 0.0035);
  const out = amount * rate * (1 - impact);
  return { out, rate, impact, route: [fromSym, toSym] };
}
