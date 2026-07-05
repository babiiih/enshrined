import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeftRight, Coins, Package, TrendingUp, Droplets, ExternalLink, PlusCircle } from "lucide-react";
import { SwapCard } from "@/components/swap-hub/swap-card";
import { StakeCard } from "@/components/swap-hub/stake-card";
import { WrapCard } from "@/components/swap-hub/wrap-card";
import { EarnCard } from "@/components/swap-hub/earn-card";
import { LiquidityCard } from "@/components/swap-hub/liquidity-card";
import { BentoCard } from "@/components/bento-card";
import { LiveStatsBar } from "@/components/live-stats-bar";
import { TOKENS } from "@/lib/ritual-tokens";
import { RITUAL_FAUCET } from "@/lib/ritual-chain";
import { cn } from "@/lib/utils";
import { NetworkGuard } from "@/components/network-guard";
import { AuthGuard } from "@/components/auth-guard";
import { SwapSkeleton } from "@/components/skeletons/swap-skeleton";

export const Route = createFileRoute("/swap")({
  head: () => ({
    meta: [
      { title: "Swap · Stake · Earn — Ritual Explorer" },
      {
        name: "description",
        content:
          "Swap, wrap, stake, and earn on Ritual testnet 1979. Liquid staking to xRITUAL, honest swap simulations, and coming-soon compute pools.",
      },
      { property: "og:title", content: "Ritual Swap & Stake Hub" },
      {
        property: "og:description",
        content: "Liquid stake RITUAL → xRITUAL, wrap, swap, earn. Testnet-honest UI.",
      },
    ],
  }),
  component: () => (
    <AuthGuard title="Swap · Stake · Earn" skeleton={<SwapSkeleton />}>
      <SwapPage />
    </AuthGuard>
  ),
});

type Tab = "swap" | "liquidity" | "stake" | "wrap" | "earn";
const TABS: { id: Tab; label: string; icon: typeof ArrowLeftRight; blurb: string }[] = [
  { id: "swap", label: "Swap", icon: ArrowLeftRight, blurb: "AMM 0.30% fee (onchain)" },
  { id: "liquidity", label: "Liquidity", icon: PlusCircle, blurb: "Add / remove LP" },
  { id: "stake", label: "Stake", icon: Coins, blurb: "RITUAL → xRITUAL" },
  { id: "wrap", label: "Wrap", icon: Package, blurb: "RITUAL ↔ wRITUAL 1:1" },
  { id: "earn", label: "Earn", icon: TrendingUp, blurb: "Pools & rewards" },
];

function SwapPage() {
  const [tab, setTab] = useState<Tab>("swap");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div>
      <LiveStatsBar />

      {/* Hero */}
      <section className="border-b border-border ritual-grid-bg">
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-14 relative">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal mb-4">
            Swap · Stake · Wrap · Earn
          </div>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-3xl leading-[1.05]">
            The <span className="text-signal">liquidity room</span> for Ritual testnet.
          </h1>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-muted-foreground leading-relaxed">
            Chain 1979 doesn't have a live DEX yet. We're honest about that — pairs marked{" "}
            <span className="font-mono text-chart-4">demo</span> simulate the trade client-side, and{" "}
            <span className="font-mono text-signal">onchain</span> pairs (native transfer, liquid
            staking) execute for real.
          </p>
          <div className="mt-5"><NetworkGuard /></div>
          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={RITUAL_FAUCET}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-signal/40 hover:text-signal"
            >
              <Droplets className="size-3.5" /> Get testnet RITUAL
            </a>
            <a
              href="https://ritual-lst.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-signal/40 hover:text-signal"
            >
              Ritual LST <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </section>

      {/* Main bento */}
      <section className="mx-auto max-w-6xl px-6 py-10 grid gap-4 md:grid-cols-3">
        {/* Left rail: tabs */}
        <aside className="md:col-span-1 flex flex-col gap-2">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "terminal-card bento-in flex items-start gap-3 p-4 text-left transition",
                tab === t.id
                  ? "border-signal/60 signal-glow"
                  : "hover:border-signal/40",
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className={cn(
                  "grid size-9 place-items-center rounded-md border",
                  tab === t.id
                    ? "border-signal/60 bg-signal/10 text-signal"
                    : "border-border text-muted-foreground",
                )}
              >
                <t.icon className="size-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{t.blurb}</div>
              </div>
            </button>
          ))}

          {/* Token registry mini panel */}
          <BentoCard tag="Registry" title="Tokens" delay={280} className="mt-2">
            <ul className="space-y-1.5 text-xs">
              {TOKENS.map((t) => (
                <li key={t.symbol} className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ background: t.color }}
                  />
                  <span className="font-mono">{t.symbol}</span>
                  <span className="text-muted-foreground truncate flex-1">{t.name}</span>
                  <span
                    className={cn(
                      "text-[9px] font-mono uppercase tracking-wider rounded px-1 py-px border",
                      t.isReal
                        ? "text-signal border-signal/30"
                        : "text-chart-4 border-chart-4/30",
                    )}
                  >
                    {t.address === "native" ? "native" : t.isReal ? "onchain" : "demo"}
                  </span>
                </li>
              ))}
            </ul>
          </BentoCard>
        </aside>

        {/* Active panel */}
        <div className="md:col-span-2">
          <BentoCard
            tag={`Tab · ${active.label}`}
            title={active.blurb}
            delay={100}
            className="min-h-[560px]"
          >
            <div key={tab} className="bento-in">
              {tab === "swap" && <SwapCard />}
              {tab === "liquidity" && <LiquidityCard />}
              {tab === "stake" && <StakeCard />}
              {tab === "wrap" && <WrapCard />}
              {tab === "earn" && <EarnCard />}
            </div>
          </BentoCard>
        </div>
      </section>

      {/* Honesty footer */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-muted-foreground">
          <div className="mono-tag text-signal mb-2">Note on integrity</div>
          <p className="max-w-3xl leading-relaxed">
            Ritual testnet has one native asset (RITUAL) plus an early liquid staking product
            (xRITUAL via ritual-lst). Every other pair shown here is a placeholder to demonstrate the
            swap UX — nothing you do with a <span className="text-chart-4 font-mono">demo</span>{" "}
            token moves real value. To wire real xRITUAL calls, set the environment variable{" "}
            <span className="text-signal font-mono">VITE_XRITUAL_ADDRESS</span> to the deployed ERC-4626
            vault address.
          </p>
        </div>
      </section>
    </div>
  );
}
