/**
 * Isolated Adzuna smoke test — verifies credentials + Australia coverage +
 * that the exact URL our provider builds returns usable results.
 *
 * Run:  node scripts/test-adzuna.mjs
 * Reads ADZUNA_APP_ID / ADZUNA_APP_KEY from .env.local (no framework needed).
 */
import { readFileSync } from "node:fs";

function loadEnv() {
  let txt = "";
  try {
    txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  } catch {
    console.error("❌ .env.local not found");
    process.exit(1);
  }
  const env = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const appId = env.ADZUNA_APP_ID;
const appKey = env.ADZUNA_APP_KEY;
if (!appId || !appKey) {
  console.error("❌ ADZUNA_APP_ID / ADZUNA_APP_KEY missing from .env.local");
  process.exit(1);
}
console.log(`🔑 app_id ${appId.slice(0, 4)}…  app_key ${appKey.slice(0, 4)}…`);

async function search(country, what, where) {
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", "20");
  url.searchParams.set("what", what);
  if (where) url.searchParams.set("where", where);
  url.searchParams.set("content-type", "application/json");

  const started = Date.now();
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  const ms = Date.now() - started;
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    console.log(`\n❌ ${country} "${what}" -> HTTP ${r.status} (${ms}ms)\n   ${body.slice(0, 200)}`);
    return;
  }
  const data = await r.json();
  const rows = Array.isArray(data.results) ? data.results : [];
  console.log(`\n✅ ${country} "${what}"${where ? ` in ${where}` : ""} -> ${rows.length} results, count=${data.count} (${ms}ms)`);
  for (const j of rows.slice(0, 3)) {
    console.log(`   • ${j.title} — ${j.company?.display_name ?? "?"} (${j.location?.display_name ?? "?"})`);
  }
}

console.log("\n=== Adzuna smoke test ===");
await search("au", "Early Childhood Educator", "Melbourne"); // the JSearch dead zone
await search("gb", "electrician", "London"); // sanity: another supported market
