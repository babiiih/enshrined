export type Capability =
  | "Think"
  | "Create"
  | "Act"
  | "Remember"
  | "Prove"
  | "Keep Secrets"
  | "Pay";

export type ExecMode = "Sync" | "Short-Async (SPC)" | "Two-Phase Async";

export type Precompile = {
  id: string;
  name: string;
  address: string;
  capability: Capability;
  mode: ExecMode;
  tagline: string;
  description: string;
  fields?: number;
  notes?: string[];
  related?: string[];
  example?: { lang: string; code: string };
};

export const PRECOMPILES: Precompile[] = [
  {
    id: "onnx",
    name: "ONNX Inference",
    address: "0x0800",
    capability: "Think",
    mode: "Sync",
    tagline: "Classical ML inference inline, same call frame.",
    description:
      "Runs a Hugging Face ONNX model synchronously in the node's native runtime. Input is a RitualTensor, model ID pinned to a 40-char commit hash so lineage stays reproducible.",
    fields: 7,
    notes: [
      "Branch names are rejected — commit hash only.",
      "Response: (bytes tensor, uint8 arithmetic, uint8 scale, uint8 rounding).",
    ],
    related: ["llm", "fhe"],
    example: {
      lang: "solidity",
      code: `(bool ok, bytes memory result) = address(0x0800).staticcall(
  abi.encode(
    bytes("hf/owner/repo/model.onnx@abc123..."),
    tensorBytes,
    uint8(2), uint8(0), uint8(2), uint8(0), uint8(1)
  )
);`,
    },
  },
  {
    id: "http",
    name: "HTTP",
    address: "0x0801",
    capability: "Act",
    mode: "Short-Async (SPC)",
    tagline: "Any URL, from Solidity, in one transaction.",
    description:
      "TEE executor makes the request, attests the response, returns it inline in the same tx. No oracles, no relayers. 13-field ABI supports ECIES secrets, PII redaction, DKMS keys.",
    fields: 13,
    notes: [
      "One async precompile per transaction.",
      "Response body is bytes — decode with TextDecoder for text.",
      "errorMessage non-empty = precompile-level failure (distinct from HTTP status).",
    ],
    related: ["long-http", "jq", "secrets", "x402"],
  },
  {
    id: "llm",
    name: "LLM Inference",
    address: "0x0802",
    capability: "Think",
    mode: "Short-Async (SPC)",
    tagline: "Open-weight LLM in TEE. No API keys. Streamable via EIP-712 SSE.",
    description:
      "Runs zai-org/GLM-4.7-FP8 (64K context, MIT) inside a TEE. 25-field ABI mirrors OpenAI chat completion. convoHistory StorageRef required. Streaming pushes EIP-712-signed tokens over SSE.",
    fields: 30,
    notes: [
      "temperature, presence/freq penalty, topP encoded as int × 1000.",
      "PII mode and streaming are mutually exclusive.",
      "convoHistory tuple (string,string,string) is required.",
    ],
    related: ["onnx", "http", "secrets"],
  },
  {
    id: "jq",
    name: "JQ",
    address: "0x0803",
    capability: "Act",
    mode: "Sync",
    tagline: "Run jq expressions against JSON in the same tx.",
    description:
      "Extracts typed values (uint256, string, address, arrays) from JSON strings. Common pattern: chain an HTTP call and a JQ call in the same transaction to parse the response.",
    notes: [
      "String output (type 2) needs _decodeJQString() double-indirection decoding.",
      "Wrong outputType does NOT revert — returns ok=true with zero-length output. Always check result.length > 0.",
    ],
    related: ["http"],
  },
  {
    id: "long-http",
    name: "Long-Running HTTP",
    address: "0x0805",
    capability: "Act",
    mode: "Two-Phase Async",
    tagline: "Submit → executor polls → delivers via callback.",
    description:
      "For HTTP flows exceeding the 2s SPC budget: batch jobs, webhook waits, long-poll patterns. 35-field ABI drives three JQ extraction paths (task ID, status check, result).",
    fields: 35,
    notes: [
      "Callback selector: onLongRunningResult(bytes32 jobId, bytes result) — 0x6dc9dbef.",
      "One call per transaction like all long-running precompiles.",
      "Executor polls at pollIntervalBlocks until statusJsonPath is truthy.",
    ],
    related: ["http", "scheduler"],
  },
  {
    id: "image",
    name: "Image Generation",
    address: "0x0818",
    capability: "Create",
    mode: "Two-Phase Async",
    tagline: "Generative image models via TEE-attested request.",
    description:
      "18-field ABI shared with audio and video. Multimodal inputs via ModalInput[], output config with steps, guidance scale, seed, negative prompt.",
    fields: 18,
    related: ["audio", "video"],
  },
  {
    id: "audio",
    name: "Audio Generation",
    address: "0x0819",
    capability: "Create",
    mode: "Two-Phase Async",
    tagline: "TTS / speech / music synthesis in TEE.",
    description:
      "Same 18-field ABI as Image and Video; OutputConfig adapts (sample rate for audio).",
    fields: 18,
    related: ["image", "video"],
  },
  {
    id: "video",
    name: "Video Generation",
    address: "0x081A",
    capability: "Create",
    mode: "Two-Phase Async",
    tagline: "Text/image to video, delivered via callback.",
    description:
      "18-field ABI shared with Image and Audio. OutputConfig includes fps.",
    fields: 18,
    related: ["image", "audio"],
  },
  {
    id: "sovereign-agent",
    name: "Sovereign Agent",
    address: "0x080C",
    capability: "Act",
    mode: "Two-Phase Async",
    tagline: "CLI harness (Claude Code, Hermes, Crush, ZeroClaw) in a TEE.",
    description:
      "Invokes a sandboxed CLI agent inside a TEE. The contract IS the agent when combined with Scheduler wakeups. Callback: onSovereignAgentResult(bytes32, bytes).",
    fields: 23,
    notes: [
      "Active harnesses: Claude Code, Hermes, Crush, ZeroClaw.",
      "Pair with Scheduler to build an infinite wake→act→schedule loop.",
    ],
    related: ["persistent-agent", "scheduler", "dkms"],
  },
  {
    id: "persistent-agent",
    name: "Persistent Agent",
    address: "0x0820",
    capability: "Act",
    mode: "Two-Phase Async",
    tagline: "Container agent with soul, memory, DA, revival.",
    description:
      "Stateful agent whose container runs in a TEE. Persists across sessions via StorageRef (HuggingFace, GCS, Pinata, IPFS). Revival from manifest CID restores full state.",
    fields: 25,
    notes: [
      "Fund the DKMS-derived child address via RitualWallet.depositFor().",
      "Dead man's switch: silent >200 blocks → chain triggers revival automatically.",
      "Callback: onPersistentAgentResult(bytes32, bytes).",
    ],
    related: ["sovereign-agent", "dkms", "scheduler"],
  },
  {
    id: "dkms",
    name: "DKMS",
    address: "0x081B",
    capability: "Remember",
    mode: "Short-Async (SPC)",
    tagline: "Deterministic secp256k1 key derivation inside TEE.",
    description:
      "Same owner + same keyIndex → same keypair every time. Private key never leaves the enclave. Foundation for agent emancipation and encrypted DA state.",
    related: ["secrets", "persistent-agent"],
  },
  {
    id: "scheduler",
    name: "Scheduler",
    address: "0x56e776BAE2DD60664b69Bd5F865F1180ffB7D58B",
    capability: "Remember",
    mode: "Sync",
    tagline: "Contracts wake themselves at future blocks.",
    description:
      "System contract, not a precompile address, but part of the map. schedule(data, gas, startBlock, numCalls, frequency, ttl, ...). Predicates gate execution via staticcall. Bypasses the async sender lock.",
    notes: [
      "Contracts only — EOAs cannot call schedule().",
      "Requires prior approveScheduler(schedulerAddress).",
      "executionIndex is written into bytes 4-35 of your calldata by the scheduler.",
    ],
    related: ["sovereign-agent", "persistent-agent"],
  },
  {
    id: "ed25519",
    name: "Ed25519",
    address: "0x0009",
    capability: "Prove",
    mode: "Sync",
    tagline: "Native Ed25519 signature verification.",
    description:
      "Verify Ed25519 signatures (Solana, Cosmos, SSH keys) directly from Solidity.",
    related: ["passkey"],
  },
  {
    id: "passkey",
    name: "Passkeys / P-256 (SECP256R1)",
    address: "0x0100",
    capability: "Prove",
    mode: "Sync",
    tagline: "WebAuthn P-256 verification. Face ID = wallet.",
    description:
      "Pairs with TxPasskey (0x77) native transaction type. Address = keccak256(pubX || pubY)[12:32]. Returns uint256 (1 = valid, 0 = invalid), NOT bool. 3,450 gas flat.",
    notes: [
      "Signature types: 0x00 secp256k1, 0x01 P-256 (+3,450), 0x02 WebAuthn (+5,000).",
    ],
    related: ["ed25519"],
  },
  {
    id: "zk",
    name: "ZK Proofs",
    address: "0x081C",
    capability: "Prove",
    mode: "Two-Phase Async",
    tagline: "Generate & verify zero-knowledge proofs in TEE.",
    description:
      "Long-running proof workloads delivered via callback. Complements TEE attestation for verifiable but private computation.",
    related: ["fhe"],
  },
  {
    id: "fhe",
    name: "FHE Inference",
    address: "0x081D",
    capability: "Think",
    mode: "Two-Phase Async",
    tagline: "Homomorphic inference (CKKS) on ciphertext tensors.",
    description:
      "Run ML models over encrypted floating-point tensors without decrypting. Uses CKKS approximate arithmetic.",
    related: ["onnx", "zk"],
  },
  {
    id: "secrets",
    name: "Secrets / ECIES",
    address: "—",
    capability: "Keep Secrets",
    mode: "Sync",
    tagline: "ECIES-encrypted secrets injected inside TEE.",
    description:
      "Not a standalone address — a system built into every async precompile. Encrypt with executor's public key (from TEEServiceRegistry), reference as {{SECRET_NAME}} in request fields. Plaintext never touches chain or mempool.",
    notes: [
      "AES-256-GCM with 12-byte nonce. Wrong nonce length is the #1 integration bug.",
      "Any {{SECRET}} template ⇒ piiEnabled must be true or the literal string ships to the API.",
    ],
    related: ["http", "llm", "x402", "dkms"],
  },
  {
    id: "x402",
    name: "X402 Payments",
    address: "—",
    capability: "Pay",
    mode: "Short-Async (SPC)",
    tagline: "Pay-per-call API access via encrypted credentials.",
    description:
      "Runs on the HTTP precompile — not a separate address. Credentials ECIES-encrypted, substituted inside TEE, letting agents monetize and consume gated APIs.",
    related: ["http", "secrets"],
  },
];

export const CAPABILITIES: { name: Capability; blurb: string }[] = [
  { name: "Think", blurb: "Reason, infer, decide" },
  { name: "Create", blurb: "Generate images, audio, video" },
  { name: "Act", blurb: "Execute tasks, call APIs, transact" },
  { name: "Remember", blurb: "Persist state, schedule, derive keys" },
  { name: "Prove", blurb: "Verify signatures, generate proofs" },
  { name: "Keep Secrets", blurb: "Encrypt credentials, redact PII" },
  { name: "Pay", blurb: "Monetize APIs, pay-per-call access" },
];

export const MODES: ExecMode[] = ["Sync", "Short-Async (SPC)", "Two-Phase Async"];

export function getPrecompile(id: string) {
  return PRECOMPILES.find((p) => p.id === id);
}
