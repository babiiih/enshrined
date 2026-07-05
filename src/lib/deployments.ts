// Lightweight localStorage registry for user-deployed contracts on chain 1979.
// This is a client-only convenience index; it does NOT replace a real indexer.

export type DeployedToken = {
  kind: "token";
  address: `0x${string}`;
  name: string;
  symbol: string;
  supply: string; // human-readable, e.g. "1000000"
  deployer: `0x${string}`;
  deployedAt: number;
  txHash: `0x${string}`;
};

export type DeployedNFT = {
  kind: "nft";
  address: `0x${string}`;
  name: string;
  symbol: string;
  baseURI: string;
  mintPrice: string; // in RITUAL, human-readable
  deployer: `0x${string}`;
  deployedAt: number;
  txHash: `0x${string}`;
};

export type DeployedMarket = {
  kind: "market";
  address: `0x${string}`;
  deployer: `0x${string}`;
  deployedAt: number;
  txHash: `0x${string}`;
};

export type DeployedWrapped = {
  kind: "wrapped";
  address: `0x${string}`;
  name: string;
  symbol: string;
  deployer: `0x${string}`;
  deployedAt: number;
  txHash: `0x${string}`;
};

export type DeployedDex = {
  kind: "factory" | "router";
  address: `0x${string}`;
  deployer: `0x${string}`;
  deployedAt: number;
  txHash: `0x${string}`;
};

export type DeployedStaking = {
  kind: "staking";
  address: `0x${string}`;
  name: string;
  symbol: string;
  rewardRate: string; // wei/sec, string
  deployer: `0x${string}`;
  deployedAt: number;
  txHash: `0x${string}`;
};

export type Deployed =
  | DeployedToken
  | DeployedNFT
  | DeployedMarket
  | DeployedWrapped
  | DeployedDex
  | DeployedStaking;

const KEY = "ritual.deployments.v1";
const MARKET_KEY = "ritual.market.active";
const WRAP_KEY = "ritual.wrap.active";
const FACTORY_KEY = "ritual.factory.active";
const ROUTER_KEY = "ritual.router.active";
const STAKING_KEY = "ritual.staking.active";
const LISTINGS_HINT_KEY = "ritual.listings.hint.v1";

export function loadDeployments(): Deployed[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Deployed[];
  } catch {
    return [];
  }
}

export function saveDeployment(item: Deployed) {
  if (typeof window === "undefined") return;
  const all = loadDeployments();
  all.unshift(item);
  window.localStorage.setItem(KEY, JSON.stringify(all.slice(0, 200)));
  window.dispatchEvent(new Event("ritual:deployments"));
}

export function getActiveMarket(): `0x${string}` | null {
  if (typeof window === "undefined") return null;
  return (window.localStorage.getItem(MARKET_KEY) as `0x${string}` | null) ?? null;
}

export function setActiveMarket(addr: `0x${string}`) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MARKET_KEY, addr);
  window.dispatchEvent(new Event("ritual:market"));
}

export function getActiveWrap(): `0x${string}` | null {
  if (typeof window === "undefined") return null;
  const env = (import.meta.env.VITE_WRITUAL_ADDRESS as `0x${string}` | undefined) ?? null;
  return env ?? ((window.localStorage.getItem(WRAP_KEY) as `0x${string}` | null) ?? null);
}

export function setActiveWrap(addr: `0x${string}`) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WRAP_KEY, addr);
  window.dispatchEvent(new Event("ritual:wrap"));
}

export function getActiveFactory(): `0x${string}` | null {
  if (typeof window === "undefined") return null;
  const env = (import.meta.env.VITE_FACTORY_ADDRESS as `0x${string}` | undefined) ?? null;
  return env ?? ((window.localStorage.getItem(FACTORY_KEY) as `0x${string}` | null) ?? null);
}
export function setActiveFactory(addr: `0x${string}`) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FACTORY_KEY, addr);
  window.dispatchEvent(new Event("ritual:dex"));
}
export function getActiveRouter(): `0x${string}` | null {
  if (typeof window === "undefined") return null;
  const env = (import.meta.env.VITE_ROUTER_ADDRESS as `0x${string}` | undefined) ?? null;
  return env ?? ((window.localStorage.getItem(ROUTER_KEY) as `0x${string}` | null) ?? null);
}
export function setActiveRouter(addr: `0x${string}`) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROUTER_KEY, addr);
  window.dispatchEvent(new Event("ritual:dex"));
}

export function getActiveStaking(): `0x${string}` | null {
  if (typeof window === "undefined") return null;
  const env = (import.meta.env.VITE_XRITUAL_ADDRESS as `0x${string}` | undefined) ?? null;
  return env ?? ((window.localStorage.getItem(STAKING_KEY) as `0x${string}` | null) ?? null);
}
export function setActiveStaking(addr: `0x${string}`) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STAKING_KEY, addr);
  window.dispatchEvent(new Event("ritual:staking"));
}

// Hint index of (nft, tokenId) pairs users have listed via this UI, so the
// marketplace can enumerate them without an indexer. Actual on-chain state
// still wins (we re-read listings from the contract).
export type ListingHint = { nft: `0x${string}`; tokenId: string };
export function loadListingHints(market: `0x${string}`): ListingHint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(`${LISTINGS_HINT_KEY}:${market.toLowerCase()}`);
    return raw ? (JSON.parse(raw) as ListingHint[]) : [];
  } catch {
    return [];
  }
}
export function addListingHint(market: `0x${string}`, hint: ListingHint) {
  if (typeof window === "undefined") return;
  const k = `${LISTINGS_HINT_KEY}:${market.toLowerCase()}`;
  const cur = loadListingHints(market);
  if (!cur.find((h) => h.nft.toLowerCase() === hint.nft.toLowerCase() && h.tokenId === hint.tokenId)) {
    cur.unshift(hint);
    window.localStorage.setItem(k, JSON.stringify(cur.slice(0, 500)));
    window.dispatchEvent(new Event("ritual:listings"));
  }
}
