#!/usr/bin/env node
// Checks a repository's project playbooks against the Team Avatar skills they extend.
//
//   node <plugin>/skills/avatar-mode/scripts/check-playbooks.mjs [repo-root]
//
// A project playbook is `.agents/playbooks/<name>.md`. Its frontmatter names
// `extends` (comma-separated Team Avatar skill names, or empty) and `when`.
// Each change line quotes a run of the extended skill's own step text. This
// fails when a playbook extends a skill this plugin lacks, or quotes step text
// no extended skill still has.
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SKILLS = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CHANGE = /^\s*(?:[-*]|\d+\.)\s+\*\*(?:After|Before|Replace|In)\*\*\s+"([^"]+)"/;
const CHANGE_VERB = /^\s*(?:[-*]|\d+\.)\s+\*\*(?:After|Before|Replace|In)\*\*/;
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const flat = (text) => text.replace(/\s+/g, " ");

// A skill's step text is its SKILL.md plus its references, where long steps live
// (avatar-mode's Feature steps are in references/feature.md).
function skillText(skills, name) {
  const dir = join(skills, name);
  if (!NAME.test(name) || !existsSync(join(dir, "SKILL.md"))) return null;
  const refs = join(dir, "references");
  const files = [join(dir, "SKILL.md")];
  if (existsSync(refs)) {
    for (const file of readdirSync(refs).filter((f) => f.endsWith(".md")).sort()) files.push(join(refs, file));
  }
  return files.map((file) => readFileSync(file, "utf8")).join("\n");
}

export function checkPlaybooks(root, skills = SKILLS) {
  const dir = join(root, ".agents/playbooks");
  if (!existsSync(dir)) return [];
  const problems = [];
  for (const name of readdirSync(dir).filter((file) => file.endsWith(".md")).sort()) {
    const path = `.agents/playbooks/${name}`;
    const text = readFileSync(join(dir, name), "utf8").replace(/^﻿/, "").replaceAll("\r\n", "\n");
    const front = text.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? "";
    const field = (key) => front.match(new RegExp(`^${key}:[ \\t]*(.*)$`, "m"))?.[1].trim() ?? "";
    if (!field("when")) problems.push(`${path}: its frontmatter needs a "when:" line`);
    const bases = field("extends")
      .split(",")
      .map((stem) => stem.trim())
      .filter(Boolean)
      .map((stem) => ({ stem, text: skillText(skills, stem) }));
    for (const base of bases) {
      if (base.text === null) problems.push(`${path}: extends \`${base.stem}\`, which is not a Team Avatar skill`);
    }
    for (const line of text.split("\n")) {
      if (CHANGE_VERB.test(line) && !CHANGE.test(line)) {
        problems.push(`${path}: a change has no straight-quoted step text to anchor on: ${line.trim().slice(0, 80)}`);
      }
      const anchor = line.match(CHANGE)?.[1];
      if (anchor && !bases.some((base) => base.text && flat(base.text).includes(flat(anchor)))) {
        problems.push(`${path}: "${anchor}" is not in any skill it extends`);
      }
    }
  }
  return problems;
}

// node leaves argv[1] unresolved and may set it to a non-file (`node -e ... arg`).
function invokedDirectly() {
  if (!process.argv[1]) return false;
  try {
    return fileURLToPath(import.meta.url) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  const root = resolve(process.argv[2] ?? ".");
  const directory = join(root, ".agents/playbooks");
  const problems = statSync(root, { throwIfNoEntry: false })?.isDirectory()
    ? checkPlaybooks(root)
    : [`${root} is not a directory`];
  if (problems.length > 0) {
    console.error(problems.join("\n"));
    process.exitCode = 1;
  } else if (existsSync(directory)) {
    console.log("Every project playbook matches the Team Avatar skills it extends.");
  } else {
    console.log(`No project playbooks to check: ${directory} does not exist.`);
  }
}
