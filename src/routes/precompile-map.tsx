import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { CAPABILITIES, MODES, PRECOMPILES, type Capability, type ExecMode } from "@/data/precompiles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/precompile-map")({
  head: () => ({
    meta: [
      { title: "Precompile Map — Ritual Chain Docs" },
      {
        name: "description",
        content:
          "All 16 Ritual precompiles across 7 capabilities. Filter by execution mode, jump to details, copy addresses.",
      },
      { property: "og:title", content: "Ritual Precompile Map" },
      {
        property: "og:description",
        content: "Think, Create, Act, Remember, Prove, Keep Secrets, Pay.",
      },
    ],
  }),
  component: PrecompileMap,
});

const MODE_STYLES: Record<ExecMode, string> = {
  Sync: "bg-signal/15 text-signal border-signal/30",
  "Short-Async (SPC)": "bg-chart-2/15 text-chart-2 border-chart-2/30",
  "Two-Phase Async": "bg-chart-4/15 text-chart-4 border-chart-4/30",
};

function PrecompileMap() {
  const [q, setQ] = useState("");
  const [cap, setCap] = useState<Capability | "All">("All");
  const [mode, setMode] = useState<ExecMode | "All">("All");

  const filtered = useMemo(
    () =>
      PRECOMPILES.filter(
        (p) =>
          (cap === "All" || p.capability === cap) &&
          (mode === "All" || p.mode === mode) &&
          (q === "" ||
            p.name.toLowerCase().includes(q.toLowerCase()) ||
            p.address.toLowerCase().includes(q.toLowerCase()) ||
            p.tagline.toLowerCase().includes(q.toLowerCase())),
      ),
    [q, cap, mode],
  );

  const byCapability = CAPABILITIES.map((c) => ({
    ...c,
    items: filtered.filter((p) => p.capability === c.name),
  })).filter((c) => c.items.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal mb-2">
          Getting Started
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Precompile Map</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          What smart contracts can do on Ritual. Seven capabilities, sixteen precompiles. Each one
          runs either inline (Sync), inside the same transaction via short-async (SPC), or via a
          callback in a later block (Two-Phase).
        </p>
      </div>

      {/* Filters */}
      <div className="sticky top-12 z-20 -mx-6 px-6 py-3 mb-6 bg-background/85 backdrop-blur border-b border-border">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name, address, or tagline…"
            className="h-9 min-w-[220px] flex-1 rounded-md border border-border bg-muted/40 px-3 text-sm focus:border-signal outline-none"
          />
          <FilterGroup
            label="Capability"
            value={cap}
            options={["All", ...CAPABILITIES.map((c) => c.name)]}
            onChange={(v) => setCap(v as Capability | "All")}
          />
          <FilterGroup
            label="Mode"
            value={mode}
            options={["All", ...MODES]}
            onChange={(v) => setMode(v as ExecMode | "All")}
          />
          <div className="ml-auto text-xs text-muted-foreground font-mono">
            {filtered.length} / {PRECOMPILES.length}
          </div>
        </div>
      </div>

      {byCapability.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-16">No matches.</div>
      )}

      <div className="space-y-10">
        {byCapability.map((cat) => (
          <section key={cat.name}>
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="text-lg font-semibold">{cat.name}</h2>
              <span className="text-xs text-muted-foreground">— {cat.blurb}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {cat.items.map((p) => (
                <Link
                  key={p.id}
                  to="/precompile-map/$id"
                  params={{ id: p.id }}
                  className="group rounded-lg border border-border bg-card p-4 hover:border-signal/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] text-muted-foreground truncate">
                      {p.address}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium",
                        MODE_STYLES[p.mode],
                      )}
                    >
                      {p.mode}
                    </span>
                  </div>
                  <div className="font-semibold group-hover:text-signal transition-colors">
                    {p.name}
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {p.tagline}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
              value === o
                ? "border-signal/60 bg-signal/10 text-signal"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
