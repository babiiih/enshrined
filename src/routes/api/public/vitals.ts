// In-memory ring buffer for Web Vitals beacons + light abuse guards.
// Resets on Worker cold start.
import { createFileRoute } from "@tanstack/react-router";
import { getRequestIP } from "@tanstack/react-start/server";

type Metric = {
  id: string;
  name: "LCP" | "CLS" | "INP" | "FCP" | "TTFB";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  path: string;
  ua: string;
  ts: number;
};

const buf: Metric[] = [];
const MAX = 500;
const MAX_BODY_BYTES = 2_000;
const VALID_NAMES = new Set(["LCP", "CLS", "INP", "FCP", "TTFB"]);

// Token bucket per IP (60 req/min).
const buckets = new Map<string, { tokens: number; ts: number }>();
function allow(ip: string) {
  const now = Date.now();
  const cap = 60;
  const refillPerMs = 60 / 60_000;
  const b = buckets.get(ip) ?? { tokens: cap, ts: now };
  b.tokens = Math.min(cap, b.tokens + (now - b.ts) * refillPerMs);
  b.ts = now;
  if (b.tokens < 1) {
    buckets.set(ip, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(ip, b);
  // Cheap GC: keep map bounded.
  if (buckets.size > 5000) {
    for (const k of buckets.keys()) {
      buckets.delete(k);
      if (buckets.size < 2500) break;
    }
  }
  return true;
}

function sanitizePath(p: unknown): string {
  const s = typeof p === "string" ? p : "/";
  // strip query / hash, cap length, allow only safe chars
  const clean = s.split("?")[0].split("#")[0].replace(/[^\w\-/._~]/g, "");
  return clean.slice(0, 120) || "/";
}

export const Route = createFileRoute("/api/public/vitals")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getRequestIP({ xForwardedFor: true }) ?? "unknown";
        if (!allow(ip)) return new Response("rate limited", { status: 429 });

        const ctype = request.headers.get("content-type") ?? "";
        if (!ctype.includes("application/json") && !ctype.includes("text/plain")) {
          return new Response("bad content-type", { status: 415 });
        }
        const raw = await request.text();
        if (raw.length > MAX_BODY_BYTES) return new Response("too large", { status: 413 });

        let body: Partial<Metric>;
        try {
          body = JSON.parse(raw) as Partial<Metric>;
        } catch {
          return new Response("bad json", { status: 400 });
        }
        if (
          !body?.name ||
          !VALID_NAMES.has(body.name as string) ||
          typeof body.value !== "number" ||
          !Number.isFinite(body.value) ||
          body.value < 0 ||
          body.value > 600_000
        ) {
          return new Response("bad payload", { status: 400 });
        }

        const entry: Metric = {
          id: String(body.id ?? crypto.randomUUID()).slice(0, 64),
          name: body.name as Metric["name"],
          value: body.value,
          rating:
            body.rating === "good" || body.rating === "needs-improvement" || body.rating === "poor"
              ? body.rating
              : "needs-improvement",
          path: sanitizePath(body.path),
          ua: (request.headers.get("user-agent") ?? "").slice(0, 160),
          ts: Date.now(),
        };
        buf.unshift(entry);
        if (buf.length > MAX) buf.length = MAX;
        // Best-effort persistence to Cloud (survives cold starts).
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          // Table may not exist yet on freshly connected Cloud — cast to any to skip typing.
          await (supabaseAdmin as any).from("web_vitals").insert({
            metric_name: entry.name,
            value: entry.value,
            rating: entry.rating,
            path: entry.path,
            ua: entry.ua,
          });
        } catch {
          // ignore — ring buffer still has the data
        }
        return new Response("ok", { status: 202 });
      },
      GET: async () =>
        Response.json(
          { count: buf.length, metrics: buf },
          {
            headers: {
              "cache-control": "no-store",
              "x-robots-tag": "noindex, nofollow",
            },
          },
        ),
    },
  },
});
