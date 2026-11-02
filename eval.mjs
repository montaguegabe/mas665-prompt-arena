#!/usr/bin/env node
// Team Auto eval runner. Dependency-free (Node 18+ fetch).
//   SERVER_URL=http://host:4100 TEAM_KEY=... node eval.mjs [prompt.txt]
// Reads the system prompt from prompt.txt (the ONLY thing you can change), submits it to the
// locked harness, prints the score, writes results.jsonl (one line per case) and summary.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SERVER_URL = (process.env.SERVER_URL || 'http://localhost:4100').replace(/\/$/, '');
const TEAM_KEY = process.env.TEAM_KEY;
if (!TEAM_KEY) { console.error('Set TEAM_KEY (and SERVER_URL) in the environment.'); process.exit(1); }
const promptPath = process.argv[2] || join(here, 'prompt.txt');
const system_prompt = readFileSync(promptPath, 'utf8').trim();

const started = Date.now();
const res = await fetch(`${SERVER_URL}/api/submit`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'ngrok-skip-browser-warning': '1' }, // the header skips ngrok's free-plan interstitial
  body: JSON.stringify({ team_key: TEAM_KEY, system_prompt })
});
const data = await res.json();
if (!res.ok) { console.error(`submit failed (${res.status}):`, data.error || data); process.exit(1); }

const lines = data.per_case.map((c) => JSON.stringify({
  id: c.id,
  tags: c.tags,
  request: c.request,
  expected: c.expected,
  output: c.output,
  transcript: c.transcript,
  model: c.model,
  usage: c.usage,
  grade: { score: c.score, tool_correct: c.grade.tool_correct, arg_f1: c.grade.arg_f1, key_detail: c.grade.key_detail }
}));
writeFileSync(join(here, 'results.jsonl'), lines.join('\n') + '\n');

const byTag = {};
for (const c of data.per_case) for (const t of c.tags || []) { (byTag[t] ??= []).push(c.score); }
const summary = {
  submission_id: data.submission_id,
  model: data.model,
  score: data.score,
  cases: data.per_case.length,
  failures: data.per_case.filter((c) => c.score < 1).map((c) => c.id),
  by_tag: Object.fromEntries(Object.entries(byTag).map(([t, s]) => [t, { n: s.length, mean: 100 * s.reduce((a, b) => a + b, 0) / s.length }])),
  server_elapsed_ms: data.elapsed_ms,
  wall_ms: Date.now() - started,
  prompt_sha256: await sha(system_prompt)
};
writeFileSync(join(here, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');

console.log(`score: ${data.score.toFixed(1)}%   (${summary.failures.length} of ${summary.cases} cases lost points; ${data.elapsed_ms} ms server time, ${data.cached} cached)`);
for (const c of data.per_case.filter((c) => c.score < 1)) {
  console.log(`  ${c.id}  ${c.score.toFixed(2)}  expected ${c.expected.tool}  got ${c.output.tool ?? 'PARSE ERROR'}   ${c.request}`);
}
console.log('wrote results.jsonl and summary.json');

async function sha(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
