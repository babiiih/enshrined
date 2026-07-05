import artifacts from "./artifacts.json";

type Artifact = { abi: unknown[]; bytecode: `0x${string}` };
const typed = artifacts as unknown as Record<
  "RitualToken" | "RitualNFT" | "RitualMarket" | "WrappedRitual" | "RitualFactory" | "RitualPair" | "RitualRouter" | "RitualStaking",
  Artifact
>;

export const RitualToken = typed.RitualToken;
export const RitualNFT = typed.RitualNFT;
export const RitualMarket = typed.RitualMarket;
export const WrappedRitual = typed.WrappedRitual;
export const RitualFactory = typed.RitualFactory;
export const RitualPair = typed.RitualPair;
export const RitualRouter = typed.RitualRouter;
export const RitualStaking = typed.RitualStaking;

// Default deployed marketplace address (can be overridden via localStorage).
// Users can deploy their own market from the /deploy page.
export const DEFAULT_MARKET_ADDRESS: `0x${string}` | undefined = undefined;
