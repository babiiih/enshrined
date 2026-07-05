import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  const { isAuthenticated, loading } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup" | "magic">(
    search.mode === "signup" ? "signup" : "signin",
  );

  const redirectTo = isSafeRedirect(search.redirect) ? search.redirect : "/";

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate({ to: redirectTo as never, replace: true });
    }
  }, [isAuthenticated, loading, navigate, redirectTo]);

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
            <h1 className="font-serif text-3xl gold-text">Welcome back</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Masuk untuk melanjutkan ke fitur DeFi kamu di Ritual Testnet (1979).
            </p>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="magic">Magic link</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5">
              <PasswordForm mode="signin" redirectTo={redirectTo} />
            </TabsContent>
            <TabsContent value="signup" className="mt-5">
              <PasswordForm mode="signup" redirectTo={redirectTo} />
            </TabsContent>
            <TabsContent value="magic" className="mt-5">
              <MagicLinkForm redirectTo={redirectTo} />
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-widest">
              <span className="bg-card px-3 text-muted-foreground">or continue with</span>
            </div>
          </div>

          <GoogleButton />

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Dengan melanjutkan kamu setuju dengan syarat penggunaan Ritual docs
            explorer.
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

const passwordSchema = z.object({
  email: z.string().trim().email({ message: "Format email tidak valid" }).max(255),
  password: z.string().min(8, { message: "Minimal 8 karakter" }).max(72),
});

function PasswordForm({
  mode,
  redirectTo,
}: {
  mode: "signin" | "signup";
  redirectTo: string;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Input tidak valid");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Berhasil masuk 🎉");
        navigate({ to: redirectTo as never, replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: displayName ? { display_name: displayName.trim() } : undefined,
          },
        });
        if (error) throw error;
        toast.success("Akun dibuat — silakan cek email untuk verifikasi.");
        navigate({ to: redirectTo as never, replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(mapAuthError(msg));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" && (
        <div className="space-y-1.5">
          <Label htmlFor="displayName">Nama tampilan</Label>
          <Input
            id="displayName"
            type="text"
            autoComplete="name"
            placeholder="Neko-chan"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor={`email-${mode}`}>Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`email-${mode}`}
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={`password-${mode}`}>Password</Label>
          {mode === "signin" && (
            <Link
              to="/reset-password"
              className="text-[11px] text-signal hover:underline"
            >
              Lupa password?
            </Link>
          )}
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`password-${mode}`}
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9"
            minLength={8}
            maxLength={72}
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            {mode === "signin" ? "Sign in" : "Create account"}
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}

function MagicLinkForm({ redirectTo }: { redirectTo: string }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().trim().email().max(255).safeParse(email);
    if (!parsed.success) {
      toast.error("Format email tidak valid");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data,
        options: {
          emailRedirectTo: window.location.origin + redirectTo,
          shouldCreateUser: true,
        },
      });
      if (error) throw error;
      setSent(true);
      toast.success("Magic link terkirim — cek inbox kamu.");
    } catch (err) {
      toast.error(mapAuthError(err instanceof Error ? err.message : "Gagal mengirim"));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-background/60 p-6 text-center">
        <div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-signal/10 text-signal">
          <Mail className="size-5" />
        </div>
        <h3 className="font-medium text-foreground">Cek inbox kamu</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Kami mengirim link login ke <span className="text-foreground">{email}</span>.
          Klik tautan untuk masuk.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="magic-email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="magic-email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Kami akan kirim tautan sekali-pakai ke email kamu — tanpa password.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            Send magic link <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}

function GoogleButton() {
  const [busy, setBusy] = useState(false);
  async function onClick() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(mapAuthError(result.error.message ?? String(result.error)));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal masuk dengan Google");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button
      variant="outline"
      className="w-full h-10"
      onClick={onClick}
      disabled={busy}
      type="button"
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <>
          <GoogleIcon /> Continue with Google
        </>
      )}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function mapAuthError(msg: string): string {
  const s = msg.toLowerCase();
  if (s.includes("invalid login")) return "Email atau password salah";
  if (s.includes("already registered")) return "Email sudah terdaftar — coba sign in";
  if (s.includes("email rate limit")) return "Terlalu banyak percobaan — coba lagi nanti";
  if (s.includes("password") && s.includes("weak")) return "Password terlalu lemah";
  if (s.includes("pwned")) return "Password ini pernah bocor — gunakan yang lain";
  return msg;
}