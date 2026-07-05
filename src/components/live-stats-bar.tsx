import { useEffect, useState } from "react";
import { createPublicClient, http, formatGwei } from "viem";
import { ritualChain, RITUAL_RPC } from "@/lib/ritual-chain";
import { CatMascot } from "./cat-mascot";

const publicClient = createPublicClient({
  chain: ritualChain,
  transport: http(RITUAL_RPC),
});

type Stats = {
  block: bigint | null;
  gasGwei: string | null;
  tps: string | null;
  ok: boolean;
};

export function LiveStatsBar() {
  const [stats, setStats] = useState<Stats>({
    block: null,
    gasGwei: null,
    tps: null,
    ok: true,
  });
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const window: { ts: number; txs: number }[] = [];

    const unwatch = publicClient.watchBlocks({
      onBlock: (block) => {
        if (cancelled) return;
        window.push({ ts: Number(block.timestamp), txs: block.transactions.length });
        const cutoff = Number(block.timestamp) - 30;
        while (window.length > 0 && window[0].ts < cutoff) window.shift();
        const totalTxs = window.reduce((a, b) => a + b.txs, 0);
        const tps = window.length > 1 ? (totalTxs / 30).toFixed(2) : "—";
        setStats((s) => ({ ...s, block: block.number, tps, ok: true }));
        setPulse((n) => n + 1);
      },
      onError: () => setStats((s) => ({ ...s, ok: false })),
      emitOnBegin: true,
      pollingInterval: 2000,
    });

    const gasInterval = setInterval(async () => {
      try {
        const gas = await publicClient.getGasPrice();
        if (cancelled) return;
        setStats((s) => ({ ...s, gasGwei: Number(formatGwei(gas)).toFixed(2), ok: true }));
      } catch {
        setStats((s) => ({ ...s, ok: false }));
      }
    }, 4000);

    return () => {
      cancelled = true;
      unwatch();
      clearInterval(gasInterval);
    };
  }, []);

  return (
    <div className="border-b border-border bg-card/50">
      <div className="mx-auto max-w-5xl px-6 py-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`size-1.5 rounded-full ${stats.ok ? "bg-signal animate-pulse" : "bg-destructive"}`}
          />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {stats.ok ? "Live" : "Offline"}
          </span>
        </span>
        <Stat label="block" value={stats.block ? `#${stats.block.toString()}` : "…"} />
        <Stat label="gas" value={stats.gasGwei ? `${stats.gasGwei} gwei` : "…"} />
        <Stat label="tps 30s" value={stats.tps ?? "…"} />
        <div className="ml-auto" key={pulse}>
          <CatMascot size={22} className="cat-hop" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="font-mono text-foreground">{value}</span>
    </span>
  );
}
