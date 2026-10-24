#!/usr/bin/env node
// Score every predictions file with the official swebench harness, one task image at a time.
//
//   node evals/team-avatar/swebench/evaluate.mjs --dataset tasks.json --out <generate out dir> \
//     --python <venv>/bin/python [--jobs 3] [--complete-only true]
//
// The published images are linux/amd64 only, and each is about 4 GB. On an arm64 Mac
// the harness cannot pull them itself, so this script pulls each image for amd64,
// grades every predictions file against it, then removes it before the next one.

import { spawn } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => (arg.startsWith("--") ? [...pairs, [arg.slice(2), all[i + 1]]] : pairs), []),
);
if (!args.dataset || !args.out || !args.python) {
  console.error("usage: evaluate.mjs --dataset tasks.json --out dir --python venv/bin/python [--jobs n]");
  process.exit(2);
}
const out = resolve(args.out);
const dataset = resolve(args.dataset);
const jobs = Number(args.jobs ?? 3);
const tasks = JSON.parse(readFileSync(dataset, "utf8"));
const predictionsDir = join(out, "predictions");
const files = readdirSync(predictionsDir).filter((f) => f.endsWith(".jsonl") && !f.endsWith(".meta.jsonl"));
const entries = (f) => readFileSync(join(predictionsDir, f), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const predicted = Object.fromEntries(files.map((f) => [f.replace(".jsonl", ""), new Set(entries(f).filter((p) => p.model_patch).map((p) => p.instance_id))]));
const emptied = Object.fromEntries(files.map((f) => [f.replace(".jsonl", ""), new Set(entries(f).filter((p) => !p.model_patch).map((p) => p.instance_id))]));
const resultsFile = join(out, "eval", "results.jsonl");
mkdirSync(join(out, "eval"), { recursive: true });
const graded = new Set(existsSync(resultsFile) ? readFileSync(resultsFile, "utf8").split("\n").filter(Boolean).map((l) => { const r = JSON.parse(l); return `${r.model}/${r.instance_id}`; }) : []);
const env = { ...process.env, DOCKER_CONFIG: args["docker-config"] ?? join(out, "dockercfg") };
if (!existsSync(join(env.DOCKER_CONFIG, "config.json"))) {
  mkdirSync(env.DOCKER_CONFIG, { recursive: true });
  writeFileSync(join(env.DOCKER_CONFIG, "config.json"), "{}");
}

const run = (bin, argv) => new Promise((done) => {
  const child = spawn(bin, argv, { cwd: join(out, "eval"), env, stdio: ["ignore", "pipe", "pipe"] });
  let text = "";
  child.stdout.on("data", (d) => (text += d));
  child.stderr.on("data", (d) => (text += d));
  child.on("close", (code) => done({ code, text }));
});

// With --complete-only, a task waits until every predictions file has an entry for it,
// so each 4 GB image is pulled once while generation is still running.
const ready = (id) => Object.keys(predicted).every((m) => predicted[m].has(id) || emptied[m].has(id));

async function gradeTask(task) {
  if (args["complete-only"] && !ready(task.instance_id)) return;
  const models = Object.keys(predicted).filter((m) => predicted[m].has(task.instance_id) && !graded.has(`${m}/${task.instance_id}`));
  const empties = Object.keys(emptied).filter((m) => emptied[m].has(task.instance_id) && !graded.has(`${m}/${task.instance_id}`));
  for (const m of empties) {
    appendFileSync(resultsFile, JSON.stringify({ model: m, instance_id: task.instance_id, resolved: false, status: "empty_patch" }) + "\n");
  }
  if (!models.length) return;
  const pull = await run("docker", ["pull", "-q", "--platform", "linux/amd64", task.image]);
  if (pull.code !== 0) {
    console.log(`${task.instance_id}: pull failed, ${pull.text.trim().split("\n").pop()}`);
    return;
  }
  for (const m of models) {
    const runId = m;
    const r = await run(args.python, [
      "-m", "swebench.harness.run_evaluation", "-d", dataset, "-p", join(predictionsDir, `${m}.jsonl`),
      "-i", task.instance_id, "--max_workers", "1", "-id", runId, "--report_dir", join(out, "eval", "reports", m, task.instance_id),
    ]);
    const report = join(out, "eval", "logs", "run_evaluation", runId, m, task.instance_id, "report.json");
    let resolved = false;
    let status = "error";
    if (existsSync(report)) {
      const rep = JSON.parse(readFileSync(report, "utf8"))[task.instance_id] ?? {};
      resolved = Boolean(rep.resolved);
      status = rep.patch_successfully_applied === false ? "patch_failed" : resolved ? "resolved" : "unresolved";
    }
    appendFileSync(resultsFile, JSON.stringify({ model: m, instance_id: task.instance_id, resolved, status }) + "\n");
    console.log(`${m} ${task.instance_id}: ${status}${status === "error" ? ` (${r.text.trim().split("\n").filter((l) => /Error|error/.test(l)).slice(-1)[0] ?? "no report"})` : ""}`);
  }
  await run("docker", ["rmi", "-f", task.image]);
}

const queue = [...tasks];
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
  while (queue.length) await gradeTask(queue.shift());
}));
await run("docker", ["image", "prune", "-f"]);
console.log(`graded into ${resultsFile}`);
