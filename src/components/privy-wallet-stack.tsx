import { useMemo, type ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider as PrivyWagmiProvider } from "@privy-io/wagmi";
import { buildWagmiConfig } from "@/lib/wagmi-config";
import { ritualChain } from "@/lib/ritual-chain";

type WalletConfig = {
  privyAppId: string;
  walletConnectProjectId: string;
};

export default function PrivyWalletStack({
  children,
  config,
}: {
  children: ReactNode;
  config: WalletConfig;
}) {
  const wagmiConfig = useMemo(() => buildWagmiConfig(), []);
  return (
    <PrivyProvider
      appId={config.privyAppId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#22d3b1",
          logo: undefined,
          showWalletLoginFirst: false,
        },
        loginMethods: ["email", "google", "wallet"],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
        defaultChain: ritualChain,
        supportedChains: [ritualChain],
        walletConnectCloudProjectId: config.walletConnectProjectId || undefined,
      }}
    >
      <PrivyWagmiProvider config={wagmiConfig}>{children}</PrivyWagmiProvider>
    </PrivyProvider>
  );
}
