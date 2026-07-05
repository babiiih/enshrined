import { loadDeployments, getActiveWrap } from "@/lib/deployments";

export type Erc20Entry = {
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
  kind: "wrap" | "token";
};

/** All ERC-20 tokens usable in the DEX: wRITUAL + user-deployed ERC20s. */
export function listErc20Tokens(): Erc20Entry[] {
  const out: Erc20Entry[] = [];
  const wrap = getActiveWrap();
  if (wrap) {
    out.push({ address: wrap, symbol: "wRITUAL", name: "Wrapped Ritual", decimals: 18, kind: "wrap" });
  }
  for (const d of loadDeployments()) {
    if (d.kind === "token") {
      out.push({ address: d.address, symbol: d.symbol, name: d.name, decimals: 18, kind: "token" });
    }
  }
  return out;
}