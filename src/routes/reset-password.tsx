import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: () => (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card/70 backdrop-blur p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-foreground">Password Reset</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Password reset is handled by Privy. Please use the Sign in page to
          reset your password via email or Google.
        </p>
        <Link
          to="/auth"
          className="mt-6 inline-flex items-center gap-2 text-signal hover:underline"
        >
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </div>
    </div>
  ),
});
