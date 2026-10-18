#!/usr/bin/env node
// Merge Claude Code and Codex results into one Markdown report and copy each
// run's final reply beside it.
//
//   node evals/team-avatar/report.mjs --in <results dir> --out <report dir>

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = resolve(fileURLToPath(import.meta.url), "..");
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), []),
);
const input = resolve(args.in);
const output = resolve(args.out);
const runtimes = ["claude", "codex"];
const label = { claude: "Claude Code", codex: "Codex" };
const cases = JSON.parse(readFileSync(join(HERE, "cases.json"), "utf8")).cases;
const results = Object.fromEntries(
  runtimes.map((r) => {
    const file = join(input, r, "results.json");
    return [r, existsSync(file) ? Object.fromEntries(JSON.parse(readFileSync(file, "utf8")).results.map((x) => [x.id, x])) : {}];
  }),
);

mkdirSync(join(output, "replies"), { recursive: true });
const cell = (r, id) => {
  const x = results[r][id];
  if (!x) return "not run";
  return `${x.pass ? "pass" : "**fail**"} (${x.seconds}s)`;
};
const totals = runtimes.map((r) => {
  const xs = Object.values(results[r]);
  return `${label[r]} passed ${xs.filter((x) => x.pass).length} of ${xs.length}`;
});

const rows = cases.map((c) => {
  for (const r of runtimes) {
    const src = join(input, r, "logs", `${c.id}.final.txt`);
    if (existsSync(src)) copyFileSync(src, join(output, "replies", `${r}-${c.id}.txt`));
  }
  const evidence = results.claude[c.id]?.checks ?? results.codex[c.id]?.checks ?? [];
  return `| \`${c.id}\` | ${c.kind} | ${cell("claude", c.id)} | ${cell("codex", c.id)} | ${evidence.map((k) => k.type).join(", ")} |`;
});

const failures = runtimes.flatMap((r) =>
  Object.values(results[r]).filter((x) => !x.pass).map((x) => `- ${label[r]} \`${x.id}\`: ${x.checks.filter((k) => !k.pass).map((k) => `${k.type} (${k.detail})`).join("; ") || `exit ${x.exit}`}`),
);

const md = `# Team Avatar end-to-end results

${totals.join(". ")}.

Every case ran headless in a fresh git repo copied from \`evals/team-avatar/fixtures/\`, with the plugin installed the way a user installs it. Both runtimes got the same prompt and the same deterministic checks. The final reply of every run is in [replies/](replies/). [HISTORY.md](HISTORY.md) explains what earlier passes found and what changed.

| Case | Kind | Claude Code | Codex | Checks |
|------|------|-------------|-------|--------|
${rows.join("\n")}

${failures.length ? `## Failures\n\n${failures.join("\n")}\n` : "## Failures\n\nNone.\n"}
## Rerun

\`\`\`bash
node evals/team-avatar/run.mjs --runtime claude --jobs 4 --out /tmp/team-avatar-evals
\`\`\`

\`\`\`bash
node evals/team-avatar/run.mjs --runtime codex --jobs 4 --out /tmp/team-avatar-evals
\`\`\`

\`\`\`bash
node evals/team-avatar/report.mjs --in /tmp/team-avatar-evals --out docs/evidence/team-avatar-evals
\`\`\`
`;
writeFileSync(join(output, "README.md"), md);
console.log(totals.join("\n"));
