import { useEffect, useState } from "react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { parseEther, formatEther, erc20Abi } from "viem";
import { ArrowDownUp, PackageOpen, Sparkles, Rocket } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ritualChain } from "@/lib/ritual-chain";
import { cn } from "@/lib/utils";
import { TokenIcon } from "../token-select";
import { tokenBySymbol } from "@/lib/ritual-tokens";
import { getActiveWrap } from "@/lib/deployments";
import { WrappedRitual } from "@/lib/contracts";
import { useRitualTx } from "@/hooks/use-ritual-tx";

/**
 * Wrap card — RITUAL ↔ wRITUAL 1:1, real onchain when a WrappedRitual
 * contract is deployed via /deploy (persisted per-browser) or via
 * VITE_WRITUAL_ADDRESS.
 */
export function WrapCard() {
  const { address } = useAccount();
  const [wrapAddr, setWrapAddr] = useState<`0x${string}` | null>(() => getActiveWrap());
  useEffect(() => {
    const sync = () => setWrapAddr(getActiveWrap());
    window.addEventListener("ritual:wrap", sync);
    window.addEventListener("ritual:deployments", sync);
    return () => {
      window.removeEventListener("ritual:wrap", sync);
      window.removeEventListener("ritual:deployments", sync);
    };
  }, []);

  const { data: nativeBal } = useBalance({
    address,
    chainId: ritualChain.id,
    query: { enabled: !!address, refetchInterval: 8000 },
  });
  const { data: wBalRaw, refetch: refetchWBal } = useReadContract({
    address: wrapAddr ?? undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: ritualChain.id,
    query: { enabled: !!address && !!wrapAddr, refetchInterval: 8000 },
  });
  const wBal = (wBalRaw as bigint | undefined) ?? 0n;

  const [dir, setDir] = useState<"wrap" | "unwrap">("wrap");
  const [amount, setAmount] = useState("");

  const rit = tokenBySymbol("RITUAL");
  const writ = tokenBySymbol("wRITUAL");
  const from = dir === "wrap" ? rit : writ;
  const to = dir === "wrap" ? writ : rit;
  const isReal = !!wrapAddr;

  const fromBal =
    dir === "wrap"
      ? nativeBal
        ? Number(formatEther(nativeBal.value)).toFixed(4)
        : "0.0000"
      : Number(formatEther(wBal)).toFixed(4);

  const { send, state } = useRitualTx(dir === "wrap" ? "Wrap RITUAL" : "Unwrap wRITUAL");

  function setMax() {
    if (dir === "wrap" && nativeBal) {
      const usable = Number(formatEther(nativeBal.value)) - 0.001;
      setAmount(usable > 0 ? usable.toString() : "0");
    } else if (dir === "unwrap") {
      setAmount(formatEther(wBal));
    }
  }

  async function onSubmit() {
    if (!amount || !wrapAddr) return;
    const value = parseEther(amount);
    if (dir === "wrap") {
      await send(async (wc) =>
        (wc as unknown as { writeContract: (a: unknown) => Promise<`0x${string}`> }).writeContract({
          address: wrapAddr,
          abi: WrappedRitual.abi,
          functionName: "deposit",
          value,
          chain: ritualChain,
          account: (wc as unknown as { account: `0x${string}` }).account,
        }),
      );
    } else {
      await send(async (wc) =>
        (wc as unknown as { writeContract: (a: unknown) => Promise<`0x${string}`> }).writeContract({
          address: wrapAddr,
          abi: WrappedRitual.abi,
          functionName: "withdraw",
          args: [value],
          chain: ritualChain,
          account: (wc as unknown as { account: `0x${string}` }).account,
        }),
      );
    }
    refetchWBal();
  }

  const busy = state.status === "signing" || state.status === "pending";

  return (
    <div className="flex flex-col gap-3">
      {isReal ? (
        <div className="flex items-center gap-2 rounded-md border border-signal/30 bg-signal/5 px-3 py-2 text-[11px] text-signal">
          <PackageOpen className="size-3.5" />
          <span className="mono-tag text-signal">onchain</span>
          <span className="text-muted-foreground truncate">
            wRITUAL @ <span className="font-mono">{wrapAddr!.slice(0, 8)}…{wrapAddr!.slice(-4)}</span>
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-chart-4/30 bg-chart-4/5 px-3 py-2 text-[11px] text-chart-4">
          <PackageOpen className="size-3.5" />
          <span className="mono-tag text-chart-4 sim-badge">not deployed</span>
          <Link
            to="/deploy"
            className="ml-1 inline-flex items-center gap-1 text-signal hover:underline"
          >
            <Rocket className="size-3" /> deploy wRITUAL
          </Link>
        </div>
      )}

      <div className="rounded-lg border border-border bg-background/40 p-3">
        <div className="flex items-center justify-between mono-tag mb-2">
          <span>From</span>
          <button onClick={setMax} className="text-signal hover:underline">
            max · {fromBal}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="flex-1 bg-transparent text-2xl font-mono outline-none placeholder:text-muted-foreground/40"
          />
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5">
            <TokenIcon token={from} size={22} />
            <span className="font-medium text-sm">{from.symbol}</span>
          </div>
        </div>
      </div>

      <div className="relative flex justify-center -my-1 z-10">
        <button
          onClick={() => setDir((d) => (d === "wrap" ? "unwrap" : "wrap"))}
          className="grid place-items-center size-8 rounded-full border border-border bg-card hover:border-signal/40 hover:text-signal transition"
          aria-label="Flip direction"
        >
          <ArrowDownUp className="size-4" />
        </button>
      </div>

      <div className="rounded-lg border border-border bg-background/40 p-3">
        <div className="flex items-center justify-between mono-tag mb-2">
          <span>To (1:1)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 text-2xl font-mono text-foreground/80">
            {amount || "0.0"}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5">
            <TokenIcon token={to} size={22} />
            <span className="font-medium text-sm">{to.symbol}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={!amount || !address || !isReal || busy}
        className={cn(
          "w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition",
          amount && address && isReal && !busy
            ? "bg-signal text-signal-foreground hover:opacity-90"
            : "bg-muted/40 text-muted-foreground cursor-not-allowed",
        )}
      >
        <Sparkles className="size-4" />
        {!address
          ? "Connect wallet"
          : !isReal
            ? "Deploy wRITUAL to enable"
            : busy
              ? "Submitting…"
              : dir === "wrap"
                ? "Wrap RITUAL"
                : "Unwrap wRITUAL"}
      </button>
    </div>
  );
}
