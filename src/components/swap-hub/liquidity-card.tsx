import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { erc20Abi, formatUnits, parseUnits } from "viem";
import { Link } from "@tanstack/react-router";
import { Droplets, Rocket, PlusCircle, MinusCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { ritualChain, RITUAL_EXPLORER } from "@/lib/ritual-chain";
import {
  getActiveFactory,
  getActiveRouter,
} from "@/lib/deployments";
import { RitualFactory, RitualPair, RitualRouter } from "@/lib/contracts";
import { useRitualTx } from "@/hooks/use-ritual-tx";
import { listErc20Tokens, type Erc20Entry } from "@/lib/dex/token-registry";
import {
  applySlippageMin,
  deadlineFromNow,
  MAX_UINT256,
} from "@/lib/dex/router";
import { cn } from "@/lib/utils";

/**
 * Add / remove liquidity for a RitualPair. ERC-20 ↔ ERC-20 only (wrap native
 * RITUAL first via the Wrap tab if you want it in a pool).
 */
export function LiquidityCard() {
  const { address } = useAccount();
  const pub = usePublicClient({ chainId: ritualChain.id });
  const [factory, setFactory] = useState<`0x${string}` | null>(() => getActiveFactory());
  const [router, setRouter] = useState<`0x${string}` | null>(() => getActiveRouter());
  const [tokens, setTokens] = useState<Erc20Entry[]>(() => listErc20Tokens());

  useEffect(() => {
    const sync = () => {
      setFactory(getActiveFactory());
      setRouter(getActiveRouter());
      setTokens(listErc20Tokens());
    };
    window.addEventListener("ritual:dex", sync);
    window.addEventListener("ritual:deployments", sync);
    window.addEventListener("ritual:wrap", sync);
    return () => {
      window.removeEventListener("ritual:dex", sync);
      window.removeEventListener("ritual:deployments", sync);
      window.removeEventListener("ritual:wrap", sync);
    };
  }, []);

  const [aAddr, setA] = useState<`0x${string}` | "">(() => tokens[0]?.address ?? "");
  const [bAddr, setB] = useState<`0x${string}` | "">(() => tokens[1]?.address ?? "");
  useEffect(() => {
    if (!aAddr && tokens[0]) setA(tokens[0].address);
    if (!bAddr && tokens[1]) setB(tokens[1].address);
  }, [tokens, aAddr, bAddr]);

  const tokA = tokens.find((t) => t.address === aAddr);
  const tokB = tokens.find((t) => t.address === bAddr);

  const [pair, setPair] = useState<`0x${string}` | null>(null);
  const [reserves, setReserves] = useState<{ rA: bigint; rB: bigint; lpSupply: bigint } | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!pub || !factory || !tokA || !tokB) return;
    let cancel = false;
    (async () => {
      try {
        const p = (await pub.readContract({
          address: factory,
          abi: RitualFactory.abi,
          functionName: "getPair",
          args: [tokA.address, tokB.address],
        })) as `0x${string}`;
        if (cancel) return;
        if (!p || p === "0x0000000000000000000000000000000000000000") {
          setPair(null);
          setReserves(null);
          return;
        }
        setPair(p);
        const [t0, res, lp] = await Promise.all([
          pub.readContract({ address: p, abi: RitualPair.abi, functionName: "token0" }) as Promise<`0x${string}`>,
          pub.readContract({ address: p, abi: RitualPair.abi, functionName: "getReserves" }) as Promise<
            [bigint, bigint]
          >,
          pub.readContract({ address: p, abi: RitualPair.abi, functionName: "totalSupply" }) as Promise<bigint>,
        ]);
        if (cancel) return;
        const aIs0 = tokA.address.toLowerCase() === t0.toLowerCase();
        setReserves({ rA: aIs0 ? res[0] : res[1], rB: aIs0 ? res[1] : res[0], lpSupply: lp });
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
  }, [pub, factory, tokA, tokB, refresh]);

  const { data: balA } = useReadContract({
    address: tokA?.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: ritualChain.id,
    query: { enabled: !!address && !!tokA, refetchInterval: 10_000 },
  });
  const { data: balB } = useReadContract({
    address: tokB?.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: ritualChain.id,
    query: { enabled: !!address && !!tokB, refetchInterval: 10_000 },
  });
  const { data: lpBal } = useReadContract({
    address: pair ?? undefined,
    abi: RitualPair.abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: ritualChain.id,
    query: { enabled: !!address && !!pair, refetchInterval: 10_000 },
  });
  const { data: allowA } = useReadContract({
    address: tokA?.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && router ? [address, router] : undefined,
    chainId: ritualChain.id,
    query: { enabled: !!address && !!router && !!tokA, refetchInterval: 10_000 },
  });
  const { data: allowB } = useReadContract({
    address: tokB?.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && router ? [address, router] : undefined,
    chainId: ritualChain.id,
    query: { enabled: !!address && !!router && !!tokB, refetchInterval: 10_000 },
  });
  const { data: allowLp } = useReadContract({
    address: pair ?? undefined,
    abi: RitualPair.abi,
    functionName: "allowance",
    args: address && router ? [address, router] : undefined,
    chainId: ritualChain.id,
    query: { enabled: !!address && !!router && !!pair, refetchInterval: 10_000 },
  });

  // --- add liquidity ---
  const [amtA, setAmtA] = useState("");
  const amtBAuto = useMemo(() => {
    if (!reserves || !tokA || !tokB || !amtA) return "";
    if (reserves.rA === 0n && reserves.rB === 0n) return ""; // free init price
    try {
      const a = parseUnits(amtA, tokA.decimals);
      const b = (a * reserves.rB) / reserves.rA;
      return formatUnits(b, tokB.decimals);
    } catch {
      return "";
    }
  }, [amtA, reserves, tokA, tokB]);
  const [amtBFree, setAmtBFree] = useState("");
  const isInit = reserves ? reserves.rA === 0n && reserves.rB === 0n : true;
  const amtBEffective = isInit ? amtBFree : amtBAuto;

  const addTx = useRitualTx("Add liquidity");
  const apprATx = useRitualTx("Approve token A");
  const apprBTx = useRitualTx("Approve token B");
  const apprLpTx = useRitualTx("Approve LP");
  const createTx = useRitualTx("Create pair");
  const removeTx = useRitualTx("Remove liquidity");

  async function createPair() {
    if (!factory || !tokA || !tokB) return;
    await createTx.send(async (wc) =>
      (wc as unknown as { writeContract: (a: unknown) => Promise<`0x${string}`> }).writeContract({
        address: factory,
        abi: RitualFactory.abi,
        functionName: "createPair",
        args: [tokA.address, tokB.address],
        chain: ritualChain,
        account: (wc as unknown as { account: `0x${string}` }).account,
      }),
    );
    setRefresh((n) => n + 1);
  }

  async function approve(which: "A" | "B") {
    const tok = which === "A" ? tokA : tokB;
    const tx = which === "A" ? apprATx : apprBTx;
    if (!tok || !router) return;
    await tx.send(async (wc) =>
      (wc as unknown as { writeContract: (a: unknown) => Promise<`0x${string}`> }).writeContract({
        address: tok.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [router, MAX_UINT256],
        chain: ritualChain,
        account: (wc as unknown as { account: `0x${string}` }).account,
      }),
    );
  }

  async function addLiq() {
    if (!router || !tokA || !tokB || !amtA || !amtBEffective) return;
    const a = parseUnits(amtA, tokA.decimals);
    const b = parseUnits(amtBEffective, tokB.decimals);
    const aMin = applySlippageMin(a, 50);
    const bMin = applySlippageMin(b, 50);
    await addTx.send(async (wc) =>
      (wc as unknown as { writeContract: (a: unknown) => Promise<`0x${string}`> }).writeContract({
        address: router,
        abi: RitualRouter.abi,
        functionName: "addLiquidity",
        args: [tokA.address, tokB.address, a, b, aMin, bMin, (wc as unknown as { account: { address: `0x${string}` } }).account.address, deadlineFromNow()],
        chain: ritualChain,
        account: (wc as unknown as { account: `0x${string}` }).account,
      }),
    );
    setAmtA("");
    setAmtBFree("");
    setRefresh((n) => n + 1);
  }

  // --- remove liquidity ---
  const [removePct, setRemovePct] = useState(50);
  async function approveLp() {
    if (!pair || !router) return;
    await apprLpTx.send(async (wc) =>
      (wc as unknown as { writeContract: (a: unknown) => Promise<`0x${string}`> }).writeContract({
        address: pair,
        abi: RitualPair.abi,
        functionName: "approve",
        args: [router, MAX_UINT256],
        chain: ritualChain,
        account: (wc as unknown as { account: `0x${string}` }).account,
      }),
    );
  }
  async function removeLiq() {
    if (!router || !tokA || !tokB || !lpBal || !pair) return;
    const lp = ((lpBal as bigint) * BigInt(Math.round(removePct))) / 100n;
    if (lp <= 0n) {
      toast.error("Nothing to remove");
      return;
    }
    await removeTx.send(async (wc) =>
      (wc as unknown as { writeContract: (a: unknown) => Promise<`0x${string}`> }).writeContract({
        address: router,
        abi: RitualRouter.abi,
        functionName: "removeLiquidity",
        args: [tokA.address, tokB.address, lp, 0n, 0n, (wc as unknown as { account: { address: `0x${string}` } }).account.address, deadlineFromNow()],
        chain: ritualChain,
        account: (wc as unknown as { account: `0x${string}` }).account,
      }),
    );
    setRefresh((n) => n + 1);
  }

  if (!factory || !router) {
    return (
      <NotReady
        title="DEX belum di-deploy"
        body="Deploy Factory + Router dulu supaya bisa bikin pool."
        cta="Deploy DEX"
      />
    );
  }
  if (tokens.length < 2) {
    return (
      <NotReady
        title="Butuh ≥ 2 token ERC-20"
        body="Deploy setidaknya 2 token (atau wRITUAL + 1 token) untuk buka pool."
        cta="Deploy Token"
      />
    );
  }
  if (!tokA || !tokB || tokA.address === tokB.address) {
    return <NotReady title="Pilih dua token berbeda" body="Pair harus 2 token ERC-20 unik." cta="" />;
  }

  const needApproveA = allowA !== undefined && amtA
    ? (allowA as bigint) < parseUnits(amtA || "0", tokA.decimals)
    : false;
  const needApproveB = allowB !== undefined && amtBEffective
    ? (allowB as bigint) < parseUnits(amtBEffective || "0", tokB.decimals)
    : false;

  return (
    <div className="flex flex-col gap-4">
      {/* Pair status */}
      <div className="rounded-md border border-signal/30 bg-signal/5 px-3 py-2 text-[11px] text-signal flex items-center gap-2">
        <Droplets className="size-3.5" />
        <span className="mono-tag text-signal">pair</span>
        {pair ? (
          <a
            href={`${RITUAL_EXPLORER}/address/${pair}`}
            target="_blank"
            rel="noreferrer"
            className="font-mono hover:underline"
          >
            {pair.slice(0, 8)}…{pair.slice(-4)}
          </a>
        ) : (
          <span className="text-chart-4">pair not created</span>
        )}
        {reserves && (
          <span className="ml-auto text-muted-foreground font-mono">
            {formatShort(reserves.rA, tokA.decimals)} {tokA.symbol} · {formatShort(reserves.rB, tokB.decimals)} {tokB.symbol}
          </span>
        )}
      </div>

      {/* Token pickers */}
      <div className="grid grid-cols-2 gap-2">
        <TokenPicker label="Token A" value={aAddr} onChange={setA} tokens={tokens} exclude={bAddr} />
        <TokenPicker label="Token B" value={bAddr} onChange={setB} tokens={tokens} exclude={aAddr} />
      </div>

      {!pair ? (
        <button
          onClick={createPair}
          disabled={!address}
          className="w-full rounded-lg py-3 text-sm font-semibold bg-signal text-signal-foreground disabled:opacity-50"
        >
          {createTx.state.status === "signing" || createTx.state.status === "pending"
            ? "Creating pair…"
            : "Create pair"}
        </button>
      ) : (
        <>
          {/* Deposit inputs */}
          <AmountInput
            label={`Deposit ${tokA.symbol}`}
            value={amtA}
            onChange={setAmtA}
            balance={balA ? formatUnits(balA as bigint, tokA.decimals) : "0"}
          />
          <AmountInput
            label={`Deposit ${tokB.symbol}`}
            value={amtBEffective}
            onChange={isInit ? setAmtBFree : () => {}}
            balance={balB ? formatUnits(balB as bigint, tokB.decimals) : "0"}
            readOnly={!isInit}
            hint={isInit ? "First liquidity sets the price" : "Auto-computed from reserves"}
          />

          {/* Approve buttons */}
          {(needApproveA || needApproveB) && (
            <div className="grid grid-cols-2 gap-2">
              {needApproveA && (
                <button
                  onClick={() => approve("A")}
                  className="rounded-md border border-signal/60 py-2 text-xs font-medium text-signal"
                >
                  Approve {tokA.symbol}
                </button>
              )}
              {needApproveB && (
                <button
                  onClick={() => approve("B")}
                  className="rounded-md border border-signal/60 py-2 text-xs font-medium text-signal"
                >
                  Approve {tokB.symbol}
                </button>
              )}
            </div>
          )}

          <button
            onClick={addLiq}
            disabled={!amtA || !amtBEffective || needApproveA || needApproveB}
            className={cn(
              "w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition",
              amtA && amtBEffective && !needApproveA && !needApproveB
                ? "bg-signal text-signal-foreground hover:opacity-90"
                : "bg-muted/40 text-muted-foreground cursor-not-allowed",
            )}
          >
            <PlusCircle className="size-4" />
            Add liquidity
          </button>

          {/* Your position */}
          {lpBal !== undefined && (lpBal as bigint) > 0n && (
            <div className="rounded-lg border border-border bg-background/40 p-3 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="mono-tag">Your position</span>
                <span className="font-mono">{formatShort(lpBal as bigint, 18)} LP</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={removePct}
                onChange={(e) => setRemovePct(Number(e.target.value))}
                className="w-full accent-[color:var(--signal)]"
              />
              <div className="text-xs text-muted-foreground text-center">Remove {removePct}%</div>
              {allowLp !== undefined && (allowLp as bigint) < ((lpBal as bigint) * BigInt(removePct)) / 100n ? (
                <button
                  onClick={approveLp}
                  className="w-full rounded-md border border-signal/60 py-2 text-xs font-medium text-signal"
                >
                  Approve LP for router
                </button>
              ) : (
                <button
                  onClick={removeLiq}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold bg-chart-4/20 text-chart-4 hover:bg-chart-4/30"
                >
                  <MinusCircle className="size-4" /> Remove liquidity
                </button>
              )}
            </div>
          )}
        </>
      )}

      <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-center">
        <Info className="size-3" />
        Fee 0.30% per swap · slippage 0.5% default · deadline 20m
      </p>
    </div>
  );
}

function NotReady({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <Droplets className="size-8 text-signal/70" />
      <div className="text-sm font-semibold">{title}</div>
      <p className="text-xs text-muted-foreground max-w-xs">{body}</p>
      {cta && (
        <Link
          to="/deploy"
          className="inline-flex items-center gap-1.5 rounded-md bg-signal px-3 py-1.5 text-xs font-medium text-signal-foreground"
        >
          <Rocket className="size-3.5" /> {cta}
        </Link>
      )}
    </div>
  );
}

function TokenPicker({
  label,
  value,
  onChange,
  tokens,
  exclude,
}: {
  label: string;
  value: `0x${string}` | "";
  onChange: (a: `0x${string}`) => void;
  tokens: Erc20Entry[];
  exclude: `0x${string}` | "";
}) {
  return (
    <label className="rounded-lg border border-border bg-background/40 p-3 flex flex-col gap-1.5">
      <span className="mono-tag">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as `0x${string}`)}
        className="bg-transparent text-sm font-mono outline-none"
      >
        {tokens
          .filter((t) => t.address !== exclude)
          .map((t) => (
            <option key={t.address} value={t.address}>
              {t.symbol}
            </option>
          ))}
      </select>
    </label>
  );
}

function AmountInput({
  label,
  value,
  onChange,
  balance,
  readOnly,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  balance: string;
  readOnly?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-center justify-between mono-tag mb-2">
        <span>{label}</span>
        <button
          onClick={() => !readOnly && onChange(balance)}
          className="text-signal hover:underline"
          disabled={readOnly}
        >
          bal · {Number(balance).toFixed(4)}
        </button>
      </div>
      <input
        inputMode="decimal"
        placeholder="0.0"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        className={cn(
          "w-full bg-transparent text-2xl font-mono outline-none placeholder:text-muted-foreground/40",
          readOnly && "text-foreground/70",
        )}
      />
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function formatShort(raw: bigint, decimals: number): string {
  const n = Number(raw) / 10 ** decimals;
  if (n === 0) return "0";
  if (n < 0.0001) return "<0.0001";
  if (n < 1) return n.toFixed(4);
  if (n < 1000) return n.toFixed(2);
  if (n < 1_000_000) return (n / 1000).toFixed(2) + "K";
  return (n / 1_000_000).toFixed(2) + "M";
}