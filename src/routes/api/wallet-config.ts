import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/wallet-config")({
  server: {
    handlers: {
      GET: async () => {
        const privyAppId = process.env.PRIVY_APP_ID ?? "";
        const walletConnectProjectId = process.env.WALLETCONNECT_PROJECT_ID ?? "";
        return Response.json(
          { privyAppId, walletConnectProjectId },
          {
            headers: {
              "cache-control": "public, max-age=60",
            },
          },
        );
      },
    },
  },
});
