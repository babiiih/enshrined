import { useQuery } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
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
  return <ConfigBootstrap>{children}</ConfigBootstrap>;
}

function ConfigBootstrap({ children }: { children: ReactNode }) {
  const wagmiConfig = useMemo(() => buildWagmiConfig(), []);
  const { data } = useQuery({
    queryKey: ["wallet-config"],
    queryFn: fetchWalletConfig,
    staleTime: Infinity,
    retry: 1,
  });

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
