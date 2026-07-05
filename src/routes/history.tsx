import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { ExternalLink, Trash2, History as HistoryIcon, CircleCheck, CircleX, Loader2, PenLine, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RITUAL_EXPLORER } from "@/lib/ritual-chain";
import {
  clearTxHistory,
  listTxHistory,
  subscribeTxHistory,
  upsertTx,
  type TxEntry,
  type TxStatus,
} from "@/lib/tx-history";
import { AuthGuard } from "@/components/auth-guard";
import { NetworkGuard } from "@/components/network-guard";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Riwayat Transaksi · Ritual" },
      { name: "description", content: "Lifecycle transaksi swap, deploy, dan marketplace di Ritual testnet." },
      { property: "og:title", content: "Riwayat Transaksi · Ritual" },
      { property: "og:description", content: "Pending → confirmed / reverted, dengan link explorer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AuthGuard title="Riwayat transaksi">
      <HistoryPage />
    </AuthGuard>
  ),
});

function HistoryPage() {
  const [items, setItems] = useState<TxEntry[]>([]);
  const [, setTick] = useState(0);
  const publicClient = usePublicClient();

  // Live subscription to store updates + 15s tick for "time ago".
  useEffect(() => {
    const sync = () => setItems(listTxHistory());
    sync();
    const unsub = subscribeTxHistory(sync);
    const t = setInterval(() => setTick((n) => n + 1), 15_000);
    return () => {
      unsub();
      clearInterval(t);
    };
  }, []);

  // Reconciler: for stuck pending/signing entries (page reload, tab switch),
  // poll receipts and promote them to confirmed/reverted.
  useEffect(() => {
    if (!publicClient) return;
    let cancelled = false;
    const reconcile = async () => {
      const stale = listTxHistory().filter(
        (t) => t.hash && (t.status === "pending" || t.status === "signing"),
      );
      for (const t of stale) {
        if (cancelled || !t.hash) continue;
        try {
          const rcpt = await publicClient.getTransactionReceipt({ hash: t.hash });
          if (rcpt) {
            upsertTx({
              id: t.id,
              status: rcpt.status === "success" ? "confirmed" : "reverted",
              hash: t.hash,
            });
          }
        } catch {
          /* still pending or dropped — retry next tick */
        }
      }
    };
    void reconcile();
    const t = setInterval(reconcile, 6_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [publicClient]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Activity</div>
          <h1 className="h1 inline-flex items-center gap-3">
            <HistoryIcon className="h-6 w-6 text-primary" />
            Riwayat Transaksi
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Semua transaksi yang kamu kirim via swap, deploy, marketplace, dan playground — lifecycle penuh dari signing
            sampai confirmed / reverted, tersimpan lokal di browser.
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => clearTxHistory()}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Bersihkan
          </Button>
        )}
      </header>

      <NetworkGuard />

      {items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Belum ada transaksi. Coba kirim satu dari <span className="text-foreground">/swap</span>,{" "}
          <span className="text-foreground">/deploy</span>, atau <span className="text-foreground">/marketplace</span>.
        </Card>
      ) : (
        <div className="grid gap-2">
          {items.map((t) => (
            <Row key={t.id} tx={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ tx }: { tx: TxEntry }) {
  return (
    <Card className="p-4 flex items-center gap-4">
      <StatusBadge status={tx.status} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{tx.label}</div>
        <div className="text-xs text-muted-foreground font-mono truncate">
          {tx.hash ? tx.hash.slice(0, 14) + "…" + tx.hash.slice(-8) : "no hash yet"}
        </div>
        {tx.error && <div className="text-xs text-destructive mt-1 line-clamp-2">{tx.error}</div>}
      </div>
      <div className="text-right shrink-0">
        <div className="text-[11px] text-muted-foreground">{timeAgo(tx.updatedAt)}</div>
        {tx.hash && (
          <a
            href={`${RITUAL_EXPLORER}/tx/${tx.hash}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary inline-flex items-center gap-1 hover:underline mt-1"
          >
            Explorer <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </Card>
  );
}

function StatusBadge({ status }: { status: TxStatus }) {
  const map: Record<TxStatus, { icon: React.ReactNode; cls: string; label: string }> = {
    signing: { icon: <PenLine className="h-3.5 w-3.5" />, cls: "text-amber-300 bg-amber-500/10 border-amber-500/30", label: "Signing" },
    pending: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, cls: "text-sky-300 bg-sky-500/10 border-sky-500/30", label: "Pending" },
    confirmed: { icon: <CircleCheck className="h-3.5 w-3.5" />, cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30", label: "Confirmed" },
    reverted: { icon: <CircleX className="h-3.5 w-3.5" />, cls: "text-rose-300 bg-rose-500/10 border-rose-500/30", label: "Reverted" },
    error: { icon: <AlertTriangle className="h-3.5 w-3.5" />, cls: "text-rose-300 bg-rose-500/10 border-rose-500/30", label: "Error" },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-mono uppercase tracking-wider ${m.cls}`}>
      {m.icon} {m.label}
    </span>
  );
}

function timeAgo(ts: number) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
