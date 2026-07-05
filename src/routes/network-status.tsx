import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { SectionShell } from "@/components/section-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { RITUAL_RPC, RITUAL_EXPLORER, RITUAL_FAUCET } from "@/lib/ritual-chain";

export const Route = createFileRoute("/network-status")({
  head: () => ({
    meta: [
      { title: "Network Status — Ritual Testnet" },
      { name: "description", content: "Live health check untuk RPC, Explorer, dan Faucet Ritual testnet (chain 1979)." },
      { property: "og:title", content: "Network Status — Ritual Testnet" },
      { property: "og:description", content: "Cek ketersediaan RPC, Explorer, dan Faucet Ritual secara real-time." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NetworkStatusPage,
});

type Status = "checking" | "ok" | "degraded" | "down";

type EndpointResult = {
  key: string;
  label: string;
  url: string;
  role: string;
  status: Status;
  latencyMs?: number;
  detail?: string;
};

const INITIAL: EndpointResult[] = [
  { key: "rpc", label: "RPC", url: RITUAL_RPC, role: "JSON-RPC (eth_chainId + eth_blockNumber)", status: "checking" },
  { key: "explorer", label: "Explorer", url: RITUAL_EXPLORER, role: "Block explorer UI", status: "checking" },
  { key: "faucet", label: "Faucet", url: RITUAL_FAUCET, role: "Testnet RITUAL dispenser", status: "checking" },
];

async function checkRpc(url: string): Promise<EndpointResult> {
  const started = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    const latency = Math.round(performance.now() - started);
    if (!res.ok) {
      return { key: "rpc", label: "RPC", url, role: INITIAL[0].role, status: "down", latencyMs: latency, detail: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as { result?: string; error?: { message?: string } };
    if (json.error) {
      return { key: "rpc", label: "RPC", url, role: INITIAL[0].role, status: "degraded", latencyMs: latency, detail: json.error.message ?? "RPC error" };
    }
    const chainIdHex = json.result ?? "";
    const chainId = chainIdHex ? parseInt(chainIdHex, 16) : NaN;
    if (chainId !== 1979) {
      return { key: "rpc", label: "RPC", url, role: INITIAL[0].role, status: "degraded", latencyMs: latency, detail: `chainId mismatch: ${chainId}` };
    }
    return { key: "rpc", label: "RPC", url, role: INITIAL[0].role, status: "ok", latencyMs: latency, detail: `chainId 1979` };
  } catch (e) {
    const latency = Math.round(performance.now() - started);
    const msg = e instanceof Error ? e.message : "unreachable";
    return { key: "rpc", label: "RPC", url, role: INITIAL[0].role, status: "down", latencyMs: latency, detail: msg };
  }
}

async function checkOpaque(key: string, label: string, url: string, role: string): Promise<EndpointResult> {
  const started = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    // Browsers block cross-origin HEAD/GET reads; no-cors returns an opaque response
    // that still resolves iff the server answered. That's enough for reachability.
    await fetch(url, { method: "GET", mode: "no-cors", signal: controller.signal, cache: "no-store" });
    clearTimeout(timer);
    const latency = Math.round(performance.now() - started);
    return { key, label, url, role, status: "ok", latencyMs: latency, detail: "reachable" };
  } catch (e) {
    const latency = Math.round(performance.now() - started);
    const msg = e instanceof Error ? e.message : "unreachable";
    return { key, label, url, role, status: "down", latencyMs: latency, detail: msg };
  }
}

function StatusPill({ status }: { status: Status }) {
  if (status === "checking") {
    return (
      <Badge variant="outline" className="gap-1">
        <Loader2 className="size-3 animate-spin" /> Mengecek
      </Badge>
    );
  }
  if (status === "ok") {
    return (
      <Badge className="gap-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15">
        <CheckCircle2 className="size-3" /> Online
      </Badge>
    );
  }
  if (status === "degraded") {
    return (
      <Badge className="gap-1 bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/15">
        <AlertTriangle className="size-3" /> Degraded
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/15">
      <AlertTriangle className="size-3" /> Down
    </Badge>
  );
}

function NetworkStatusPage() {
  const [results, setResults] = useState<EndpointResult[]>(INITIAL);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [running, setRunning] = useState(false);

  const runChecks = useCallback(async () => {
    setRunning(true);
    setResults(INITIAL);
    const [rpc, explorer, faucet] = await Promise.all([
      checkRpc(RITUAL_RPC),
      checkOpaque("explorer", "Explorer", RITUAL_EXPLORER, INITIAL[1].role),
      checkOpaque("faucet", "Faucet", RITUAL_FAUCET, INITIAL[2].role),
    ]);
    setResults([rpc, explorer, faucet]);
    setCheckedAt(new Date());
    setRunning(false);
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const problems = results.filter((r) => r.status === "down" || r.status === "degraded");
  const allOk = results.every((r) => r.status === "ok");

  return (
    <SectionShell
      eyebrow="Status"
      title="Status jaringan Ritual"
      lede="Live health check untuk endpoint publik testnet Ritual (chain 1979). Jika ada endpoint bermasalah, sebagian fitur DeFi & faucet mungkin tidak berjalan."
      related={[
        { title: "Chain", to: "/chain" },
        { title: "Playground", to: "/playground" },
        { title: "Overview", to: "/" },
      ]}
    >
      <div className="not-prose space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {checkedAt
              ? `Terakhir dicek ${checkedAt.toLocaleTimeString()}`
              : "Menjalankan pengecekan..."}
          </div>
          <Button onClick={runChecks} disabled={running} size="sm" variant="outline" className="gap-2">
            <RefreshCw className={`size-4 ${running ? "animate-spin" : ""}`} /> Cek ulang
          </Button>
        </div>

        {!running && problems.length > 0 && (
          <div
            role="alert"
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100"
          >
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-4" /> Peringatan: {problems.length} endpoint bermasalah
            </div>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              {problems.map((p) => (
                <li key={p.key}>
                  <span className="font-mono">{p.label}</span> — {p.status}
                  {p.detail ? `: ${p.detail}` : ""}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-amber-200/80">
              Swap, Pools, Deploy dan Portfolio mungkin tidak berfungsi normal sampai endpoint kembali online.
            </p>
          </div>
        )}

        {!running && allOk && (
          <div
            role="status"
            className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-100 flex items-center gap-2"
          >
            <CheckCircle2 className="size-4" /> Semua endpoint online — jaringan sehat.
          </div>
        )}

        <div className="grid gap-3">
          {results.map((r) => (
            <Card key={r.key} className="border-border/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">{r.label}</CardTitle>
                <StatusPill status={r.status} />
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-muted-foreground">{r.role}</div>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-mono text-xs text-signal hover:underline break-all"
                >
                  {r.url}
                  <ExternalLink className="size-3" />
                </a>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
                  {typeof r.latencyMs === "number" && <span>Latency: {r.latencyMs} ms</span>}
                  {r.detail && <span>Detail: {r.detail}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Catatan: Explorer & Faucet dicek via permintaan lintas domain (opaque response). Latency yang ditampilkan adalah waktu handshake browser — bukan indikator kesehatan aplikasi di baliknya. RPC dicek dengan panggilan <code className="font-mono">eth_chainId</code> nyata dan memverifikasi chain 1979.
        </p>
      </div>
    </SectionShell>
  );
}
