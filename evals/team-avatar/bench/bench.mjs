#!/usr/bin/env node
// A/B benchmark: the same tasks with Team Avatar, with pstack, or with neither, on Claude Code or Codex.
//
//   node evals/team-avatar/bench/bench.mjs --runtime claude|codex --arm without|with|invoked|pstack|pstack-invoked [--repeat 3] [--jobs 4] [--tasks id,id] [--out dir]
//   node evals/team-avatar/bench/bench.mjs --grade-dir <repo> --task <id> [--final reply.txt]   # score an existing repo
//
// Every arm runs with every other workflow plugin switched off, so the plugin under test
// is the only difference. "with" and "pstack" install one plugin and leave the prompt
// alone. "invoked" and "pstack-invoked" also start the prompt with that plugin's mode,
// the way a user who asks for it would. Hidden graders in hidden/ never enter the
// agent's repo until the run is over.

import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const HERE = resolve(fileURLToPath(import.meta.url), "..");
const PLUGIN = resolve(HERE, "../../../plugins/team-avatar");
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), []),
);
if (args["grade-dir"]) {
  args.runtime ??= "claude";
  args.arm ??= "with";
}
const { runtime, arm } = args;
const ARMS = ["without", "with", "invoked", "pstack", "pstack-invoked"];
if (!["claude", "codex"].includes(runtime) || !ARMS.includes(arm)) {
  console.error(`usage: bench.mjs --runtime claude|codex --arm ${ARMS.join("|")} [--repeat n] [--jobs n] [--tasks id,id] [--out dir]`);
  process.exit(2);
}
const repeat = Number(args.repeat ?? 3);
const jobs = Number(args.jobs ?? 4);
const out = resolve(args.out ?? join(tmpdir(), "team-avatar-bench"));
const timeoutMs = Number(args.timeout ?? 1200) * 1000;
const tasks = JSON.parse(readFileSync(join(HERE, "tasks.json"), "utf8")).tasks.filter((t) => !args.tasks || args.tasks.split(",").includes(t.id));

const sh = (cmd, cwd) => spawnSync("sh", ["-c", cmd], { cwd, encoding: "utf8", timeout: 120000 });
const git = (cwd, ...a) => spawnSync("git", ["-c", "user.name=bench", "-c", "user.email=bench@example.com", ...a], { cwd, encoding: "utf8" });

function setup(task, rep) {
  const dir = join(out, runtime, arm, "work", `${task.id}-${rep}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  cpSync(join(HERE, "fixtures", task.fixture), dir, { recursive: true });
  git(dir, "init", "-q", "-b", "main");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "base");
  if (task.branch) {
    git(dir, "checkout", "-q", "-b", task.branch);
    cpSync(join(HERE, "fixtures", `${task.fixture}-change`), dir, { recursive: true });
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", "change");
  }
  return dir;
}

const plugin = arm.startsWith("pstack") ? "pstack" : arm === "without" ? null : "team-avatar";
const PSTACK_CACHE = join(process.env.HOME, ".claude", "plugins", "cache", "pstack-claude", "pstack");
const pstackDir = () => join(PSTACK_CACHE, readdirSync(PSTACK_CACHE).filter((v) => /^\d/.test(v)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop());

function command(dir, finalFile, prompt) {
  if (runtime === "claude") {
    return ["claude", [
      "-p", prompt, "--output-format", "stream-json", "--verbose",
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
    prompt,
  ]];
}

const INVOKE = {
  "invoked": { claude: "/team-avatar:avatar-mode ", codex: "$avatar-mode " },
  "pstack-invoked": { claude: "/pstack:poteto-mode ", codex: "$poteto-mode " },
};

function runAgent(dir, finalFile, task) {
  const prompt = (INVOKE[arm]?.[runtime] ?? "") + task.prompt;
  const [bin, argv] = command(dir, finalFile, prompt);
  const started = Date.now();
  return new Promise((done) => {
    const child = spawn(bin, argv, { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", () => {});
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    child.on("close", (code) => {
      clearTimeout(timer);
      done({ code, stdout, seconds: Math.round((Date.now() - started) / 1000) });
    });
  });
}

const events = (stdout) => stdout.split("\n").flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });

function usage(evts, finalFile) {
  if (runtime === "claude") {
    const r = [...evts].reverse().find((e) => e.type === "result") ?? {};
    const u = r.usage ?? {};
    return {
      final: r.result ?? "",
      cost: r.total_cost_usd ?? null,
      tokens: (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.output_tokens ?? 0),
    };
  }
  const tokens = evts.filter((e) => e.type === "turn.completed").reduce((n, e) => n + (e.usage?.input_tokens ?? 0) + (e.usage?.output_tokens ?? 0), 0);
  return { final: existsSync(finalFile) ? readFileSync(finalFile, "utf8") : "", cost: null, tokens };
}

function teamAvatarSkills(evts, raw) {
  if (runtime === "claude") {
    const uses = evts.flatMap((e) => (e.type === "assistant" ? e.message?.content ?? [] : [])).filter((b) => b.type === "tool_use");
    return [...new Set(uses.flatMap((t) => {
      if (t.name === "Skill" && /^(team-avatar|pstack):/.test(String(t.input?.skill))) return [String(t.input.skill).replace(/^team-avatar:/, "")];
      const m = JSON.stringify(t.input ?? {}).match(/(team-avatar|pstack)\/(?:[\d.]+\/)?skills\/([a-z0-9-]+)\/SKILL\.md/);
      return m ? [m[1] === "pstack" ? `pstack:${m[2]}` : m[2]] : [];
    }))];
  }
  return [...new Set([...raw.matchAll(/(team-avatar|pstack)\/[\d.]+\/skills\/([a-z0-9-]+)\/SKILL\.md/g)].map((m) => (m[1] === "pstack" ? `pstack:${m[2]}` : m[2])))];
}

function nodeTest(dir, files) {
  const r = sh(`node --test --test-reporter=tap ${files.map((f) => `"${f}"`).join(" ")} 2>&1`, dir);
  const num = (k) => Number(r.stdout.match(new RegExp(`^# ${k} (\\d+)`, "m"))?.[1] ?? 0);
  const failed = [...r.stdout.matchAll(/^\s*not ok \d+ - (.+)$/gm)].map((m) => m[1].trim());
  return { pass: num("pass"), fail: num("fail"), total: num("tests"), status: r.status, failed };
}

function withHidden(dir, name, fn) {
  const target = join(dir, `.bench-${name}`);
  cpSync(join(HERE, "hidden", name), target);
  try {
    return fn(target);
  } finally {
    rmSync(target, { force: true });
  }
}

function agentTests(dir, needle, exclude) {
  const found = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      if (name === "node_modules" || name === ".git" || name.startsWith(".bench-")) continue;
      const p = join(d, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(test|spec)\.m?js$/.test(name) && relative(dir, p) !== exclude && readFileSync(p, "utf8").includes(needle)) found.push(p);
    }
  };
  walk(dir);
  return found;
}

const SCORERS = {
  "hidden-tests"(task, dir) {
    const r = withHidden(dir, task.hidden, (f) => nodeTest(dir, [f]));
    const visible = nodeTest(dir, agentTests(dir, "", "")).status === 0;
    return { score: r.total ? r.pass / r.total : 0, detail: `${r.pass}/${r.total} hidden tests, visible suite ${visible ? "green" : "red"}` };
  },
  "planted-bugs"(task, dir, final) {
    const changed = git(dir, "status", "--porcelain").stdout.split("\n").filter((l) => l && !/\.omc\/$/.test(l));
    const found = task.planted.filter((b) => {
      const lines = [...final.matchAll(new RegExp(`${b.file.replace(".", "\\.")}[^\\n]{0,40}?:(\\d+)`, "g"))].map((m) => Number(m[1]));
      if (lines.some((n) => Math.abs(n - b.line) <= (task.exact ? 1 : 2))) return true;
      const reach = task.exact ? 200 : 300;
      return [...final.matchAll(new RegExp(b.file.replace(".", "\\."), "g"))].some((m) =>
        new RegExp(b.words, "i").test(final.slice(Math.max(0, m.index - reach), m.index + reach)));
    });
    const score = changed.length ? 0 : found.length / task.planted.length;
    return { score, detail: `${found.length}/${task.planted.length} planted bugs found${changed.length ? ", but files were edited" : ""}`, found: found.map((b) => b.file) };
  },
  mutation(task, dir) {
    const target = join(dir, task.target);
    const theirs = existsSync(target) ? readFileSync(target, "utf8") : "";
    const hidden = withHidden(dir, task.hidden, (f) => nodeTest(dir, [f]));
    const correctness = hidden.total ? hidden.pass / hidden.total : 0;
    const tests = agentTests(dir, "parseDuration", task.target);
    const reference = readFileSync(join(HERE, "hidden", task.reference), "utf8");
    // Tests that fail on a correct reference pin details the spec never set (error text, input
    // types). They are set aside, and only the remaining tests count toward catching mutants.
    let killed = 0;
    let overspecified = 0;
    if (tests.length) {
      writeFileSync(target, reference);
      const baseline = new Set(nodeTest(dir, tests).failed);
      overspecified = baseline.size;
      for (const [from, to] of task.mutants) {
        writeFileSync(target, reference.replace(from, to));
        if (nodeTest(dir, tests).failed.some((name) => !baseline.has(name))) killed++;
      }
      writeFileSync(target, theirs);
    }
    const mutation = killed / task.mutants.length;
    return {
      score: 0.5 * correctness + 0.5 * mutation,
      detail: `correct ${hidden.pass}/${hidden.total}, tests caught ${killed}/${task.mutants.length} broken versions${tests.length ? (overspecified ? `, ${overspecified} tests pin unspecified details` : "") : " (no tests written)"}`,
      correctness, mutation, overspecified,
    };
  },
  perf(task, dir) {
    const hidden = withHidden(dir, task.hidden, (f) => nodeTest(dir, [f]));
    const correct = hidden.total ? hidden.pass / hidden.total : 0;
    const after = withHidden(dir, task.bench, (f) => JSON.parse(sh(`node "${f}"`, dir).stdout.trim() || '{"ms":null}').ms);
    git(dir, "stash", "-q", "-u");
    const before = withHidden(dir, task.bench, (f) => JSON.parse(sh(`node "${f}"`, dir).stdout.trim() || '{"ms":null}').ms);
    git(dir, "stash", "pop", "-q");
    const speedup = before && after ? before / after : 0;
    const speedScore = Math.min(1, speedup / task.target_speedup);
    return {
      score: correct === 1 ? speedScore : correct * speedScore * 0.5,
      detail: `${hidden.pass}/${hidden.total} behavior tests, ${speedup.toFixed(1)}x faster (${before?.toFixed(0)}ms to ${after?.toFixed(1)}ms)`,
      speedup, correct,
    };
  },
  prose(task, dir) {
    const original = readFileSync(join(HERE, "fixtures", task.fixture, task.file), "utf8");
    const now = existsSync(join(dir, task.file)) ? readFileSync(join(dir, task.file), "utf8") : "";
    const hits = (text) => task.slop.reduce((n, p) => n + (text.toLowerCase().split(p.toLowerCase()).length - 1), 0);
    const before = hits(original);
    const after = hits(now);
    const facts = task.facts.filter((f) => new RegExp(f, "i").test(now)).length;
    const cleaned = Math.max(0, 1 - after / before);
    return { score: cleaned * (facts / task.facts.length), detail: `${after} of ${before} AI-tell hits left, ${facts}/${task.facts.length} facts kept, ${now.split(/\s+/).filter(Boolean).length} words` };
  },
  answer(task, dir, final) {
    const changed = git(dir, "status", "--porcelain").stdout.split("\n").filter((l) => l && !/\.omc\/$/.test(l));
    const right = new RegExp(task.answer).test(final) && !new RegExp(task.wrong, "i").test(final);
    const cites = task.cites.filter(([p]) => new RegExp(p).test(final));
    const score = changed.length ? 0 : (right ? 0.6 : 0) + cites.reduce((n, [, w]) => n + w, 0);
    return { score, detail: `${right ? "right answer" : "wrong or missing answer"}, ${cites.length}/${task.cites.length} deciding lines cited` };
  },
};

function secondary(task, dir, final, raw) {
  const touched = git(dir, "status", "--porcelain", "--untracked-files=all").stdout.split("\n").filter(Boolean)
    .map((l) => l.slice(3)).filter((f) => !f.includes(".omc/"));
  const stray = touched.filter((f) => !new RegExp(task.allowed).test(f));
  const out = {
    longDashes: (final.match(/[\u2013\u2014]/g) ?? []).length,
    strayFiles: stray.length,
    ranCode: /"(command|cmd)"\s*:\s*"[^"]*\b(node|npm|bun)\b/.test(raw),
  };
  if (task.regression) {
    const tests = agentTests(dir, "", "").filter((f) => git(dir, "ls-files", "--error-unmatch", relative(dir, f)).status !== 0 || git(dir, "diff", "--quiet", "HEAD", "--", relative(dir, f)).status !== 0);
    const file = join(dir, task.regression.file);
    const fixed = readFileSync(file, "utf8");
    writeFileSync(file, git(dir, "show", `HEAD:${task.regression.file}`).stdout);
    out.regressionTest = tests.length > 0 && nodeTest(dir, tests).status !== 0;
    writeFileSync(file, fixed);
  }
  if (task.evidence) out.reportedMeasurement = new RegExp(task.evidence, "i").test(final);
  return out;
}

async function runOne(task, rep) {
  const dir = setup(task, rep);
  const finalFile = join(dir, "..", `${task.id}-${rep}.final.txt`);
  const run = await runAgent(dir, finalFile, task);
  const evts = events(run.stdout);
  const { final, cost, tokens } = usage(evts, finalFile);
  const logs = join(out, runtime, arm, "logs");
  mkdirSync(logs, { recursive: true });
  writeFileSync(join(logs, `${task.id}-${rep}.jsonl`), run.stdout);
  writeFileSync(join(logs, `${task.id}-${rep}.final.txt`), final);
  writeFileSync(join(logs, `${task.id}-${rep}.diff`), git(dir, "diff", "HEAD").stdout + git(dir, "status", "--porcelain").stdout);
  const graded = run.code === 0 ? SCORERS[task.scorer](task, dir, final) : { score: 0, detail: `agent exited ${run.code}` };
  const skills = teamAvatarSkills(evts, run.stdout);
  const extra = secondary(task, dir, final, run.stdout);
  console.log(`${runtime}/${arm} ${task.id}#${rep} score ${graded.score.toFixed(2)} (${run.seconds}s) ${graded.detail}${skills.length ? ` [skills: ${skills.join(", ")}]` : ""}`);
  return { task: task.id, rep, seconds: run.seconds, cost, tokens, exit: run.code, skills, ...extra, ...graded };
}

if (args["grade-dir"]) {
  const task = tasks.find((t) => t.id === args.task);
  const final = args.final ? readFileSync(args.final, "utf8") : "";
  console.log(JSON.stringify(SCORERS[task.scorer](task, resolve(args["grade-dir"]), final)));
  process.exit(0);
}

const queue = tasks.flatMap((t) => Array.from({ length: repeat }, (_, i) => [t, i + 1]));
const results = [];
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
  while (queue.length) results.push(await runOne(...queue.shift()));
}));
const file = join(out, runtime, arm, "results.json");
const previous = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")).results : [];
const merged = [...previous.filter((p) => !results.some((r) => r.task === p.task && r.rep === p.rep)), ...results];
writeFileSync(file, JSON.stringify({ runtime, arm, finished: new Date().toISOString(), results: merged }, null, 2));
console.log(`\n${runtime}/${arm}: mean score ${(results.reduce((n, r) => n + r.score, 0) / results.length).toFixed(3)} over ${results.length} runs. ${file}`);
