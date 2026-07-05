import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { buildWagmiConfig } from "@/lib/wagmi-config";
import { WalletStack, ConfigMissingBanner } from "./wallet-stack";

type WalletConfig = {
  privyAppId: string;
  walletConnectProjectId: string;
};

async function fetchWalletConfig(): Promise<WalletConfig> {
  const res = await fetch("/api/wallet-config");
  if (!res.ok) throw new Error("wallet-config unavailable");
  return res.json();
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigBootstrap>{children}</ConfigBootstrap>
    </QueryClientProvider>
  );
}

function ConfigBootstrap({ children }: { children: ReactNode }) {
  const wagmiConfig = useMemo(() => buildWagmiConfig(), []);
  const { data } = useQuery({
    queryKey: ["wallet-config"],
    queryFn: fetchWalletConfig,
    staleTime: Infinity,
    retry: 1,
  });

  // Always mount base WagmiProvider so useAccount works during SSR and while
  // the (lazy) Privy chunk streams in. Privy layers on top when configured.
  if (!data || !data.privyAppId) {
    return (
      <WagmiProvider config={wagmiConfig}>
        {!data ? null : <ConfigMissingBanner />}
        {children}
      </WagmiProvider>
    );
  }

  return <WalletStack config={data}>{children}</WalletStack>;
}
