# Security Audit — Ritual dApp

Ringkasan hardening yang sudah dilakukan dan yang masih perlu dilakukan
setelah audit "sudah full dApp / aman?".

## ✅ Sudah dikerjakan

### Admin gate (`/admin/vitals`)
- Route diproteksi via `loader → checkAdmin()` (server session cookie, httpOnly,
  secure, sameSite=lax, 8 jam) di `src/lib/admin-gate.functions.ts`.
- Password disimpan sebagai secret `ADMIN_PASSWORD` (server-only) dan diverifikasi
  timing-safe (SHA-256 → `timingSafeEqual`). Session dienkripsi dengan
  `SESSION_SECRET` (64 char).
- Delay 250ms per attempt untuk blunt brute-force pada single isolate.
- Halaman unlock terpisah di `/admin/unlock`, `robots: noindex,nofollow`.

### `/api/public/vitals` hardening
- Rate limit token-bucket per-IP: 60 req/min.
- Cap body 2KB, wajib `content-type` JSON/text.
- Whitelist metric name (LCP/CLS/INP/FCP/TTFB), validasi range value (0–600000),
  sanitize `path` (strip query/hash, char allowlist, max 120 char).
- GET response: `x-robots-tag: noindex,nofollow`, `cache-control: no-store`.

### Wallet & tx safety (existing)
- `useRitualTx` menggabungkan sign → pending → confirmed/reverted, auto-switch
  chain 1979.
- Swap card sudah punya slippage selector (0.1 / 0.5 / 1%) dan `Min received`.
- Portfolio pakai TTL cache + dedup + debounce 4s.

## ⚠️ Belum dikerjakan (action items berikutnya)

1. **Allowance flow di swap** — belum cek `allowance()` sebelum `approve()`;
   kalau nanti swap dipoint ke DEX real, wajib approve-if-needed + max-uint
   opsional.
2. **Gas preview** — belum ada `estimateGas` yang ditampilkan sebelum sign.
   Rekomendasi: tambah `publicClient.estimateGas` di `useRitualTx.send()` dan
   render di toast sebelum walletClient dipanggil.
3. **Marketplace contract** — `src/lib/contracts/artifacts.json` cuma berisi
   ABI + bytecode. Sumber Solidity tidak ada di repo. Sebelum production:
    - audit reentrancy pada `buy()` (harus pakai OpenZeppelin `ReentrancyGuard`
      atau pola checks-effects-interactions);
    - verifikasi di explorer Ritual;
    - tambah royalty (EIP-2981) & fee cap;
    - cancel-listing + expiry.
4. **Tx history durability** — sekarang localStorage only, hilang antar-device.
   Kalau perlu cross-device, sinkron ke Lovable Cloud table dengan RLS.
5. **Rate limit vitals** in-memory → reset saat cold start. Untuk retensi
   panjang, pindahkan ke Lovable Cloud KV/table.
6. **CSP / security headers** — belum ada `Content-Security-Policy`,
   `Referrer-Policy`, `Permissions-Policy` di root response headers.
7. **Sentry / observability** — hanya `reportLovableError`. Bisa disambung ke
   Sentry / Logtail lewat server function.

## Env vars wajib

| Var | Type | Kegunaan |
| --- | --- | --- |
| `SESSION_SECRET` | server, 64 char | enkripsi cookie admin session |
| `ADMIN_PASSWORD` | server | password `/admin/unlock` |
| `PRIVY_APP_ID` | server (via `/api/wallet-config`) | Privy login |
| `WALLETCONNECT_PROJECT_ID` | server | WalletConnect QR |

Semua sudah dikonfigurasi lewat Lovable Cloud secrets.
