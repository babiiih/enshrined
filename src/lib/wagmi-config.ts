import { createConfig } from "@privy-io/wagmi";
import { http } from "wagmi";
import { ritualChain, RITUAL_RPC } from "./ritual-chain";

export function buildWagmiConfig() {
  return createConfig({
    chains: [ritualChain],
    transports: {
      [ritualChain.id]: http(RITUAL_RPC),
    },
  });
}
