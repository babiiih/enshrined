import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type GateSession = { admin?: boolean };

function sessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    return null;
  }
  return {
    password,
    name: "ritual-admin",
    maxAge: 60 * 60 * 8, // 8h
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

function matches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export const checkAdmin = createServerFn({ method: "GET" }).handler(async () => {
  const cfg = sessionConfig();
  if (!cfg) return { admin: false };
  const s = await useSession<GateSession>(cfg);
  return { admin: !!s.data.admin };
});

export const unlockAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => {
    if (!data || typeof data.password !== "string" || data.password.length > 256) {
      throw new Error("bad input");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) return { ok: false as const, reason: "not-configured" };
    // Small artificial delay to blunt brute force on a single isolate.
    await new Promise((r) => setTimeout(r, 250));
    if (!matches(data.password, expected)) return { ok: false as const };
    const cfg = sessionConfig();
    if (!cfg) return { ok: false as const, reason: "not-configured" };
    const s = await useSession<GateSession>(cfg);
    await s.update({ admin: true });
    return { ok: true as const };
  });

export const lockAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const cfg = sessionConfig();
  if (!cfg) return { ok: true as const };
  const s = await useSession<GateSession>(cfg);
  await s.clear();
  return { ok: true as const };
});
