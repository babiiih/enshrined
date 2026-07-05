import { useEffect, useState } from "react";
import { useAccount, useBalance, useSendTransaction, useWriteContract, useReadContract } from "wagmi";
import { parseEther, formatEther, encodeFunctionData } from "viem";
import { toast } from "sonner";
import { ArrowRight, ExternalLink, Info, Sparkles } from "lucide-react";
import { ritualChain, RITUAL_EXPLORER } from "@/lib/ritual-chain";
import { STAKING_ABI, STAKING_DEMO, computeAprBps } from "@/lib/staking";
import { getActiveStaking } from "@/lib/deployments";
import { cn } from "@/lib/utils";
import { CatMascot } from "../cat-mascot";

/**
 * Stake card — real onchain when a RitualStaking vault is active (deployed
 * via /deploy → Staking, or via VITE_XRITUAL_ADDRESS). Otherwise falls back
 * to a demo panel.
 */
export function StakeCard() {
  const { address } = useAccount();
  const [stakingAddr, setStakingAddr] = useState<`0x${string}` | null>(() =>
    typeof window !== "undefined" ? getActiveStaking() : null,
  );
  useEffect(() => {
    const on = () => setStakingAddr(getActiveStaking());
    window.addEventListener("ritual:staking", on);
    return () => window.removeEventListener("ritual:staking", on);
  }, []);

  const { data: nativeBal } = useBalance({
    address,
    chainId: ritualChain.id,
    query: { enabled: !!address, refetchInterval: 8000 },
  });
  const { data: xBalRaw } = useReadContract({
    address: stakingAddr ?? undefined,
    abi: STAKING_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: ritualChain.id,
    query: { enabled: !!address && !!stakingAddr, refetchInterval: 8000 },
  });
  const { data: totalAssets } = useReadContract({
    address: stakingAddr ?? undefined,
    abi: STAKING_ABI,
    functionName: "previewTotalAssets",
    chainId: ritualChain.id,
    query: { enabled: !!stakingAddr, refetchInterval: 8000 },
  });
  const { data: totalShares } = useReadContract({
    address: stakingAddr ?? undefined,
    abi: STAKING_ABI,
    functionName: "totalShares",
    chainId: ritualChain.id,
    query: { enabled: !!stakingAddr, refetchInterval: 8000 },
  });
  const { data: rewardRate } = useReadContract({
    address: stakingAddr ?? undefined,
    abi: STAKING_ABI,
    functionName: "rewardRate",
    chainId: ritualChain.id,
    query: { enabled: !!stakingAddr, refetchInterval: 15000 },
  });
  const xBal = xBalRaw ? { value: xBalRaw as bigint } : undefined;

  const { sendTransactionAsync, isPending: sendPending } = useSendTransaction();
  const { writeContractAsync, isPending: writePending } = useWriteContract();

  const [mode, setMode] = useState<"stake" | "unstake">("stake");
  const [amount, setAmount] = useState("");
  const bal = mode === "stake" ? nativeBal : xBal;
  const balNum = bal ? Number(formatEther(bal.value)) : 0;

  const isReal = !!stakingAddr;
  const busy = sendPending || writePending;

  // Live metrics
  const tAssets = (totalAssets as bigint | undefined) ?? 0n;
  const tShares = (totalShares as bigint | undefined) ?? 0n;
  const rRate = (rewardRate as bigint | undefined) ?? 0n;
  const aprBps = isReal ? computeAprBps(rRate, tAssets) : 0;
  const aprStr = isReal ? `${(aprBps / 100).toFixed(2)}%` : STAKING_DEMO.apr;
  const totalStakedStr = isReal
    ? Number(formatEther(tAssets)).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : STAKING_DEMO.totalStaked;
  const ppsStr = isReal
    ? tShares === 0n
      ? "1.0000"
      : (Number(formatEther(tAssets)) / Number(formatEther(tShares))).toFixed(4)
    : STAKING_DEMO.xRitualRate;
  // Expected output
  const expected = (() => {
    if (!amount) return "0.0";
    const v = Number(amount);
    if (!isReal || tShares === 0n || tAssets === 0n) return v.toFixed(4);
    if (mode === "stake") return (v / (Number(formatEther(tAssets)) / Number(formatEther(tShares)))).toFixed(4);
    return (v * (Number(formatEther(tAssets)) / Number(formatEther(tShares)))).toFixed(4);
  })();

  async function onSubmit() {
    if (!address) {
      toast.error("Connect wallet first");
      return;
    }
    const value = amount ? parseEther(amount) : 0n;
    if (value === 0n) {
      toast.error("Enter an amount");
      return;
    }
    if (!isReal || !stakingAddr) {
      toast.info("Staking vault not deployed", {
        description: "Deploy RitualStaking at /deploy → Staking to enable real stake/unstake.",
      });
      return;
    }
    try {
      if (mode === "stake") {
        const data = encodeFunctionData({
          abi: STAKING_ABI,
          functionName: "deposit",
          args: [address],
        });
        const hash = await sendTransactionAsync({
          to: stakingAddr,
          data,
          value,
          chainId: ritualChain.id,
        });
        toast.success("Stake submitted", {
          description: hash.slice(0, 10) + "…",
          action: { label: "View", onClick: () => window.open(`${RITUAL_EXPLORER}/tx/${hash}`, "_blank") },
        });
      } else {
        const hash = await writeContractAsync({
          address: stakingAddr,
          abi: STAKING_ABI,
          functionName: "withdraw",
          args: [value, address],
          chainId: ritualChain.id,
        });
        toast.success("Unstake submitted", {
          description: hash.slice(0, 10) + "…",
          action: { label: "View", onClick: () => window.open(`${RITUAL_EXPLORER}/tx/${hash}`, "_blank") },
        });
      }
    } catch (e) {
      toast.error("Rejected", { description: (e as Error).message.slice(0, 100) });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border border-border">
        <Metric label={isReal ? "APR" : "APR (demo)"} value={aprStr} accent />
        <Metric label="Total staked" value={totalStakedStr} />
        <Metric label="1 xRITUAL" value={`${ppsStr} RIT`} />
      </div>

      {/* Toggle */}
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-background/40 p-1">
        {(["stake", "unstake"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "py-1.5 text-xs font-mono uppercase tracking-wider rounded-md transition",
              mode === m
                ? "bg-signal text-signal-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div className="rounded-lg border border-border bg-background/40 p-3">
        <div className="flex items-center justify-between mono-tag mb-2">
          <span>{mode === "stake" ? "Stake" : "Unstake"}</span>
          <button
            onClick={() => setAmount(Math.max(balNum - (mode === "stake" ? 0.001 : 0), 0).toString())}
            className="text-signal hover:underline"
          >
            max · {balNum.toFixed(4)} {mode === "stake" ? "RITUAL" : "xRIT"}
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
          <span className="font-mono text-sm text-muted-foreground">
            {mode === "stake" ? "RITUAL" : "xRITUAL"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-border bg-background/40 px-3 py-2 text-xs">
        <ArrowRight className="size-3.5 text-signal" />
        <span className="text-muted-foreground">You get</span>
        <span className="ml-auto font-mono">
          ≈ {expected}{" "}
          {mode === "stake" ? "xRITUAL" : "RITUAL"}
        </span>
      </div>

      {mode === "unstake" && (
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <Info className="size-3" />
          Unbonding: {isReal ? "instant (no queue)" : STAKING_DEMO.unbonding}
        </div>
      )}

      <button
        onClick={onSubmit}
        disabled={!amount || busy || !address}
        className={cn(
          "w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition",
          amount && address
            ? "bg-signal text-signal-foreground hover:opacity-90"
            : "bg-muted/40 text-muted-foreground cursor-not-allowed",
          busy && "opacity-60",
        )}
      >
        <Sparkles className="size-4" />
        {!address
          ? "Connect wallet"
          : busy
            ? "Submitting…"
            : mode === "stake"
              ? "Stake RITUAL"
              : "Unstake xRITUAL"}
      </button>

      {!isReal && (
        <div className="flex items-start gap-3 rounded-lg border border-signal/30 bg-signal/5 p-3 text-[11px]">
          <CatMascot size={28} />
          <div className="flex-1">
            <div className="text-signal font-medium">No staking vault deployed yet</div>
            <div className="text-muted-foreground mt-0.5">
              Deploy your own RitualStaking vault (linear-drip rewards, instant unbond) — atau pakai
              official Ritual LST:
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              <a href="/deploy" className="inline-flex items-center gap-1 text-signal hover:underline">
                Deploy staking →
              </a>
              <a
                href="https://ritual-lst.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-signal"
              >
                ritual-lst.vercel.app <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-card p-3">
      <div className="mono-tag mb-1">{label}</div>
      <div className={cn("font-mono text-sm font-semibold", accent && "text-signal")}>{value}</div>
    </div>
  );
}
