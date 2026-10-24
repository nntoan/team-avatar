# Resume storage

`make-camp` and `break-camp` share one project locator. The [resume.mjs](../scripts/resume.mjs) command resolves the project's Git common directory and stores checkpoints under its `team-avatar/resume/` directory. `latest.json` points to the latest complete checkpoint. It records the worktree, branch, timestamp, note, and requested artifacts with content hashes.

Claude Code, Codex, and other runtimes use this same command and location. Runtime-specific home directories and transcript encodings do not affect lookup. Git worktrees of the same repository share the locator, and Git leaves its contents out of commits. This needs a local Git checkout whose common directory survives the interruption. It does not survive deleting or recloning the repository. Before that happens, move the complete checkpoint to durable storage and give the resumed session its locator.

In the commands below, `<scripts>` is this skill's `scripts/` directory.

## Write a checkpoint

1. Run `node <scripts>/resume.mjs begin --project <worktree>` to allocate a new checkpoint directory. Write `resume.md` there with the intent, verified progress, current state, and next steps.
2. Save the requested artifacts in that directory and link them from the note. Reuse existing artifacts in the project when their location survives the expected interruption. Do not make competing copies. For a worktree that will be removed, put the requested material in the common checkpoint store instead. Check exact wording, completeness, and order where required.
3. Publish with `node <scripts>/resume.mjs publish --project <worktree> --note <resume.md> --artifact <file> ...`. Register every local note link as an artifact, including existing project files. The link rules are below. The command verifies file ownership, links, and contents before it atomically replaces `latest.json`. Never treat a failed publication as a ready checkpoint.
4. Run `node <scripts>/resume.mjs read --project <worktree>` and open its note and artifacts. Treat published checkpoint files as immutable. Use a new checkpoint directory for a later pause. If an existing project artifact changes, the pickup reports that difference rather than silently treating it as the saved material.

`begin` keeps concurrent writers' files apart. Publishing replaces one shared latest pointer atomically, and the last complete publication wins. Keep the returned checkpoint paths when several tasks must stay separately resumable. The pointer is a locator, not a task scheduler or an execution lock.

## Link rules

- Link each local file with an inline Markdown link whose destination is the path, written bare or as `<path>`.
- Put no square brackets in the link text and no title after the path.
- Reference-style links are not read.
- The path is relative to the note or absolute. It is percent-decoded, so write a literal `%` as `%25`.
- Wrap a path that contains spaces or parentheses in angle brackets, or percent-encode it.
- Links inside code spans and fenced code blocks are ignored.

Each rejected link reports these rules.

## Read a checkpoint

`break-camp` starts with `node <scripts>/resume.mjs read --project <worktree>`, using only the project directory. Exit 0 with `kind: checkpoint` gives the saved note and every registered artifact. Open them before you search transcripts. The command validates hashes and links again, including reused project artifacts.

Exit 2 with `kind: missing` means there is no pointer, so use the transcript, cloud URL, or branch fallback. Exit 1 with `kind: unavailable` means a checkpoint is malformed, unreadable, changed, or incomplete. Diagnose that concrete gap. Do not silently ignore the checkpoint or claim the material was never saved. None of these commands pauses a running task.
