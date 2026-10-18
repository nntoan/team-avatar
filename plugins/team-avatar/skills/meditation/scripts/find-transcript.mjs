#!/usr/bin/env node
// Locate the transcript whose opening user prompt carries a fragment.
//
//   node find-transcript.mjs <transcripts-dir> <opening-prompt-fragment> [workspace]
//
// Prints the newest matching path, or exits 1. Covers Claude Code's layouts
// under one per-project directory (flat <id>.jsonl, nested <id>/<id>.jsonl,
// subagent <id>/subagents/<child>.jsonl) and Codex's rollouts under
// ~/.codex/sessions/YYYY/MM/DD/ or ~/.codex/archived_sessions/. Each candidate
// is streamed line by line and abandoned at its first typed user prompt.
// Codex keeps every project in one tree, so a rollout counts only when its
// session_meta cwd is the workspace (the current directory by default).
import { createReadStream, readdirSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// readline also breaks on U+2028 and U+2029, which JSON leaves unescaped.
async function* jsonlLines(stream) {
  let rest = "";
  for await (const chunk of stream) {
    const parts = (rest + chunk).split("\n");
    rest = parts.pop();
    yield* parts;
  }
  if (rest) yield rest;
}

// Session cleanup can delete a transcript or its directory while a search
// runs. Anything under the root that vanishes after it was listed is skipped;
// a missing root still throws.
export function rethrowUnlessRemoved(error) {
  if (error.code !== "ENOENT") throw error;
}

export function candidates(root, maxDepth = 3) {
  const files = [];
  const walk = (dir, depth) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isFile() && entry.name.endsWith(".jsonl")) files.push(full);
      else if (entry.isDirectory() && depth < maxDepth) {
        try {
          walk(full, depth + 1);
        } catch (error) {
          rethrowUnlessRemoved(error);
        }
      }
    }
  };
  walk(root, 0);
  return files
    .flatMap((path) => {
      const stat = statSync(path, { throwIfNoEntry: false });
      return stat ? [{ path, mtime: stat.mtimeMs }] : [];
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function text(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((block) => typeof block?.text === "string")
      .map((block) => block.text)
      .join("\n");
  }
  return null;
}

// `user` records Claude Code writes for a local command (/clear, !cmd) and its
// output, not a prompt the user typed. A skill invocation leads with
// <command-message> and is kept: its <command-args> carry what the user typed.
const LOCAL_COMMAND = /^\s*<(?:command-name|local-command-stdout|bash-input)>/u;

// Context Codex injects as `user` messages ahead of the typed prompt.
const CODEX_INJECTED = /^\s*(?:# AGENTS\.md instructions|<(?:environment_context|user_instructions|codex_internal_context|INSTRUCTIONS)\b)/u;

const isCodexHeader = (record) => record?.type === "session_meta" && typeof record.payload === "object";

function sameDir(a, b) {
  try {
    return realpathSync(a) === realpathSync(b);
  } catch {
    // A removed or inaccessible workspace cannot identify this session.
    return false;
  }
}

async function codexOpening(head, records, workspace) {
  const cwd = head.payload?.cwd;
  if (typeof cwd !== "string" || !isAbsolute(cwd) || !sameDir(cwd, workspace)) return null;
  for await (const record of records) {
    const item = record?.payload;
    if (record?.type !== "response_item" || item?.type !== "message" || item.role !== "user") continue;
    for (const block of item.content ?? []) {
      if (typeof block?.text === "string" && block.text.trim() && !CODEX_INJECTED.test(block.text)) return block.text;
    }
  }
  return null;
}

async function* parsed(lines) {
  for await (const line of lines) {
    try {
      yield JSON.parse(line);
    } catch {}
  }
}

async function* prepend(head, rest) {
  yield head;
  yield* rest;
}

// A Claude Code transcript opens with the first prompt the user typed.
async function claudeOpening(records) {
  for await (const record of records) {
    if (record?.type !== "user" || record.isMeta) continue;
    const prompt = text(record.message?.content);
    if (prompt && !LOCAL_COMMAND.test(prompt)) return prompt;
  }
  return null;
}

export async function openingPrompt(path, workspace = process.cwd()) {
  const stream = createReadStream(path, { encoding: "utf8" });
  try {
    const records = parsed(jsonlLines(stream));
    const { value: head, done } = await records.next();
    if (done) return null;
    if (isCodexHeader(head)) return await codexOpening(head, records, workspace);
    return await claudeOpening(prepend(head, records));
  } finally {
    stream.destroy();
  }
}

export async function findTranscript(root, fragment, workspace = process.cwd()) {
  for (const { path } of candidates(root)) {
    try {
      const prompt = await openingPrompt(path, workspace);
      if (prompt?.includes(fragment)) return path;
    } catch (error) {
      rethrowUnlessRemoved(error);
    }
  }
  return null;
}

async function main(argv) {
  const [root, fragment, workspace] = argv;
  if (!root || !fragment || argv.length > 3) {
    console.error("usage: find-transcript.mjs <transcripts-dir> <opening-prompt-fragment> [workspace]");
    return 2;
  }
  const path = await findTranscript(root, fragment, workspace);
  if (!path) {
    console.error(`no transcript under ${root} opens with ${JSON.stringify(fragment)}`);
    return 1;
  }
  console.log(path);
  return 0;
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
  process.exitCode = await main(process.argv.slice(2));
}
