import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Wrench, ExternalLink, Copy, Search } from "lucide-react";
import { AGENT_SKILLS, SKILL_CATEGORIES, type AgentSkill } from "@/data/agent-skills";
import { AuthGuard } from "@/components/auth-guard";

export const Route = createFileRoute("/agent-skills")({
  head: () => ({
    meta: [
      { title: "Agent Skills · Ritual" },
      {
        name: "description",
        content:
          "Katalog modular Agent Skills untuk autonomous agents Ritual — DEX swap, LLM, HTTP, DKMS, X402, Scheduler.",
      },
      { property: "og:title", content: "Agent Skills · Ritual" },
      {
        property: "og:description",
        content:
          "Skill terkurasi dari skills.ritualfoundation.org untuk agent onchain.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <AuthGuard title="Agent Skills">
      <AgentSkillsPage />
    </AuthGuard>
  ),
});

function AgentSkillsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<AgentSkill["category"] | "all">("all");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return AGENT_SKILLS.filter((s) => {
      if (cat !== "all" && s.category !== cat) return false;
      if (!query) return true;
      return (
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.precompiles.some((p) => p.toLowerCase().includes(query))
      );
    });
  }, [q, cat]);

  async function copyInstall(cmd: string) {
    try {
      await navigator.clipboard.writeText(cmd);
      toast.success("Install command tersalin");
    } catch {
      toast.error("Gagal menyalin");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8 space-y-3">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">
          skills.ritualfoundation.org
        </div>
        <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-3">
          <Wrench className="size-7 text-signal" /> Agent Skills
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Modular skill packages untuk autonomous agents Ritual. Setiap skill membungkus
          panggilan precompile atau kontrak sistem dengan API sederhana — copy install command
          lalu import di{" "}
          <a
            href="https://skills.ritualfoundation.org"
            className="text-signal hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            skills.ritualfoundation.org
          </a>
          .
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari skill, precompile, atau kategori…"
            className="w-full h-10 rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-signal"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <CatChip active={cat === "all"} onClick={() => setCat("all")}>
            All
          </CatChip>
          {SKILL_CATEGORIES.map((c) => (
            <CatChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)}>
              {c.label}
            </CatChip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Tidak ada skill yang cocok.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <article
              key={s.id}
              className="rounded-xl border border-border bg-card p-5 flex flex-col hover:border-signal/60 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold">{s.name}</h2>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                  {s.category}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground flex-1">{s.description}</p>
              {s.precompiles.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {s.precompiles.map((p) => (
                    <span
                      key={p}
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-signal/10 text-signal"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 rounded-md bg-muted/40 border border-border px-3 py-2 flex items-center gap-2">
                <code className="flex-1 truncate font-mono text-[11px]">{s.install}</code>
                <button
                  onClick={() => copyInstall(s.install)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Copy install command untuk ${s.name}`}
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
              <a
                href={s.docUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs text-signal hover:underline self-start"
              >
                Open docs <ExternalLink className="size-3" />
              </a>
            </article>
          ))}
        </div>
      )}

      <p className="mt-8 text-[11px] text-muted-foreground text-center">
        Katalog akan sinkron otomatis dengan skills.ritualfoundation.org di rilis mendatang.
      </p>
    </div>
  );
}

function CatChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1 text-xs transition " +
        (active
          ? "border-signal bg-signal/10 text-signal"
          : "border-border text-muted-foreground hover:text-foreground hover:border-signal/40")
      }
    >
      {children}
    </button>
  );
}