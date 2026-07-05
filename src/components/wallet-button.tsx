import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useBalance, useChainId, useSwitchChain, useDisconnect } from "wagmi";
import { useState } from "react";
import { Copy, Check, ExternalLink, LogOut, Droplets, AlertTriangle, Wallet } from "lucide-react";
import { formatEther } from "viem";
import { ritualChain, RITUAL_EXPLORER, RITUAL_FAUCET } from "@/lib/ritual-chain";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MovingBorder } from "@/components/motion/moving-border";

function shorten(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletButton() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({
    address,
    chainId: ritualChain.id,
    query: { refetchInterval: 8000, enabled: !!address },
  });
  const [copied, setCopied] = useState(false);

  if (!ready) {
    return (
      <div className="h-9 w-28 rounded-md bg-muted/40 animate-pulse" aria-label="loading wallet" />
    );
  }

  if (!authenticated) {
    return (
      <MovingBorder duration={4} className="!px-0 !py-0">
        <button
          onClick={() => login()}
          className="inline-flex items-center gap-2 rounded-[calc(0.375rem-1px)] bg-signal px-3 py-1.5 text-sm font-medium text-signal-foreground hover:opacity-90 transition"
        >
          <Wallet className="size-4" />
          Connect
        </button>
      </MovingBorder>
    );
  }

  const displayAddress = address ?? user?.wallet?.address;
  const wrongChain = !!address && chainId !== ritualChain.id;
  const balanceStr = balance ? Number(formatEther(balance.value)).toFixed(4) : "—";
  const zero = balance && balance.value === 0n;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm transition",
            wrongChain
              ? "border-chart-4/50 bg-chart-4/10 text-chart-4"
              : "border-border bg-card hover:border-signal/40",
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full",
              wrongChain ? "bg-chart-4 animate-pulse" : "bg-signal",
            )}
          />
          <span className="font-mono text-xs">{shorten(displayAddress)}</span>
          {!wrongChain && (
            <span className="hidden sm:inline text-xs text-muted-foreground">
              {balanceStr} RITUAL
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-card border-border">
        <div className="p-4 border-b border-border">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Signed in
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate font-mono text-sm text-foreground">
              {displayAddress}
            </code>
            <button
              onClick={() => {
                if (!displayAddress) return;
                navigator.clipboard.writeText(displayAddress);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="p-1.5 text-muted-foreground hover:text-signal"
              aria-label="Copy address"
            >
              {copied ? (
                <Check className="size-3.5 text-signal" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
          {user?.email?.address && (
            <div className="mt-2 text-xs text-muted-foreground truncate">
              {user.email.address}
            </div>
          )}
        </div>

        {wrongChain && (
          <div className="p-3 border-b border-border bg-chart-4/5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-chart-4 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="text-chart-4 font-medium">Wrong network</div>
                <div className="text-muted-foreground mt-0.5">
                  Currently on chain {chainId}. Switch to Ritual (1979).
                </div>
                <button
                  onClick={() => switchChain({ chainId: ritualChain.id })}
                  className="mt-2 rounded-md bg-chart-4/20 text-chart-4 px-2 py-1 text-xs font-medium hover:bg-chart-4/30"
                >
                  Switch network
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 border-b border-border">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            Balance
          </div>
          <div className="text-2xl font-semibold tracking-tight">
            {balanceStr} <span className="text-sm text-muted-foreground font-normal">RITUAL</span>
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">Testnet · no real value</div>
        </div>

        <div className="p-2 space-y-1">
          <a
            href={RITUAL_FAUCET}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              zero
                ? "bg-signal/10 text-signal hover:bg-signal/20"
                : "hover:bg-muted/40 text-foreground",
            )}
          >
            <Droplets className="size-4" />
            <span className="flex-1">Faucet</span>
            {zero && (
              <span className="text-[10px] uppercase tracking-wider">Get RITUAL</span>
            )}
            <ExternalLink className="size-3 text-muted-foreground" />
          </a>
          <a
            href={displayAddress ? `${RITUAL_EXPLORER}/address/${displayAddress}` : RITUAL_EXPLORER}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted/40"
          >
            <ExternalLink className="size-4" />
            <span className="flex-1">View on Explorer</span>
          </a>
          <button
            onClick={() => {
              disconnect();
              logout();
            }}
            className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-destructive/10 text-destructive"
          >
            <LogOut className="size-4" />
            Disconnect
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
