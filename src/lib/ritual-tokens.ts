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
    address: "0x9Be498b02cA7AFCF3eaC175aa4b40D39195b0085",
    decimals: 18,
    color: "#4ade80",
    logo: "$",
    isReal: true,
    note: "Stablecoin",
  },
  {
    symbol: "AIR",
    name: "Ritual Agent Inference",
    address: "0x6E4028fC0aAbCe5aFfDf7ee50b7f872262E49DC1",
    decimals: 18,
    color: "#60a5fa",
    logo: "A",
    isReal: true,
    note: "LLM/ONNX precompile usage",
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
  {
    symbol: "RMEME",
    name: "Ritual Meme",
    address: "0x50d9D03A80DbE7AF5F27568CfcD48B87D85c7Dab",
    decimals: 18,
    color: "#fbbf24",
    logo: "M",
    isReal: true,
    note: "Community meme token",
  },
  {
    symbol: "AGENT",
    name: "Agent Token",
    address: "0x89376BA0B8BD6A4BA75964bB9A2103b272f2D86a",
    decimals: 18,
    color: "#a78bfa",
    logo: "G",
    isReal: true,
    note: "Autonomous agent governance",
  },
  {
    symbol: "DEFI",
    name: "DeFi Token",
    address: "0x18A527cb88Dfd36c6374C598D98284c2FE4F7918",
    decimals: 18,
    color: "#34d399",
    logo: "D",
    isReal: true,
    note: "DeFi protocol token",
  },
  {
    symbol: "NFTX",
    name: "NFT Token",
    address: "0xee11De69D75C8ceB05Bd09E23cF3042e627c9afa",
    decimals: 18,
    color: "#f87171",
    logo: "N",
    isReal: true,
    note: "NFT marketplace token",
  },
];

export const ROUTER_ADDRESS = "0xA1A36B9dd9877F580b51D407B023D08c66A937B6" as const;
export const FACTORY_ADDRESS = "0x2C8b6652f2C48b8596F87a2f3e0e1449791aB39c" as const;

export type PairInfo = {
  token0: string;
  token1: string;
  address: `0x${string}`;
};

export const PAIRS: PairInfo[] = [
  { token0: "USDR", token1: "AIR", address: "0xE43fdF32C4769d3508c3eb52FbB7d95E792CFC7A" },
  { token0: "USDR", token1: "COMPUTE", address: "0x0F20fCBCdd55645580A00e335767dBFe37fe8e30" },
  { token0: "USDR", token1: "RMEME", address: "0xeBDA49a6D77B566E142449D64d40996eF1123bD7" },
  { token0: "USDR", token1: "AGENT", address: "0x5d972711974B41df42F62aC48E4364314539918a" },
  { token0: "USDR", token1: "DEFI", address: "0x471f6359baB1Ee515F207b6C91e97B8f3e1AF795" },
  { token0: "USDR", token1: "NFTX", address: "0x88C3197C58B799247A27455Bf112d1B1619c368B" },
  { token0: "AIR", token1: "COMPUTE", address: "0xF0a4Adb09C9B67576e3A8971C7E687b70Af9bd31" },
  { token0: "AIR", token1: "RMEME", address: "0x86BE1983E00082010B46522f699193dF27feE26C" },
  { token0: "AIR", token1: "AGENT", address: "0xd2a5596044cF0eCFEf1a03F5CEA942F55d93ee8B" },
  { token0: "AIR", token1: "DEFI", address: "0xBAd5431c349deccB63a5F64031c89eE8d7C8f5D6" },
  { token0: "COMPUTE", token1: "RMEME", address: "0xBA5Bb82724f8F495AD6f870cC085a05708F22514" },
  { token0: "COMPUTE", token1: "AGENT", address: "0x314F1CB8bb8Ae393B37163d9aab1E5C09873546e" },
  { token0: "RMEME", token1: "AGENT", address: "0x60534f6B30CDA7584c40bf5944A3ead913EA2f97" },
  { token0: "DEFI", token1: "NFTX", address: "0x936f92F13132DA0df8652C6A8FD529FCff470166" },
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
