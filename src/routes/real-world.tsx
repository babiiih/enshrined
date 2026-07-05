import { createFileRoute } from "@tanstack/react-router";
import { SectionShell, Spec } from "@/components/section-shell";
import { Callout, CodeBlock } from "@/components/code-block";

export const Route = createFileRoute("/real-world")({
  head: () => ({
    meta: [
      { title: "Real World — Ritual Docs Explorer" },
      { name: "description", content: "HTTP, long-running tasks, scheduler, WebSockets from Solidity." },
    ],
  }),
  component: RealWorld,
});

function RealWorld() {
  return (
    <SectionShell
      eyebrow="Real World"
      title="Talk to the internet from Solidity"
      lede="Ritual's Act capability lets contracts make HTTP calls, hold WebSocket connections open across blocks, and schedule callbacks — with no oracle in the middle."
      related={[
        { title: "HTTP precompile", to: "/precompile-map/$id", params: { id: "http" } },
        { title: "Scheduler", to: "/precompile-map/$id", params: { id: "scheduler" } },
        { title: "Chain execution modes", to: "/chain" },
      ]}
    >
      <h2>HTTP · SPC</h2>
      <p>
        The HTTP precompile at <code>0x0801</code> runs inside a Short-Async co-processor call.
        Your transaction pauses, the TEE issues the request, and your contract resumes with the
        response bytes still inside the same transaction.
      </p>
      <Callout variant="warn" title="One SPC per transaction">
        You can't do two HTTP calls in one tx. Batch upstream, or chain via callbacks in later
        blocks.
      </Callout>

      <CodeBlock
        title="OracleFree.sol"
        snippets={[
          {
            lang: "solidity",
            label: "solidity",
            code: `interface IHttp {
  function get(string calldata url, bytes calldata headers)
    external returns (uint16 status, bytes memory body);
}

contract PriceReader {
  IHttp constant HTTP = IHttp(0x0000000000000000000000000000000000000801);

  function readEthUsd() external returns (uint256 price) {
    (uint16 status, bytes memory body) = HTTP.get(
      "https://api.example.com/price/eth-usd", ""
    );
    require(status == 200, "http");
    price = abi.decode(body, (uint256));
  }
}`,
          },
        ]}
      />

      <h2>Scheduler · Two-Phase</h2>
      <p>
        The Scheduler at <code>0x56e7...</code> lets a contract queue a callback for a future block
        or block interval. This is how agents run loops without an offchain keeper.
      </p>
      <Spec
        rows={[
          ["Trigger types", "One-shot at height, cron-like interval, or on external condition."],
          ["Payload", "Arbitrary calldata for a target contract on your behalf."],
          ["Gas", "Debited from RitualWallet balance at execution."],
        ]}
      />

      <h2>Long-running tasks</h2>
      <p>
        For work that outlives a block — training loops, agent deliberation, streaming inference —
        you dispatch a job via Two-Phase Async. The AsyncJobTracker mints a job ID, the callback
        lands in a later block, and your contract handles it via a designated selector.
      </p>

      <h2>WebSockets</h2>
      <p>
        The WebSocket precompile lets a contract hold a stateful subscription across blocks —
        market data, agent-to-agent chat, or live event streams flow into contract storage
        automatically.
      </p>
    </SectionShell>
  );
}
