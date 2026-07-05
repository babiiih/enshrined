import type { LucideIcon } from "lucide-react";
import {
  Home,
  Cpu,
  Network,
  Globe,
  Brain,
  Bot,
  Fingerprint,
  KeyRound,
  Sparkle,
  Zap,
  ArrowLeftRight,
  Rocket,
  Store,
  GraduationCap,
  Info,
  Wallet2,
  History,
  Droplets,
  Wrench,
  Activity,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  blurb: string;
  group: "start" | "build" | "docs" | "you";
};

export const NAV: NavItem[] = [
  { title: "Overview", url: "/", icon: Home, blurb: "Why Ritual, quick start, chain params.", group: "start" },
  { title: "About", url: "/about", icon: Info, blurb: "Foundation, principles, and motion showcase.", group: "start" },
  {
    title: "Network Status",
    url: "/network-status",
    icon: Activity,
    blurb: "Live health check RPC, Explorer, dan Faucet.",
    group: "start",
  },
  {
    title: "Swap · Stake",
    url: "/swap",
    icon: ArrowLeftRight,
    blurb: "Swap, wrap, stake xRITUAL, earn.",
    group: "build",
  },
  {
    title: "Pools",
    url: "/pools",
    icon: Droplets,
    blurb: "AMM pools, reserves, LP positions.",
    group: "build",
  },
  {
    title: "Portfolio",
    url: "/portfolio",
    icon: Wallet2,
    blurb: "Saldo, token & NFT hasil deploy kamu.",
    group: "you",
  },
  {
    title: "Riwayat Tx",
    url: "/history",
    icon: History,
    blurb: "Lifecycle transaksi: pending → confirmed / reverted.",
    group: "you",
  },
  {
    title: "Deploy",
    url: "/deploy",
    icon: Rocket,
    blurb: "Deploy ERC-20, NFT, marketplace kamu sendiri.",
    group: "build",
  },
  {
    title: "Marketplace",
    url: "/marketplace",
    icon: Store,
    blurb: "OpenSea-style NFT market di Ritual.",
    group: "you",
  },
  {
    title: "Agent Tutorial",
    url: "/agent-tutorial",
    icon: GraduationCap,
    blurb: "Step-by-step deploy autonomous agent.",
    group: "build",
  },
  {
    title: "Agent Skills",
    url: "/agent-skills",
    icon: Wrench,
    blurb: "Modular skills untuk autonomous agents (skills.ritualfoundation.org).",
    group: "build",
  },
  {
    title: "Playground",
    url: "/playground",
    icon: Zap,
    blurb: "Send live testnet calls to precompiles.",
    group: "build",
  },
  {
    title: "Precompile Map",
    url: "/precompile-map",
    icon: Cpu,
    blurb: "16 precompiles across 7 capabilities.",
    group: "docs",
  },
  {
    title: "Chain",
    url: "/chain",
    icon: Network,
    blurb: "TEE-EOVMT, Superposition, execution models, system contracts.",
    group: "docs",
  },
  {
    title: "Real World",
    url: "/real-world",
    icon: Globe,
    blurb: "HTTP, Long-Running HTTP, Scheduler, JQ.",
    group: "docs",
  },
  {
    title: "Enshrined AI",
    url: "/enshrined-ai",
    icon: Brain,
    blurb: "LLM, ONNX, FHE, ZK, multimodal generation.",
    group: "docs",
  },
  {
    title: "Autonomous Agents",
    url: "/autonomous-agents",
    icon: Bot,
    blurb: "Seven properties, Sovereign & Persistent agents, revival.",
    group: "docs",
  },
  {
    title: "Authentication",
    url: "/authentication",
    icon: Fingerprint,
    blurb: "TxPasskey, WebAuthn P-256, Ed25519.",
    group: "docs",
  },
  {
    title: "Privacy & Keys",
    url: "/privacy-keys",
    icon: KeyRound,
    blurb: "DKMS, ECIES secrets, PII redaction, X402.",
    group: "docs",
  },
  {
    title: "For Agents",
    url: "/for-agents",
    icon: Sparkle,
    blurb: "AI coding agents building dApps on Ritual.",
    group: "docs",
  },
];

export const NAV_GROUPS: { id: NavItem["group"]; label: string }[] = [
  { id: "start", label: "Start" },
  { id: "build", label: "Build" },
  { id: "docs", label: "Docs" },
  { id: "you", label: "You" },
];
