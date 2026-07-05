import { useCallback, useState } from "react";
import { toast } from "sonner";
import { usePublicClient, useWalletClient } from "wagmi";
import type { Hash } from "viem";
import { RITUAL_EXPLORER } from "@/lib/ritual-chain";
import { useEnsureRitualChain } from "./use-ensure-ritual-chain";
import { upsertTx } from "@/lib/tx-history";

type SendFn = (walletClient: NonNullable<ReturnType<typeof useWalletClient>["data"]>) => Promise<Hash>;

export type RitualTxState = {
  status: "idle" | "signing" | "pending" | "confirmed" | "reverted" | "error";
  hash?: Hash;
  error?: string;
};

/**
 * Standardized DeFi tx lifecycle:
 * signing → pending (mempool) → confirmed / reverted, with toast + explorer link.
 * Auto-guards network (prompts switch to Ritual 1979).
 */
export function useRitualTx(label = "Transaction") {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { needsSwitch, switchToRitual } = useEnsureRitualChain();
  const [state, setState] = useState<RitualTxState>({ status: "idle" });

  const send = useCallback(
    async (fn: SendFn) => {
      if (!walletClient) {
        toast.error("Connect wallet first");
        return;
      }
      if (needsSwitch) {
        toast.message("Switching to Ritual (1979)…");
        const ok = await switchToRitual();
        if (!ok) {
          toast.error("Please switch to Ritual Testnet (1979)");
          return;
        }
      }
      const toastId = toast.loading(`${label} — awaiting signature…`);
      const txId = `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const from = walletClient.account?.address as `0x${string}` | undefined;
      setState({ status: "signing" });
      upsertTx({ id: txId, label, status: "signing", from });
      try {
        const hash = await fn(walletClient);
        setState({ status: "pending", hash });
        upsertTx({ id: txId, status: "pending", hash, from });
        toast.loading(`${label} — pending`, {
          id: toastId,
          description: hash.slice(0, 10) + "…" + hash.slice(-6),
          action: {
            label: "View",
            onClick: () => window.open(`${RITUAL_EXPLORER}/tx/${hash}`, "_blank"),
          },
        });
        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          if (receipt.status === "success") {
            setState({ status: "confirmed", hash });
            upsertTx({ id: txId, status: "confirmed", hash, from });
            toast.success(`${label} confirmed`, {
              id: toastId,
              action: {
                label: "Explorer",
                onClick: () => window.open(`${RITUAL_EXPLORER}/tx/${hash}`, "_blank"),
              },
            });
          } else {
            setState({ status: "reverted", hash });
            upsertTx({ id: txId, status: "reverted", hash, from });
            toast.error(`${label} reverted`, { id: toastId });
          }
        } else {
          toast.dismiss(toastId);
        }
        return hash;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setState({ status: "error", error: msg });
        upsertTx({ id: txId, status: "error", error: msg, from });
        toast.error(`${label} failed`, { id: toastId, description: msg.slice(0, 120) });
        return undefined;
      }
    },
    [walletClient, publicClient, needsSwitch, switchToRitual, label],
  );

  return { send, state, reset: () => setState({ status: "idle" }) };
}
