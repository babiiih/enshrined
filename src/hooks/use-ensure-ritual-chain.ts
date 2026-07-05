import { useAccount, useSwitchChain } from "wagmi";
import { ritualChain } from "@/lib/ritual-chain";

/**
 * Returns wallet + chain status and a `switchToRitual()` helper.
 * Use this to gate write actions and show a "wrong network" prompt.
 */
export function useEnsureRitualChain() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChainAsync, isPending } = useSwitchChain();

  const isRitual = chainId === ritualChain.id;
  const needsSwitch = isConnected && !isRitual;

  async function switchToRitual() {
    try {
      await switchChainAsync({ chainId: ritualChain.id });
      return true;
    } catch {
      return false;
    }
  }

  return {
    address,
    isConnected,
    chainId,
    isRitual,
    needsSwitch,
    switching: isPending,
    switchToRitual,
  };
}
