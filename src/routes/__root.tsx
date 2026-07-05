// Trim font weights to the essentials to keep the initial payload light.
import "@fontsource/quicksand/400.css";
import "@fontsource/quicksand/600.css";
import "@fontsource/fredoka/500.css";
import "@fontsource/fredoka/600.css";
import "@fontsource/jetbrains-mono/400.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/command-palette";
import { BreadcrumbStrip } from "@/components/breadcrumb-strip";
import { Providers } from "@/components/providers";
import { WalletButton } from "@/components/wallet-button";
import { UserMenu } from "@/components/user-menu";
import { Toaster } from "@/components/ui/sonner";
import ritualLogo from "@/assets/ritual-logo.png";
import mascotPeek from "@/assets/mascot-peek.png";
import { startVitals } from "@/lib/vitals-client";
import { usePrefetchAfterAuth } from "@/hooks/use-prefetch-after-auth";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">
          404 · not found
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">Off the precompile map</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This route isn't part of the Ritual docs explorer.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground transition-colors hover:opacity-90"
          >
            Back to overview
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Retry, or head back to the overview.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-signal px-4 py-2 text-sm font-medium text-signal-foreground transition-colors hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Overview
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#fef0f5" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "Enshrined" },
      { title: "Enshrined · The Ritual Testnet Companion" },
      {
        name: "description",
        content:
          "Enshrined — the companion for Ritual Testnet (1979). Explore precompiles, autonomous agents, TEE-EOVMT, DKMS, X402, and deploy on-chain.",
      },
      { name: "author", content: "Enshrined" },
      { property: "og:title", content: "Enshrined · The Ritual Testnet Companion" },
      {
        property: "og:description",
        content:
          "16 precompiles, 7 capabilities, autonomous on-chain agents on Ritual Testnet 1979. Guided by docs.ritualfoundation.org.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Enshrined · The Ritual Testnet Companion" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b5bf8569-2f8a-4d27-8c61-3ea7ff9b6e0b/id-preview-37bdddec--cd02b8d2-b5fd-4d26-875e-b77dd1dbe5bb.lovable.app-1782913815511.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b5bf8569-2f8a-4d27-8c61-3ea7ff9b6e0b/id-preview-37bdddec--cd02b8d2-b5fd-4d26-875e-b77dd1dbe5bb.lovable.app-1782913815511.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    startVitals();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Providers>
        <PrefetchAfterAuth />
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/70 backdrop-blur-xl px-3">
                <SidebarTrigger />
                <div className="h-4 w-px bg-border mx-1" />
                <Link to="/" className="flex items-center gap-2 group">
                  <span className="relative logo-halo grid place-items-center size-9 rounded-2xl bg-white border border-[color-mix(in_oklab,var(--gold)_45%,var(--border))] overflow-hidden shadow-sm">
                    <img
                      src={ritualLogo}
                      alt="Ritual"
                      width={24}
                      height={24}
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      className="h-6 w-6 object-contain transition-transform duration-500 group-hover:rotate-[12deg] group-hover:scale-110"
                    />
                  </span>
                  <span className="hidden sm:flex flex-col leading-none gap-0.5">
                    <span className="font-serif text-[17px] tracking-[0.14em] gold-text">RITUAL</span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
                      build the unseen ♡
                    </span>
                  </span>
                </Link>
                <div className="ml-auto flex items-center gap-2">
                  <CommandPalette />
                  <UserMenu />
                  <WalletButton />
                </div>
              </header>
              <main className="flex-1 min-w-0">
                <BreadcrumbStrip />
                <Outlet />
              </main>
              <footer className="border-t border-border px-6 py-6 text-xs text-muted-foreground">
                Unofficial research explorer. Content synthesized from{" "}
                <a
                  href="https://docs.ritualfoundation.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-signal hover:underline"
                >
                  docs.ritualfoundation.org
                </a>
                . Chain ID <span className="font-mono text-foreground">1979</span> ·{" "}
                <span className="font-mono text-foreground">RITUAL</span> testnet.
              </footer>
            </div>
          </div>
          <Toaster theme="light" richColors position="bottom-right" />
          <img
            src={mascotPeek}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="pointer-events-none fixed left-3 bottom-3 z-20 hidden md:block w-20 lg:w-24 opacity-90 drop-shadow-[0_6px_18px_rgba(232,138,171,0.35)]"
          />
        </SidebarProvider>
      </Providers>
    </QueryClientProvider>
  );
}

function PrefetchAfterAuth() {
  usePrefetchAfterAuth();
  return null;
}

