import { useRouter, useRouterState } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { NAV } from "@/data/nav";
import { PRECOMPILES } from "@/data/precompiles";

function labelFor(path: string): string | null {
  const nav = NAV.find((n) => n.url === path);
  if (nav) return nav.title;
  const pre = path.match(/^\/precompile-map\/(.+)$/);
  if (pre) {
    const p = PRECOMPILES.find((x) => x.id === pre[1]);
    return p?.name ?? pre[1];
  }
  // Fallback: title-case the last segment
  const last = path.split("/").filter(Boolean).pop() ?? "";
  return last ? last.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;
}

export function BreadcrumbStrip() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((_, i) => {
    const url = "/" + segments.slice(0, i + 1).join("/");
    return { url, label: labelFor(url) ?? segments[i] };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className="border-b border-border bg-background/60 backdrop-blur-sm"
    >
      <ol className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 sm:px-6 py-2 text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground overflow-x-auto">
        <li className="shrink-0">
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); router.navigate({ to: "/" }); }}
            className="hover:text-signal transition-colors"
          >
            Home
          </a>
        </li>
        {crumbs.map((c, i) => (
          <li key={c.url} className="flex items-center gap-1.5 shrink-0">
            <ChevronRight className="size-3 opacity-50" />
            {i === crumbs.length - 1 ? (
              <span className="text-foreground normal-case tracking-normal font-sans">
                {c.label}
              </span>
            ) : (
              <a
                href={c.url}
                onClick={(e) => { e.preventDefault(); router.navigate({ to: c.url as never }); }}
                className="hover:text-signal transition-colors"
              >
                {c.label}
              </a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}