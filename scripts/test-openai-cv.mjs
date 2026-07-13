/**
 * Smoke-test the OpenAI (GPT) CV provider path: verifies the existing
 * OPENAI_API_KEY has chat-completions access and gpt-4o returns parseable CV
 * JSON with response_format=json_object. Run: node scripts/test-openai-cv.mjs
 */
import { readFileSync } from "node:fs";

function loadEnv() {
  const txt = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

const key = loadEnv().OPENAI_API_KEY;
if (!key) { console.error("❌ OPENAI_API_KEY missing from .env.local"); process.exit(1); }
console.log(`🔑 OPENAI_API_KEY ${key.slice(0, 7)}…`);

const system = `You are a professional CV writer. Return ONLY a JSON object:
{"personal":{"full_name":"string","city":"string","country":"string"},"objective":"string","experience":[{"company":"string","role":"string","duration":"string","description":"string"}],"skills":["string"]}`;
const user = `Answers: name Ahmed, lives Riyadh Saudi Arabia. Job: construction site worker at BuildCo, 3 years, does concrete + safety. Skills: scaffolding, forklift licence. Write the CV JSON in English now.`;

const started = Date.now();
const res = await fetch("https://api.openai.com/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "gpt-4o",
    max_tokens: 800,
    response_format: { type: "json_object" },
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
  }),
});
const ms = Date.now() - started;

if (!res.ok) {
  const body = await res.text().catch(() => "");
  console.error(`\n❌ HTTP ${res.status} (${ms}ms)\n   ${body.slice(0, 300)}`);
  if (res.status === 401) console.error("   → key rejected for chat completions");
  if (res.status === 404 || /model/i.test(body)) console.error("   → gpt-4o not available on this key/plan");
  process.exit(1);
}

const data = await res.json();
const content = data.choices?.[0]?.message?.content ?? "";
try {
  const cv = JSON.parse(content);
  console.log(`\n✅ gpt-4o returned valid CV JSON (${ms}ms)`);
  console.log(`   name: ${cv.personal?.full_name}  role: ${cv.experience?.[0]?.role}`);
  console.log(`   skills: ${(cv.skills || []).join(", ")}`);
  console.log("\n→ The OpenAI provider will work when CV_MULTI_MODEL=true.");
} catch {
  console.error("\n❌ Response was not valid JSON:\n" + content.slice(0, 300));
  process.exit(1);
}
