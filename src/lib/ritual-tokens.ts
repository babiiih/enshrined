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

export const ROUTER_ADDRESS = "0x89a1bc4F5F6563134D66259aA8326aBc4B4D6888" as const;
export const FACTORY_ADDRESS = "0x8fa5d9717533286c1AF4b0e829b884B7eA581Cc6" as const;

export type PairInfo = {
  token0: string;
  token1: string;
  address: `0x${string}`;
};

export const PAIRS: PairInfo[] = [
  // Original pairs
  { token0: "USDR", token1: "AIR", address: "0xC432Eaf3f2dd5271F0dA6Ad11a53ae90410722cB" },
  { token0: "USDR", token1: "COMPUTE", address: "0x194AC8d266d76d22cD5F67348fFAAeAc3ba4CE78" },
  { token0: "AIR", token1: "COMPUTE", address: "0xd177D0a013260cb5b126b57D56af1bB15b938a7f" },
  // New pairs
  { token0: "USDR", token1: "RMEME", address: "0xbec560dbe3a3fcfa5e7be9837a575140453df28b" },
  { token0: "USDR", token1: "AGENT", address: "0x40054b9539b50b8d165ffe4f2d38c44ccfe2752c" },
  { token0: "USDR", token1: "DEFI", address: "0xb6fc4ce79c3746f41ff4a1ca40e70f482d02eacd" },
  { token0: "USDR", token1: "NFTX", address: "0xc5daf106e765a97dc07175b9888dd5e9d40c57b3" },
  { token0: "AIR", token1: "RMEME", address: "0xee137aab3fbe9bf9f34b8f8c3aec3a54c279019e" },
  { token0: "AIR", token1: "AGENT", address: "0x71d981eef579b32dec51c950b25482aa66f67f5d" },
  { token0: "AIR", token1: "DEFI", address: "0x60e07144b3af2bec652ac0eb7cf85aa8ff54b0a7" },
  { token0: "COMPUTE", token1: "RMEME", address: "0x88dbd272394d12c590f95305d7d119e749f4eca9" },
  { token0: "COMPUTE", token1: "AGENT", address: "0xcf5cec12d99475b3bc9dee24b05002eee5103970" },
  { token0: "RMEME", token1: "AGENT", address: "0xf59d2deada90a0bfb00a400affd0a3810ce66ede" },
  { token0: "DEFI", token1: "NFTX", address: "0x2459892cc898d06101f94f37b681251e2db66a4d" },
];

export const tokenBySymbol = (s: string) => TOKENS.find((t) => t.symbol === s)!;
