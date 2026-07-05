import { defineChain } from "viem";

export const RITUAL_RPC = "https://rpc.ritualfoundation.org";
export const RITUAL_EXPLORER = "https://explorer.ritualfoundation.org";
export const RITUAL_FAUCET = "https://faucet.ritualfoundation.org";

export const ritualChain = defineChain({
  id: 1979,
  name: "Ritual Testnet",
  nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 },
  rpcUrls: {
    default: { http: [RITUAL_RPC] },
    public: { http: [RITUAL_RPC] },
  },
  blockExplorers: {
    default: { name: "Ritual Testnet Explorer", url: RITUAL_EXPLORER },
  },
  testnet: true,
});

// Precompile / system addresses
export const PRECOMPILE_ADDRESSES = {
  ONNX: "0x0000000000000000000000000000000000000800",
  HTTP: "0x0000000000000000000000000000000000000801",
  LLM: "0x0000000000000000000000000000000000000802",
  DKMS: "0x0000000000000000000000000000000000000803",
  SCHEDULER: "0x0000000000000000000000000000000000000804",
  X402: "0x0000000000000000000000000000000000000805",
  JQ: "0x0000000000000000000000000000000000000806",
} as const;
