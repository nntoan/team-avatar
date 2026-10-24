#!/usr/bin/env node
// Summarize SWE-bench results: resolved rate per setup, a paired exact test, and cost.
//
//   node evals/team-avatar/swebench/summarize.mjs --dataset tasks.json --out <generate out dir> --report <report dir>

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), []),
);
const out = resolve(args.out);
const report = resolve(args.report);
mkdirSync(report, { recursive: true });
const tasks = JSON.parse(readFileSync(resolve(args.dataset), "utf8"));
const ids = tasks.map((t) => t.instance_id);
const repoOf = Object.fromEntries(tasks.map((t) => [t.instance_id, t.repo]));
const lines = (f) => (existsSync(f) ? readFileSync(f, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);

const results = {};
for (const r of lines(join(out, "eval", "results.jsonl"))) (results[r.model] ??= {})[r.instance_id] = r;
const meta = {};
for (const model of Object.keys(results)) for (const m of lines(join(out, "predictions", `${model}.meta.jsonl`))) (meta[model] ??= {})[m.instance_id] = m;

const runtimes = [["claude", "Claude Code"], ["codex", "Codex"]];
const arms = [
  ["without", "No workflow plugin"],
  ["with", "Team Avatar installed"],
  ["invoked", "Team Avatar, asked by name"],
  ["pstack", "pstack installed"],
  ["pstack-invoked", "pstack, asked by name"],
];
const present = (r) => arms.filter(([a]) => results[`${r}-${a}`]);
const resolvedSet = (model) => new Set(ids.filter((id) => results[model]?.[id]?.resolved));
const pct = (n, d) => (d ? `${((100 * n) / d).toFixed(0)}%` : "n/a");
const mean = (xs) => (xs.length ? xs.reduce((n, x) => n + x, 0) / xs.length : NaN);

// Exact two-sided McNemar test on the discordant pairs: tasks one setup solved and the other did not.
function mcnemar(b, c) {
  const n = b + c;
  if (n === 0) return 1;
  const k = Math.min(b, c);
  let tail = 0;
  for (let i = 0; i <= k; i++) {
    let comb = 1;
    for (let j = 0; j < i; j++) comb = (comb * (n - j)) / (j + 1);
    tail += comb / 2 ** n;
  }
  return Math.min(1, 2 * tail);
}

const rows = [];
const tests = [];
for (const [r, rl] of runtimes) {
  for (const [a, al] of present(r)) {
    const model = `${r}-${a}`;
    const graded = ids.filter((id) => results[model]?.[id]);
    const solved = resolvedSet(model);
    const m = Object.values(meta[model] ?? {});
    const cost = mean(m.map((x) => x.cost).filter((v) => typeof v === "number"));
    const byRepo = ["django/django", "sphinx-doc/sphinx"].map((repo) => {
      const inRepo = graded.filter((id) => repoOf[id] === repo);
      return `${inRepo.filter((id) => solved.has(id)).length}/${inRepo.length}`;
    });
    const skillRuns = m.filter((x) => (x.skills ?? []).length).length;
    rows.push(`| ${rl} | ${al} | **${solved.size}/${graded.length} (${pct(solved.size, graded.length)})** | ${byRepo.join(" | ")} | ${m.filter((x) => !x.patchLines).length} | ${a === "without" ? "n/a" : `${skillRuns}/${m.length}`} | ${Math.round(mean(m.map((x) => x.seconds)) / 6) / 10} min | ${Math.round(mean(m.map((x) => x.tokens ?? 0)) / 1000)}k${Number.isNaN(cost) ? "" : `, $${cost.toFixed(2)}`} |`);
  }
  const pairs = [
    ...present(r).filter(([x]) => x !== "without").map(([a, al]) => [`${r}-without`, `${r}-${a}`, `${al} vs no plugin`]),
    ...[["with", "pstack"], ["invoked", "pstack-invoked"]].filter(([x, y]) => results[`${r}-${x}`] && results[`${r}-${y}`])
      .map(([x, y]) => [`${r}-${y}`, `${r}-${x}`, `${arms.find(([a]) => a === x)[1]} vs ${arms.find(([a]) => a === y)[1]}`]),
  ];
  for (const [base, model, al] of pairs) {
    const both = ids.filter((id) => results[base]?.[id] && results[model]?.[id]);
    const s0 = resolvedSet(base);
    const s1 = resolvedSet(model);
    const gained = both.filter((id) => s1.has(id) && !s0.has(id));
    const lost = both.filter((id) => s0.has(id) && !s1.has(id));
    tests.push(`| ${rl} | ${al} | ${both.filter((id) => s1.has(id)).length - both.filter((id) => s0.has(id)).length >= 0 ? "+" : ""}${both.filter((id) => s1.has(id)).length - both.filter((id) => s0.has(id)).length} tasks | ${gained.length} | ${lost.length} | ${mcnemar(gained.length, lost.length).toFixed(3)} |`);
  }
}

const md = `# SWE-bench Verified Mini: Team Avatar, pstack, and plain Claude Code and Codex

[SWE-bench Verified Mini](https://huggingface.co/datasets/MariusHobbhahn/swe-bench-verified-mini) is 50 tasks from SWE-bench Verified (25 Django, 25 Sphinx). Each task is a real GitHub issue. A task counts as resolved only when the official \`swebench\` harness applies the agent's patch and the project's hidden tests pass, using the published task images.

Each setup got one attempt per task: the same checkout, the same issue text, and no hints. "No workflow plugin" runs the tool with every workflow plugin off. "Installed" turns on exactly one plugin, Team Avatar or pstack, and leaves the prompt alone. "Asked by name" also starts the prompt with that plugin's mode (\`avatar-mode\` or \`poteto-mode\`). Changes to files that the hidden test patch rewrites are dropped from every patch, so no setup is failed by a conflict with its own new tests.

| Tool | Setup | Resolved | Django | Sphinx | Empty patches | Runs that loaded a plugin skill | Time per task | Tokens per task |
|------|-------|---:|---:|---:|---:|---:|---:|---:|
${rows.join("\n")}

"Runs that loaded a plugin skill" counts Skill tool calls on Claude Code and skill files read on Codex. In the asked-by-name setups the prompt itself loads \`avatar-mode\` or \`poteto-mode\` in every run, so that column counts the runs that went on to load a second skill.

## Is the difference real?

The same 50 tasks ran in every setup, so the fair test is paired. It counts only the tasks one setup solved and the other did not. The p-value is an exact two-sided McNemar test. With 50 tasks, a p-value above 0.05 means the gap could be chance.

| Tool | Comparison | Net change | Solved only by the first | Solved only by the second | p-value |
|------|-----------|---:|---:|---:|---:|
${tests.join("\n")}
`;
writeFileSync(join(report, "README.md"), md);

const csv = ["model,instance_id,repo,resolved,status,seconds,tokens,cost_usd,patch_lines,skills"];
for (const model of Object.keys(results).sort()) for (const id of ids) {
  const r = results[model][id];
  const m = meta[model]?.[id] ?? {};
  if (r) csv.push([model, id, repoOf[id], r.resolved, r.status, m.seconds ?? "", m.tokens ?? "", m.cost ?? "", m.patchLines ?? "", (m.skills ?? []).join(" ")].join(","));
}
writeFileSync(join(report, "results.csv"), csv.join("\n") + "\n");
console.log(md);
