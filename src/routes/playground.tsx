import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAccount, useChainId, useSendTransaction, useBalance } from "wagmi";
import { encodeAbiParameters, toHex, stringToHex } from "viem";
import { z } from "zod";
import { usePrivy } from "@privy-io/react-auth";
import { Loader2, Send, Wallet, Droplets, AlertTriangle } from "lucide-react";
import { PRECOMPILE_ADDRESSES, ritualChain, RITUAL_FAUCET, RITUAL_EXPLORER } from "@/lib/ritual-chain";
import { cn } from "@/lib/utils";
import { NetworkGuard } from "@/components/network-guard";

export const Route = createFileRoute("/playground")({
  head: () => ({
    meta: [
      { title: "Precompile Playground — Ritual Docs Explorer" },
      {
        name: "description",
        content:
          "Send live testnet transactions to Ritual precompiles: HTTP GET, ONNX inference, LLM request.",
      },
    ],
  }),
  component: Playground,
});

type TabId = "http" | "onnx" | "llm" | "scheduler" | "dkms" | "x402" | "jq";

function Playground() {
  const [tab, setTab] = useState<TabId>("http");
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal mb-2">
          Live · Testnet
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Precompile Playground</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Send actual transactions from your wallet to Ritual precompiles (HTTP, ONNX, LLM,
          Scheduler, DKMS, X402, JQ). Testnet RITUAL only — grab some from the faucet if you're empty.
        </p>
      </div>

      <div className="mb-4"><NetworkGuard /></div>
      <GateBanner />


      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {(
          [
            { id: "http", label: "HTTP GET", addr: PRECOMPILE_ADDRESSES.HTTP },
            { id: "onnx", label: "ONNX", addr: PRECOMPILE_ADDRESSES.ONNX },
            { id: "llm", label: "LLM", addr: PRECOMPILE_ADDRESSES.LLM },
            { id: "scheduler", label: "Scheduler", addr: PRECOMPILE_ADDRESSES.SCHEDULER },
            { id: "dkms", label: "DKMS", addr: PRECOMPILE_ADDRESSES.DKMS },
            { id: "x402", label: "X402", addr: PRECOMPILE_ADDRESSES.X402 },
            { id: "jq", label: "JQ", addr: PRECOMPILE_ADDRESSES.JQ },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 -mb-px text-sm border-b-2 transition-colors whitespace-nowrap",
              tab === t.id
                ? "border-signal text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span className="ml-2 font-mono text-[10px] text-muted-foreground">
              {t.addr.slice(0, 6)}…{t.addr.slice(-4)}
            </span>
          </button>
        ))}
      </div>

      <div className="pt-6">
        {tab === "http" && <HttpTab />}
        {tab === "onnx" && <OnnxTab />}
        {tab === "llm" && <LlmTab />}
        {tab === "scheduler" && <SchedulerTab />}
        {tab === "dkms" && <DkmsTab />}
        {tab === "x402" && <X402Tab />}
        {tab === "jq" && <JqTab />}
      </div>
    </div>
  );
}

function GateBanner() {
  const { authenticated, login, ready } = usePrivy();
  const { address } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address,
    chainId: ritualChain.id,
    query: { enabled: !!address },
  });

  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="mb-6 rounded-lg border border-signal/30 bg-signal/5 p-4 flex items-center gap-3">
        <Wallet className="size-5 text-signal" />
        <div className="flex-1 text-sm">
          <div className="font-medium">Connect a wallet to send precompile calls.</div>
          <div className="text-muted-foreground text-xs">Email, Google, or any EVM wallet.</div>
        </div>
        <button
          onClick={() => login()}
          className="rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-signal-foreground hover:opacity-90"
        >
          Connect
        </button>
      </div>
    );
  }
  if (chainId !== ritualChain.id) {
    return (
      <div className="mb-6 rounded-lg border border-chart-4/40 bg-chart-4/5 p-4 flex items-center gap-3">
        <AlertTriangle className="size-5 text-chart-4" />
        <div className="flex-1 text-sm text-chart-4">
          Switch to Ritual (chain 1979) using the wallet menu.
        </div>
      </div>
    );
  }
  if (balance && balance.value === 0n) {
    return (
      <div className="mb-6 rounded-lg border border-signal/30 bg-signal/5 p-4 flex items-center gap-3">
        <Droplets className="size-5 text-signal" />
        <div className="flex-1 text-sm">
          <div className="font-medium">Zero RITUAL balance</div>
          <div className="text-muted-foreground text-xs">
            You need testnet RITUAL to send precompile calls.
          </div>
        </div>
        <a
          href={RITUAL_FAUCET}
          target="_blank"
          rel="noreferrer"
          className="rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-signal-foreground hover:opacity-90"
        >
          Get from faucet
        </a>
      </div>
    );
  }
  return null;
}

type SendState = {
  status: "idle" | "sending" | "sent" | "error";
  hash?: `0x${string}`;
  error?: string;
};

function useSendPrecompile() {
  const [state, setState] = useState<SendState>({ status: "idle" });
  const { sendTransactionAsync } = useSendTransaction();
  const { authenticated } = usePrivy();

  async function send(to: `0x${string}`, data: `0x${string}`) {
    if (!authenticated) {
      setState({ status: "error", error: "Connect a wallet first" });
      return;
    }
    setState({ status: "sending" });
    try {
      const hash = await sendTransactionAsync({
        to,
        data,
        chainId: ritualChain.id,
        gas: 500_000n,
      });
      setState({ status: "sent", hash });
    } catch (e) {
      setState({ status: "error", error: e instanceof Error ? e.message : String(e) });
    }
  }
  return { state, send, reset: () => setState({ status: "idle" }) };
}

function HttpTab() {
  const [url, setUrl] = useState("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
  const { state, send } = useSendPrecompile();

  function submit() {
    const parsed = z
      .string()
      .url({ message: "URL tidak valid" })
      .refine((u) => /^https?:\/\//u.test(u), { message: "Hanya http(s):// yang didukung" })
      .safeParse(url);
    if (!parsed.success) {
      alert(parsed.error.issues[0]?.message);
      return;
    }
    // Encode a call payload for the HTTP precompile: (string url, bytes headers)
    // Note: the exact ABI signature depends on the enshrined precompile; this
    // demonstrates the call site — the precompile parses the calldata itself.
    const data = encodeAbiParameters(
      [{ type: "string" }, { type: "bytes" }],
      [parsed.data, "0x"],
    );
    send(PRECOMPILE_ADDRESSES.HTTP as `0x${string}`, data);
  }

  return (
    <TabShell
      title="HTTP GET via precompile 0x0801"
      description="Short-Async (SPC). The TEE issues the request and returns the body in the same transaction."
    >
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        Target URL
      </label>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://api.example.com/endpoint"
        className="w-full h-10 rounded-md border border-border bg-muted/30 px-3 font-mono text-sm outline-none focus:border-signal"
      />
      <SubmitRow state={state} onSubmit={submit} label="Send HTTP call" />
    </TabShell>
  );
}

const ONNX_MODELS = [
  {
    label: "MobileNetV2 (classifier)",
    id: "hf/onnx-community/mobilenetv2-1.0-224@a1b2c3d4e5f60708091011121314151617181920",
  },
  {
    label: "MiniLM sentence embeddings",
    id: "hf/sentence-transformers/all-MiniLM-L6-v2@aabbccddeeff00112233445566778899aabbccdd",
  },
];

function OnnxTab() {
  const [modelId, setModelId] = useState(ONNX_MODELS[0].id);
  const [tensorHex, setTensorHex] = useState("0x000102030405060708090a0b0c0d0e0f");
  const { state, send } = useSendPrecompile();

  function submit() {
    const data = encodeAbiParameters(
      [
        { type: "string" },
        { type: "bytes" },
        { type: "uint8" },
        { type: "uint8" },
        { type: "uint8" },
        { type: "uint8" },
        { type: "uint8" },
      ],
      [modelId, tensorHex as `0x${string}`, 2, 0, 2, 0, 1],
    );
    send(PRECOMPILE_ADDRESSES.ONNX as `0x${string}`, data);
  }

  return (
    <TabShell
      title="ONNX inference via precompile 0x0800"
      description="Sync. Model pinned to a commit hash. Response is a tensor + scale bytes."
    >
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        Model
      </label>
      <select
        value={modelId}
        onChange={(e) => setModelId(e.target.value)}
        className="w-full h-10 rounded-md border border-border bg-muted/30 px-3 text-sm outline-none focus:border-signal"
      >
        {ONNX_MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-1.5">
        Input tensor (hex)
      </label>
      <input
        value={tensorHex}
        onChange={(e) => setTensorHex(e.target.value)}
        className="w-full h-10 rounded-md border border-border bg-muted/30 px-3 font-mono text-xs outline-none focus:border-signal"
      />
      <SubmitRow state={state} onSubmit={submit} label="Run inference" />
    </TabShell>
  );
}

function LlmTab() {
  const [prompt, setPrompt] = useState("Write a haiku about a black cat living on a blockchain.");
  const { state, send } = useSendPrecompile();

  function submit() {
    const modelId = stringToHex("glm-4.7-fp8", { size: 32 });
    const callback = "0x00000000";
    const data = encodeAbiParameters(
      [{ type: "bytes32" }, { type: "bytes" }, { type: "bytes4" }],
      [modelId, toHex(prompt), callback],
    );
    send(PRECOMPILE_ADDRESSES.LLM as `0x${string}`, data);
  }

  return (
    <TabShell
      title="LLM request via precompile 0x0802"
      description="Two-Phase Async. Response arrives via callback in a later block. Watch AsyncJobTracker for completion."
    >
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        Prompt
      </label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm outline-none focus:border-signal resize-none"
      />
      <SubmitRow state={state} onSubmit={submit} label="Request completion" />
    </TabShell>
  );
}

function TabShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4">
        <div className="font-semibold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      </div>
      {children}
    </div>
  );
}

function SchedulerTab() {
  const [target, setTarget] = useState("");
  const [cron, setCron] = useState("*/5 * * * *");
  const [callSig, setCallSig] = useState("wake()");
  const { state, send } = useSendPrecompile();

  function submit() {
    const addr = z.string().regex(/^0x[a-fA-F0-9]{40}$/u).safeParse(target);
    if (!addr.success) return alert("Target address tidak valid (0x… 40 hex)");
    if (!cron.trim()) return alert("Cron expression wajib");
    const data = encodeAbiParameters(
      [{ type: "address" }, { type: "string" }, { type: "string" }],
      [addr.data as `0x${string}`, cron, callSig],
    );
    send(PRECOMPILE_ADDRESSES.SCHEDULER as `0x${string}`, data);
  }

  return (
    <TabShell
      title="Scheduler via precompile 0x0804"
      description="Wake-up periodik untuk autonomous agent. Cron style — chain memanggil target address sesuai jadwal."
    >
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        Target agent address
      </label>
      <input
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        placeholder="0x…"
        className="w-full h-10 rounded-md border border-border bg-muted/30 px-3 font-mono text-sm outline-none focus:border-signal"
      />
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-1.5">
        Cron expression
      </label>
      <input
        value={cron}
        onChange={(e) => setCron(e.target.value)}
        placeholder="*/5 * * * *"
        className="w-full h-10 rounded-md border border-border bg-muted/30 px-3 font-mono text-sm outline-none focus:border-signal"
      />
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-1.5">
        Call signature
      </label>
      <input
        value={callSig}
        onChange={(e) => setCallSig(e.target.value)}
        className="w-full h-10 rounded-md border border-border bg-muted/30 px-3 font-mono text-sm outline-none focus:border-signal"
      />
      <SubmitRow state={state} onSubmit={submit} label="Register schedule" />
    </TabShell>
  );
}

function DkmsTab() {
  const [op, setOp] = useState<"generate" | "sign">("generate");
  const [policy, setPolicy] = useState("owner-only");
  const [payload, setPayload] = useState("0x");
  const { state, send } = useSendPrecompile();

  function submit() {
    const data = encodeAbiParameters(
      [{ type: "string" }, { type: "string" }, { type: "bytes" }],
      [op, policy, (payload || "0x") as `0x${string}`],
    );
    send(PRECOMPILE_ADDRESSES.DKMS as `0x${string}`, data);
  }

  return (
    <TabShell
      title="DKMS via precompile 0x0803"
      description="Distributed Key Management System — generate keypair TEE-managed, atau sign payload dengan policy check."
    >
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        Operation
      </label>
      <select
        value={op}
        onChange={(e) => setOp(e.target.value as "generate" | "sign")}
        className="w-full h-10 rounded-md border border-border bg-muted/30 px-3 text-sm outline-none focus:border-signal"
      >
        <option value="generate">generate — mint key baru</option>
        <option value="sign">sign — tanda tangan payload</option>
      </select>
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-1.5">
        Policy ID
      </label>
      <input
        value={policy}
        onChange={(e) => setPolicy(e.target.value)}
        className="w-full h-10 rounded-md border border-border bg-muted/30 px-3 font-mono text-sm outline-none focus:border-signal"
      />
      {op === "sign" && (
        <>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-1.5">
            Payload (hex)
          </label>
          <input
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            className="w-full h-10 rounded-md border border-border bg-muted/30 px-3 font-mono text-xs outline-none focus:border-signal"
          />
        </>
      )}
      <SubmitRow state={state} onSubmit={submit} label={op === "generate" ? "Generate key" : "Sign payload"} />
    </TabShell>
  );
}

function X402Tab() {
  const [url, setUrl] = useState("https://paid-api.example.com/premium/data");
  const [maxPay, setMaxPay] = useState("0.001");
  const { state, send } = useSendPrecompile();

  function submit() {
    const parsed = z
      .string()
      .url({ message: "URL tidak valid" })
      .refine((u) => /^https?:\/\//u.test(u), { message: "Hanya http(s)://" })
      .safeParse(url);
    if (!parsed.success) return alert(parsed.error.issues[0]?.message);
    if (Number(maxPay) <= 0) return alert("Max payment harus > 0");
    const wei = BigInt(Math.floor(Number(maxPay) * 1e18));
    const data = encodeAbiParameters(
      [{ type: "string" }, { type: "uint256" }],
      [parsed.data, wei],
    );
    send(PRECOMPILE_ADDRESSES.X402 as `0x${string}`, data);
  }

  return (
    <TabShell
      title="X402 payment via precompile 0x0805"
      description="HTTP 402 Payment Required — agent membayar micropayment untuk mengakses API/data. Chain handle settlement onchain."
    >
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        Paid URL
      </label>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full h-10 rounded-md border border-border bg-muted/30 px-3 font-mono text-sm outline-none focus:border-signal"
      />
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-1.5">
        Max payment (RITUAL)
      </label>
      <input
        value={maxPay}
        onChange={(e) => setMaxPay(e.target.value)}
        className="w-full h-10 rounded-md border border-border bg-muted/30 px-3 font-mono text-sm outline-none focus:border-signal"
      />
      <SubmitRow state={state} onSubmit={submit} label="Pay & fetch" />
    </TabShell>
  );
}

function JqTab() {
  const [input, setInput] = useState(`{"prices":{"eth":3210,"btc":68500}}`);
  const [filter, setFilter] = useState(".prices.eth");
  const { state, send } = useSendPrecompile();

  function submit() {
    try {
      JSON.parse(input);
    } catch {
      return alert("Input harus JSON valid");
    }
    if (!filter.trim()) return alert("Filter jq wajib");
    const data = encodeAbiParameters(
      [{ type: "string" }, { type: "string" }],
      [input, filter],
    );
    send(PRECOMPILE_ADDRESSES.JQ as `0x${string}`, data);
  }

  return (
    <TabShell
      title="JQ transform via precompile 0x0806"
      description="Transformasi JSON dengan filter jq — memangkas response HTTP besar tanpa membebani gas kontrak."
    >
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        JSON input
      </label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={4}
        className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-xs outline-none focus:border-signal resize-none"
      />
      <label className="block text-xs uppercase tracking-wider text-muted-foreground mt-4 mb-1.5">
        jq filter
      </label>
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full h-10 rounded-md border border-border bg-muted/30 px-3 font-mono text-sm outline-none focus:border-signal"
      />
      <SubmitRow state={state} onSubmit={submit} label="Run jq" />
    </TabShell>
  );
}

function SubmitRow({
  state,
  onSubmit,
  label,
}: {
  state: SendState;
  onSubmit: () => void;
  label: string;
}) {
  const sending = state.status === "sending";
  return (
    <div className="mt-5">
      <button
        onClick={onSubmit}
        disabled={sending}
        className="inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground hover:opacity-90 disabled:opacity-60"
      >
        {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {sending ? "Awaiting signature…" : label}
      </button>

      {state.status === "sent" && state.hash && (
        <div className="mt-4 rounded-md border border-signal/30 bg-signal/5 p-3 animate-fade-in">
          <div className="text-xs text-signal font-medium mb-1">Transaction sent</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate font-mono text-xs">{state.hash}</code>
            <a
              href={`${RITUAL_EXPLORER}/tx/${state.hash}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-signal hover:underline whitespace-nowrap"
            >
              View →
            </a>
          </div>
        </div>
      )}
      {state.status === "error" && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive animate-fade-in">
          {state.error}
        </div>
      )}
    </div>
  );
}
