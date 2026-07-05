import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Client-side gate for authenticated pages. Renders a friendly locked
 * state (with sign-in CTA) instead of redirecting so the URL is
 * preserved — the /auth page reads ?redirect=... to bounce back.
 */
export function AuthGuard({
  children,
  title,
  skeleton,
}: {
  children: ReactNode;
  title?: string;
  skeleton?: ReactNode;
}) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="w-full"
      >
        <span className="sr-only">Memeriksa sesi login…</span>
        <div className="mx-auto w-full max-w-6xl px-4 pt-6">
          <div className="flex items-center gap-3">
            <Loader2 className="size-4 animate-spin text-signal" aria-hidden />
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Checking session…
            </div>
          </div>
        </div>
        <div aria-hidden>{skeleton ?? <DefaultSkeleton />}</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect =
      typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card/70 backdrop-blur p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-signal/10 text-signal">
            <Lock className="size-5" />
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-signal">
            Sign in required
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-foreground">
            {title ?? "This page is for signed-in users"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Masuk untuk mengakses fitur DeFi ini — wrap, swap, staking, pool,
            deploy kontrak, dan riwayat transaksi kamu.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link to="/auth" search={{ redirect } as never}>
                Sign in
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/auth" search={{ redirect, mode: "signup" } as never}>
                Create account
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function DefaultSkeleton() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card/60 p-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/2" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card/60 p-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-3 h-24 w-full" />
        <Skeleton className="mt-3 h-4 w-2/3" />
        <Skeleton className="mt-2 h-4 w-1/2" />
      </div>
    </div>
  );
}