import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { Droplets, Rocket, ExternalLink, RefreshCcw } from "lucide-react";
import { ritualChain, RITUAL_EXPLORER } from "@/lib/ritual-chain";
import { getActiveFactory } from "@/lib/deployments";
import { prefetchPools, invalidatePoolsCache, type PoolRow } from "@/lib/prefetch";
import { NetworkGuard } from "@/components/network-guard";
import { PoolsSkeleton } from "@/components/skeletons/pools-skeleton";

export const Route = createFileRoute("/pools")({
  head: () => ({
    meta: [
      { title: "Pools · Ritual DEX" },
      {
        name: "description",
        content: "All liquidity pools on the Ritual testnet DEX. Real reserves, LP supply, and quick liquidity actions.",
      },
      { property: "og:title", content: "Ritual DEX — Pools" },
      { property: "og:description", content: "Live AMM pools on Ritual chain 1979." },
    ],
  }),
  component: PoolsPage,
});

function PoolsPage() {
  const pub = usePublicClient({ chainId: ritualChain.id });
  const [factory, setFactory] = useState<`0x${string}` | null>(() => getActiveFactory());
  const [rows, setRows] = useState<PoolRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const sync = () => setFactory(getActiveFactory());
    window.addEventListener("ritual:dex", sync);
    return () => window.removeEventListener("ritual:dex", sync);
  }, []);

  useEffect(() => {
    if (!pub || !factory) {
      setRows(null);
      return;
    }
    let cancel = false;
    (async () => {
      try {
        const enriched = await prefetchPools(pub, factory);
        if (!cancel) setRows(enriched);
      } catch (e) {
        if (!cancel) setErr(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancel = true;
    };
  }, [pub, factory, reload]);

  // Reload button should bust the shared cache so we re-fetch.
  function refresh() {
    invalidatePoolsCache();
    setReload((n) => n + 1);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">DEX · testnet 1979</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Pools</h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Semua pair yang di-deploy oleh Factory aktif. Fee swap 0.30% masuk ke LP holder proporsional.
          </p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:border-signal/40 hover:text-signal"
        >
          <RefreshCcw className="size-3.5" /> Refresh
        </button>
      </div>

      <div className="mb-4">
        <NetworkGuard />
      </div>

      {!factory ? (
        <EmptyState
          title="Factory belum di-deploy"
          body="Setup DEX di /deploy → tab DEX untuk mulai."
        />
      ) : rows === null && !err ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Loading pools…
        </div>
      ) : err ? (
        <div className="rounded-xl border border-chart-4/40 bg-chart-4/5 p-4 text-xs text-chart-4 font-mono">
          {err}
        </div>
      ) : rows && rows.length === 0 ? (
        <EmptyState title="Belum ada pool" body="Buat pair pertama di /swap → Liquidity." />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            <span>Pair</span>
            <span>Reserve 0</span>
            <span>Reserve 1</span>
            <span>LP supply</span>
            <span />
          </div>
          {rows?.map((r) => (
            <div
              key={r.pair}
              className="grid grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-border/60 last:border-b-0 items-center text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="grid place-items-center size-7 rounded-full bg-signal/10 text-signal text-[11px] font-semibold">
                  {r.s0[0]}
                </div>
                <div className="grid place-items-center size-7 -ml-2 rounded-full bg-chart-2/20 text-chart-2 text-[11px] font-semibold">
                  {r.s1[0]}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {r.s0} / {r.s1}
                  </div>
                  <a
                    href={`${RITUAL_EXPLORER}/address/${r.pair}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[10px] text-muted-foreground hover:text-signal inline-flex items-center gap-0.5"
                  >
                    {r.pair.slice(0, 8)}…{r.pair.slice(-4)}
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
              </div>
              <div className="font-mono text-xs">{formatShort(r.r0, 18)}</div>
              <div className="font-mono text-xs">{formatShort(r.r1, 18)}</div>
              <div className="font-mono text-xs">{formatShort(r.lp, 18)}</div>
              <Link
                to="/swap"
                className="inline-flex items-center gap-1 rounded-md border border-signal/40 px-2 py-1 text-xs text-signal hover:bg-signal/10"
              >
                Add
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center rounded-xl border border-border bg-card">
      <Droplets className="size-10 text-signal/70" />
      <div className="text-lg font-semibold">{title}</div>
      <p className="text-sm text-muted-foreground max-w-md">{body}</p>
      <Link
        to="/deploy"
        className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-signal px-3 py-1.5 text-xs font-medium text-signal-foreground"
      >
        <Rocket className="size-3.5" /> Deploy DEX
      </Link>
    </div>
  );
}

function formatShort(raw: bigint, decimals: number): string {
  const n = Number(formatUnits(raw, decimals));
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  if (n < 1) return n.toFixed(4);
  if (n < 1000) return n.toFixed(2);
  if (n < 1_000_000) return (n / 1000).toFixed(2) + "K";
  return (n / 1_000_000).toFixed(2) + "M";
}