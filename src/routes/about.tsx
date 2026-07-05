import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  Brain,
  Cpu,
  Zap,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Droplets,
  Compass,
} from "lucide-react";
import { CatMascot3D } from "@/components/cat-mascot-3d";
import { AuroraBackground } from "@/components/motion/aurora-background";
import { Spotlight } from "@/components/motion/spotlight";
import { TextGenerate } from "@/components/motion/text-generate";
import { CardSpotlight } from "@/components/motion/card-spotlight";
import { MovingBorder } from "@/components/motion/moving-border";
import { Sparkles as SparkleFx } from "@/components/motion/sparkles";
import { RITUAL_FAUCET, RITUAL_EXPLORER } from "@/lib/ritual-chain";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · Ritual Chain Docs Explorer" },
      {
        name: "description",
        content:
          "About the Ritual Chain Docs Explorer — a deep-research companion to the official docs, with a live playground, swap hub, and on-chain creator suite.",
      },
      { property: "og:title", content: "About · Ritual Chain Docs Explorer" },
      {
        property: "og:description",
        content:
          "Foundation, principles, and the motion system powering the Ritual Docs Explorer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
  errorComponent: ({ reset }) => {
    const router = useRouter();
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center">
        <div className="eyebrow text-destructive mb-3">Error</div>
        <h1 className="h1 mb-3">Couldn't load the About page</h1>
        <button
          onClick={() => {
            reset();
            router.invalidate();
          }}
          className="rounded-md border border-border px-4 py-2 text-sm hover:border-signal/40 hover:text-signal transition"
        >
          Try again
        </button>
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <div className="eyebrow text-signal mb-3">404</div>
      <h1 className="h1">Not here.</h1>
    </div>
  ),
});

const PRINCIPLES = [
  {
    icon: Brain,
    tag: "Think",
    title: "Inference as a first-class op",
    body: "LLM, ONNX, and multimodal generation live at precompile addresses — no hosted APIs, no oracles, no trust in a middleman.",
  },
  {
    icon: Zap,
    tag: "Act",
    title: "Talk to the real world",
    body: "Native HTTP, long-running tasks, and a block-builder scheduler let contracts reach outside the chain deterministically.",
  },
  {
    icon: Cpu,
    tag: "Remember",
    title: "State that outlives a block",
    body: "Postgres + Redis precompiles, ECIES secrets via DKMS, and X402-native pay-per-call let agents keep memory and identity.",
  },
];

function AboutPage() {
  return (
    <div>
      <AuroraBackground intensity="soft" className="border-b border-border ritual-grid-bg">
        <Spotlight />
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-20 relative">
          <div className="flex flex-col items-start gap-6">
            <div className="eyebrow text-signal">
              <Compass className="inline size-3 mr-1.5 -mt-0.5" /> About the Explorer
            </div>
            <div className="flex items-center gap-5">
              <div className="relative">
                <SparkleFx count={12} className="!inset-[-30%]" />
                <CatMascot3D size={128} />
              </div>
              <h1 className="h-display max-w-2xl">
                <TextGenerate words="A companion to the Ritual docs —" />
                <span className="gold-text italic">
                  <TextGenerate words="fast, curious, and a little furry." delay={0.35} />
                </span>
              </h1>
            </div>
            <p className="lead max-w-2xl">
              This site distills every tab of{" "}
              <a
                href="https://docs.ritualfoundation.org"
                target="_blank"
                rel="noreferrer"
                className="text-signal underline underline-offset-4"
              >
                docs.ritualfoundation.org
              </a>{" "}
              into an interactive explorer — precompile map, live playground on testnet Chain 1979,
              a swap + stake hub, deploy suite, and marketplace. Built to answer "what can I
              actually build on Ritual?" without leaving the tab.
            </p>
            <div className="flex flex-wrap gap-2">
              <MovingBorder duration={5} className="!px-0 !py-0">
                <a
                  href="https://docs.ritualfoundation.org"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-gold inline-flex items-center gap-1.5 rounded-[calc(0.375rem-1px)] px-3.5 py-2 text-xs"
                >
                  <BookOpen className="size-3.5" /> Read official docs
                </a>
              </MovingBorder>
              <a
                href={RITUAL_FAUCET}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:border-signal/40 hover:text-signal transition"
              >
                <Droplets className="size-3.5" /> Faucet
              </a>
              <a
                href={RITUAL_EXPLORER}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:border-signal/40 hover:text-signal transition"
              >
                <ExternalLink className="size-3.5" /> Explorer
              </a>
            </div>
          </div>
        </div>
      </AuroraBackground>

      {/* Principles — CardSpotlight reuse */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-2xl mb-10">
            <div className="eyebrow text-signal mb-3">Three Principles</div>
            <h2 className="h1">
              Think. <span className="gold-text italic">Act.</span> Remember.
            </h2>
            <p className="lead mt-4">
              Every precompile falls into one of these three loops. Get comfortable with them and
              the rest of the docs snap into place.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <CardSpotlight key={p.tag} className="rounded-[0.85rem]">
                <div className="terminal-card terminal-card-hover p-6 h-full flex flex-col">
                  <div className="grid size-10 place-items-center rounded-md border border-border bg-muted/40 text-signal">
                    <p.icon className="size-5" />
                  </div>
                  <div className="eyebrow mt-4">{p.tag}</div>
                  <h3 className="h3 mt-1">{p.title}</h3>
                  <p className="body-copy mt-2">{p.body}</p>
                </div>
              </CardSpotlight>
            ))}
          </div>
        </div>
      </section>

      {/* Foundation */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="eyebrow text-signal mb-3">Foundation</div>
          <h2 className="h2 mb-4">Built alongside the Ritual community.</h2>
          <p className="lead">
            The Ritual Foundation stewards the protocol and the docs at{" "}
            <a
              href="https://docs.ritualfoundation.org"
              target="_blank"
              rel="noreferrer"
              className="text-signal underline underline-offset-4"
            >
              docs.ritualfoundation.org
            </a>
            . This explorer is a community-flavored lens on that material — everything on testnet,
            nothing custodial, honest about what's simulated.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["Chain", "1979 · TEE-EOVMT"],
              ["Block time", "~350ms"],
              ["Currency", "RITUAL"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-border bg-card/60 p-4">
                <div className="eyebrow">{k}</div>
                <div className="mt-1 font-mono text-sm">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link
              to="/precompile-map"
              className="inline-flex items-center gap-1.5 text-sm text-signal hover:underline"
            >
              Jump to the precompile map <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
