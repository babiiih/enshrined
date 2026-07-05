import { ArrowUpRight, Sparkles, Cpu, Bot, Brain } from "lucide-react";
import { STAKING_DEMO } from "@/lib/staking";
import { cn } from "@/lib/utils";

type Pool = {
  name: string;
  apr: string;
  tvl: string;
  icon: typeof Sparkles;
  live: boolean;
  href?: string;
  tag: string;
  color: string;
};

const POOLS: Pool[] = [
  {
    name: "Liquid Staking · xRITUAL",
    apr: STAKING_DEMO.apr,
    tvl: `${STAKING_DEMO.totalStaked} RITUAL`,
    icon: Sparkles,
    live: true,
    href: "https://ritual-lst.vercel.app",
    tag: "LST",
    color: "#22d3b1",
  },
  {
    name: "Agent Compute Pool",
    apr: "~9.20%",
    tvl: "coming soon",
    icon: Bot,
    live: false,
    tag: "AGENT",
    color: "#a78bfa",
  },
  {
    name: "LLM Inference Rewards",
    apr: "~12.5%",
    tvl: "coming soon",
    icon: Brain,
    live: false,
    tag: "AI",
    color: "#f7c948",
  },
  {
    name: "TEE Node Delegation",
    apr: "~7.80%",
    tvl: "coming soon",
    icon: Cpu,
    live: false,
    tag: "TEE",
    color: "#60a5fa",
  },
];

export function EarnCard() {
  return (
    <div className="flex flex-col gap-3">
      {POOLS.map((p) => (
        <div
          key={p.name}
          className={cn(
            "flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3 transition",
            p.live && "hover:border-signal/40",
          )}
        >
          <div
            className="grid size-10 place-items-center rounded-md shrink-0"
            style={{
              background: `color-mix(in oklab, ${p.color} 15%, transparent)`,
              color: p.color,
              border: `1px solid color-mix(in oklab, ${p.color} 35%, transparent)`,
            }}
          >
            <p.icon className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm truncate">{p.name}</span>
              <span
                className="text-[9px] font-mono uppercase tracking-wider rounded px-1 py-px border"
                style={{
                  color: p.color,
                  borderColor: `color-mix(in oklab, ${p.color} 40%, transparent)`,
                }}
              >
                {p.tag}
              </span>
              {!p.live && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-chart-4 border border-chart-4/30 rounded px-1 py-px">
                  soon
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>
                APR <span className="text-foreground font-mono">{p.apr}</span>
              </span>
              <span>
                TVL <span className="text-foreground font-mono">{p.tvl}</span>
              </span>
            </div>
          </div>
          {p.live ? (
            <a
              href={p.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-signal/40 bg-signal/10 px-2.5 py-1.5 text-xs font-medium text-signal hover:bg-signal/20"
            >
              Enter <ArrowUpRight className="size-3" />
            </a>
          ) : (
            <span className="text-[10px] text-muted-foreground font-mono">Q3 · 2026</span>
          )}
        </div>
      ))}
    </div>
  );
}
