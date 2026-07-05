import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, ArrowLeft } from "lucide-react";
import { getPrecompile, PRECOMPILES, type Precompile } from "@/data/precompiles";
import { Callout, CodeBlock } from "@/components/code-block";
import { Spec } from "@/components/section-shell";

export const Route = createFileRoute("/precompile-map/$id")({
  loader: ({ params }) => {
    const p = getPrecompile(params.id);
    if (!p) throw notFound();
    return { precompile: p };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.precompile.name} (${loaderData.precompile.address}) — Ritual Precompile`
          : "Precompile — Ritual",
      },
      {
        name: "description",
        content: loaderData?.precompile.tagline ?? "Ritual precompile detail.",
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-6 py-20 text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal mb-3">404</div>
      <h1 className="text-2xl font-semibold">Precompile not found</h1>
      <Link
        to="/precompile-map"
        className="mt-6 inline-flex items-center gap-2 text-signal hover:underline"
      >
        <ArrowLeft className="size-4" /> Back to map
      </Link>
    </div>
  ),
  component: Detail,
});

function Detail() {
  const data = Route.useLoaderData() as { precompile: Precompile };
  const p = data.precompile;
  const [copied, setCopied] = useState(false);

  const related: Precompile[] = (p.related ?? [])
    .map((id: string) => PRECOMPILES.find((x) => x.id === id))
    .filter((x): x is Precompile => !!x);

  return (
    <article className="mx-auto max-w-3xl px-6 py-10 prose-docs">
      <Link
        to="/precompile-map"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-signal mb-6"
      >
        <ArrowLeft className="size-3" /> Precompile Map
      </Link>

      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal mb-2">
        {p.capability} · {p.mode}
      </div>
      <h1>{p.name}</h1>
      <p className="text-lg text-muted-foreground mt-2">{p.tagline}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Address
          </span>
          <code className="font-mono text-sm text-signal">{p.address}</code>
          {p.address !== "—" && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(p.address);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="text-muted-foreground hover:text-foreground p-1"
              aria-label="Copy address"
            >
              {copied ? <Check className="size-3.5 text-signal" /> : <Copy className="size-3.5" />}
            </button>
          )}
        </div>
        {p.fields && (
          <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              ABI Fields
            </span>
            <span className="font-mono text-sm">{p.fields}</span>
          </div>
        )}
      </div>

      <h2>Overview</h2>
      <p>{p.description}</p>

      {p.notes && p.notes.length > 0 && (
        <>
          <h2>Gotchas</h2>
          <Callout variant="warn" title="Watch for">
            <ul>
              {p.notes.map((n: string, i: number) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </Callout>
        </>
      )}

      {p.example && (
        <>
          <h2>Example</h2>
          <CodeBlock
            snippets={[{ lang: p.example.lang, label: p.example.lang, code: p.example.code }]}
            title={`example.${p.example.lang}`}
          />
        </>
      )}

      <h2>Spec</h2>
      <Spec
        rows={[
          ["Capability", p.capability],
          ["Execution mode", p.mode],
          ["Address", <span className="font-mono">{p.address}</span>],
          ["ABI fields", p.fields ? String(p.fields) : "—"],
        ]}
      />

      {related.length > 0 && (
        <>
          <h2>Related precompiles</h2>
          <div className="grid gap-3 md:grid-cols-2 not-prose">
            {related.map((r: Precompile) => (
              <Link
                key={r.id}
                to="/precompile-map/$id"
                params={{ id: r.id }}
                className="rounded-lg border border-border bg-card p-3 hover:border-signal/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-muted-foreground">{r.address}</span>
                  <span className="text-[10px] text-signal">{r.capability}</span>
                </div>
                <div className="mt-1 font-semibold text-sm">{r.name}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.tagline}</div>
              </Link>
            ))}
          </div>
        </>
      )}
    </article>
  );
}
