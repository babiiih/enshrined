import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Sparkles, Wallet, Mail, ArrowRight } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";

const searchSchema = z.object({
  redirect: z.string().optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Sign in · Ritual" },
      { name: "description", content: "Masuk atau daftar untuk mengakses fitur DeFi Ritual — swap, staking, dan portfolio onchain." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function isSafeRedirect(p: string | undefined): p is string {
  return !!p && p.startsWith("/") && !p.startsWith("//");
}

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { ready, authenticated, login } = usePrivy();
  const [loading, setLoading] = useState(true);

  const redirectTo = isSafeRedirect(search.redirect) ? search.redirect : "/";

  useEffect(() => {
    if (ready) {
      setLoading(false);
      if (authenticated) {
        navigate({ to: redirectTo as never, replace: true });
      }
    }
  }, [ready, authenticated, navigate, redirectTo]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal login");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-signal" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10 overflow-hidden">
      {/* Decorative gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-signal/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[color:var(--gold)]/20 blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-signal">
              <Sparkles className="size-3" /> ritual · secure sign-in
            </div>
            <h1 className="font-serif text-3xl gold-text">Welcome</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Masuk untuk mengakses fitur DeFi kamu di Ritual Testnet (1979).
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {/* Privy Login - handles email, Google, wallet */}
            <Button
              onClick={handleLogin}
              className="w-full h-12 text-base"
              size="lg"
            >
              <Wallet className="size-5 mr-2" />
              Sign in with Privy
              <ArrowRight className="size-4 ml-2" />
            </Button>

            <div className="text-center">
              <p className="text-[11px] text-muted-foreground">
                Privy mendukung Email, Google, dan Wallet
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Dengan melanjutkan kamu setuju dengan syarat penggunaan Ritual docs explorer.
          </p>
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            ← Back to overview
          </Link>
        </div>
      </div>
    </div>
  );
}
