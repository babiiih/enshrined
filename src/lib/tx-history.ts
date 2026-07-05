// Lightweight cross-page tx history store with localStorage persistence.
// Populated by useRitualTx and read by /history.
import type { Hash } from "viem";

export type TxStatus = "signing" | "pending" | "confirmed" | "reverted" | "error";

export type TxEntry = {
  id: string;
  label: string;
  status: TxStatus;
  hash?: Hash;
  from?: `0x${string}`;
  error?: string;
  createdAt: number;
  updatedAt: number;
};

const KEY = "ritual.tx.history.v1";
const MAX = 100;
const listeners = new Set<() => void>();
let cache: TxEntry[] | null = null;

function read(): TxEntry[] {
  if (cache) return cache;
  if (typeof window === "undefined") return [];
  try {
    cache = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as TxEntry[];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(next: TxEntry[]) {
  cache = next.slice(0, MAX);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  }
  listeners.forEach((l) => l());
}

export function listTxHistory(): TxEntry[] {
  return read();
}

export function subscribeTxHistory(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function upsertTx(entry: Partial<TxEntry> & { id: string }) {
  const all = read().slice();
  const idx = all.findIndex((t) => t.id === entry.id);
  const now = Date.now();
  if (idx === -1) {
    all.unshift({
      label: "Transaction",
      status: "signing",
      createdAt: now,
      updatedAt: now,
      ...entry,
    } as TxEntry);
  } else {
    all[idx] = { ...all[idx], ...entry, updatedAt: now };
  }
  write(all);
}

export function clearTxHistory() {
  write([]);
}
