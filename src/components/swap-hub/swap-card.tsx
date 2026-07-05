import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, Info, Zap, TriangleAlert, Rocket } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { TokenSelect, TokenIcon } from "../token-select";
import { TOKENS, tokenBySymbol, mockQuote, type RitualToken } from "@/lib/ritual-tokens";
import { ritualChain } from "@/lib/ritual-chain";
import { cn } from "@/lib/utils";
import { getActiveFactory, getActiveRouter, getActiveWrap } from "@/lib/deployments";
import { RitualFactory, RitualPair, RitualRouter } from "@/lib/contracts";
import { useRitualTx } from "@/hooks/use-ritual-tx";
import {
  applySlippageMin,
  deadlineFromNow,
  getAmountOut,
  MAX_UINT256,
  priceImpactBps,
} from "@/lib/dex/router";

/**
 * Swap card.
 *
 * Real on-chain swap via RitualRouter when a pair exists in the deployed
 * factory. Falls back to `mockQuote` (labeled `simulated`) otherwise, so
 * the UI stays coherent even when the DEX / pair isn't set up yet.
 */
export function SwapCard() {
  const [from, setFrom] = useState<RitualToken>(tokenBySymbol("RITUAL"));
  const [to, setTo] = useState<RitualToken>(tokenBySymbol("AIR"));
  const [amount, setAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(50); // 0.5%

  const { address } = useAccount();
  const pub = usePublicClient({ chainId: ritualChain.id });

  const [factory, setFactory] = useState<`0x${string}` | null>(() => getActiveFactory());
  const [router, setRouter] = useState<`0x${string}` | null>(() => getActiveRouter());
  const [wrap, setWrap] = useState<`0x${string}` | null>(() => getActiveWrap());
  useEffect(() => {
    const sync = () => {
      setFactory(getActiveFactory());
      setRouter(getActiveRouter());
      setWrap(getActiveWrap());
    };
    window.addEventListener("ritual:dex", sync);
    window.addEventListener("ritual:wrap", sync);
    return () => {
      window.removeEventListener("ritual:dex", sync);
      window.removeEventListener("ritual:wrap", sync);
    };
  }, []);

  // Resolve ERC20 address for a token (native → wRITUAL if configured).
  const fromErc20: `0x${string}` | null =
    from.address === "native" ? wrap : from.isReal && from.address !== "0x0000000000000000000000000000000000000000" ? (from.address as `0x${string}`) : null;
  const toErc20: `0x${string}` | null =
    to.address === "native" ? wrap : to.isReal && to.address !== "0x0000000000000000000000000000000000000000" ? (to.address as `0x${string}`) : null;

  const [pair, setPair] = useState<`0x${string}` | null>(null);
  const [reserves, setReserves] = useState<{ rIn: bigint; rOut: bigint } | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!pub || !factory || !fromErc20 || !toErc20 || fromErc20 === toErc20) {
      setPair(null);
      setReserves(null);
      return;
    }
    let cancel = false;
    (async () => {
      try {
        const p = (await pub.readContract({
          address: factory,
          abi: RitualFactory.abi,
          functionName: "getPair",
          args: [fromErc20, toErc20],
        })) as `0x${string}`;
        if (cancel) return;
        if (!p || p === "0x0000000000000000000000000000000000000000") {
          setPair(null);
          setReserves(null);
          return;
        }
        const [t0, res] = await Promise.all([
          pub.readContract({ address: p, abi: RitualPair.abi, functionName: "token0" }) as Promise<`0x${string}`>,
          pub.readContract({ address: p, abi: RitualPair.abi, functionName: "getReserves" }) as Promise<
            [bigint, bigint]
          >,
        ]);
        if (cancel) return;
        setPair(p);
        const inIs0 = fromErc20.toLowerCase() === t0.toLowerCase();
        setReserves({ rIn: inIs0 ? res[0] : res[1], rOut: inIs0 ? res[1] : res[0] });
      } catch {
        if (!cancel) {
          setPair(null);
          setReserves(null);
        }
      }
    })();
    return () => {
      cancel = true;
    };
  }, [pub, factory, fromErc20, toErc20, refresh]);

  const isReal = !!(router && pair && reserves && reserves.rIn > 0n && reserves.rOut > 0n);

  const num = Number(amount);
  const mockQ = useMemo(() => mockQuote(from.symbol, to.symbol, num), [from.symbol, to.symbol, num]);

  const decIn = from.decimals ?? 18;
  const decOut = to.decimals ?? 18;

  const realQuote = useMemo(() => {
    if (!isReal || !reserves || !amount) return null;
    try {
      const a = parseUnits(amount, decIn);
      const out = getAmountOut(a, reserves.rIn, reserves.rOut);
      const min = applySlippageMin(out, slippageBps);
      const impact = priceImpactBps(a, reserves.rIn, reserves.rOut);
      return { amountIn: a, out, min, impact };
    } catch {
      return null;
    }
  }, [isReal, reserves, amount, decIn, slippageBps]);

  const outDisplay = realQuote
    ? Number(formatUnits(realQuote.out, decOut))
    : mockQ.out;
  const minOutDisplay = realQuote
    ? Number(formatUnits(realQuote.min, decOut))
    : mockQ.out * (1 - slippageBps / 10_000);
  const impactPct = realQuote ? realQuote.impact / 100 : mockQ.impact * 100;
  const route = realQuote ? [from.symbol, to.symbol] : mockQ.route;

  const { data: nativeBal } = useReadContract({
    address: fromErc20 ?? undefined,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: ritualChain.id,
    query: { enabled: !!address && !!fromErc20, refetchInterval: 10_000 },
  });
  const { data: allowance } = useReadContract({
    address: fromErc20 ?? undefined,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && router ? [address, router] : undefined,
    chainId: ritualChain.id,
    query: { enabled: !!address && !!fromErc20 && !!router, refetchInterval: 10_000 },
  });

  const swapTx = useRitualTx("Swap");
  const approveTx = useRitualTx("Approve token");

  const needApprove =
    isReal && realQuote && allowance !== undefined
      ? (allowance as bigint) < realQuote.amountIn
      : false;

  const flip = () => {
    setFrom(to);
    setTo(from);
  };

  const setMax = () => {
    if (fromErc20 && nativeBal) {
      setAmount(formatUnits(nativeBal as bigint, decIn));
    }
  };

  async function onApprove() {
    if (!fromErc20 || !router) return;
    await approveTx.send(async (wc) =>
      (wc as unknown as { writeContract: (a: unknown) => Promise<`0x${string}`> }).writeContract({
        address: fromErc20,
        abi: erc20Abi,
        functionName: "approve",
        args: [router, MAX_UINT256],
        chain: ritualChain,
        account: (wc as unknown as { account: `0x${string}` }).account,
      }),
    );
  }

  async function onSwap() {
    if (!isReal || !router || !realQuote || !fromErc20 || !toErc20) return;
    await swapTx.send(async (wc) =>
      (wc as unknown as { writeContract: (a: unknown) => Promise<`0x${string}`> }).writeContract({
        address: router,
        abi: RitualRouter.abi,
        functionName: "swapExactTokensForTokens",
        args: [
          realQuote.amountIn,
          realQuote.min,
          [fromErc20, toErc20],
          (wc as unknown as { account: { address: `0x${string}` } }).account.address,
          deadlineFromNow(),
        ],
        chain: ritualChain,
        account: (wc as unknown as { account: `0x${string}` }).account,
      }),
    );
    setAmount("");
    setRefresh((n) => n + 1);
  }

  const busy = swapTx.state.status === "signing" || swapTx.state.status === "pending" ||
    approveTx.state.status === "signing" || approveTx.state.status === "pending";

  return (
    <div className="flex flex-col gap-3">
      {/* Status banner */}
      {isReal ? (
        <div className="flex items-center gap-2 rounded-md border border-signal/30 bg-signal/5 px-3 py-2 text-[11px] text-signal">
          <Zap className="size-3.5" />
          <span className="mono-tag text-signal">onchain</span>
          <span className="text-muted-foreground">Live pair · router {router!.slice(0, 6)}…</span>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-md border border-chart-4/30 bg-chart-4/5 px-3 py-2 text-[11px] text-chart-4">
          <TriangleAlert className="size-3.5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <span className="font-mono uppercase tracking-wider sim-badge">simulated</span>{" "}
            <span className="text-muted-foreground">
              — {factory && router
                ? (fromErc20 && toErc20 ? "pair not created yet." : "swap needs ERC-20 tokens (wrap RITUAL first).")
                : "DEX not deployed."}
            </span>{" "}
            <Link to="/deploy" className="text-signal hover:underline inline-flex items-center gap-0.5">
              <Rocket className="size-3" /> setup
            </Link>
          </div>
        </div>
      )}

      {/* From */}
      <div className="rounded-lg border border-border bg-background/40 p-3">
        <div className="flex items-center justify-between mono-tag mb-2">
          <span>Sell</span>
          {fromErc20 && nativeBal !== undefined && (
            <button onClick={setMax} className="text-signal hover:underline">
              max · {Number(formatUnits(nativeBal as bigint, decIn)).toFixed(4)}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="flex-1 bg-transparent text-2xl font-mono tracking-tight outline-none placeholder:text-muted-foreground/40"
          />
          <TokenSelect value={from} onChange={setFrom} exclude={to.symbol} />
        </div>
      </div>

      {/* Flip */}
      <div className="relative flex justify-center -my-1 z-10">
        <button
          onClick={flip}
          className="grid place-items-center size-8 rounded-full border border-border bg-card hover:border-signal/40 hover:text-signal transition"
          aria-label="Flip tokens"
        >
          <ArrowDown className="size-4" />
        </button>
      </div>

      {/* To */}
      <div className="rounded-lg border border-border bg-background/40 p-3">
        <div className="flex items-center justify-between mono-tag mb-2">
          <span>Buy</span>
          <span>
            ≈ 1 {from.symbol} ={" "}
            {isReal && reserves && reserves.rIn > 0n
              ? (Number(reserves.rOut) / Number(reserves.rIn)).toFixed(4)
              : mockQ.rate.toFixed(4)}{" "}
            {to.symbol}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 text-2xl font-mono tracking-tight text-foreground/80">
            {outDisplay ? outDisplay.toFixed(6) : "0.0"}
          </div>
          <TokenSelect value={to} onChange={setTo} exclude={from.symbol} />
        </div>
      </div>

      {/* Route + details */}
      <div className="rounded-md border border-border bg-background/40 p-3 text-xs space-y-2">
        <Row label="Route">
          <span className="flex items-center gap-1.5 font-mono">
            {route.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1.5">
                <TokenIcon token={tokenBySymbol(s)} size={16} />
                {s}
                {i < route.length - 1 && <span className="text-muted-foreground">→</span>}
              </span>
            ))}
          </span>
        </Row>
        <Row label="Price impact">
          <span className={impactPct > 3 ? "text-chart-4" : "text-signal"}>
            {impactPct.toFixed(2)}%
          </span>
        </Row>
        <Row label="Min received">
          <span className="font-mono">
            {minOutDisplay ? minOutDisplay.toFixed(6) : "0.0"} {to.symbol}
          </span>
        </Row>
        <Row label="Slippage">
          <div className="flex gap-1">
            {[
              [10, "0.1%"],
              [50, "0.5%"],
              [100, "1%"],
            ].map(([bps, label]) => (
              <button
                key={bps}
                onClick={() => setSlippageBps(bps as number)}
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-mono border",
                  slippageBps === bps
                    ? "border-signal text-signal bg-signal/10"
                    : "border-border text-muted-foreground hover:border-signal/40",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Row>
      </div>

      {needApprove ? (
        <button
          onClick={onApprove}
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold bg-signal text-signal-foreground hover:opacity-90 disabled:opacity-60"
        >
          <Zap className="size-4" />
          {busy ? "Approving…" : `Approve ${from.symbol}`}
        </button>
      ) : (
        <button
          onClick={onSwap}
          disabled={!num || busy || !address || !isReal}
          className={cn(
            "w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition",
            isReal && num && address
              ? "bg-signal text-signal-foreground hover:opacity-90"
              : "bg-muted/40 text-muted-foreground cursor-not-allowed",
            busy && "opacity-60",
          )}
        >
          <Zap className="size-4" />
          {!address
            ? "Connect wallet"
            : !num
              ? "Enter amount"
              : busy
                ? "Submitting…"
                : isReal
                  ? "Swap"
                  : "No live pair"}
        </button>
      )}

      <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-center">
        <Info className="size-3" />
        DEX = UniswapV2-style · 0.30% fee · single-hop
      </p>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <div>{children}</div>
    </div>
  );
}

// keep TOKENS reachable for tree-shakers in case card lives standalone
export const _tokens = TOKENS;
