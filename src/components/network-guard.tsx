import { AlertTriangle } from "lucide-react";
import { useEnsureRitualChain } from "@/hooks/use-ensure-ritual-chain";
import { Button } from "@/components/ui/button";

/**
 * Compact banner shown when a connected wallet is on the wrong network.
 * Renders nothing when not connected or already on Ritual 1979.
 */
export function NetworkGuard({ className }: { className?: string }) {
  const { needsSwitch, switching, switchToRitual, chainId } = useEnsureRitualChain();
  if (!needsSwitch) return null;
  return (
    <div
      className={
        "flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 " +
        (className ?? "")
      }
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        Wallet on chain <b>{chainId}</b>. Switch to <b>Ritual 1979</b> to transact.
      </span>
      <Button
        size="sm"
        variant="outline"
        disabled={switching}
        onClick={() => switchToRitual()}
      >
        {switching ? "Switching…" : "Switch"}
      </Button>
    </div>
  );
}
