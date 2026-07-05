import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Snippet = { lang: string; label?: string; code: string };

export function CodeBlock({
  snippets,
  title,
  className,
}: {
  snippets: Snippet[];
  title?: string;
  className?: string;
}) {
  const [tab, setTab] = useState(snippets[0]?.lang);
  const [copied, setCopied] = useState(false);
  const active = snippets.find((s) => s.lang === tab) ?? snippets[0];

  const copy = () => {
    navigator.clipboard.writeText(active.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden my-4", className)}>
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-3 min-w-0">
          {title && (
            <span className="text-xs text-muted-foreground font-mono truncate">{title}</span>
          )}
          {snippets.length > 1 && (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="h-7 bg-transparent p-0 gap-1">
                {snippets.map((s) => (
                  <TabsTrigger
                    key={s.lang}
                    value={s.lang}
                    className="h-7 px-2 text-[11px] data-[state=active]:bg-background"
                  >
                    {s.label ?? s.lang}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>
        <button
          onClick={copy}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
          aria-label="Copy code"
        >
          {copied ? <Check className="size-3.5 text-signal" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      {snippets.length > 1 ? (
        <Tabs value={tab} onValueChange={setTab}>
          {snippets.map((s) => (
            <TabsContent key={s.lang} value={s.lang} className="m-0">
              <pre className="overflow-x-auto px-4 py-3 text-[12.5px] leading-relaxed text-foreground/90">
                <code>{s.code}</code>
              </pre>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <pre className="overflow-x-auto px-4 py-3 text-[12.5px] leading-relaxed text-foreground/90">
          <code>{active.code}</code>
        </pre>
      )}
    </div>
  );
}

export function Callout({
  variant = "note",
  title,
  children,
}: {
  variant?: "note" | "warn" | "danger";
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    note: "border-signal/30 bg-signal/5",
    warn: "border-warn/40 bg-warn/5",
    danger: "border-destructive/40 bg-destructive/5",
  } as const;
  const labelColor = {
    note: "text-signal",
    warn: "text-warn",
    danger: "text-destructive",
  } as const;
  return (
    <div className={cn("my-4 rounded-lg border-l-2 border p-4 text-sm", styles[variant])}>
      {title && (
        <div className={cn("mb-1 text-xs font-semibold uppercase tracking-wider", labelColor[variant])}>
          {title}
        </div>
      )}
      <div className="text-foreground/90 [&>p]:mb-2 [&>p:last-child]:mb-0">{children}</div>
    </div>
  );
}
