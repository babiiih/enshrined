import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { usePublicClient } from "wagmi";
import { useAuth } from "@/hooks/use-auth";
import { ritualChain } from "@/lib/ritual-chain";
import { getActiveFactory } from "@/lib/deployments";
import { prefetchPools } from "@/lib/prefetch";

/**
 * Once the session is verified, warm up the data + code chunks the user is
 * most likely to hit next (Swap, Pools, Deploy). Idempotent — cached fetches
 * dedupe, and route preloads are no-ops after the first call.
 */
export function usePrefetchAfterAuth() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pub = usePublicClient({ chainId: ritualChain.id });

  useEffect(() => {
    if (loading || !isAuthenticated) return;

    // 1. Preload the JS chunks for the protected routes.
    void router.preloadRoute({ to: "/swap" }).catch(() => {});
    void router.preloadRoute({ to: "/pools" }).catch(() => {});
    void router.preloadRoute({ to: "/deploy" }).catch(() => {});

    // 2. Kick off on-chain reads for Pools if a factory is configured.
    const factory = getActiveFactory();
    if (pub && factory) {
      void prefetchPools(pub, factory).catch(() => {});
    }
  }, [isAuthenticated, loading, pub, router]);
}