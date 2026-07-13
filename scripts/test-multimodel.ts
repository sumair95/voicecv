/**
 * End-to-end test of the REAL multi-model orchestrator (Claude vs GPT-4o +
 * blind judge). Exercises the actual production code path — not a replica.
 *
 * Run: npx --yes tsx scripts/test-multimodel.ts
 * Loads keys from .env.local and forces CV_MULTI_MODEL=true.
 */
import { readFileSync } from "node:fs";
import type { QAPair } from "@/types/cv";

// Load .env.local into process.env BEFORE the providers read it.
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
process.env.CV_MULTI_MODEL = "true";

const qa: QAPair[] = [
  { field_key: "personal", question: "Your name and where you live?", answer: "Ahmed Khan, I live in Riyadh, Saudi Arabia. My number is 0555123456." },
  { field_key: "recent_job", question: "Your most recent job?", answer: "Construction site worker at a big building company for 3 years. I do concrete pouring, read basic drawings, follow safety rules, and help train new workers." },
  { field_key: "previous_roles", question: "Earlier jobs?", answer: "Before that I worked 2 years as a general labourer moving materials and mixing cement." },
  { field_key: "skills", question: "Your skills?", answer: "Scaffolding, forklift licence, concrete work, MIG welding basics, first aid." },
  { field_key: "spoken_languages", question: "Languages you speak?", answer: "Urdu native, Arabic good, English basic." },
  { field_key: "education", question: "Education?", answer: "Finished high school in Lahore." },
  { field_key: "certificates", question: "Certificates?", answer: "OSHA safety card, forklift licence." },
  { field_key: "hobbies", question: "Hobbies?", answer: "Cricket, cooking." },
  { field_key: "achievement", question: "An achievement?", answer: "Employee of the month twice, zero accidents on my team for 2 years." },
];

async function main() {
  const { generateBestCV } = await import("@/lib/cv-models/generate");

  console.log("=== Multi-model generation (CV_MULTI_MODEL=true) ===");
  console.log(`keys: ANTHROPIC=${process.env.ANTHROPIC_API_KEY ? "set" : "MISSING"}  OPENAI=${process.env.OPENAI_API_KEY ? "set" : "MISSING"}\n`);

  const started = Date.now();
  const { cvData, model, scores } = await generateBestCV(qa, "en", "en", []);
  const ms = Date.now() - started;

  console.log(`✅ done in ${(ms / 1000).toFixed(1)}s`);
  console.log("\nblind scores:");
  for (const s of scores) {
    console.log(`  ${s.won ? "🏆" : "  "} ${s.model.padEnd(18)} ${s.score}/10`);
  }
  console.log(`\nwinning model: ${model}`);
  console.log("winning CV preview:");
  console.log(`  name:      ${cvData.personal.full_name}`);
  console.log(`  objective: ${(cvData.objective || "").slice(0, 120)}…`);
  console.log(`  role:      ${cvData.experience?.[0]?.role}`);
  console.log(`  skills:    ${(cvData.skills || []).slice(0, 6).join(", ")}`);
  console.log(`  phone (faithful, should be +966...): ${cvData.personal.phone}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
