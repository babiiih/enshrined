import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type RelatedLink = {
  title: string;
  to: string;
  params?: Record<string, string>;
};

export function SectionShell({
  eyebrow,
  kicker,
  title,
  lede,
  children,
  related,
}: {
  eyebrow?: string;
  kicker?: string;
  title: string;
  lede?: string;
  children: ReactNode;
  related?: RelatedLink[];
}) {
  const label = eyebrow ?? kicker;
  return (
    <article className="mx-auto max-w-3xl px-6 py-10 prose-docs">
      {label && <div className="eyebrow text-signal mb-3">{label}</div>}
      <h1 className="h1">{title}</h1>
      {lede && <p className="lead mt-2 mb-8">{lede}</p>}
      {children}
      {related && related.length > 0 && (
        <div className="mt-16 pt-6 border-t border-border not-prose">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Related
          </div>
          <div className="flex flex-wrap gap-2">
            {related.map((r, i) => (
              <Link
                key={i}
                to={r.to}
                params={r.params as never}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs hover:border-signal/40 hover:text-signal transition-colors"
              >
                {r.title} →
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}


export function Spec({
  rows,
  className,
}: {
  rows: [string, ReactNode][];
  className?: string;
}) {
  return (
    <div className={cn("my-4 rounded-lg border border-border overflow-hidden", className)}>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v], i) => (
            <tr key={i} className={i > 0 ? "border-t border-border" : ""}>
              <td className="w-1/3 bg-muted/30 px-4 py-2.5 font-mono text-xs text-muted-foreground align-top">
                {k}
              </td>
              <td className="px-4 py-2.5 text-foreground/90">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Mono({ children }: { children: ReactNode }) {
  return (
    <code className="font-mono text-[12.5px] text-signal bg-muted px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}
