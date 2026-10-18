#!/usr/bin/env node
// Regenerate the Team Avatar roster tables from plugins/team-avatar/team.json.
//
//   node scripts/generate-team-avatar.mjs          # rewrite the generated regions
//   node scripts/generate-team-avatar.mjs --check  # exit 1 if any region is stale
//
// Each target file holds a region between `<!-- team:<kind>:start -->` and
// `<!-- team:<kind>:end -->`. Everything outside the markers is hand-written.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const PLUGIN = join(ROOT, "plugins", "team-avatar");
const CHECK = process.argv.includes("--check");
const team = JSON.parse(readFileSync(join(PLUGIN, "team.json"), "utf8"));

const owned = (character) => team.skills.filter((s) => s.owner === character).map((s) => s.name);
const code = (names) => names.map((n) => `\`${n}\``).join(", ");

const roster = () =>
  [
    "| Character | Discipline | Skills |",
    "|-----------|------------|--------|",
    ...team.characters.map((c) => `| ${c.title} | ${c.discipline} | ${code(owned(c.name))} |`),
  ].join("\n");

const agentSkills = (character) => `Your skills: ${code(owned(character))}.`;

const targets = [
  { file: join(PLUGIN, "skills", "avatar-mode", "SKILL.md"), kind: "roster", render: roster },
  { file: join(PLUGIN, "README.md"), kind: "roster", render: roster },
  ...team.characters.map((c) => ({
    file: join(PLUGIN, "agents", `${c.name}.md`),
    kind: "skills",
    render: () => agentSkills(c.name),
  })),
];

let stale = 0;
for (const { file, kind, render } of targets) {
  const rel = relative(ROOT, file);
  if (!existsSync(file)) {
    console.error(`${rel}: missing`);
    stale++;
    continue;
  }
  const text = readFileSync(file, "utf8");
  const start = `<!-- team:${kind}:start -->`;
  const end = `<!-- team:${kind}:end -->`;
  const i = text.indexOf(start);
  const j = text.indexOf(end);
  if (i < 0 || j < i) {
    console.error(`${rel}: missing ${start} ... ${end} markers`);
    stale++;
    continue;
  }
  const next = `${text.slice(0, i + start.length)}\n${render()}\n${text.slice(j)}`;
  if (next === text) continue;
  if (CHECK) {
    console.error(`${rel}: generated ${kind} region is stale, run node scripts/generate-team-avatar.mjs`);
    stale++;
  } else {
    writeFileSync(file, next);
    console.log(`updated ${rel}`);
  }
}
if (stale) process.exit(1);
