import { lazy, Suspense, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { useMemo } from "react";
import { buildWagmiConfig } from "@/lib/wagmi-config";

type WalletConfig = {
  privyAppId: string;
  walletConnectProjectId: string;
};

// Lazy chunk — pulls in @privy-io/react-auth + @privy-io/wagmi (~79MB in node_modules,
// several hundred KB gzipped) only after wallet-config resolves.
const PrivyWalletStack = lazy(() => import("./privy-wallet-stack"));

export function WalletStack({ children, config }: { children: ReactNode; config: WalletConfig }) {
  const wagmiConfig = useMemo(() => buildWagmiConfig(), []);

  if (!config.privyAppId) {
    return (
      <WagmiProvider config={wagmiConfig}>
        <ConfigMissingBanner />
        {children}
      </WagmiProvider>
    );
  }

  return (
    <Suspense
      fallback={
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      }
    >
      <PrivyWalletStack config={config}>{children}</PrivyWalletStack>
    </Suspense>
  );
}

export function ConfigMissingBanner() {
  return (
    <div className="fixed bottom-4 right-4 z-[100] max-w-sm rounded-lg border border-chart-4/40 bg-background/95 backdrop-blur px-4 py-3 shadow-xl">
      <div className="font-mono text-[10px] uppercase tracking-wider text-chart-4 mb-1">
        Wallet login disabled
      </div>
      <p className="text-xs text-muted-foreground">
        Set <code className="text-signal">PRIVY_APP_ID</code> in project secrets to enable Privy
        login. Read-only features still work.
      </p>
    </div>
  );
}
