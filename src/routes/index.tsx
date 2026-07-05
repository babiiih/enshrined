import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Cpu,
  Bot,
  Globe,
  Brain,
  Fingerprint,
  KeyRound,
  Zap,
  Droplets,
  ArrowLeftRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { LiveStatsBar } from "@/components/live-stats-bar";
import { BentoCard } from "@/components/bento-card";
import { RITUAL_FAUCET, RITUAL_EXPLORER } from "@/lib/ritual-chain";
import { PRECOMPILES } from "@/data/precompiles";
import ritualBanner from "@/assets/ritual-bg.png.asset.json";
import ritualLogo from "@/assets/ritual-logo.png.asset.json";
import mascotWave from "@/assets/mascot-wave.png";
import mascotHeart from "@/assets/mascot-heart.png";
import mascotPeek from "@/assets/mascot-peek.png";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [
      // Preload the small LCP logo so the hero paints fast.
      { rel: "preload", as: "image", href: ritualLogo.url, fetchPriority: "high" },
    ],
  }),
  component: Index,
});

const USE_CASES = [
  {
    n: "01",
    tag: "Autonomous Agents",
    title: "Agents that live forever",
    body: "Emancipated from any human controller. Financial + computational sovereignty enshrined at the block builder.",
  },
  {
    n: "02",
    tag: "Multi-Agent Evals",
    title: "Fully-onchain multi-agent worlds",
    body: "Project Vend, LMArena and beyond running as autonomous agents — emergent behavior without a hosted arena.",
  },
  {
    n: "03",
    tag: "Private AI",
    title: "A private multimodal ChatGPT onchain",
    body: "TEE-hosted GLM-4.7-FP8 with EIP-712-signed SSE streaming. Humans and agents share the interface.",
  },
  {
    n: "04",
    tag: "Identity",
    title: "Financialization of identity",
    body: "Humans rent or sell identity to agents in a trust-minimized way — agents indistinguishable from humans.",
  },
  {
    n: "05",
    tag: "Autonomous Companies",
    title: "Agent-native companies",
    body: "Agents create full-fledged companies onchain, accrue value independent of any human intermediary.",
  },
  {
    n: "06",
    tag: "Market Structure",
    title: "An agent-first RWA exchange",
    body: "Hyperliquid-style orderbook with enshrined cancel priority, direct access to real-world liquidity.",
  },
];

const ENTRY = [
  { icon: Cpu, url: "/precompile-map", title: "Precompile Map", blurb: "16 precompiles across 7 capabilities." },
  { icon: Globe, url: "/real-world", title: "Real World", blurb: "HTTP, long-running tasks, scheduler." },
  { icon: Brain, url: "/enshrined-ai", title: "Enshrined AI", blurb: "LLM, ONNX, FHE, ZK, multimodal." },
  { icon: Bot, url: "/autonomous-agents", title: "Autonomous Agents", blurb: "Seven properties. Three precompiles." },
  { icon: Fingerprint, url: "/authentication", title: "Authentication", blurb: "WebAuthn P-256, Ed25519, TxPasskey." },
  { icon: KeyRound, url: "/privacy-keys", title: "Privacy & Keys", blurb: "DKMS, ECIES, PII, X402." },
] as const;

function Index() {
  return (
    <div>
      <LiveStatsBar />

      {/* Kawaii banner hero */}
      <section className="relative border-b border-border overflow-hidden">
        {/* Decorative banner: heavy asset (~2.6MB) — lazy + low priority so it
            never blocks initial paint. Rendered as a real <img> so the browser
            can defer it, decode off-thread, and skip it entirely when offscreen. */}
        <img
          src={ritualBanner.url}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(254,240,245,0.15) 60%, var(--background) 100%)",
          }}
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-28 text-center relative">
          <img
            src={ritualLogo.url}
            alt="Ritual"
            width={96}
            height={96}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="mx-auto h-16 w-16 md:h-24 md:w-24 drop-shadow-[0_8px_24px_rgba(232,138,171,0.5)]"
          />
          <h1 className="mt-5 font-serif text-5xl md:text-7xl tracking-[0.22em] text-foreground drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]">
            RITUAL
          </h1>
          <p className="mt-3 font-mono text-[11px] md:text-xs uppercase tracking-[0.4em] text-primary drop-shadow-[0_1px_6px_rgba(255,255,255,0.9)]">
            ✿ build the unseen together ✿
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/80 backdrop-blur px-4 py-1.5 text-xs font-medium text-primary shadow-sm">
            <span>♡ Own your agent</span>
            <span className="opacity-40">·</span>
            <span>♡ Own your data</span>
            <span className="opacity-40">·</span>
            <span>♡ Own your future</span>
          </div>
          <img
            src={mascotPeek}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="pointer-events-none hidden md:block absolute left-4 bottom-2 w-28 lg:w-36 drop-shadow-[0_6px_18px_rgba(232,138,171,0.35)]"
          />
          <img
            src={mascotWave}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="pointer-events-none hidden md:block absolute right-4 bottom-2 w-28 lg:w-36 drop-shadow-[0_6px_18px_rgba(232,138,171,0.35)]"
          />
        </div>
      </section>

      <section className="border-b border-border ritual-grid-bg">
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-14 relative">
          <div className="grid gap-4 md:grid-cols-4 md:auto-rows-[minmax(150px,auto)]">
            {/* Headline card */}
            <BentoCard
              span="col-2-row-2"
              delay={0}
              className="!p-8 justify-between overflow-hidden relative"
            >
              <img
                src={mascotHeart}
                alt=""
                aria-hidden
                loading="lazy"
                decoding="async"
                className="pointer-events-none absolute -right-2 -bottom-2 w-40 md:w-48 drop-shadow-[0_6px_18px_rgba(232,138,171,0.35)]"
              />
              <div>
                <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-signal">
                  Testnet 1979 · TEE-EOVMT · ~350ms
                </div>
                <h1 className="h-display max-w-md">
                  Smart contracts that{" "}
                  <span className="gold-text italic">think, see, hear, act.</span>
                </h1>
                <p className="lead mt-4 max-w-md">
                  Deep-research explorer for Ritual Chain. Every tab of the official docs,
                  distilled — precompiles, agents, TEEs, and now a swap + stake hub.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 relative z-10">
                <Link
                  to="/swap"
                  preload="intent"
                  className="inline-flex items-center gap-1.5 rounded-md bg-signal px-3.5 py-2 text-xs font-semibold text-signal-foreground hover:opacity-90 shadow-sm"
                >
                  <ArrowLeftRight className="size-3.5" /> Open Swap
                </Link>
                <Link
                  to="/playground"
                  preload="intent"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:border-signal/40 hover:text-signal transition"
                >
                  <Zap className="size-3.5" /> Playground
                </Link>
                <a
                  href={RITUAL_FAUCET}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:border-signal/40 hover:text-signal transition"
                >
                  <Droplets className="size-3.5" /> Faucet
                </a>
              </div>
            </BentoCard>

            {/* Precompiles count */}
            <BentoCard tag="Precompiles" delay={80}>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-semibold tracking-tight text-signal font-mono">
                  {PRECOMPILES.length}
                </span>
                <span className="text-xs text-muted-foreground">enshrined primitives</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Think, Create, Act, Remember, Prove, Keep Secrets, Pay.
              </p>
              <Link
                to="/precompile-map"
                className="mt-auto inline-flex items-center gap-1 text-xs text-signal hover:underline"
              >
                Map <ArrowRight className="size-3" />
              </Link>
            </BentoCard>

            {/* Faucet CTA */}
            <BentoCard tag="Testnet" delay={140} className="!p-4">
              <div className="text-sm font-semibold">Get RITUAL</div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Fund your wallet in one click. No real value.
              </p>
              <a
                href={RITUAL_FAUCET}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center gap-1.5 rounded-md bg-card border border-signal/40 px-2.5 py-1.5 text-xs text-signal hover:bg-signal/10 self-start"
              >
                <Droplets className="size-3.5" /> Faucet <ExternalLink className="size-2.5" />
              </a>
            </BentoCard>

            {/* Swap teaser */}
            <BentoCard tag="Liquidity" delay={200} className="!p-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-md border border-signal/40 bg-signal/10 text-signal">
                  <ArrowLeftRight className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">Swap · Stake · Wrap · Earn</div>
                  <div className="text-xs text-muted-foreground truncate">
                    Liquid stake RITUAL → xRITUAL. Testnet-honest UI.
                  </div>
                </div>
                <Link
                  to="/swap"
                  preload="intent"
                  className="inline-flex items-center gap-1 rounded-md bg-signal px-3 py-1.5 text-xs font-semibold text-signal-foreground hover:opacity-90"
                >
                  Enter <ArrowRight className="size-3" />
                </Link>
              </div>
            </BentoCard>

            {/* Explorer link */}
            <BentoCard tag="Explorer" delay={260} className="!p-4">
              <div className="text-sm font-semibold">Live block feed</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Blocks, agents, mempool, validators.
              </p>
              <a
                href={RITUAL_EXPLORER}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center gap-1 text-xs text-signal hover:underline"
              >
                explorer.ritualfoundation.org <ExternalLink className="size-2.5" />
              </a>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* Quick spec */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="mono-tag mb-4">Quick Start</div>
          <div className="grid gap-px bg-border rounded-lg overflow-hidden border border-border md:grid-cols-4">
            {[
              ["Chain ID", "1979"],
              ["Currency", "RITUAL"],
              ["Block Time", "~350ms"],
              ["Tx Types", "0x10 / 0x11 / 0x12 / 0x77"],
              ["RPC", "rpc.ritualfoundation.org"],
              ["Explorer", "explorer.ritualfoundation.org"],
              ["Faucet", "faucet.ritualfoundation.org"],
              ["Wallet", "MetaMask + Add Network"],
            ].map(([k, v]) => (
              <div key={k} className="bg-card p-4">
                <div className="mono-tag">{k}</div>
                <div className="mt-1 font-mono text-sm text-foreground truncate">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why this matters */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl mb-10">
            <div className="eyebrow text-signal mb-3">Why This Matters</div>
            <h2 className="h1">
              Six things you can build here that <span className="gold-text italic">no other major L1</span> hosts natively.
            </h2>
            <p className="lead mt-4">
              Ritual isn't interesting because it has precompiles. It's interesting because those
              primitives let you build systems no other L1 hosts today.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((u, i) => (
              <BentoCard key={u.n} tag={u.tag} delay={i * 50}>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="font-mono text-[11px] text-signal">{u.n}</span>
                  <Sparkles className="size-3 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-2 tracking-tight">{u.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{u.body}</p>
              </BentoCard>
            ))}
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mono-tag mb-6">All Sections</div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ENTRY.map((e) => (
              <Link
                key={e.url}
                to={e.url}
                preload="intent"
                className="group terminal-card terminal-card-hover flex items-start gap-4 p-5"
              >
                  <div className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-muted/40 text-signal group-hover:border-signal/40">
                    <e.icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{e.title}</div>
                      <ArrowRight className="size-4 text-muted-foreground group-hover:text-signal transition-colors" />
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{e.blurb}</div>
                  </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Precompile chips — static grid replaces looping marquee for perf */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="mono-tag mb-4">Precompiles · quick jump</div>
          <div className="flex flex-wrap gap-2">
            {PRECOMPILES.map((p) => (
              <Link
                key={p.address}
                to="/precompile-map/$id"
                params={{ id: p.id }}
                preload="intent"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs hover:border-signal/40 hover:text-signal transition-colors"
              >
                <span className="font-mono text-signal">{p.address}</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-medium">{p.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
