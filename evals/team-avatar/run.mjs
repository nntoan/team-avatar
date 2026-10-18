#!/usr/bin/env node
// Run the Team Avatar end-to-end cases against a real Claude Code or Codex CLI.
//
//   node evals/team-avatar/run.mjs --runtime claude|codex [--cases id,id] [--jobs 4] [--out dir]
//
// Each case gets a fresh git repo copied from fixtures/, a headless agent run,
// and the same deterministic checks on both runtimes. Results land in
// <out>/<runtime>/results.json, with every run's raw events beside it.

import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const HERE = resolve(fileURLToPath(import.meta.url), "..");
const PLUGIN = resolve(HERE, "../../plugins/team-avatar");
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), []),
);
const runtime = args.runtime;
if (!["claude", "codex"].includes(runtime)) {
  console.error("usage: run.mjs --runtime claude|codex [--cases id,id] [--jobs n] [--out dir]");
  process.exit(2);
}
const jobs = Number(args.jobs ?? 4);
const out = resolve(args.out ?? join(tmpdir(), "team-avatar-evals"));
const timeoutMs = Number(args.timeout ?? 900) * 1000;
const all = JSON.parse(readFileSync(join(HERE, "cases.json"), "utf8")).cases;
const wanted = args.cases ? new Set(args.cases.split(",")) : null;
const cases = all.filter((c) => !wanted || wanted.has(c.id));
const skillNames = JSON.parse(readFileSync(join(PLUGIN, "team.json"), "utf8")).skills.map((s) => s.name);

const INVOKE = {
  claude: { avatar: "/team-avatar:avatar-mode", setup: "/team-avatar:avatar-setup" },
  codex: { avatar: "$avatar-mode", setup: "$avatar-setup" },
};

// Files other plugins on the host create in every repo they touch. They are not the skill's doing.
const HOST_NOISE = /^\?\? (.*\/)?\.omc\/$/;

const sh = (cmd, cwd) => spawnSync("sh", ["-c", cmd], { cwd, encoding: "utf8" });
const git = (cwd, ...a) => spawnSync("git", ["-c", "user.name=eval", "-c", "user.email=eval@example.com", ...a], { cwd, encoding: "utf8" });

function setup(c) {
  const dir = join(out, runtime, "work", c.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  cpSync(join(HERE, "fixtures", c.fixture), dir, { recursive: true });
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "base");
  if (c.branch) {
    git(dir, "checkout", "-q", "-b", c.branch);
    cpSync(join(HERE, "fixtures", `${c.fixture}-change`), dir, { recursive: true });
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", "feature change");
  }
  return dir;
}

function command(c, dir, prompt) {
  if (runtime === "claude") {
    return {
      bin: "claude",
      argv: [
        "-p", prompt,
        "--output-format", "stream-json", "--verbose", "--include-hook-events",
        "--permission-mode", "acceptEdits",
        "--allowedTools", "Bash,Read,Edit,Write,Glob,Grep,Skill,Agent,Task,TodoWrite",
        "--no-session-persistence",
      ],
    };
  }
  return {
    bin: "codex",
    argv: [
      "exec", "--json", "--skip-git-repo-check", "-s", "workspace-write", "-C", dir,
      "-o", join(dir, "..", `${c.id}.final.txt`),
      ...(c.kind === "hook" ? ["--dangerously-bypass-hook-trust"] : []),
      prompt,
    ],
  };
}

function runAgent(c, dir) {
  const prompt = c.prompt.replace(/\{(\w+)\}/g, (_, k) => INVOKE[runtime][k] ?? `{${k}}`);
  const { bin, argv } = command(c, dir, prompt);
  const started = Date.now();
  return new Promise((done) => {
    const child = spawn(bin, argv, { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      done({ prompt, code, signal, stdout, stderr, seconds: Math.round((Date.now() - started) / 1000) });
    });
  });
}

function parseEvents(stdout) {
  return stdout.split("\n").flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
}

function finalText(c, dir, events) {
  if (runtime === "claude") return [...events].reverse().find((e) => e.type === "result")?.result ?? "";
  const file = join(dir, "..", `${c.id}.final.txt`);
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

function toolUses(events) {
  return events.flatMap((e) => (e.type === "assistant" ? e.message?.content ?? [] : [])).filter((b) => b.type === "tool_use");
}

function skillUsed(name, events, raw, prompt) {
  const path = `skills/${name}/SKILL.md`;
  // A Claude Code slash command injects the whole skill, so invoking it counts. Codex `$name` only
  // names the skill, and the agent still has to read the file, so Codex needs the read.
  if (runtime === "claude" && prompt.trimStart().startsWith(`/team-avatar:${name}`)) return true;
  if (runtime === "claude") {
    return toolUses(events).some(
      (t) => (t.name === "Skill" && String(t.input?.skill ?? "").replace(/^team-avatar:/, "") === name) || JSON.stringify(t.input ?? {}).includes(path),
    ) || events.some((e) => e.type === "user" && JSON.stringify(e).includes(`team-avatar:${name}`) && JSON.stringify(e).includes("Base directory for this skill"));
  }
  return raw.includes(path);
}

// Codex exec does not print spawn_agent calls in --json output. Each child
// agent writes its own rollout that names the parent thread, so look there.
function codexChildren(events) {
  const thread = events.find((e) => e.type === "thread.started")?.thread_id;
  if (!thread) return [];
  const root = join(process.env.CODEX_HOME ?? join(process.env.HOME, ".codex"), "sessions");
  const r = spawnSync("grep", ["-rl", `"parent_thread_id":"${thread}"`, root], { encoding: "utf8" });
  return r.stdout.split("\n").filter(Boolean).map((f) => readFileSync(f, "utf8"));
}

function agentDispatched(name, events) {
  if (runtime === "claude") {
    return toolUses(events).some((t) => ["Agent", "Task"].includes(t.name) && String(t.input?.subagent_type ?? "") === `team-avatar:${name}`);
  }
  return codexChildren(events).some((child) => child.includes(`agents/${name}.md`));
}

function checkOne(chk, ctx) {
  const { dir, final, events, raw } = ctx;
  switch (chk.type) {
    case "route": {
      const token = (final.match(/`([^`]+)`/)?.[1] ?? final.trim().split(/\s+/)[0] ?? "").replace(/^(team-avatar:|\$|\/)+/, "");
      return { pass: token === chk.skill, detail: `answered ${token || "(nothing)"}` };
    }
    case "unchanged": {
      const status = git(dir, "status", "--porcelain").stdout.split("\n").filter((l) => l && !HOST_NOISE.test(l)).join("\n");
      return { pass: status === "", detail: status ? status.split("\n").slice(0, 3).join("; ") : "clean tree" };
    }
    case "lists_all_skills": {
      const missing = skillNames.filter((n) => !new RegExp(`(^|[^a-z-])${n}([^a-z-]|$)`, "m").test(final));
      return { pass: missing.length === 0, detail: missing.length ? `missing ${missing.join(", ")}` : `all ${skillNames.length} listed` };
    }
    case "skill_used":
      return { pass: skillUsed(chk.skill, events, raw, ctx.prompt), detail: chk.skill };
    case "agent_dispatched":
      return { pass: agentDispatched(chk.agent, events), detail: chk.agent };
    case "hook_fired":
      return { pass: raw.includes(chk.text), detail: chk.text };
    case "cmd": {
      const r = sh(chk.run, dir);
      return { pass: r.status === chk.expect, detail: `${chk.run} exited ${r.status}` };
    }
    case "mutant": {
      const file = join(dir, chk.file);
      const original = readFileSync(file, "utf8");
      writeFileSync(file, chk.replace);
      const r = sh(chk.run, dir);
      writeFileSync(file, original);
      return { pass: chk.expect_fail ? r.status !== 0 : r.status === 0, detail: `tests ${r.status === 0 ? "passed" : "failed"} against a broken ${chk.file}` };
    }
    case "file_unchanged": {
      const r = git(dir, "diff", "--quiet", "HEAD", "--", chk.path);
      return { pass: r.status === 0 && existsSync(join(dir, chk.path)), detail: chk.path };
    }
    case "max_diff_lines": {
      const lines = git(dir, "diff", "--numstat", "HEAD", "--", ...chk.paths).stdout.trim().split("\n").filter(Boolean)
        .reduce((n, l) => n + l.split("\t").slice(0, 2).reduce((a, b) => a + Number(b), 0), 0);
      return { pass: lines > 0 && lines <= chk.max, detail: `${lines} changed lines` };
    }
    case "final_matches": {
      const missing = chk.patterns.filter((p) => !new RegExp(p, "i").test(final));
      return { pass: missing.length === 0, detail: missing.length ? `reply lacks ${missing.join(", ")}` : "reply has every expected point" };
    }
    case "file_has":
    case "file_lacks": {
      const file = join(dir, chk.path);
      if (!existsSync(file)) return { pass: false, detail: `${chk.path} missing` };
      const text = readFileSync(file, "utf8");
      const bad = chk.patterns.filter((p) => new RegExp(p, "i").test(text) !== (chk.type === "file_has"));
      return { pass: bad.length === 0, detail: bad.length ? `${chk.type === "file_has" ? "lacks" : "still has"} ${bad.join(", ")}` : chk.path };
    }
    case "plan_units_have_checks": {
      const file = join(dir, chk.path);
      if (!existsSync(file)) return { pass: false, detail: "no plan" };
      const units = readFileSync(file, "utf8").split(/\n(?=#{2,4} |\d+\. )/).filter((s) => /^(#{2,4} +(\d+[.:)]|(unit|step|pr|phase) *\d)|\d+\. )/i.test(s));
      const without = units.filter((u) => !/check|run `|`(npm|node|bun) /i.test(u));
      return { pass: units.length >= 3 && without.length === 0, detail: `${units.length} units, ${without.length} without a check` };
    }
    case "sheet_in_final": {
      const block = final.match(/```[^\n]*\n([\s\S]*?)```/)?.[1];
      if (!block) return { pass: false, detail: "no fenced sheet" };
      const sheet = join(dir, "..", "sheet-under-test.md");
      writeFileSync(sheet, block);
      const r = sh(`sh "${PLUGIN}/skills/avatar-setup/scripts/check-sheet.sh" "${sheet}"`, dir);
      return { pass: r.status === 0, detail: (r.stdout + r.stderr).trim().split("\n")[0] };
    }
    default:
      return { pass: false, detail: `unknown check ${chk.type}` };
  }
}

async function runCase(c) {
  const dir = setup(c);
  const run = await runAgent(c, dir);
  const logDir = join(out, runtime, "logs");
  mkdirSync(logDir, { recursive: true });
  writeFileSync(join(logDir, `${c.id}.jsonl`), run.stdout);
  writeFileSync(join(logDir, `${c.id}.stderr.txt`), run.stderr);
  const events = parseEvents(run.stdout);
  const final = finalText(c, dir, events);
  writeFileSync(join(logDir, `${c.id}.final.txt`), final);
  writeFileSync(join(logDir, `${c.id}.diff`), git(dir, "diff", "HEAD").stdout + git(dir, "status", "--porcelain").stdout);
  const ctx = { dir, final, events, raw: run.stdout, prompt: run.prompt };
  const checks = c.checks.map((chk) => ({ type: chk.type, ...checkOne(chk, ctx) }));
  const pass = run.code === 0 && checks.every((k) => k.pass);
  console.log(`${pass ? "PASS" : "FAIL"} ${runtime} ${c.id} (${run.seconds}s)${pass ? "" : "  " + checks.filter((k) => !k.pass).map((k) => `${k.type}: ${k.detail}`).join(" | ")}`);
  return { id: c.id, kind: c.kind, prompt: run.prompt, exit: run.code, signal: run.signal, seconds: run.seconds, pass, checks };
}

const results = [];
const queue = [...cases];
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
  while (queue.length) results.push(await runCase(queue.shift()));
}));
results.sort((a, b) => cases.findIndex((c) => c.id === a.id) - cases.findIndex((c) => c.id === b.id));
const file = join(out, runtime, "results.json");
const previous = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")).results : [];
const merged = [...previous.filter((p) => !results.some((r) => r.id === p.id)), ...results];
writeFileSync(file, JSON.stringify({ runtime, finished: new Date().toISOString(), results: merged }, null, 2));
const passed = results.filter((r) => r.pass).length;
console.log(`\n${runtime}: ${passed}/${results.length} passed. Results in ${file}`);
process.exit(passed === results.length ? 0 : 1);
