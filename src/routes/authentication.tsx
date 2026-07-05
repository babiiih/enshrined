import { createFileRoute } from "@tanstack/react-router";
import { SectionShell, Spec } from "@/components/section-shell";
import { Callout, CodeBlock } from "@/components/code-block";

export const Route = createFileRoute("/authentication")({
  head: () => ({
    meta: [
      { title: "Authentication — Ritual Docs Explorer" },
      { name: "description", content: "WebAuthn P-256, Ed25519, TxPasskey — passwordless auth as precompiles." },
    ],
  }),
  component: Auth,
});

function Auth() {
  return (
    <SectionShell
      eyebrow="Authentication"
      title="Passkeys and non-secp256k1 signatures, natively"
      lede="Every wallet, phone and hardware key ships with WebAuthn P-256 or Ed25519. Ritual makes those signatures verifiable inside Solidity as cheap opcodes — no smart-wallet gymnastics."
      related={[
        { title: "WebAuthn / P-256", to: "/precompile-map/$id", params: { id: "p256" } },
        { title: "Ed25519", to: "/precompile-map/$id", params: { id: "ed25519" } },
        { title: "TxPasskey", to: "/precompile-map/$id", params: { id: "txpasskey" } },
      ]}
    >
      <h2>Why this matters</h2>
      <p>
        Onboarding to onchain apps still requires a browser extension or a smart wallet with a
        proxy account. When P-256 is a precompile, an iPhone's Face ID can directly authorize an
        EOA — no extension, no third-party bundler.
      </p>

      <Spec
        rows={[
          ["P-256", "WebAuthn signatures verifiable in-contract."],
          ["Ed25519", "Solana/Cosmos-style keys, verifiable on Ritual."],
          ["TxPasskey", "New transaction type authorizing a tx directly from a passkey signature — no ECDSA wrapper."],
        ]}
      />

      <h2>Example: Face ID authorizes a swap</h2>
      <CodeBlock
        title="passkey-swap.ts"
        snippets={[
          {
            lang: "typescript",
            label: "typescript",
            code: `// 1. Prompt the OS for a WebAuthn assertion.
const assertion = await navigator.credentials.get({ publicKey: challenge });

// 2. Build a TxPasskey tx (type 0x77) carrying the P-256 signature.
const tx = buildTxPasskey({
  to: swapRouter, data: swapCalldata, value: 0n,
  webauthn: assertion,
});

// 3. Submit — the chain verifies P-256 in a precompile, no ECDSA needed.
await provider.send("eth_sendRawTransaction", [tx]);`,
          },
        ]}
      />

      <Callout variant="warn" title="Replay & origin binding">
        Passkey signatures are bound to a challenge. Contracts must consume nonces or the WebAuthn
        RP-ID to prevent cross-origin replays.
      </Callout>
    </SectionShell>
  );
}
