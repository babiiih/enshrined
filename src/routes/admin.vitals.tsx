import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Activity, RefreshCcw, TrendingUp, LogOut } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { readLocalVitals } from "@/lib/vitals-client";
import { checkAdmin, lockAdmin } from "@/lib/admin-gate.functions";

type M = { id: string; name: string; value: number; rating: string; path: string; ts: number };

export const Route = createFileRoute("/admin/vitals")({
  head: () => ({
    meta: [
      { title: "Web Vitals · Admin" },
      { name: "description", content: "Ringkasan LCP / CLS / INP dari user Ritual Docs Explorer." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  loader: async () => {
    const { admin } = await checkAdmin();
    if (!admin) throw redirect({ to: "/admin/unlock" });
    return null;
  },
  component: VitalsAdmin,
});

const BUDGET: Record<string, { good: number; poor: number; unit: string; scale?: number }> = {
  LCP: { good: 2500, poor: 4000, unit: "ms" },
  INP: { good: 200, poor: 500, unit: "ms" },
  CLS: { good: 100, poor: 250, unit: "×1000" },
  FCP: { good: 1800, poor: 3000, unit: "ms" },
  TTFB: { good: 800, poor: 1800, unit: "ms" },
};

function VitalsAdmin() {
  const [server, setServer] = useState<M[]>([]);
  const [local, setLocal] = useState<M[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/public/vitals", { cache: "no-store" });
      const j = (await res.json()) as { metrics: M[] };
      setServer(j.metrics ?? []);
    } catch {
      setServer([]);
    }
    setLocal(readLocalVitals());
    setLoading(false);
  };
  useEffect(() => {
    void load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, []);

  const all = useMemo(() => {
    const seen = new Set<string>();
    return [...server, ...local].filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
  }, [server, local]);

  const groups = useMemo(() => {
    const g: Record<string, M[]> = {};
    for (const m of all) (g[m.name] ??= []).push(m);
    return g;
  }, [all]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Admin · Observability</div>
          <h1 className="h1 inline-flex items-center gap-3">
            <Activity className="h-6 w-6 text-primary" />
            Web Vitals
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Ringkasan LCP / CLS / INP / FCP / TTFB dari pengunjung. Data server = in-memory ring buffer (reset saat cold
            start), data lokal = browser saat ini.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCcw className={"h-3.5 w-3.5 mr-1.5 " + (loading ? "animate-spin" : "")} />
            Refresh
          </Button>
          <LockButton />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.keys(BUDGET).map((name) => (
          <MetricSummary key={name} name={name} samples={groups[name] ?? []} />
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Sample terbaru</h2>
        <Card className="divide-y divide-border">
          {all.slice(0, 40).map((m) => (
            <div key={m.id} className="p-3 flex items-center gap-3 text-sm">
              <span className="font-mono text-xs w-14">{m.name}</span>
              <span className="tabular-nums w-20">{Math.round(m.value)}</span>
              <RatingPill rating={m.rating} />
              <span className="font-mono text-xs text-muted-foreground truncate flex-1">{m.path}</span>
              <span className="text-[11px] text-muted-foreground">{new Date(m.ts).toLocaleTimeString()}</span>
            </div>
          ))}
          {all.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">Belum ada sample.</div>}
        </Card>
      </section>
    </div>
  );
}

function MetricSummary({ name, samples }: { name: string; samples: M[] }) {
  const budget = BUDGET[name];
  const sorted = samples.map((s) => s.value).sort((a, b) => a - b);
  const p75 = sorted.length ? sorted[Math.floor(sorted.length * 0.75)] : null;
  const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : null;
  const rating = p75 === null ? "—" : p75 <= budget.good ? "good" : p75 <= budget.poor ? "needs-improvement" : "poor";
  const barPct =
    p75 === null ? 0 : Math.min(100, Math.round((p75 / budget.poor) * 100));

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{name}</div>
        <RatingPill rating={rating} />
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-serif tabular-nums">{p75 !== null ? Math.round(p75) : "—"}</div>
        <div className="text-xs text-muted-foreground">p75 · {budget.unit}</div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={
            "h-full transition-all " +
            (rating === "good"
              ? "bg-emerald-500"
              : rating === "needs-improvement"
                ? "bg-amber-500"
                : rating === "poor"
                  ? "bg-rose-500"
                  : "bg-muted-foreground/30")
          }
          style={{ width: `${barPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
        <span>good ≤{budget.good}</span>
        <span>poor &gt;{budget.poor}</span>
      </div>
      <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
        <TrendingUp className="h-3 w-3" /> n={samples.length} · p95={p95 !== null ? Math.round(p95) : "—"}
      </div>
    </Card>
  );
}

function LockButton() {
  const lock = useServerFn(lockAdmin);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await lock();
        window.location.href = "/admin/unlock";
      }}
    >
      <LogOut className="h-3.5 w-3.5 mr-1.5" />
      Lock
    </Button>
  );
}

function RatingPill({ rating }: { rating: string }) {
  const cls =
    rating === "good"
      ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
      : rating === "needs-improvement"
        ? "text-amber-300 bg-amber-500/10 border-amber-500/30"
        : rating === "poor"
          ? "text-rose-300 bg-rose-500/10 border-rose-500/30"
          : "text-muted-foreground bg-muted border-border";
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-mono uppercase ${cls}`}>
      {rating}
    </span>
  );
}
