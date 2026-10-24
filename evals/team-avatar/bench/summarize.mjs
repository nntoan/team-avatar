#!/usr/bin/env node
// Turn benchmark results into a report, a CSV of every run, and a chart page.
//
//   node evals/team-avatar/bench/summarize.mjs --in <bench out dir> --out <report dir>

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = resolve(fileURLToPath(import.meta.url), "..");
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), []),
);
const input = resolve(args.in);
const output = resolve(args.out);
mkdirSync(output, { recursive: true });

const tasks = JSON.parse(readFileSync(join(HERE, "tasks.json"), "utf8")).tasks;
const runtimes = [["claude", "Claude Code"], ["codex", "Codex"]];
const arms = [["without", "Without Team Avatar", "#2a78d6"], ["with", "Team Avatar installed", "#eb6834"], ["invoked", "Team Avatar, asked by name", "#1baf7a"]];
const runs = {};
for (const [r] of runtimes) for (const [a] of arms) {
  const f = join(input, r, a, "results.json");
  runs[`${r}/${a}`] = existsSync(f) ? JSON.parse(readFileSync(f, "utf8")).results : [];
}
const present = arms.filter(([a]) => runtimes.some(([r]) => runs[`${r}/${a}`].length));

const mean = (xs) => (xs.length ? xs.reduce((n, x) => n + x, 0) / xs.length : NaN);
const pct = (x) => (Number.isNaN(x) ? "n/a" : `${Math.round(x * 100)}`);
const pick = (r, a, t) => runs[`${r}/${a}`].filter((x) => !t || x.task === t);
const scores = (r, a, t) => pick(r, a, t).map((x) => x.score);
const range = (xs) => (xs.length ? `${pct(Math.min(...xs))}-${pct(Math.max(...xs))}` : "");
const rate = (xs, f) => (xs.length ? xs.filter(f).length / xs.length : NaN);

const csv = ["runtime,arm,task,rep,score,seconds,tokens,cost_usd,long_dashes,stray_files,ran_code,regression_test,reported_measurement,skills,detail"];
for (const [r] of runtimes) for (const [a] of arms) for (const x of runs[`${r}/${a}`]) {
  csv.push([r, a, x.task, x.rep, x.score.toFixed(3), x.seconds, x.tokens ?? "", x.cost ?? "", x.longDashes ?? "", x.strayFiles ?? "", x.ranCode ?? "",
    x.regressionTest ?? "", x.reportedMeasurement ?? "", (x.skills ?? []).join(" "), `"${String(x.detail).replace(/"/g, "'")}"`].join(","));
}
writeFileSync(join(output, "runs.csv"), csv.join("\n") + "\n");

const head = `| Task | ${runtimes.flatMap(([, rl]) => present.map(([, al]) => `${rl}: ${al}`)).join(" | ")} |`;
const sep = `|------|${runtimes.flatMap(() => present.map(() => "---:")).join("|")}|`;
const taskRows = tasks.map((t) => `| ${t.id} | ${runtimes.flatMap(([r]) => present.map(([a]) => {
  const xs = scores(r, a, t.id);
  return xs.length ? `${pct(mean(xs))} <sub>(${range(xs)})</sub>` : "n/a";
})).join(" | ")} |`);
const allRow = `| **All tasks** | ${runtimes.flatMap(([r]) => present.map(([a]) => `**${pct(mean(scores(r, a)))}**`)).join(" | ")} |`;

const disciplineRows = runtimes.flatMap(([r, rl]) => present.map(([a, al]) => {
  const all = pick(r, a);
  const fixes = pick(r, a, "root-cause-fix");
  const perf = pick(r, a, "perf-without-regression");
  const cost = mean(all.map((x) => x.cost).filter((v) => typeof v === "number"));
  return `| ${rl} | ${al} | ${pct(rate(fixes, (x) => x.regressionTest))}% | ${pct(rate(perf, (x) => x.reportedMeasurement))}% | ${pct(rate(all, (x) => (x.longDashes ?? 0) === 0))}% | ${mean(all.map((x) => x.strayFiles ?? 0)).toFixed(1)} | ${Math.round(mean(all.map((x) => x.seconds)))}s | ${Math.round(mean(all.map((x) => x.tokens ?? 0)) / 1000)}k${Number.isNaN(cost) ? "" : `, $${cost.toFixed(2)}`} |`;
}));

const reps = Math.max(...Object.values(runs).map((xs) => Math.max(0, ...xs.map((x) => x.rep))));
const md = `# Team Avatar benchmark

Scores are 0 to 100: the mean of ${reps} runs per cell, with the lowest and highest run in brackets. Every run started from the same fresh repo and the same prompt. "Without" is the tool with no workflow plugins. "Installed" adds only the Team Avatar plugin and leaves the prompt alone. "Asked by name" also starts the prompt with avatar mode. Hidden graders score the work after the agent finishes, and the agent never sees them.

${tasks.map((t) => `- **${t.id}.** ${t.measures}`).join("\n")}

${head}
${sep}
${taskRows.join("\n")}
${allRow}

## Engineering discipline

| Tool | Setup | Bug fix ships a regression test | Perf reply reports a measured number | Replies with no long dash | Stray files left per run | Time per run | Tokens per run |
|------|-------|---:|---:|---:|---:|---:|---:|
${disciplineRows.join("\n")}

A regression test counts only when the agent's tests fail against the original buggy code. Stray files are files outside the ones the task needed, such as scratch scripts left in the repo.

Every run, its score, and the grader's reason are in [runs.csv](runs.csv).
`;
writeFileSync(join(output, "README.md"), md);

const W = 560, rowH = 20 * present.length + 18, top = 70, left = 200, barW = 250;
const panel = (r, label, x0) => {
  const bars = tasks.map((t, i) => {
    const y = top + i * rowH;
    const group = present.map(([a, al, color], j) => {
      const v = mean(scores(r, a, t.id));
      if (Number.isNaN(v)) return "";
      const w = Math.max(2, v * barW);
      const yy = y + j * 18;
      return `<rect x="${left}" y="${yy}" width="${w}" height="14" rx="4" fill="${color}"><title>${label}, ${t.id}, ${al}: ${pct(v)}</title></rect><text class="val" x="${left + w + 6}" y="${yy + 11}">${pct(v)}</text>`;
    }).join("");
    return `<text class="task" x="${left - 10}" y="${y + 9 * present.length + 4}" text-anchor="end">${t.id}</text>${group}`;
  }).join("");
  return `<g transform="translate(${x0},0)"><text class="panel" x="${left}" y="34">${label}: all tasks ${present.map(([a]) => pct(mean(scores(r, a)))).join(" / ")}</text>${bars}</g>`;
};
const H = top + tasks.length * rowH + 4;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W * 2} ${H}" width="${W * 2}" height="${H}" role="img" aria-label="Team Avatar benchmark scores by task">${panel("claude", "Claude Code", 0)}${panel("codex", "Codex", W)}</svg>`;
const html = `<!doctype html><meta charset="utf-8"><title>Team Avatar benchmark</title><style>
body{margin:0;background:#fcfcfb;color:#1f1f1d;font:15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:28px 32px}
h1{font-size:22px;margin:0 0 4px} p{margin:0 0 12px;color:#5b5a54}
.legend{display:flex;gap:18px;color:#5b5a54;font-size:14px}.legend i{display:inline-block;width:12px;height:12px;border-radius:3px;margin-right:6px;vertical-align:-1px}
.task{fill:#5b5a54;font-size:13px}.val{fill:#1f1f1d;font-size:12px;font-variant-numeric:tabular-nums}.panel{fill:#1f1f1d;font-size:16px;font-weight:600}
</style><h1>Team Avatar benchmark</h1><p>Mean score out of 100 over ${reps} runs per task, graded by hidden tests the agent never sees.</p>
<div class="legend">${present.map(([, al, c]) => `<span><i style="background:${c}"></i>${al}</span>`).join("")}</div>${svg}`;
writeFileSync(join(output, "chart.html"), html);
for (const [r, rl] of runtimes) console.log(`${rl}: ${present.map(([a, al]) => `${al} ${pct(mean(scores(r, a)))}`).join(", ")}`);
