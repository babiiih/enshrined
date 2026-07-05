#!/usr/bin/env node
// Bundle-size budget gate. Reads dist/ output and fails if budgets are exceeded.
// Usage: node scripts/bundle-budget.mjs
import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

const BUDGETS = {
  initialJsGz: 260 * 1024, // 260 KB gz for entry chunks
  totalJsGz: 1.2 * 1024 * 1024, // 1.2 MB gz total JS
  singleChunkGz: 350 * 1024, // any single chunk
};

const DIST_CANDIDATES = ["dist", ".output/public", ".vinxi/build"];
const dist = DIST_CANDIDATES.find((d) => existsSync(d));
if (!dist) {
  console.error("[budget] No dist directory found; run `bun run build` first.");
  process.exit(2);
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (name.endsWith(".js") || name.endsWith(".mjs")) out.push({ path: p, size: st.size });
  }
  return out;
}

const files = walk(dist);
let totalGz = 0;
let initialGz = 0;
let worst = { path: "", gz: 0 };
const rows = [];

for (const f of files) {
  const gz = gzipSync(readFileSync(f.path)).length;
  totalGz += gz;
  const isEntry = /entry|index|start|root/i.test(f.path);
  if (isEntry) initialGz += gz;
  if (gz > worst.gz) worst = { path: f.path, gz };
  rows.push({ ...f, gz, isEntry });
}

rows.sort((a, b) => b.gz - a.gz);
console.log("\nTop 15 chunks (gz):");
for (const r of rows.slice(0, 15)) {
  console.log(`  ${(r.gz / 1024).toFixed(1).padStart(7)} KB  ${r.path}`);
}

const fails = [];
if (initialGz > BUDGETS.initialJsGz)
  fails.push(`Initial JS gz ${(initialGz / 1024).toFixed(1)}KB > ${(BUDGETS.initialJsGz / 1024).toFixed(0)}KB`);
if (totalGz > BUDGETS.totalJsGz)
  fails.push(`Total JS gz ${(totalGz / 1024).toFixed(1)}KB > ${(BUDGETS.totalJsGz / 1024).toFixed(0)}KB`);
if (worst.gz > BUDGETS.singleChunkGz)
  fails.push(`Chunk ${worst.path} (${(worst.gz / 1024).toFixed(1)}KB) > ${(BUDGETS.singleChunkGz / 1024).toFixed(0)}KB`);

console.log(
  `\nSummary: total=${(totalGz / 1024).toFixed(1)}KB gz, initial=${(initialGz / 1024).toFixed(1)}KB gz, worst=${(worst.gz / 1024).toFixed(1)}KB`,
);

if (fails.length) {
  console.error("\n[budget] FAIL:");
  for (const f of fails) console.error("  ✗ " + f);
  process.exit(1);
}
console.log("[budget] OK — all under budget.");
