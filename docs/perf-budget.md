# Performance Budget — Ritual Docs Explorer

Target metrics (mobile, 4G, Moto G-class):

| Metric | Budget | Notes |
| --- | --- | --- |
| LCP    | ≤ 2.0s | Aurora + hero copy; no LCP image on `/`. |
| CLS    | ≤ 0.05 | Reserve height for 3D mascot & marquee. |
| INP    | ≤ 200ms | Debounce cursor spotlight, throttle motion. |
| TBT    | ≤ 200ms | Privy stack is `React.lazy` — do not eager-import. |
| Initial JS | ≤ 250KB gz | Router + React + shadcn + wagmi shim only. |
| Route chunk | ≤ 120KB gz | Motion primitives lazy per-route. |
| 3D chunk | ≤ 300KB gz (three + drei subset) | Mount via IntersectionObserver. |

## Guardrails already in place

- `defaultPreload: "intent"` — hover prefetch, no eager route loading.
- Privy/wagmi stack code-split via `React.lazy` (`privy-wallet-stack.tsx`).
- 3D canvas mounts only when in viewport, `dpr` capped 1.5, antialias off, `powerPreference: low-power`.
- On-chain reads cached (15s TTL) + de-duped (`onchain-cache.ts`); Portfolio refresh debounced 4s.
- Aurora / Meteors / Marquee / 3D bob honor `prefers-reduced-motion`.
- Tx history stored client-side (no RPC poll) via `tx-history.ts`.

## Manual audit

```
bun run build
# Analyze chunks:
du -sh dist/**/*.js | sort -h | tail -20
# Lighthouse (CI-friendly):
bunx lighthouse http://localhost:8080 --preset=desktop --quiet --chrome-flags="--headless"
bunx lighthouse http://localhost:8080 --form-factor=mobile --throttling.cpuSlowdownMultiplier=4 --quiet
```

Fail the PR if any budget above is exceeded by >10%.
