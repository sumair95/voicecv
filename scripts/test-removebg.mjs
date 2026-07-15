/**
 * Smoke-test remove.bg: validates REMOVEBG_API_KEY and shows output quality.
 * Uses the SAME params as the app (white bg, person, crop to headshot).
 *
 * Run: node scripts/test-removebg.mjs <image_url>
 * e.g. node scripts/test-removebg.mjs https://example.com/selfie.jpg
 * Saves the result next to this script as removebg-out.jpg — open it to judge quality.
 */
import { readFileSync, writeFileSync } from "node:fs";

const key = (() => {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*REMOVEBG_API_KEY\s*=\s*(.*)\s*$/);
    if (m) return m[1].replace(/^["']|["']$/g, "");
  }
  return "";
})();

if (!key) {
  console.error("❌ REMOVEBG_API_KEY missing from .env.local — add it, then rerun.");
  process.exit(1);
}
const imageUrl = process.argv[2];
if (!imageUrl) {
  console.error("Usage: node scripts/test-removebg.mjs <image_url>  (a face photo URL)");
  process.exit(1);
}
console.log(`🔑 key ${key.slice(0, 6)}…   image ${imageUrl}`);

const form = new URLSearchParams({
  image_url: imageUrl,
  size: "auto",
  type: "person",
  bg_color: "ffffff",
  crop: "true",
  crop_margin: "15%",
  format: "jpg",
});

const started = Date.now();
const res = await fetch("https://api.remove.bg/v1.0/removebg", {
  method: "POST",
  headers: { "X-Api-Key": key, "Content-Type": "application/x-www-form-urlencoded" },
  body: form.toString(),
});
const ms = Date.now() - started;

if (!res.ok) {
  const body = await res.text().catch(() => "");
  console.error(`\n❌ HTTP ${res.status} (${ms}ms)\n   ${body.slice(0, 300)}`);
  if (res.status === 403) console.error("   → key rejected");
  if (res.status === 402) console.error("   → out of credits");
  process.exit(1);
}

const bytes = Buffer.from(await res.arrayBuffer());
const outPath = new URL("./removebg-out.jpg", import.meta.url);
writeFileSync(outPath, bytes);
const credits = res.headers.get("x-credits-charged");
console.log(`\n✅ converted in ${ms}ms (${(bytes.length / 1024).toFixed(0)} KB, credits charged: ${credits ?? "?"})`);
console.log(`   saved: scripts/removebg-out.jpg — open it to check the white-bg headshot quality.`);
