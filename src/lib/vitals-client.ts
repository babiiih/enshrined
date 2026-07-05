// Client-side Web Vitals collector. Sends beacons to /api/public/vitals
// and mirrors to localStorage for offline / admin fallback.
import { onLCP, onCLS, onINP, onFCP, onTTFB, type Metric } from "web-vitals";

const LS_KEY = "ritual.vitals.v1";
const MAX_LOCAL = 100;

function persist(m: {
  id: string;
  name: string;
  value: number;
  rating: string;
  path: string;
  ts: number;
}) {
  try {
    const cur = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as unknown[];
    cur.unshift(m);
    localStorage.setItem(LS_KEY, JSON.stringify(cur.slice(0, MAX_LOCAL)));
  } catch {
    /* ignore */
  }
}

function send(m: Metric) {
  const payload = {
    id: m.id,
    name: m.name,
    value: Math.round(m.name === "CLS" ? m.value * 1000 : m.value),
    rating: m.rating,
    path: location.pathname,
    ts: Date.now(),
  };
  persist(payload);
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/public/vitals", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/public/vitals", {
        method: "POST",
        keepalive: true,
        headers: { "content-type": "application/json" },
        body,
      });
    }
  } catch {
    /* ignore */
  }
}

let started = false;
export function startVitals() {
  if (started || typeof window === "undefined") return;
  started = true;
  onLCP(send);
  onCLS(send);
  onINP(send);
  onFCP(send);
  onTTFB(send);
}

export function readLocalVitals(): Array<{
  id: string;
  name: string;
  value: number;
  rating: string;
  path: string;
  ts: number;
}> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]");
  } catch {
    return [];
  }
}
