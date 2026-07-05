import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { NAV } from "@/data/nav";
import { PRECOMPILES } from "@/data/precompiles";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (url: string, params?: Record<string, string>) => {
    setOpen(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ to: url as any, params: params as any });
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 text-xs text-muted-foreground hover:border-signal/40 hover:text-foreground transition-colors"
        aria-label="Open search"
      >
        <span>Search docs…</span>
        <kbd className="ml-2 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Sections, precompiles, addresses…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Sections">
            {NAV.map((n) => (
              <CommandItem
                key={n.url}
                value={`${n.title} ${n.blurb}`}
                onSelect={() => go(n.url)}
              >
                <n.icon className="size-4" />
                <span>{n.title}</span>
                <span className="ml-auto text-[11px] text-muted-foreground truncate">
                  {n.blurb}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Precompiles">
            {PRECOMPILES.map((p) => (
              <CommandItem
                key={p.id}
                value={`${p.name} ${p.address} ${p.capability} ${p.tagline}`}
                onSelect={() => go("/precompile-map/$id", { id: p.id })}
              >
                <span className="font-mono text-[10px] text-muted-foreground w-14 shrink-0">
                  {p.address.length > 8 ? p.address.slice(0, 6) : p.address}
                </span>
                <span>{p.name}</span>
                <span className="ml-auto text-[11px] text-signal">{p.capability}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
