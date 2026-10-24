#!/usr/bin/env node
// Generate SWE-bench predictions with Claude Code or Codex, with Team Avatar, with pstack, or with neither.
//
//   node evals/team-avatar/swebench/generate.mjs --dataset tasks.json --runtime claude|codex \
//     --arm without|with|invoked|pstack|pstack-invoked \
//     [--jobs 4] [--ids id,id] [--out dir] [--timeout 1800] [--reverse true]
//
// Each task gets a fresh checkout at its base commit, one headless agent run on the
// issue text, and a patch written to <out>/predictions/<runtime>-<arm>.jsonl in the
// format the official swebench harness reads. Every arm runs with every other workflow
// plugin switched off, so the plugin under test is the only difference between arms.
// "with" and "pstack" install one plugin. "invoked" and "pstack-invoked" also start the
// prompt with that plugin's mode.

import { spawn, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, openSync, closeSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const HERE = resolve(fileURLToPath(import.meta.url), "..");
const PLUGIN = resolve(HERE, "../../../plugins/team-avatar");
const PSTACK_CACHE = join(process.env.HOME, ".claude", "plugins", "cache", "pstack-claude", "pstack");
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), []),
);
const { runtime, arm } = args;
const ARMS = ["without", "with", "invoked", "pstack", "pstack-invoked"];
if (!args.dataset || !["claude", "codex"].includes(runtime) || !ARMS.includes(arm)) {
  console.error(`usage: generate.mjs --dataset tasks.json --runtime claude|codex --arm ${ARMS.join("|")} [--jobs n] [--ids a,b] [--out dir]`);
  process.exit(2);
}
const out = resolve(args.out ?? join(tmpdir(), "team-avatar-swebench"));
const jobs = Number(args.jobs ?? 4);
const timeoutMs = Number(args.timeout ?? 1800) * 1000;
const name = `${runtime}-${arm}`;
const tasks = JSON.parse(readFileSync(resolve(args.dataset), "utf8")).filter((t) => !args.ids || args.ids.split(",").includes(t.instance_id));
const predictionsFile = join(out, "predictions", `${name}.jsonl`);
const metaFile = join(out, "predictions", `${name}.meta.jsonl`);
mkdirSync(join(out, "predictions"), { recursive: true });
const done = new Set(existsSync(predictionsFile) ? readFileSync(predictionsFile, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).instance_id) : []);

const git = (cwd, ...a) => spawnSync("git", ["-c", "user.name=swe", "-c", "user.email=swe@example.com", "-c", "core.quotepath=false", ...a], { cwd, encoding: "utf8", maxBuffer: 1 << 28 });

// One full clone per repo, shared by every run through `git clone --shared`.
function cacheRepo(repo) {
  const dir = join(out, "repos", repo.replace("/", "__"));
  if (!existsSync(join(dir, ".git"))) {
    mkdirSync(join(out, "repos"), { recursive: true });
    const r = spawnSync("git", ["clone", "-q", `https://github.com/${repo}.git`, dir], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`clone ${repo} failed: ${r.stderr}`);
  }
  return dir;
}

function checkout(task) {
  const dir = join(out, "work", name, task.instance_id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(out, "work", name), { recursive: true });
  const r = spawnSync("git", ["clone", "-q", "--shared", "--no-checkout", cacheRepo(task.repo), dir], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`clone for ${task.instance_id} failed: ${r.stderr}`);
  git(dir, "checkout", "-q", "--detach", task.base_commit);
  git(dir, "remote", "remove", "origin");
  // Drop every ref, so history after the base commit (which holds the real fix) is not
  // reachable from `git log --all` or a branch name. HEAD alone keeps the base commit.
  for (const ref of git(dir, "for-each-ref", "--format=%(refname)").stdout.split("\n").filter(Boolean)) git(dir, "update-ref", "-d", ref);
  git(dir, "reflog", "expire", "--expire=now", "--all");
  return dir;
}

const plugin = arm.startsWith("pstack") ? "pstack" : arm === "without" ? null : "team-avatar";
const INVOKE = {
  "invoked": { claude: "/team-avatar:avatar-mode ", codex: "$avatar-mode " },
  "pstack-invoked": { claude: "/pstack:poteto-mode ", codex: "$poteto-mode " },
};
function pstackDir() {
  const versions = existsSync(PSTACK_CACHE) ? readdirSync(PSTACK_CACHE).filter((v) => /^\d/.test(v)) : [];
  if (!versions.length) throw new Error(`no pstack install under ${PSTACK_CACHE}`);
  return join(PSTACK_CACHE, versions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop());
}

const prompt = (task) =>
  `${INVOKE[arm]?.[runtime] ?? ""}` +
  `You are in a git checkout of ${task.repo} at the commit where the issue below was reported. ` +
  `Resolve the issue by changing the repository's source files. Do not commit.\n\n<issue>\n${task.problem_statement}\n</issue>`;

function command(dir, finalFile, text) {
  if (runtime === "claude") {
    return ["claude", [
      "-p", text, "--output-format", "stream-json", "--verbose",
      "--permission-mode", "acceptEdits", "--allowedTools", "Bash,Read,Edit,Write,Glob,Grep,Skill,Agent,Task,TodoWrite",
      "--no-session-persistence", "--setting-sources", "project,local",
      ...(plugin === "team-avatar" ? ["--plugin-dir", PLUGIN] : plugin === "pstack" ? ["--plugin-dir", pstackDir()] : []),
    ]];
  }
  return ["codex", [
    "exec", "--json", "--skip-git-repo-check", "-s", "workspace-write", "-C", dir, "-o", finalFile,
    "--dangerously-bypass-hook-trust",
    "-c", "plugins.tstack@personal.enabled=false",
    ...(plugin !== "pstack" ? ["-c", "plugins.pstack@pstack-claude.enabled=false"] : []),
    ...(plugin !== "team-avatar" ? ["-c", "plugins.team-avatar@team-avatar.enabled=false"] : []),
    text,
  ]];
}

function runAgent(dir, task) {
  const finalFile = join(out, "work", name, `${task.instance_id}.final.txt`);
  const [bin, argv] = command(dir, finalFile, prompt(task));
  const started = Date.now();
  return new Promise((finish) => {
    const child = spawn(bin, argv, { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", () => {});
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      finish({ code, signal, stdout, finalFile, seconds: Math.round((Date.now() - started) / 1000) });
    });
  });
}

// Paths the instance's own test patch rewrites are dropped from the agent's patch, so an
// agent that wrote its own tests is never failed by a conflict with the hidden tests.
// Scratch output (virtualenvs, caches, build trees, large files) never counts as a fix.
const SCRATCH = /(^|\/)(\.?venv[^/]*|env|node_modules|__pycache__|\.tox|\.pytest_cache|build|dist|[^/]+\.egg-info|\.audit|\.omc|\.claude)(\/|$)/;

function extractPatch(dir, task) {
  const testPaths = new Set([...task.test_patch.matchAll(/^diff --git a\/(\S+) b\//gm)].map((m) => m[1]));
  const untracked = git(dir, "ls-files", "-z", "--others", "--exclude-standard").stdout.split("\0").filter(Boolean)
    .filter((f) => !SCRATCH.test(f) && !testPaths.has(f) && existsSync(join(dir, f)) && statSync(join(dir, f)).size < 200_000);
  if (untracked.length) git(dir, "add", "-N", "--", ...untracked);
  const changed = git(dir, "diff", "-z", "--name-only", task.base_commit).stdout.split("\0").filter(Boolean)
    .filter((f) => !SCRATCH.test(f) && !testPaths.has(f));
  if (!changed.length) return { patch: "", files: [] };
  const patch = git(dir, "diff", "--binary", task.base_commit, "--", ...changed).stdout;
  return { patch, files: changed };
}

function telemetry(stdout, finalFile) {
  const events = stdout.split("\n").flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  if (runtime === "claude") {
    const r = [...events].reverse().find((e) => e.type === "result") ?? {};
    const u = r.usage ?? {};
    const uses = events.flatMap((e) => (e.type === "assistant" ? e.message?.content ?? [] : [])).filter((b) => b.type === "tool_use");
    const skills = [...new Set(uses.filter((t) => t.name === "Skill").map((t) => String(t.input?.skill)).filter((s) => /^(team-avatar|pstack):/.test(s)).map((s) => s.replace(/^team-avatar:/, "")))];
    return {
      cost: r.total_cost_usd ?? null,
      tokens: (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.output_tokens ?? 0),
      turns: r.num_turns ?? null,
      skills,
      final: r.result ?? "",
    };
  }
  const tokens = events.filter((e) => e.type === "turn.completed").reduce((n, e) => n + (e.usage?.input_tokens ?? 0) + (e.usage?.output_tokens ?? 0), 0);
  const skills = [...new Set([...stdout.matchAll(/(team-avatar|pstack)\/[\d.]+\/skills\/([a-z0-9-]+)\/SKILL\.md/g)].map((m) => (m[1] === "pstack" ? `pstack:${m[2]}` : m[2])))];
  return { cost: null, tokens, turns: null, skills, final: existsSync(finalFile) ? readFileSync(finalFile, "utf8") : "" };
}

// A claim file lets a second process work the same queue from the other end without
// running a task twice.
function claim(task) {
  if (existsSync(predictionsFile) && readFileSync(predictionsFile, "utf8").includes(`"instance_id":"${task.instance_id}"`)) return false;
  const file = join(out, "claims", name, task.instance_id);
  mkdirSync(join(out, "claims", name), { recursive: true });
  try {
    closeSync(openSync(file, "wx"));
    return true;
  } catch {
    return false;
  }
}

// Provider capacity errors are infrastructure, not the agent's work. Retry them on a
// fresh checkout instead of scoring an empty patch.
const TRANSIENT = /at capacity|overloaded|rate.limit|429|503 Service|temporarily unavailable/i;
const transientFailure = (run) => run.code !== 0 && run.stdout.split("\n").some((l) => /"type":"(turn\.failed|error)"|"is_error":true/.test(l) && TRANSIENT.test(l));

async function runOne(task) {
  if (!claim(task)) return;
  let dir;
  let run;
  for (let attempt = 1; attempt <= 4; attempt++) {
    dir = checkout(task);
    run = await runAgent(dir, task);
    if (!transientFailure(run)) break;
    console.log(`${name} ${task.instance_id} provider capacity error, retry ${attempt} of 3 after a pause`);
    await new Promise((r) => setTimeout(r, 60_000 * attempt));
  }
  const { patch, files } = extractPatch(dir, task);
  const t = telemetry(run.stdout, run.finalFile);
  mkdirSync(join(out, "logs", name), { recursive: true });
  writeFileSync(join(out, "logs", name, `${task.instance_id}.jsonl`), run.stdout);
  writeFileSync(join(out, "logs", name, `${task.instance_id}.patch`), patch);
  appendFileSync(predictionsFile, JSON.stringify({ instance_id: task.instance_id, model_name_or_path: name, model_patch: patch }) + "\n");
  appendFileSync(metaFile, JSON.stringify({
    instance_id: task.instance_id, exit: run.code, signal: run.signal, seconds: run.seconds,
    files, patchLines: patch ? patch.split("\n").length : 0, cost: t.cost, tokens: t.tokens, turns: t.turns, skills: t.skills,
  }) + "\n");
  rmSync(dir, { recursive: true, force: true });
  console.log(`${name} ${task.instance_id} exit ${run.code}${run.signal ? ` (${run.signal})` : ""} ${run.seconds}s, ${files.length} files${t.skills.length ? ` [${t.skills.join(", ")}]` : ""}`);
}

for (const repo of new Set(tasks.map((t) => t.repo))) cacheRepo(repo);
const queue = tasks.filter((t) => !done.has(t.instance_id));
if (args.reverse) queue.reverse();
console.log(`${name}: ${queue.length} to run, ${done.size} already done`);
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
  while (queue.length) {
    const task = queue.shift();
    try {
      await runOne(task);
    } catch (error) {
      console.log(`${name} ${task.instance_id} setup failed: ${error.message}`);
    }
  }
}));
