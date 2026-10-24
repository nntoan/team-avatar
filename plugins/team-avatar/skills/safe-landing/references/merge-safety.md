# Merge and restack safety

Use this reference with [safe-landing](../SKILL.md) and before topology changes in `shield-wall`. The watcher stays responsible for CI and blocker classification. These operations add revision and destination checks. They do not grant merge authority.

## Read both pending mechanisms

Use `ship-pr` from the plugin's `tools/watch-pr/` directory (`../../../tools/watch-pr/ship-pr` from this file). It owns GitHub transport, parsing, cancellation order, and readback. The watcher and this command share one `LandingRevision`, which holds the repository, PR number, head OID, base branch, and base OID.

```sh
ship-pr inspect --repo "$owner/$repo" --pr "$pr" > "$record_file"
ship-pr cancel-pending --record "$record_file"
```

Run the command by its full path when it is not on PATH. It carries a `bun` shebang, so run it directly. `inspect` emits `kind: inspected` with a parsed landing record. The record includes both pending mechanisms (auto-merge and merge-queue membership) and the merge commit when there is one. Save that record with the verification evidence. `cancel-pending` takes the saved record, rereads current state, disables auto-merge when present, rereads queue membership, dequeues when needed, and verifies that both mechanisms are absent on the same open landing revision. It does not merge, push, retarget, or grant landing authority.

Only exit 0 with `kind: cancelled` permits the planned topology operation. The outcomes `changed`, `not-open`, and `still-pending` return exit 1 with the observed record. `unavailable` returns exit 1 with the read or mutation failure. A missing field or an unsupported API never means an absent request. Reconcile those outcomes before rewriting. Do not replace the saved record merely to get past a mismatch.

Establish the affected dependency chain and coordinate with its topology writer first. Inspect and cancel each affected PR, including descendants whose context will change. Leave unrelated PRs alone. Cancellation is an observed condition, not a lock against another actor rearming afterward. If state changes, stop and reconcile. Origin must supply an equivalent validated operation through its own installed service. This command is GitHub-specific, so never present it as Origin support.

## Preserve concurrent writes and child changes

Capture the remote branch SHA before rewriting with `git ls-remote --exit-code origin "refs/heads/$branch"`, and check that exactly the intended ref came back. Keep that SHA in the operation record. An implicit lease or an earlier read is not enough, because a background fetch can move a tracking ref.

After you confirm the parent squash landed in the intended destination, fetch trunk and identify the recorded old parent tip on which this child was built. Verify it is an ancestor of the child. Inspect `old-parent..child` to confirm the range holds only child work. If it does not, reconstruct the boundary before you go on. Never infer the boundary from the parent's new squash commit.

```sh
git merge-base --is-ancestor "$old_parent_tip" "$child"
git rebase --onto "$trunk_tip" "$old_parent_tip" "$child"
git push --force-with-lease="refs/heads/$child:$captured_remote_head" \
  origin "HEAD:refs/heads/$child"
```

Run the rebase in the child's clean worktree, where `HEAD` is the prepared child. This leaves out the parent's old commits. Inspect the resulting diff and content, reassess whether the review still applies, and run checks at the new head. If the lease refuses the push, fetch and reconcile the concurrent work. Do not refresh the lease and retry the overwrite blindly. Retarget only after cancellation is verified. Keep the recorded boundary for each remaining child when you prepare later levels.

## What the service guards

GitHub's head condition for an immediate merge is `--match-head-commit` in `gh`, `expectedHeadOid` in the GraphQL `mergePullRequest` mutation, or `sha` in the REST merge endpoint. Use one, carrying the exact verified SHA. None of these supplies an expected base-branch condition. Observe the base immediately before and after the merge and coordinate retargeting. Do not call those observations atomic.

A queued or automatic request can outlive the revision it was admitted at. Use one only when existing repository rules enforce the required verification on the eventual revision and merge context. A prose verdict or a green check on an older head is not such a gate. If you cannot establish those guarantees, keep watching for an immediate guarded merge. If the repository requires a queue, stop at that unmet gate rather than bypass protection.

After a merge, confirm state `MERGED`, the approved final head, the intended base, and a non-null merge commit. Fetch the destination and run `git merge-base --is-ancestor "$merge_commit" "$destination_tip"`. Then check the resulting content before you advance. If the service cannot report these facts, the outcome stays unconfirmed.

Service references: [GitHub CLI merge flags](https://cli.github.com/manual/gh_pr_merge), [GraphQL pull requests and queue mutations](https://docs.github.com/en/graphql/reference/pulls), and [REST merge endpoint](https://docs.github.com/en/rest/pulls/pulls#merge-a-pull-request). Recheck the installed service's capabilities when they differ from these. Test service behavior in a disposable repository, never with production PRs.
