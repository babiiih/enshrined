import { createFileRoute } from "@tanstack/react-router";
import { SectionShell, Spec } from "@/components/section-shell";
import { Callout, CodeBlock } from "@/components/code-block";

export const Route = createFileRoute("/chain")({
  head: () => ({
    meta: [
      { title: "Chain — Ritual Docs Explorer" },
      { name: "description", content: "TEE-EOVMT, Superposition, execution models, and system contracts." },
    ],
  }),
  component: Chain,
});

function Chain() {
  return (
    <SectionShell
      eyebrow="Chain"
      title="TEE-EOVMT, Superposition, and the block builder"
      lede="Ritual Chain is a fork of a modern EVM stack with an enshrined execution surface. Every block is built by a leader that can talk to TEEs and route work between replicated and delegated execution — without asking a contract to trust anyone."
      related={[
        { title: "Precompile Map", to: "/precompile-map" },
        { title: "Autonomous Agents", to: "/autonomous-agents" },
        { title: "Privacy & Keys", to: "/privacy-keys" },
      ]}
    >
      <h2>The one-paragraph mental model</h2>
      <p>
        A Ritual block still contains ordered transactions like Ethereum. The difference: some
        transactions are marked to run in a TEE-hosted delegated execution environment, and every
        node's EVM state includes the results of what those TEEs did. Both surfaces share one state
        root — this is <em>Superposition</em>. The block builder is the choreographer.
      </p>

      <h2>TEE-EOVMT</h2>
      <p>
        TEE-EOVMT = TEE-hosted Extended Off-chain Virtual Machine Toolkit. It runs alongside the
        EVM inside an attested enclave and is what makes precompiles like <code>LLM</code>,{" "}
        <code>ONNX</code>, <code>HTTP</code>, <code>DKMS</code>, and <code>FHE</code> possible
        without oracles.
      </p>
      <Spec
        rows={[
          ["Attestation", "Every TEE workload emits a hardware attestation, verifiable onchain."],
          ["Isolation", "Enclave memory is opaque to the operator. Even the block builder can't read plaintext DKMS keys."],
          ["Determinism", "Where output must be replicated, TEEs run in a deterministic mode. Where it must not (private inference), only the sender sees plaintext."],
        ]}
      />

      <h2>Superposition — one state, two surfaces</h2>
      <p>
        Superposition is the invariant: the EVM's view of the world and the TEE's view converge on
        every block boundary. Contracts read TEE-produced values as if they were natively stored;
        TEE precompiles read EVM state as if they were inside the interpreter.
      </p>

      <h2>Three execution modes</h2>
      <div className="grid gap-3 md:grid-cols-3 not-prose">
        {[
          {
            k: "Sync",
            v: "Inline. Same call frame. Used for ONNX, ECIES, small crypto ops. Returns bytes immediately.",
          },
          {
            k: "Short-Async (SPC)",
            v: "Same transaction, but the precompile call is dispatched to a co-processor and resumed. One SPC per tx. HTTP, X402 live here.",
          },
          {
            k: "Two-Phase Async",
            v: "Fire and forget. Callback lands in a future block via AsyncJobTracker → Scheduler. Used for LLM, long-running jobs, WebSockets.",
          },
        ].map((m) => (
          <div key={m.k} className="rounded-lg border border-border bg-card p-4">
            <div className="font-mono text-[11px] text-signal uppercase tracking-wider">{m.k}</div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{m.v}</p>
          </div>
        ))}
      </div>

      <h2>Sender lock</h2>
      <p>
        When a transaction issues an SPC or async job, the sender is locked from issuing conflicting
        jobs on the same slot until the callback lands or fails. This makes agent state races
        impossible without contract-level plumbing.
      </p>

      <h2>System contracts</h2>
      <Spec
        rows={[
          ["RitualWallet", <code>0x532F...</code>],
          ["AsyncJobTracker", <code>0xC069...</code>],
          ["Scheduler", <code>0x56e7...</code>],
          ["Chain ID", <code>1979</code>],
        ]}
      />
      <Callout variant="note" title="Where SPC ends and Two-Phase begins">
        Rule of thumb: if a precompile can return in &lt;1 block worth of wall time, it's a
        candidate for SPC. Anything model-heavy (LLM, big ONNX, RAG) is Two-Phase.
      </Callout>

      <h2>Adding the network</h2>
      <CodeBlock
        title="wallet.ts"
        snippets={[
          {
            lang: "typescript",
            label: "typescript",
            code: `await window.ethereum.request({
  method: "wallet_addEthereumChain",
  params: [{
    chainId: "0x7bb", // 1979
    chainName: "Ritual",
    nativeCurrency: { name: "Ritual", symbol: "RITUAL", decimals: 18 },
    rpcUrls: ["https://rpc.ritualfoundation.org"],
    blockExplorerUrls: ["https://explorer.ritualfoundation.org"],
  }],
});`,
          },
        ]}
      />
    </SectionShell>
  );
}
