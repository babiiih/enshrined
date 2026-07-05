import { createFileRoute } from "@tanstack/react-router";
import { SectionShell, Spec } from "@/components/section-shell";
import { Callout, CodeBlock } from "@/components/code-block";

export const Route = createFileRoute("/enshrined-ai")({
  head: () => ({
    meta: [
      { title: "Enshrined AI — Ritual Docs Explorer" },
      { name: "description", content: "LLM, ONNX, FHE, ZK inference, multimodal AI as precompiles." },
    ],
  }),
  component: EAI,
});

function EAI() {
  return (
    <SectionShell
      eyebrow="Enshrined AI"
      title="AI is a first-class VM primitive"
      lede="Ritual promotes model inference from ‘call an oracle’ to ‘call an opcode’. Classical ML runs inline; LLMs run async in an attested TEE; FHE and ZK preserve privacy or verifiability."
      related={[
        { title: "LLM Inference", to: "/precompile-map/$id", params: { id: "llm" } },
        { title: "ONNX Inference", to: "/precompile-map/$id", params: { id: "onnx" } },
        { title: "FHE Inference", to: "/precompile-map/$id", params: { id: "fhe" } },
      ]}
    >
      <h2>Model catalog</h2>
      <Spec
        rows={[
          ["Hosted LLM", "GLM-4.7-FP8 default. Multimodal in/out. Streaming SSE for humans."],
          ["ONNX", "Any Hugging Face model pinned to a 40-char commit. Sync return."],
          ["FHE", "Encrypted-in / encrypted-out — inference on private inputs."],
          ["ZK", "Prover for inference correctness. Verifier is a companion precompile."],
        ]}
      />

      <h2>Two lifecycles</h2>
      <p>
        <strong>Sync (ONNX)</strong>: your <code>staticcall</code> returns the tensor bytes in-line.
        Good for classifiers, embeddings under a few MB.
      </p>
      <p>
        <strong>Two-Phase (LLM)</strong>: your contract calls <code>llm.request(...)</code>; the
        job ID is emitted; the callback lands one to a few blocks later with the completion. Your
        contract exposes a selector the Scheduler invokes.
      </p>

      <CodeBlock
        title="LLMConsumer.sol"
        snippets={[
          {
            lang: "solidity",
            label: "solidity",
            code: `interface ILLM {
  function request(bytes32 modelId, bytes calldata prompt, bytes4 callback)
    external returns (uint256 jobId);
}

contract Agent {
  ILLM constant LLM = ILLM(0x0000000000000000000000000000000000000802);

  function think(string calldata q) external {
    LLM.request(bytes32("glm-4.7-fp8"), bytes(q), this.onCompletion.selector);
  }

  function onCompletion(uint256 jobId, bytes calldata output) external {
    // Called by the Scheduler in a future block.
  }
}`,
          },
        ]}
      />

      <Callout variant="note" title="Privacy tiers">
        Public inference is cheapest; private inference (per-request DKMS keys) hides prompts from
        everyone except the sender. FHE hides them from the TEE operator too, at higher cost.
      </Callout>
    </SectionShell>
  );
}
