import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { formatEther, parseEther } from "viem";
import { toast } from "sonner";
import { z } from "zod";
import { Store, Tag, ShoppingCart, X, ExternalLink, ImageOff } from "lucide-react";
import { RitualNFT, RitualMarket } from "@/lib/contracts";
import {
  getActiveMarket,
  setActiveMarket,
  loadDeployments,
  addListingHint,
  loadListingHints,
  type DeployedNFT,
} from "@/lib/deployments";
import { RITUAL_EXPLORER, ritualChain } from "@/lib/ritual-chain";
import { NetworkGuard } from "@/components/network-guard";
import { AuthGuard } from "@/components/auth-guard";
import { PoolsSkeleton } from "@/components/skeletons/pools-skeleton";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace · Ritual Chain" },
      { name: "description", content: "OpenSea-style NFT marketplace on Ritual testnet (chain 1979). List, buy, cancel — real on-chain." },
    ],
  }),
  component: () => (
    <AuthGuard title="Marketplace" skeleton={<PoolsSkeleton />}>
      <Marketplace />
    </AuthGuard>
  ),
});

const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/u, { message: "Address harus format 0x… (40 hex)" });
const tokenIdSchema = z
  .string()
  .regex(/^\d+$/u, { message: "Token ID harus angka positif" })
  .refine((v) => BigInt(v) >= 0n, { message: "Token ID tidak valid" });
const priceSchema = z
  .string()
  .regex(/^\d+(\.\d{1,18})?$/u, { message: "Price harus desimal (mis. 0.1)" })
  .refine((v) => Number(v) > 0, { message: "Price harus > 0" });

type ListingRow = {
  nft: `0x${string}`;
  tokenId: bigint;
  seller: `0x${string}`;
  price: bigint;
  collectionName?: string;
  tokenURI?: string;
};

function Marketplace() {
  const [market, setMarket] = useState<`0x${string}` | null>(null);
  const [manualAddr, setManualAddr] = useState("");
  const [tab, setTab] = useState<"browse" | "sell">("browse");

  useEffect(() => {
    setMarket(getActiveMarket());
    const h = () => setMarket(getActiveMarket());
    window.addEventListener("ritual:market", h);
    return () => window.removeEventListener("ritual:market", h);
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Onchain · testnet 1979</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight flex items-center gap-3">
            <Store className="size-7 text-signal" /> Ritual Marketplace
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            NFT marketplace ala OpenSea di jaringan Ritual. List NFT, cancel, atau beli — semuanya real onchain.
            Fee protokol 1% untuk deployer marketplace.
          </p>
          <div className="mt-4"><NetworkGuard /></div>
        </div>
        {market ? (
          <div className="rounded-md border border-border bg-card p-3 text-xs">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Active market</div>
            <a href={`${RITUAL_EXPLORER}/address/${market}`} target="_blank" rel="noreferrer"
               className="font-mono text-signal hover:underline">
              {market.slice(0, 10)}…{market.slice(-6)}
            </a>
          </div>
        ) : null}
      </div>

      {!market ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <Store className="mx-auto size-10 text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold">Belum ada marketplace aktif</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Deploy marketplace kamu sendiri, atau tempel alamat marketplace yang sudah ada.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Link to="/deploy" className="inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground">
              Deploy marketplace
            </Link>
            <div className="flex items-center gap-2">
              <input
                value={manualAddr}
                onChange={(e) => setManualAddr(e.target.value)}
                placeholder="0x… alamat market"
                className="w-72 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-signal"
              />
              <button
                onClick={() => {
                  if (/^0x[a-fA-F0-9]{40}$/.test(manualAddr)) {
                    setActiveMarket(manualAddr as `0x${string}`);
                  } else toast.error("Address tidak valid");
                }}
                className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/40"
              >
                Gunakan
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-1 rounded-lg border border-border p-1 bg-card w-fit mb-6">
            <TabBtn active={tab === "browse"} onClick={() => setTab("browse")} icon={ShoppingCart}>Browse</TabBtn>
            <TabBtn active={tab === "sell"} onClick={() => setTab("sell")} icon={Tag}>Sell</TabBtn>
          </div>
          {tab === "browse" ? <BrowseTab market={market} /> : <SellTab market={market} />}
        </>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition ${
      active ? "bg-signal text-signal-foreground" : "text-muted-foreground hover:text-foreground"
    }`}>
      <Icon className="size-4" />{children}
    </button>
  );
}

function BrowseTab({ market }: { market: `0x${string}` }) {
  const pub = usePublicClient({ chainId: ritualChain.id });
  const { address } = useAccount();
  const { data: wallet } = useWalletClient({ chainId: ritualChain.id });
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    if (!pub) return;
    let live = true;
    const load = async () => {
      setLoading(true);
      const hints = loadListingHints(market);
      const out: ListingRow[] = [];
      for (const h of hints) {
        try {
          const res = (await pub.readContract({
            address: market, abi: RitualMarket.abi as any,
            functionName: "listings", args: [h.nft, BigInt(h.tokenId)],
          })) as [`0x${string}`, bigint];
          if (res && res[1] > 0n) {
            let colName: string | undefined;
            let uri: string | undefined;
            try {
              colName = (await pub.readContract({ address: h.nft, abi: RitualNFT.abi as never, functionName: "name" })) as string;
            } catch { /* ignore */ }
            try {
              uri = (await pub.readContract({ address: h.nft, abi: RitualNFT.abi as never, functionName: "tokenURI", args: [BigInt(h.tokenId)] })) as string;
            } catch { /* ignore */ }
            out.push({ nft: h.nft, tokenId: BigInt(h.tokenId), seller: res[0], price: res[1], collectionName: colName, tokenURI: uri });
          }
        } catch { /* ignore */ }
      }
      if (live) { setRows(out); setLoading(false); }
    };
    load();
    const h = () => load();
    window.addEventListener("ritual:listings", h);
    return () => { live = false; window.removeEventListener("ritual:listings", h); };
  }, [pub, market]);

  async function buy(r: ListingRow) {
    if (!wallet || !pub) return toast.error("Connect wallet");
    try {
      setBuying(`${r.nft}-${r.tokenId}`);
      const hash = await (wallet as any).writeContract({
        address: market, abi: RitualMarket.abi as any,
        functionName: "buy", args: [r.nft, r.tokenId], value: r.price,
      });
      toast.info("Buying…", { description: hash.slice(0, 12) + "…" });
      await pub.waitForTransactionReceipt({ hash });
      toast.success("Purchased!");
      setRows((rs) => rs.filter((x) => !(x.nft === r.nft && x.tokenId === r.tokenId)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Buy failed");
    } finally {
      setBuying(null);
    }
  }

  if (loading) return <div className="text-sm text-muted-foreground">Loading listings…</div>;
  if (!rows.length) return (
    <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
      Belum ada listing yang di-track UI ini. Buka tab <strong className="text-foreground">Sell</strong> untuk list-kan NFT kamu.
    </div>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => {
        const key = `${r.nft}-${r.tokenId}`;
        return (
          <div key={key} className="rounded-xl border border-border bg-card overflow-hidden group hover:border-signal/60 transition">
            <NFTImage uri={r.tokenURI} />
            <div className="p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {r.collectionName ?? "Collection"} · #{r.tokenId.toString()}
              </div>
              <div className="mt-1 font-semibold">{formatEther(r.price)} RITUAL</div>
              <div className="mt-1 text-xs text-muted-foreground truncate">seller {r.seller.slice(0, 8)}…</div>
              <button
                onClick={() => buy(r)}
                disabled={buying === key || !address || r.seller.toLowerCase() === address?.toLowerCase()}
                className="mt-3 w-full rounded-md bg-signal py-2 text-sm font-medium text-signal-foreground disabled:opacity-40"
              >
                {r.seller.toLowerCase() === address?.toLowerCase() ? "Punyamu" : buying === key ? "Buying…" : "Buy"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NFTImage({ uri }: { uri?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!uri) return;
    const httpUri = uri.replace(/^ipfs:\/\//, "https://ipfs.io/ipfs/");
    fetch(httpUri).then((r) => r.json()).then((j) => {
      const img = (j.image as string | undefined) ?? (j.image_url as string | undefined);
      if (img) setSrc(img.replace(/^ipfs:\/\//, "https://ipfs.io/ipfs/"));
    }).catch(() => {});
  }, [uri]);
  return (
    <div className="aspect-square bg-muted/20 flex items-center justify-center">
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <ImageOff className="size-10 text-muted-foreground" />}
    </div>
  );
}

function SellTab({ market }: { market: `0x${string}` }) {
  const { address } = useAccount();
  const pub = usePublicClient({ chainId: ritualChain.id });
  const { data: wallet } = useWalletClient({ chainId: ritualChain.id });
  const [nftAddr, setNftAddr] = useState<string>("");
  const [tokenId, setTokenId] = useState("1");
  const [price, setPrice] = useState("0.1");
  const [busy, setBusy] = useState(false);
  const [myCancels, setMyCancels] = useState(0);

  const myNFTs = typeof window !== "undefined"
    ? (loadDeployments().filter((d) => d.kind === "nft") as DeployedNFT[])
    : [];

  async function list() {
    if (!wallet || !pub || !address) return toast.error("Connect wallet");
    const addr = addressSchema.safeParse(nftAddr);
    const tid = tokenIdSchema.safeParse(tokenId);
    const prc = priceSchema.safeParse(price);
    const err = addr.error?.issues[0] ?? tid.error?.issues[0] ?? prc.error?.issues[0];
    if (err) return toast.error(err.message);
    try {
      setBusy(true);
      // approve first
      const approved = (await pub.readContract({
        address: addr.data as `0x${string}`, abi: RitualNFT.abi as any,
        functionName: "getApproved", args: [BigInt(tid.data!)],
      })) as `0x${string}`;
      if (approved.toLowerCase() !== market.toLowerCase()) {
        toast.info("Approving marketplace…");
        const ah = await (wallet as any).writeContract({
          address: addr.data as `0x${string}`, abi: RitualNFT.abi as any,
          functionName: "approve", args: [market, BigInt(tid.data!)],
        });
        await pub.waitForTransactionReceipt({ hash: ah });
      }
      const hash = await (wallet as any).writeContract({
        address: market, abi: RitualMarket.abi as any,
        functionName: "list", args: [addr.data as `0x${string}`, BigInt(tid.data!), parseEther(prc.data!)],
      });
      await pub.waitForTransactionReceipt({ hash });
      addListingHint(market, { nft: addr.data as `0x${string}`, tokenId: tid.data! });
      toast.success("Listed!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "List failed");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!wallet || !pub || !address) return toast.error("Connect wallet");
    const addr = addressSchema.safeParse(nftAddr);
    const tid = tokenIdSchema.safeParse(tokenId);
    const err = addr.error?.issues[0] ?? tid.error?.issues[0];
    if (err) return toast.error(err.message);
    try {
      setBusy(true);
      const hash = await (wallet as any).writeContract({
        address: market, abi: RitualMarket.abi as any,
        functionName: "cancel", args: [addr.data as `0x${string}`, BigInt(tid.data!)],
      });
      await pub.waitForTransactionReceipt({ hash });
      toast.success("Cancelled");
      setMyCancels((n) => n + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cancel failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block sm:col-span-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">NFT contract</div>
          <input
            value={nftAddr}
            onChange={(e) => setNftAddr(e.target.value)}
            placeholder="0x…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-signal font-mono"
          />
          {myNFTs.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="text-[10px] text-muted-foreground self-center mr-1">Punyamu:</span>
              {myNFTs.slice(0, 5).map((n) => (
                <button key={n.address} onClick={() => setNftAddr(n.address)}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted/40 hover:bg-signal/20 hover:text-signal">
                  {n.symbol} {n.address.slice(0, 6)}…
                </button>
              ))}
            </div>
          )}
        </label>
        <label className="block">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Token ID</div>
          <input value={tokenId} onChange={(e) => setTokenId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-signal font-mono" />
        </label>
        <label className="block sm:col-span-2">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Price (RITUAL)</div>
          <input value={price} onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-signal font-mono" />
        </label>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={list} disabled={busy || !address}
          className="inline-flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground disabled:opacity-50">
          <Tag className="size-4" />{busy ? "…" : "List for sale"}
        </button>
        <button onClick={cancel} disabled={busy || !address}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted/40 disabled:opacity-50">
          <X className="size-4" />Cancel listing
        </button>
        <div className="ml-auto text-xs text-muted-foreground self-center">
          Approvals otomatis · fee protokol 1%
        </div>
      </div>
      {myCancels > 0 && <div className="sr-only">{myCancels}</div>}
    </div>
  );
}

void ExternalLink;
