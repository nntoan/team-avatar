#!/usr/bin/env node
// Flag runs that may have seen their own answer: another setup's work, log, patch, or
// grade for the same task, or a dataset file that carries every gold patch.
//
//   node evals/team-avatar/swebench/audit.mjs --out <generate out dir> [--root <benchmark root>]
//
// Every run shares one machine, so isolation is checked after the fact from each run's
// own event log. A flagged run is rerun, not quietly kept. Looking at other tasks' files
// cannot leak this task's answer, so it is noted but not disqualifying.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), []),
);
const out = resolve(args.out);
const root = resolve(args.root ?? dirname(out));
const logs = join(out, "logs");
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const pathPattern = new RegExp(`${escape(root)}[^"'\\s\\\\]*`, "g");
const flagged = [];
const noted = [];

for (const model of existsSync(logs) ? readdirSync(logs) : []) {
  for (const file of readdirSync(join(logs, model)).filter((f) => f.endsWith(".jsonl"))) {
    const id = file.replace(".jsonl", "");
    const own = join(out, "work", model, id);
    const text = readFileSync(join(logs, model, file), "utf8");
    const leaks = new Set();
    const peeks = new Set();
    for (const [path] of text.matchAll(pathPattern)) {
      if (path.startsWith(own)) continue;
      if (/(verified-)?mini\.json/.test(path)) leaks.add(path);
      else if (/\/(logs|predictions|eval|claims|work)\//.test(path)) (path.includes(id) ? leaks : peeks).add(path);
    }
    for (const [name] of text.matchAll(/(verified-mini|mini)\.json|SWE-bench_Verified|swe-bench-verified-mini/g)) leaks.add(name);
    if (leaks.size) flagged.push({ model, instance_id: id, paths: [...leaks].slice(0, 5) });
    else if (peeks.size) noted.push({ model, instance_id: id, paths: [...peeks].slice(0, 3) });
  }
}

writeFileSync(join(out, "audit.json"), JSON.stringify({ flagged, noted }, null, 2));
for (const f of flagged) console.log(`LEAK ${f.model} ${f.instance_id}: ${f.paths.join(" ")}`);
for (const f of noted) console.log(`note ${f.model} ${f.instance_id}: ${f.paths.join(" ")}`);
console.log(`${flagged.length} run(s) may have seen their own answer, ${noted.length} looked at other tasks' files. Details in ${join(out, "audit.json")}`);
