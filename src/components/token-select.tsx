import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { TOKENS, type RitualToken } from "@/lib/ritual-tokens";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function TokenIcon({ token, size = 24 }: { token: RitualToken; size?: number }) {
  return (
    <span
      className="inline-grid place-items-center rounded-full font-mono font-semibold text-[11px]"
      style={{
        width: size,
        height: size,
        background: `color-mix(in oklab, ${token.color} 22%, transparent)`,
        color: token.color,
        border: `1px solid color-mix(in oklab, ${token.color} 40%, transparent)`,
      }}
    >
      {token.logo}
    </span>
  );
}

export function TokenSelect({
  value,
  onChange,
  exclude,
}: {
  value: RitualToken;
  onChange: (t: RitualToken) => void;
  exclude?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="token-pill inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5 text-sm"
        >
          <TokenIcon token={value} size={22} />
          <span className="font-medium">{value.symbol}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0 bg-card border-border">
        <div className="border-b border-border px-3 py-2 mono-tag">Select token</div>
        <div className="max-h-80 overflow-auto py-1">
          {TOKENS.filter((t) => t.symbol !== exclude).map((t) => (
            <button
              key={t.symbol}
              onClick={() => {
                onChange(t);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-muted/40 transition",
                value.symbol === t.symbol && "bg-muted/30",
              )}
            >
              <TokenIcon token={t} size={30} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium">{t.symbol}</span>
                  {!t.isReal && (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-chart-4 border border-chart-4/30 rounded px-1 py-px">
                      demo
                    </span>
                  )}
                  {t.isReal && t.address !== "native" && (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-signal border border-signal/30 rounded px-1 py-px">
                      onchain
                    </span>
                  )}
                  {t.address === "native" && (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-signal border border-signal/30 rounded px-1 py-px">
                      native
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">{t.name}</div>
                {t.note && <div className="mt-0.5 text-[10px] text-muted-foreground/70">{t.note}</div>}
              </div>
              {value.symbol === t.symbol && <Check className="size-4 text-signal shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
