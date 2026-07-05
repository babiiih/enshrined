import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkAdmin, unlockAdmin } from "@/lib/admin-gate.functions";

export const Route = createFileRoute("/admin/unlock")({
  head: () => ({
    meta: [
      { title: "Admin · Unlock" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  loader: async () => {
    const { admin } = await checkAdmin();
    if (admin) throw redirect({ to: "/admin/vitals" });
    return null;
  },
  component: Unlock,
});

function Unlock() {
  const router = useRouter();
  const unlock = useServerFn(unlockAdmin);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await unlock({ data: { password: pw } });
      if (res.ok) {
        await router.navigate({ to: "/admin/vitals" });
      } else {
        setErr(res.reason === "not-configured" ? "ADMIN_PASSWORD not configured" : "Incorrect password");
      }
    } catch {
      setErr("Request failed");
    }
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" /> Admin area
        </div>
        <h1 className="text-2xl font-serif">Unlock observability</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="Admin password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            maxLength={256}
            required
          />
          {err && <p className="text-xs text-rose-400">{err}</p>}
          <Button type="submit" disabled={busy || !pw} className="w-full">
            {busy ? "Checking…" : "Enter"}
          </Button>
        </form>
        <p className="text-[11px] text-muted-foreground">
          Session lasts 8 hours. Rate-limited server-side.
        </p>
      </Card>
    </div>
  );
}
