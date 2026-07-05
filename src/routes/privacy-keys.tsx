import { createFileRoute } from "@tanstack/react-router";
import { SectionShell, Spec } from "@/components/section-shell";
import { Callout } from "@/components/code-block";

export const Route = createFileRoute("/privacy-keys")({
  head: () => ({
    meta: [
      { title: "Privacy & Keys — Ritual Docs Explorer" },
      { name: "description", content: "DKMS, ECIES, PII, X402 — private state and private payments." },
    ],
  }),
  component: PrivacyKeys,
});

function PrivacyKeys() {
  return (
    <SectionShell
      eyebrow="Privacy & Keys"
      title="A key custody layer for humans and agents"
      lede="DKMS is Ritual's Distributed Key Management System — keys live inside attested TEEs, policies decide who or what can sign. ECIES and PII precompiles handle encrypted payloads; X402 wires them into HTTP paywalls."
      related={[
        { title: "DKMS", to: "/precompile-map/$id", params: { id: "dkms" } },
        { title: "ECIES", to: "/precompile-map/$id", params: { id: "ecies" } },
        { title: "X402", to: "/precompile-map/$id", params: { id: "x402" } },
      ]}
    >
      <h2>DKMS</h2>
      <p>
        A user (or agent) requests a keypair; the private half never leaves the enclave. The
        contract stores only the public key and a policy — signing requests are evaluated by the
        TEE against that policy.
      </p>
      <Spec
        rows={[
          ["Keys", "Ed25519, secp256k1, X25519 — pick per use case."],
          ["Policy", "Owner address, allow-listed selectors, rate limits, expiry, agent tag."],
          ["Recovery", "Multi-party recovery via threshold custody; no single node can exfiltrate."],
        ]}
      />

      <h2>ECIES</h2>
      <p>
        Elliptic-curve integrated encryption for encrypted messages between two known keys.
        Encrypt-to-agent, encrypt-to-DKMS-key, or encrypt-to-user, all inline.
      </p>

      <h2>PII</h2>
      <p>
        A structured store for personally-identifiable data. Contracts see hashes and commitments;
        the plaintext lives inside the TEE and is released to authorized parties only.
      </p>

      <h2>X402 · pay for what you fetch</h2>
      <p>
        X402 turns HTTP <code>402 Payment Required</code> into a first-class flow. A contract
        fetches a resource; if the server responds 402, the precompile can settle the invoice from
        RitualWallet and retry — all inside one SPC.
      </p>
      <Callout variant="danger" title="Trust boundary">
        Anything an agent decrypts is exposed to the code the agent runs. DKMS protects keys; it
        does not sanitize decisions. Use policies aggressively.
      </Callout>
    </SectionShell>
  );
}
