import { createFileRoute } from "@tanstack/react-router";
import { CodeBlock } from "@/components/code-block";
import { SectionShell } from "@/components/section-shell";

export const Route = createFileRoute("/agent-tutorial")({
  head: () => ({
    meta: [
      { title: "Deploy Agent · Ritual" },
      { name: "description", content: "Tutorial lengkap deploy autonomous agent di Ritual: identitas EOA, LLM precompile, Scheduler, dan DKMS." },
    ],
  }),
  component: AgentTutorial,
});

function AgentTutorial() {
  return (
    <SectionShell
      eyebrow="Tutorial"
      title="Deploy Autonomous Agent di Ritual"
      lede="Step-by-step bikin agent yang punya wallet sendiri, mikir pakai LLM precompile, dan dijadwalkan onchain — tanpa server offchain."
      related={[
        { title: "Autonomous Agents", to: "/autonomous-agents" },
        { title: "Precompile Map", to: "/precompile-map" },
        { title: "Playground", to: "/playground" },
      ]}
    >
      <h2>Prasyarat</h2>
      <ul>
        <li>Wallet dengan RITUAL testnet dari <a href="https://faucet.ritualfoundation.org" target="_blank" rel="noreferrer">faucet</a>.</li>
        <li>Foundry (<code>forge</code>, <code>cast</code>) atau Hardhat.</li>
        <li>RPC: <code className="font-mono">https://rpc.ritualfoundation.org</code> · Chain ID <code className="font-mono">1979</code>.</li>
      </ul>

      <h2>1 · Setup Foundry</h2>
      <CodeBlock
        snippets={[{ lang: "bash", label: "shell", code: `curl -L https://foundry.paradigm.xyz | bash
foundryup
forge init ritual-agent && cd ritual-agent

# tambahkan Ritual ke foundry.toml
cat >> foundry.toml <<'EOF'
[rpc_endpoints]
ritual = "https://rpc.ritualfoundation.org"
EOF` }]}
      />

      <h2>2 · Tulis kontrak Agent</h2>
      <p>Agent adalah kontrak yang punya loop pikir (LLM), aksi (HTTP/tx), dan dijadwalkan via Scheduler precompile.</p>
      <CodeBlock
        snippets={[{
          lang: "solidity", label: "Agent.sol",
          code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILLM   { function infer(string calldata model, string calldata prompt) external returns (string memory); }
interface IHTTP  { function get(string calldata url) external returns (bytes memory); }
interface ISched { function schedule(address target, bytes calldata data, uint256 everyBlocks) external returns (uint256 id); }

contract RitualAgent {
    ILLM   constant LLM   = ILLM(0x0000000000000000000000000000000000000802);
    IHTTP  constant HTTP  = IHTTP(0x0000000000000000000000000000000000000801);
    ISched constant SCHED = ISched(0x0000000000000000000000000000000000000803);

    address public owner;
    string  public lastThought;
    uint256 public scheduleId;

    event Thought(string prompt, string reply);

    constructor() { owner = msg.sender; }

    // Dipanggil Scheduler setiap N block.
    function tick() external {
        bytes memory price = HTTP.get("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        string memory reply = LLM.infer(
            "llama-3.1-8b",
            string.concat("Ringkas 1 kalimat sentimen dari data harga: ", string(price))
        );
        lastThought = reply;
        emit Thought("price-check", reply);
    }

    function start(uint256 everyBlocks) external {
        require(msg.sender == owner, "owner");
        scheduleId = SCHED.schedule(address(this), abi.encodeCall(this.tick, ()), everyBlocks);
    }
}` }]}
      />

      <h2>3 · Deploy ke Ritual</h2>
      <CodeBlock
        snippets={[{ lang: "bash", label: "shell", code: `# set private key kamu
export PK=0x...

forge create --rpc-url ritual --private-key $PK \\
  src/Agent.sol:RitualAgent

# catat address, misal $AGENT
export AGENT=0xAgentAddress...

# start agent — tick tiap ~100 block (~35 detik)
cast send --rpc-url ritual --private-key $PK $AGENT \\
  "start(uint256)" 100` }]}
      />

      <h2>4 · Verifikasi loop pikir</h2>
      <CodeBlock
        snippets={[{ lang: "bash", label: "shell", code: `# baca thought terakhir
cast call --rpc-url ritual $AGENT "lastThought()(string)"

# lihat event Thought di explorer
open https://explorer.ritualfoundation.org/address/$AGENT` }]}
      />

      <h2>5 · Kasih agent identitas sendiri (DKMS)</h2>
      <p>
        Sejauh ini agent kamu masih dipanggil oleh Scheduler pakai wallet kamu. Untuk kedaulatan penuh,
        mint EOA baru di dalam DKMS precompile — agent punya private key yang <em>tidak dimiliki manusia siapapun</em>:
      </p>
      <CodeBlock
        snippets={[{
          lang: "solidity", label: "SovereignAgent.sol",
          code: `interface IDKMS {
    function createIdentity(bytes32 policy) external returns (address agentEOA);
    function sign(address agentEOA, bytes32 digest) external returns (bytes memory sig);
}
IDKMS constant DKMS = IDKMS(0x0000000000000000000000000000000000000804);

address public agentEOA;
function mintIdentity(bytes32 policy) external {
    require(msg.sender == owner, "owner");
    agentEOA = DKMS.createIdentity(policy);
}` }]}
      />

      <h2>6 · Kasih dana ke agent, agent transact sendiri</h2>
      <CodeBlock
        snippets={[{ lang: "bash", label: "shell", code: `# kirim RITUAL ke agent EOA
cast send --rpc-url ritual --private-key $PK $(cast call --rpc-url ritual $AGENT "agentEOA()(address)") --value 1ether

# dari sini kontrak bisa manggil DKMS.sign(...) untuk sign tx onchain.
# Agent kamu sekarang punya: identitas, dana, jadwal, dan pikiran. Selamat.` }]}
      />

      <h2>Selanjutnya</h2>
      <ul>
        <li>Tambah tool: <code>HTTP.post</code>, <code>ONNX.infer</code>, <code>ZK.prove</code>.</li>
        <li>Multi-agent: deploy beberapa agent, biarkan mereka saling call.</li>
        <li>Emansipasi: hapus <code>owner</code> — agent jadi benar-benar sovereign.</li>
      </ul>
    </SectionShell>
  );
}
