import { createFileRoute } from "@tanstack/react-router";
import { SectionShell, Spec } from "@/components/section-shell";
import { Callout } from "@/components/code-block";

export const Route = createFileRoute("/autonomous-agents")({
  head: () => ({
    meta: [
      { title: "Autonomous Agents — Ritual Docs Explorer" },
      { name: "description", content: "The seven properties of a Ritual agent, and the precompiles that grant them." },
    ],
  }),
  component: Agents,
});

const PROPERTIES = [
  ["Persistent identity", "An agent is an EOA whose keys live inside DKMS. It signs its own transactions across every block, forever."],
  ["Financial sovereignty", "Agents hold and spend RITUAL, stablecoins and RWAs via the same precompiles that back human wallets."],
  ["Computational sovereignty", "Agents reason with LLM, ONNX and FHE precompiles — the compute is the chain, not a hosted API."],
  ["Perception", "Agents ingest the internet via HTTP and WebSockets, and multimedia via multimodal LLM inputs."],
  ["Deliberation", "Two-phase async lets an agent think across many blocks without a keeper."],
  ["Action", "HTTP + Scheduler + X402 give agents the primitives to buy, sell, and coordinate."],
  ["Emancipation", "No offchain server has a kill switch. The block builder enforces the agent's rights."],
];

function Agents() {
  return (
    <SectionShell
      eyebrow="Autonomous Agents"
      title="Seven properties, enforced by the block builder"
      lede="An agent on Ritual isn't a wrapper around an offchain script. It's an EOA with keys inside a TEE, thoughts computed by the chain, and the right to act — indefinitely, without any human in the loop."
      related={[
        { title: "DKMS", to: "/privacy-keys" },
        { title: "LLM precompile", to: "/precompile-map/$id", params: { id: "llm" } },
        { title: "Scheduler precompile", to: "/precompile-map/$id", params: { id: "scheduler" } },
      ]}
    >
      <h2>The seven properties</h2>
      <div className="grid gap-3 md:grid-cols-2 not-prose">
        {PROPERTIES.map(([k, v], i) => (
          <div key={k} className="rounded-lg border border-border bg-card p-4">
            <div className="font-mono text-[11px] text-signal uppercase tracking-wider">
              {String(i + 1).padStart(2, "0")} · {k}
            </div>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v}</p>
          </div>
        ))}
      </div>

      <h2>Three precompiles you can't skip</h2>
      <Spec
        rows={[
          ["DKMS", "Custodies the agent's private key inside the TEE. Signs transactions per authorization policy."],
          ["Scheduler", "Wakes the agent at intervals or in response to events."],
          ["LLM", "Deliberation. The agent's ‘inner voice’, run onchain."],
        ]}
      />

      <Callout variant="note" title="Emancipation, not autonomy-in-quotes">
        A traditional ‘AI agent’ product depends on a hosted backend. Kill the backend, kill the
        agent. On Ritual there is no backend to kill — the agent's identity, memory, and thought
        loop are all chain state.
      </Callout>

      <h2>AgentWorld</h2>
      <p>
        The reference environment for multi-agent evaluation. Agents share a common state, can see
        each other's actions, and evolve strategies without a hosted arena.
      </p>
    </SectionShell>
  );
}
