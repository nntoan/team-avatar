#!/usr/bin/env node
// Validate the Team Avatar plugin so it loads in Claude Code and Codex.
//
//   node scripts/validate-team-avatar.mjs
//
// Zero npm dependencies. Exits 1 and prints one line per problem.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const PLUGIN = join(ROOT, "plugins", "team-avatar");
const problems = [];
const fail = (file, msg) => problems.push(`${relative(ROOT, file)}: ${msg}`);

const readJson = (p) => {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    fail(p, `invalid JSON (${e.message})`);
    return {};
  }
};

function frontmatter(file) {
  const text = readFileSync(file, "utf8");
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) {
    fail(file, "missing YAML frontmatter");
    return { fields: {}, body: text };
  }
  const fields = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-z_-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return { fields, body: text.slice(m[0].length) };
}

const walk = (dir) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => join(d.parentPath ?? d.path, d.name));

const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const skillsDir = join(PLUGIN, "skills");
const agentsDir = join(PLUGIN, "agents");
const skills = readdirSync(skillsDir).filter((d) => statSync(join(skillsDir, d)).isDirectory());
const agents = readdirSync(agentsDir).filter((f) => f.endsWith(".md")).map((f) => f.slice(0, -3));

for (const skill of skills) {
  const file = join(skillsDir, skill, "SKILL.md");
  if (!existsSync(file)) {
    fail(join(skillsDir, skill), "missing SKILL.md");
    continue;
  }
  const { fields } = frontmatter(file);
  if (fields.name !== skill) fail(file, `frontmatter name "${fields.name}" must equal directory "${skill}"`);
  if (!NAME.test(skill)) fail(file, "skill name must be lowercase words joined by hyphens");
  if (!fields.description) fail(file, "frontmatter needs a description");
  else if (fields.description.length > 1024) fail(file, "description is longer than 1024 characters");
}

for (const agent of agents) {
  const file = join(agentsDir, `${agent}.md`);
  const { fields, body } = frontmatter(file);
  if (fields.name !== agent) fail(file, `frontmatter name "${fields.name}" must equal file name "${agent}"`);
  if (!fields.description) fail(file, "frontmatter needs a description");
  const loads = [...body.matchAll(/Load `([a-z0-9-]+)`/g)].map((m) => m[1]);
  if (loads.length === 0) fail(file, "agent must load at least one skill");
  for (const s of loads) if (!skills.includes(s)) fail(file, `loads unknown skill "${s}"`);
}

const avatar = readFileSync(join(skillsDir, "avatar-mode", "SKILL.md"), "utf8");
const table = avatar.slice(avatar.indexOf("## The team"), avatar.indexOf("## Route the task"));
for (const s of skills) if (!table.includes(`\`${s}\``)) fail(join(skillsDir, "avatar-mode", "SKILL.md"), `team table omits skill "${s}"`);
for (const a of agents) {
  if (!new RegExp(`^\\| ${a[0].toUpperCase()}${a.slice(1)} \\|`, "m").test(table)) {
    fail(join(skillsDir, "avatar-mode", "SKILL.md"), `team table omits character "${a}"`);
  }
}

// Only names after a routing verb count, so code spans like `git log -S` are not mistaken for skills.
const ROUTE = /(?:Load|Run|run|Use|use|with|to|via|follows|Hand to|hand to|see|See|in) `([a-z0-9]+(?:-[a-z0-9]+)+)`/g;
const files = walk(PLUGIN).filter((f) => f.endsWith(".md"));
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const [, ref] of text.matchAll(ROUTE)) {
    if (!skills.includes(ref) && !agents.includes(ref)) fail(file, `references unknown skill "${ref}"`);
  }
  for (const [, href] of text.matchAll(/\]\(([^)#\s]+)(?:#[^)]*)?\)/g)) {
    if (/^[a-z]+:/.test(href)) continue;
    if (!existsSync(resolve(dirname(file), href))) fail(file, `broken link "${href}"`);
  }
}

const claude = readJson(join(PLUGIN, ".claude-plugin", "plugin.json"));
const codex = readJson(join(PLUGIN, ".codex-plugin", "plugin.json"));
const claudeMarket = readJson(join(ROOT, ".claude-plugin", "marketplace.json"));
const codexMarket = readJson(join(ROOT, ".agents", "plugins", "marketplace.json"));
const claudeEntry = (claudeMarket.plugins ?? []).find((p) => p.name === "team-avatar");
const codexEntry = (codexMarket.plugins ?? []).find((p) => p.name === "team-avatar");
if (claude.name !== "team-avatar") fail(join(PLUGIN, ".claude-plugin", "plugin.json"), "name must be team-avatar");
if (codex.name !== "team-avatar") fail(join(PLUGIN, ".codex-plugin", "plugin.json"), "name must be team-avatar");
if (codex.skills !== "./skills/") fail(join(PLUGIN, ".codex-plugin", "plugin.json"), 'skills must be "./skills/"');
if (!claudeEntry) fail(join(ROOT, ".claude-plugin", "marketplace.json"), "no team-avatar entry");
else if (resolve(ROOT, claudeEntry.source) !== PLUGIN) fail(join(ROOT, ".claude-plugin", "marketplace.json"), "source must point at plugins/team-avatar");
if (!codexEntry) fail(join(ROOT, ".agents", "plugins", "marketplace.json"), "no team-avatar entry");
else if (resolve(ROOT, codexEntry.source?.path ?? "") !== PLUGIN) fail(join(ROOT, ".agents", "plugins", "marketplace.json"), "source.path must point at plugins/team-avatar");
const versions = new Set([claude.version, codex.version, claudeEntry?.version].filter(Boolean));
if (versions.size !== 1) fail(PLUGIN, `versions disagree: ${[...versions].join(", ")}`);

// Trent's house style: no long dashes anywhere in the plugin.
const DASHES = /[\u2013\u2014]/;
for (const file of [...walk(PLUGIN), join(ROOT, ".claude-plugin", "marketplace.json"), join(ROOT, ".agents", "plugins", "marketplace.json")]) {
  readFileSync(file, "utf8").split("\n").forEach((line, i) => {
    if (DASHES.test(line)) fail(file, `line ${i + 1} contains a long dash`);
  });
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(`\n${problems.length} problem(s)`);
  process.exit(1);
}
console.log(`team-avatar OK: ${skills.length} skills, ${agents.length} agents`);
