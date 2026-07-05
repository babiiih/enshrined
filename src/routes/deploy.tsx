import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { parseEther, parseUnits } from "viem";
import { toast } from "sonner";
import { Coins, Image as ImageIcon, Store, ExternalLink, Rocket, Package, Repeat, Sparkles } from "lucide-react";
import { RitualToken, RitualNFT, RitualMarket, WrappedRitual, RitualFactory, RitualRouter, RitualStaking } from "@/lib/contracts";
import {
  saveDeployment,
  loadDeployments,
  setActiveMarket,
  getActiveMarket,
  setActiveWrap,
  getActiveWrap,
  setActiveFactory,
  getActiveFactory,
  setActiveRouter,
  getActiveRouter,
  setActiveStaking,
  getActiveStaking,
} from "@/lib/deployments";
import { RITUAL_EXPLORER, ritualChain } from "@/lib/ritual-chain";
import { CodeBlock } from "@/components/code-block";
import { NetworkGuard } from "@/components/network-guard";
import { AuthGuard } from "@/components/auth-guard";
import { DeploySkeleton } from "@/components/skeletons/deploy-skeleton";

export const Route = createFileRoute("/deploy")({
  head: () => ({
    meta: [
      { title: "Deploy · Ritual Chain" },
      { name: "description", content: "Deploy your own ERC-20 token, ERC-721 NFT collection, or Marketplace contract on Ritual testnet (chain 1979)." },
    ],
  }),
  component: () => (
    <AuthGuard title="Deploy contracts" skeleton={<DeploySkeleton />}>
      <DeployPage />
    </AuthGuard>
  ),
});

type Tab = "token" | "nft" | "market" | "wrap" | "dex" | "staking";

function DeployPage() {
  const [tab, setTab] = useState<Tab>("token");
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Onchain · testnet 1979</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Deploy on Ritual</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Kirim bytecode langsung ke Ritual testnet. Semua kontrak di bawah dikompilasi dari Solidity 0.8.24
          dan real onchain — bukan simulasi. Kamu butuh RITUAL testnet untuk gas.
        </p>
      </div>

      <div className="mb-4"><NetworkGuard /></div>



      <div className="flex gap-1 rounded-lg border border-border p-1 bg-card w-fit mb-6">
        {([
          ["token", "ERC-20 Token", Coins],
          ["nft", "NFT Collection", ImageIcon],
          ["market", "Marketplace", Store],
          ["wrap", "Wrapped RITUAL", Package],
          ["dex", "DEX (Factory + Router)", Repeat],
          ["staking", "Staking (xRITUAL)", Sparkles],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
              tab === id ? "bg-signal text-signal-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "token" && <TokenDeployer />}
      {tab === "nft" && <NFTDeployer />}
      {tab === "market" && <MarketDeployer />}
      {tab === "wrap" && <WrapDeployer />}
      {tab === "dex" && <DexDeployer />}
      {tab === "staking" && <StakingDeployer />}

      <RecentDeployments />
    </div>
  );
}

function StakingDeployer() {
  const { address, pub, wallet } = useDeployer();
  const [busy, setBusy] = useState(false);
  const [rateHuman, setRateHuman] = useState("0.001"); // RITUAL/sec drip from pot
  const [seed, setSeed] = useState("1"); // initial reward pot funded on deploy
  const active = typeof window !== "undefined" ? getActiveStaking() : null;

  async function deploy() {
    if (!wallet || !pub || !address) return toast.error("Connect wallet first");
    try {
      setBusy(true);
      const rate = parseEther(rateHuman || "0");
      const value = parseEther(seed || "0");
      const hash = await (wallet as unknown as { deployContract: (a: unknown) => Promise<`0x${string}`> }).deployContract({
        abi: RitualStaking.abi,
        bytecode: RitualStaking.bytecode,
        args: [rate],
        value,
      });
      const rec = await pub.waitForTransactionReceipt({ hash });
      if (!rec.contractAddress) throw new Error("no address");
      const addr = rec.contractAddress as `0x${string}`;
      saveDeployment({
        kind: "staking", address: addr, name: "Staked Ritual", symbol: "xRITUAL",
        rewardRate: rate.toString(),
        deployer: address, deployedAt: Date.now(), txHash: hash,
      });
      setActiveStaking(addr);
      toast.success(`Staking deployed & set active: ${addr.slice(0, 10)}…`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deploy failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div>
        <div className="mono-tag text-signal">ERC-4626-style liquid staking</div>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Deploy <span className="font-mono text-foreground">RitualStaking</span>: kirim RITUAL native
          ke <code className="font-mono text-foreground">deposit()</code> untuk mint{" "}
          <span className="font-mono">xRITUAL</span> shares. Reward pot dikuras linear (wei/sec) ke total
          assets sehingga <code className="font-mono">pricePerShare</code> naik. Unbond instan lewat{" "}
          <code className="font-mono text-foreground">withdraw(shares, receiver)</code>.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Reward rate (RITUAL / sec)" value={rateHuman} onChange={setRateHuman} placeholder="0.001" />
        <Field label="Initial reward pot (RITUAL)" value={seed} onChange={setSeed} placeholder="1" />
      </div>
      {active && (
        <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
          <span className="text-muted-foreground">Active staking:</span>{" "}
          <a href={`${RITUAL_EXPLORER}/address/${active}`} target="_blank" rel="noreferrer" className="font-mono text-signal hover:underline">
            {active}
          </a>
        </div>
      )}
      <button
        onClick={deploy}
        disabled={busy || !address}
        className="inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground disabled:opacity-50"
      >
        <Rocket className="size-4" />
        {busy ? "Deploying…" : address ? "Deploy Staking Vault" : "Connect wallet"}
      </button>
      <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
        Sesudah aktif, buka <a href="/swap" className="text-signal hover:underline">/swap → Stake</a>{" "}
        untuk stake/unstake real onchain. Kirim RITUAL tambahan ke alamat kontrak (atau panggil{" "}
        <code className="font-mono">fundRewards</code>) untuk nambah reward pot.
      </div>
    </div>
  );
}

function DexDeployer() {
  const { address, pub, wallet } = useDeployer();
  const [busyF, setBusyF] = useState(false);
  const [busyR, setBusyR] = useState(false);
  const [factory, setFactory] = useState<`0x${string}` | null>(() =>
    typeof window !== "undefined" ? getActiveFactory() : null,
  );
  const [router, setRouter] = useState<`0x${string}` | null>(() =>
    typeof window !== "undefined" ? getActiveRouter() : null,
  );
  const wrap = typeof window !== "undefined" ? getActiveWrap() : null;

  async function deployFactory() {
    if (!wallet || !pub || !address) return toast.error("Connect wallet first");
    try {
      setBusyF(true);
      const hash = await (wallet as unknown as { deployContract: (a: unknown) => Promise<`0x${string}`> }).deployContract({
        abi: RitualFactory.abi,
        bytecode: RitualFactory.bytecode,
        args: [],
      });
      const rec = await pub.waitForTransactionReceipt({ hash });
      if (!rec.contractAddress) throw new Error("no address");
      const addr = rec.contractAddress as `0x${string}`;
      saveDeployment({ kind: "factory", address: addr, deployer: address, deployedAt: Date.now(), txHash: hash });
      setActiveFactory(addr);
      setFactory(addr);
      toast.success(`Factory deployed: ${addr.slice(0, 10)}…`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deploy failed");
    } finally {
      setBusyF(false);
    }
  }

  async function deployRouter() {
    if (!wallet || !pub || !address) return toast.error("Connect wallet first");
    if (!factory) return toast.error("Deploy factory first");
    if (!wrap) return toast.error("Deploy wRITUAL first (Wrap tab)");
    try {
      setBusyR(true);
      const hash = await (wallet as unknown as { deployContract: (a: unknown) => Promise<`0x${string}`> }).deployContract({
        abi: RitualRouter.abi,
        bytecode: RitualRouter.bytecode,
        args: [factory, wrap],
      });
      const rec = await pub.waitForTransactionReceipt({ hash });
      if (!rec.contractAddress) throw new Error("no address");
      const addr = rec.contractAddress as `0x${string}`;
      saveDeployment({ kind: "router", address: addr, deployer: address, deployedAt: Date.now(), txHash: hash });
      setActiveRouter(addr);
      setRouter(addr);
      toast.success(`Router deployed: ${addr.slice(0, 10)}…`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deploy failed");
    } finally {
      setBusyR(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div>
        <div className="mono-tag text-signal">Uniswap V2-style DEX</div>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
          Deploy <span className="font-mono text-foreground">RitualFactory</span> (mints{" "}
          <span className="font-mono">RitualPair</span> LP tokens) dan{" "}
          <span className="font-mono text-foreground">RitualRouter</span> (add/remove liquidity + swap,
          fee 0.30%). Router butuh <span className="font-mono">wRITUAL</span> address — deploy dulu di tab Wrap.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatusPill label="wRITUAL" value={wrap} />
        <StatusPill label="Factory" value={factory} />
        <StatusPill label="Router" value={router} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={deployFactory}
          disabled={busyF || !address}
          className="inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground disabled:opacity-50"
        >
          <Rocket className="size-4" />
          {busyF ? "Deploying…" : factory ? "Redeploy Factory" : "1. Deploy Factory"}
        </button>
        <button
          onClick={deployRouter}
          disabled={busyR || !address || !factory || !wrap}
          className="inline-flex items-center gap-2 rounded-md border border-signal/60 px-4 py-2 text-sm font-medium text-signal disabled:opacity-40"
        >
          <Rocket className="size-4" />
          {busyR ? "Deploying…" : router ? "Redeploy Router" : "2. Deploy Router"}
        </button>
      </div>

      <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
        Setelah factory + router siap, buat pair &amp; add liquidity di{" "}
        <a href="/swap" className="text-signal hover:underline">/swap → Liquidity</a>. Semua pair terbuka
        muncul di <a href="/pools" className="text-signal hover:underline">/pools</a>.
      </div>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: `0x${string}` | null }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <div className="mono-tag text-muted-foreground mb-1">{label}</div>
      {value ? (
        <a
          href={`${RITUAL_EXPLORER}/address/${value}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-signal hover:underline break-all"
        >
          {value.slice(0, 10)}…{value.slice(-6)}
        </a>
      ) : (
        <span className="text-xs text-chart-4">not deployed</span>
      )}
    </div>
  );
}

function WrapDeployer() {
  const { address, pub, wallet } = useDeployer();
  const [busy, setBusy] = useState(false);
  const active = typeof window !== "undefined" ? getActiveWrap() : null;

  async function deploy() {
    if (!wallet || !pub || !address) return toast.error("Connect wallet first");
    try {
      setBusy(true);
      const hash = await (wallet as unknown as { deployContract: (a: unknown) => Promise<`0x${string}`> }).deployContract({
        abi: WrappedRitual.abi,
        bytecode: WrappedRitual.bytecode,
        args: [],
      });
      const rec = await pub.waitForTransactionReceipt({ hash });
      if (!rec.contractAddress) throw new Error("no address");
      const addr = rec.contractAddress as `0x${string}`;
      saveDeployment({
        kind: "wrapped", address: addr, name: "Wrapped Ritual", symbol: "wRITUAL",
        deployer: address, deployedAt: Date.now(), txHash: hash,
      });
      setActiveWrap(addr);
      toast.success(`wRITUAL deployed & set active: ${addr.slice(0, 10)}…`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deploy failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">
        Deploy WETH9-style <span className="font-mono text-foreground">wRITUAL</span>: kirim RITUAL
        native ke <code className="font-mono text-foreground">deposit()</code> untuk mint 1:1 wRITUAL,{" "}
        <code className="font-mono text-foreground">withdraw(amount)</code> untuk unwrap. Alamat
        disimpan sebagai active wrap dan otomatis dipakai oleh <a href="/swap" className="text-signal hover:underline">/swap</a> tab Wrap.
      </p>
      {active && (
        <div className="mt-3 rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
          <span className="text-muted-foreground">Active wrap:</span>{" "}
          <a href={`${RITUAL_EXPLORER}/address/${active}`} target="_blank" rel="noreferrer" className="font-mono text-signal hover:underline">
            {active}
          </a>
        </div>
      )}
      <button
        onClick={deploy}
        disabled={busy || !address}
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground disabled:opacity-50"
      >
        <Rocket className="size-4" />
        {busy ? "Deploying…" : address ? "Deploy wRITUAL" : "Connect wallet"}
      </button>
    </div>
  );
}

function useDeployer() {
  const { address } = useAccount();
  const pub = usePublicClient({ chainId: ritualChain.id });
  const { data: wallet } = useWalletClient({ chainId: ritualChain.id });
  return { address, pub, wallet };
}

function TokenDeployer() {
  const { address, pub, wallet } = useDeployer();
  const [name, setName] = useState("Ritual Test Token");
  const [symbol, setSymbol] = useState("RTT");
  const [supply, setSupply] = useState("1000000");
  const [busy, setBusy] = useState(false);

  async function deploy() {
    if (!wallet || !pub || !address) return toast.error("Connect wallet first");
    try {
      setBusy(true);
      const hash = await (wallet as any).deployContract({
        abi: RitualToken.abi as never,
        bytecode: RitualToken.bytecode,
        args: [name, symbol, BigInt(supply)],
      });
      toast.info("Deploying...", { description: hash.slice(0, 10) + "…" });
      const rec = await pub.waitForTransactionReceipt({ hash });
      if (!rec.contractAddress) throw new Error("no address");
      saveDeployment({
        kind: "token", address: rec.contractAddress as `0x${string}`,
        name, symbol, supply, deployer: address, deployedAt: Date.now(), txHash: hash,
      });
      toast.success(`Token deployed: ${rec.contractAddress.slice(0, 10)}…`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deploy failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" value={name} onChange={setName} placeholder="Ritual Test Token" />
        <Field label="Symbol" value={symbol} onChange={setSymbol} placeholder="RTT" />
        <Field label="Total supply (whole units)" value={supply} onChange={setSupply} placeholder="1000000" />
        <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
          Decimals fixed at <span className="font-mono text-foreground">18</span>. Semua supply awal
          dikirim ke wallet kamu.
        </div>
      </div>
      <button
        onClick={deploy}
        disabled={busy || !address}
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground disabled:opacity-50"
      >
        <Rocket className="size-4" />
        {busy ? "Deploying…" : address ? "Deploy Token" : "Connect wallet"}
      </button>
    </div>
  );
}

function NFTDeployer() {
  const { address, pub, wallet } = useDeployer();
  const [name, setName] = useState("Ritual Cats");
  const [symbol, setSymbol] = useState("RCAT");
  const [baseURI, setBaseURI] = useState("ipfs://bafy.../");
  const [price, setPrice] = useState("0");
  const [busy, setBusy] = useState(false);

  async function deploy() {
    if (!wallet || !pub || !address) return toast.error("Connect wallet first");
    try {
      setBusy(true);
      const hash = await (wallet as any).deployContract({
        abi: RitualNFT.abi as any,
        bytecode: RitualNFT.bytecode,
        args: [name, symbol, baseURI, parseEther(price || "0")],
      });
      toast.info("Deploying...", { description: hash.slice(0, 10) + "…" });
      const rec = await pub.waitForTransactionReceipt({ hash });
      if (!rec.contractAddress) throw new Error("no address");
      saveDeployment({
        kind: "nft", address: rec.contractAddress as `0x${string}`,
        name, symbol, baseURI, mintPrice: price,
        deployer: address, deployedAt: Date.now(), txHash: hash,
      });
      toast.success(`NFT deployed: ${rec.contractAddress.slice(0, 10)}…`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deploy failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Collection name" value={name} onChange={setName} />
        <Field label="Symbol" value={symbol} onChange={setSymbol} />
        <Field label="Base URI (metadata)" value={baseURI} onChange={setBaseURI} placeholder="ipfs://.../ atau https://.../" />
        <Field label="Mint price (RITUAL)" value={price} onChange={setPrice} placeholder="0" />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        <code className="font-mono text-foreground">tokenURI(id)</code> = <code className="font-mono">baseURI + id</code>.
        Kamu bisa host metadata di IPFS / bucket biasa. Setiap mint bayar <span className="font-mono">mintPrice</span>,
        seluruhnya masuk ke owner (kamu).
      </p>
      <button
        onClick={deploy}
        disabled={busy || !address}
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground disabled:opacity-50"
      >
        <Rocket className="size-4" />
        {busy ? "Deploying…" : address ? "Deploy Collection" : "Connect wallet"}
      </button>
    </div>
  );
}

function MarketDeployer() {
  const { address, pub, wallet } = useDeployer();
  const [busy, setBusy] = useState(false);
  const active = typeof window !== "undefined" ? getActiveMarket() : null;

  async function deploy() {
    if (!wallet || !pub || !address) return toast.error("Connect wallet first");
    try {
      setBusy(true);
      const hash = await (wallet as any).deployContract({
        abi: RitualMarket.abi as any,
        bytecode: RitualMarket.bytecode,
        args: [],
      });
      const rec = await pub.waitForTransactionReceipt({ hash });
      if (!rec.contractAddress) throw new Error("no address");
      const addr = rec.contractAddress as `0x${string}`;
      saveDeployment({ kind: "market", address: addr, deployer: address, deployedAt: Date.now(), txHash: hash });
      setActiveMarket(addr);
      toast.success(`Marketplace deployed & set active: ${addr.slice(0, 10)}…`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Deploy failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">
        Kontrak marketplace mini bergaya OpenSea: <code className="font-mono text-foreground">list</code>,
        <code className="font-mono text-foreground"> cancel</code>,
        <code className="font-mono text-foreground"> buy</code>. Fee protokol 1% masuk ke deployer.
        Setelah deploy, alamat marketplace disimpan sebagai <em>active market</em> untuk halaman{" "}
        <a href="/marketplace" className="text-signal hover:underline">/marketplace</a>.
      </p>
      {active && (
        <div className="mt-3 rounded-md border border-border/60 bg-muted/20 p-3 text-xs">
          <span className="text-muted-foreground">Active market:</span>{" "}
          <a href={`${RITUAL_EXPLORER}/address/${active}`} target="_blank" rel="noreferrer" className="font-mono text-signal hover:underline">
            {active}
          </a>
        </div>
      )}
      <button
        onClick={deploy}
        disabled={busy || !address}
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground disabled:opacity-50"
      >
        <Rocket className="size-4" />
        {busy ? "Deploying…" : address ? "Deploy Marketplace" : "Connect wallet"}
      </button>

      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">Lihat ABI singkat</summary>
        <CodeBlock
          snippets={[{
            lang: "solidity", label: "market.sol",
            code: `function list(address nft, uint256 id, uint256 price) external;
function cancel(address nft, uint256 id) external;
function buy(address nft, uint256 id) external payable;
function listings(address nft, uint256 id) view returns (address seller, uint256 price);`,
          }]}
        />
      </details>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-signal font-mono"
      />
    </label>
  );
}

function RecentDeployments() {
  const items = typeof window !== "undefined" ? loadDeployments() : [];
  if (!items.length) return null;
  return (
    <div className="mt-10">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Recent deployments (local)</div>
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {items.slice(0, 8).map((d) => (
          <div key={d.address} className="flex items-center gap-3 px-4 py-3 text-sm">
            <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-muted/40 text-muted-foreground">
              {d.kind}
            </span>
            <span className="font-medium">
              {d.kind === "market" ? "Marketplace" : `${(d as { name: string }).name} (${(d as { symbol: string }).symbol})`}
            </span>
            <a href={`${RITUAL_EXPLORER}/address/${d.address}`} target="_blank" rel="noreferrer"
               className="ml-auto inline-flex items-center gap-1 font-mono text-xs text-signal hover:underline">
              {d.address.slice(0, 10)}…{d.address.slice(-6)}
              <ExternalLink className="size-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

// keep parseUnits import used
void parseUnits;
