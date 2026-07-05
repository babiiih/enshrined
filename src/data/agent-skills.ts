export type AgentSkill = {
  id: string;
  name: string;
  category: "onchain" | "data" | "ai" | "defi" | "social" | "infra";
  description: string;
  precompiles: string[];
  docUrl: string;
  install: string;
};

/**
 * Kurasi Agent Skills dari katalog Ritual (skills.ritualfoundation.org).
 * Data statis — link `docUrl` mengarah ke halaman skill di katalog resmi.
 */
export const AGENT_SKILLS: AgentSkill[] = [
  {
    id: "web-fetch",
    name: "Web Fetch",
    category: "data",
    description:
      "GET/POST HTTP request via precompile HTTP (0x0801) dengan TEE-attested response.",
    precompiles: ["HTTP"],
    docUrl: "https://skills.ritualfoundation.org/skills/web-fetch",
    install: 'ritual skill add @ritual/web-fetch',
  },
  {
    id: "llm-completion",
    name: "LLM Completion",
    category: "ai",
    description:
      "Chat completion via LLM precompile (0x0802). Response ditandatangani EIP-712 dan bisa distream via SSE.",
    precompiles: ["LLM"],
    docUrl: "https://skills.ritualfoundation.org/skills/llm-completion",
    install: 'ritual skill add @ritual/llm',
  },
  {
    id: "onnx-classify",
    name: "ONNX Classify",
    category: "ai",
    description:
      "Klasifikasi tensor via ONNX precompile (0x0800). Model dipinned ke commit hash.",
    precompiles: ["ONNX"],
    docUrl: "https://skills.ritualfoundation.org/skills/onnx-classify",
    install: 'ritual skill add @ritual/onnx',
  },
  {
    id: "dex-swap",
    name: "DEX Swap",
    category: "defi",
    description: "Swap token via router AMM — slippage, deadline, path routing.",
    precompiles: [],
    docUrl: "https://skills.ritualfoundation.org/skills/dex-swap",
    install: 'ritual skill add @ritual/dex-swap',
  },
  {
    id: "scheduler",
    name: "Scheduler",
    category: "infra",
    description:
      "Register cron untuk agent wake-up periodik via precompile 0x0804.",
    precompiles: ["SCHEDULER"],
    docUrl: "https://skills.ritualfoundation.org/skills/scheduler",
    install: 'ritual skill add @ritual/scheduler',
  },
  {
    id: "dkms-sign",
    name: "DKMS Sign",
    category: "infra",
    description:
      "Sign payload dengan key TEE-managed lewat DKMS (0x0803). Policy-based access.",
    precompiles: ["DKMS"],
    docUrl: "https://skills.ritualfoundation.org/skills/dkms-sign",
    install: 'ritual skill add @ritual/dkms',
  },
  {
    id: "x402-pay",
    name: "X402 Pay",
    category: "onchain",
    description:
      "Bayar API premium via HTTP 402 micropayment — settlement onchain otomatis.",
    precompiles: ["X402"],
    docUrl: "https://skills.ritualfoundation.org/skills/x402-pay",
    install: 'ritual skill add @ritual/x402',
  },
  {
    id: "jq-transform",
    name: "JQ Transform",
    category: "data",
    description:
      "Filter response JSON besar dengan jq (0x0806) supaya kontrak hanya konsumsi field relevan.",
    precompiles: ["JQ"],
    docUrl: "https://skills.ritualfoundation.org/skills/jq-transform",
    install: 'ritual skill add @ritual/jq',
  },
  {
    id: "erc20-transfer",
    name: "ERC-20 Transfer",
    category: "onchain",
    description:
      "Transfer ERC-20 dengan auto-approve & receipt verification.",
    precompiles: [],
    docUrl: "https://skills.ritualfoundation.org/skills/erc20-transfer",
    install: 'ritual skill add @ritual/erc20',
  },
  {
    id: "twitter-post",
    name: "Twitter Post",
    category: "social",
    description:
      "Post ke Twitter/X via HTTP + X402 payment (butuh API bearer via DKMS).",
    precompiles: ["HTTP", "X402", "DKMS"],
    docUrl: "https://skills.ritualfoundation.org/skills/twitter-post",
    install: 'ritual skill add @ritual/twitter',
  },
  {
    id: "pyth-price",
    name: "Pyth Price",
    category: "defi",
    description:
      "Ambil harga oracle Pyth via HTTP precompile — TEE attested, siap konsumsi kontrak.",
    precompiles: ["HTTP"],
    docUrl: "https://skills.ritualfoundation.org/skills/pyth-price",
    install: 'ritual skill add @ritual/pyth',
  },
  {
    id: "ipfs-pin",
    name: "IPFS Pin",
    category: "data",
    description:
      "Pin data/asset ke IPFS via provider dengan payment X402.",
    precompiles: ["HTTP", "X402"],
    docUrl: "https://skills.ritualfoundation.org/skills/ipfs-pin",
    install: 'ritual skill add @ritual/ipfs',
  },
];

export const SKILL_CATEGORIES: { id: AgentSkill["category"]; label: string }[] = [
  { id: "onchain", label: "Onchain" },
  { id: "data", label: "Data" },
  { id: "ai", label: "AI" },
  { id: "defi", label: "DeFi" },
  { id: "social", label: "Social" },
  { id: "infra", label: "Infra" },
];