import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { formatEther, formatUnits } from "viem";
import { ExternalLink, Wallet2, Coins, ImageIcon, Store, RefreshCcw, Loader2 } from "lucide-react";
import { NetworkGuard } from "@/components/network-guard";
import { AuthGuard } from "@/components/auth-guard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  loadDeployments,
  type Deployed,
  type DeployedToken,
  type DeployedNFT,
  type DeployedMarket,
} from "@/lib/deployments";
import { RITUAL_EXPLORER } from "@/lib/ritual-chain";
import { erc20Abi } from "viem";
import { cachedRead, invalidateCache } from "@/lib/onchain-cache";

export const Route = createFileRoute("/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio · Ritual" },
      {
        name: "description",
        content: "Your Ritual testnet portfolio — balances, deployed tokens, NFTs, and marketplaces.",
      },
      { property: "og:title", content: "Portfolio · Ritual" },
      { property: "og:description", content: "Your Ritual testnet balances and deployments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AuthGuard title="Your portfolio">
      <PortfolioPage />
    </AuthGuard>
  ),
});

function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const [items, setItems] = useState<Deployed[]>([]);

  useEffect(() => {
    const load = () => setItems(loadDeployments());
    load();
    window.addEventListener("ritual:deployments", load);
    return () => window.removeEventListener("ritual:deployments", load);
  }, []);

  const mine = useMemo(
    () => (address ? items.filter((i) => i.deployer.toLowerCase() === address.toLowerCase()) : []),
    [items, address],
  );
  const tokens = mine.filter((i): i is DeployedToken => i.kind === "token");
  const nfts = mine.filter((i): i is DeployedNFT => i.kind === "nft");
  const markets = mine.filter((i): i is DeployedMarket => i.kind === "market");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <header className="space-y-3">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Portfolio</div>
        <h1 className="h1">Aset kamu di Ritual</h1>
        <p className="text-muted-foreground max-w-2xl">
          Ringkasan saldo native, token & NFT hasil deploy kamu, plus marketplace instance yang kamu miliki. Semua data
          langsung dibaca on-chain dari RPC Ritual (chain 1979).
        </p>
        <NetworkGuard />
      </header>

      {!isConnected ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Wallet2 className="h-8 w-8 mx-auto mb-3 opacity-60" />
          Connect wallet untuk melihat portfolio kamu.
        </Card>
      ) : (
        <>
          <BalancesCard address={address!} />

          <Section
            title="Token ERC-20"
            icon={<Coins className="h-4 w-4" />}
            empty="Belum ada token yang kamu deploy. Buka /deploy untuk mint token pertama."
          >
            {tokens.map((t) => (
              <TokenRow key={t.address} token={t} owner={address!} />
            ))}
          </Section>

          <Section
            title="NFT Collections"
            icon={<ImageIcon className="h-4 w-4" />}
            empty="Belum ada koleksi NFT. Deploy ERC-721 di /deploy."
          >
            {nfts.map((n) => (
              <NftRow key={n.address} nft={n} />
            ))}
          </Section>

          <Section
            title="Marketplaces"
            icon={<Store className="h-4 w-4" />}
            empty="Belum ada marketplace instance. Deploy di /deploy → tab Marketplace."
          >
            {markets.map((m) => (
              <MarketRow key={m.address} market={m} />
            ))}
          </Section>
        </>
      )}
    </div>
  );
}

const BALANCE_TTL = 15_000; // 15s cache
const REFRESH_COOLDOWN = 4_000; // debounce refresh clicks

function useDebouncedRefresh(cb: () => Promise<void> | void) {
  const [busy, setBusy] = useState(false);
  const lastRef = useRef(0);
  const run = useCallback(async () => {
    const now = Date.now();
    if (busy || now - lastRef.current < REFRESH_COOLDOWN) return;
    lastRef.current = now;
    setBusy(true);
    try {
      await cb();
    } finally {
      setBusy(false);
    }
  }, [busy, cb]);
  return { run, busy };
}

function BalancesCard({ address }: { address: `0x${string}` }) {
  const publicClient = usePublicClient();
  const [value, setValue] = useState<bigint | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!publicClient) return;
      const key = `nativeBal:${address}`;
      if (force) invalidateCache(key);
      const v = await cachedRead(key, BALANCE_TTL, () => publicClient.getBalance({ address }));
      setValue(v);
    },
    [publicClient, address],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const { run, busy } = useDebouncedRefresh(() => load(true));

  const initialLoading = value === null && busy === false; // first load in-flight
  const isStale = value !== null && busy; // stale-while-refresh

  return (
    <Card className="p-6 flex items-center justify-between gap-6 flex-wrap">
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground inline-flex items-center gap-2">
          RITUAL (native)
          {isStale && (
            <span className="text-[10px] font-mono text-amber-400/80 inline-flex items-center gap-1">
              <Loader2 className="h-2.5 w-2.5 animate-spin" /> refreshing
            </span>
          )}
        </div>
        <div className={"mt-1 text-4xl font-serif transition-opacity " + (isStale ? "opacity-60" : "opacity-100")}>
          {value !== null ? (
            Number(formatEther(value)).toLocaleString(undefined, { maximumFractionDigits: 4 })
          ) : initialLoading || value === null ? (
            <span className="inline-block h-9 w-40 rounded-md bg-muted/60 animate-pulse align-middle" />
          ) : (
            "—"
          )}
        </div>
        <div className="text-xs text-muted-foreground font-mono mt-1">{shorten(address)}</div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={run} disabled={busy} title="Debounced 4s, cache 15s">
          <RefreshCcw className={"h-3.5 w-3.5 mr-1.5 " + (busy ? "animate-spin" : "")} />
          Refresh
        </Button>
        <a
          href={`${RITUAL_EXPLORER}/address/${address}`}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary inline-flex items-center gap-1 hover:underline"
        >
          Explorer <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </Card>
  );
}

function Section({
  title,
  icon,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <section className="space-y-3">
      <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-2">
        {icon} {title}
      </h2>
      {hasChildren ? (
        <div className="grid gap-3">{children}</div>
      ) : (
        <Card className="p-6 text-sm text-muted-foreground">{empty}</Card>
      )}
    </section>
  );
}

function TokenRow({ token, owner }: { token: DeployedToken; owner: `0x${string}` }) {
  const publicClient = usePublicClient();
  const [bal, setBal] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!publicClient) return;
      try {
        const key = `erc20Bal:${token.address}:${owner}`;
        const raw = await cachedRead(key, BALANCE_TTL, () =>
          publicClient.readContract({
            address: token.address,
            abi: erc20Abi,
            functionName: "balanceOf",
            args: [owner],
          }) as Promise<bigint>,
        );
        if (alive) setBal(Number(formatUnits(raw, 18)).toLocaleString(undefined, { maximumFractionDigits: 4 }));
      } catch {
        if (alive) setBal("—");
      }
    })();
    return () => {
      alive = false;
    };
  }, [publicClient, token.address, owner]);

  return (
    <Card className="p-4 flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">
          {token.name} <span className="text-muted-foreground">· {token.symbol}</span>
        </div>
        <div className="text-xs font-mono text-muted-foreground">{shorten(token.address)}</div>
      </div>
      <div className="text-right">
        <div className="text-lg tabular-nums">
          {bal === null ? (
            <span className="inline-block h-5 w-20 rounded bg-muted/60 animate-pulse align-middle" />
          ) : (
            bal
          )}
        </div>
        <a
          href={`${RITUAL_EXPLORER}/address/${token.address}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
        >
          Explorer <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </Card>
  );
}

function NftRow({ nft }: { nft: DeployedNFT }) {
  return (
    <Card className="p-4 flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">
          {nft.name} <span className="text-muted-foreground">· {nft.symbol}</span>
        </div>
        <div className="text-xs font-mono text-muted-foreground">{shorten(nft.address)}</div>
        <div className="text-xs text-muted-foreground mt-1">Mint price: {nft.mintPrice} RITUAL</div>
      </div>
      <a
        href={`${RITUAL_EXPLORER}/address/${nft.address}`}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
      >
        Explorer <ExternalLink className="h-3 w-3" />
      </a>
    </Card>
  );
}

function MarketRow({ market }: { market: DeployedMarket }) {
  return (
    <Card className="p-4 flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">Marketplace</div>
        <div className="text-xs font-mono text-muted-foreground">{shorten(market.address)}</div>
      </div>
      <a
        href={`${RITUAL_EXPLORER}/address/${market.address}`}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
      >
        Explorer <ExternalLink className="h-3 w-3" />
      </a>
    </Card>
  );
}

function shorten(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}
