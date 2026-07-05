import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password · Ritual" },
      { name: "description", content: "Reset password akun Ritual kamu." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [recoveryMode, setRecoveryMode] = useState(false);

  // Detect password-recovery deep link — Supabase sends type=recovery in the URL hash.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setRecoveryMode(true);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecoveryMode(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-10 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-signal/20 blur-3xl"
      />
      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-border bg-card/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl">
          <div className="text-center">
            <h1 className="font-serif text-3xl gold-text">
              {recoveryMode ? "Set password baru" : "Reset password"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {recoveryMode
                ? "Masukkan password baru untuk akun kamu."
                : "Masukkan email kamu, kami akan kirim tautan reset."}
            </p>
          </div>
          <div className="mt-6">
            {recoveryMode ? <NewPasswordForm /> : <RequestResetForm />}
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/auth" className="hover:text-foreground transition-colors">
            ← Kembali ke sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

function RequestResetForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().trim().email().max(255).safeParse(email);
    if (!parsed.success) return toast.error("Format email tidak valid");
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      setSent(true);
      toast.success("Tautan reset dikirim ke email kamu");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-background/60 p-6 text-center">
        <Mail className="mx-auto mb-2 size-6 text-signal" />
        <p className="text-sm text-foreground">Cek inbox kamu untuk tautan reset.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="reset-email">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
            placeholder="you@example.com"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <>Send reset link <ArrowRight className="size-4" /></>}
      </Button>
    </form>
  );
}

function NewPasswordForm() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Minimal 8 karakter");
    if (password !== confirm) return toast.error("Password tidak sama");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password diperbarui");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="new-password">Password baru</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm-password">Konfirmasi password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : "Update password"}
      </Button>
    </form>
  );
}