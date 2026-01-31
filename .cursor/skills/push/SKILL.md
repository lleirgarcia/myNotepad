---
name: push
description: Adds all changes, generates a commit message from the diff summary, commits, and pushes to the current branch. Use when the user wants to push their work, commit and push, or run a full push workflow.
---

# Push

## Workflow

1. **Stage all changes**: `git add -A` (or `git add .` from repo root).
2. **Summarize changes**: From `git status` and `git diff --staged` (or `git diff` before staging), produce a short commit message that describes what was updated.
3. **Commit**: `git commit -m "<summary>"`.
4. **Push**: `git push` (pushes the current branch).

Run these from the repository root. If the workspace has multiple repos, run in the repo that contains the changes.

## Commit message

- **Imperative mood**: "Add feature" not "Added feature".
- **Concise**: One line preferred; 50–72 chars if possible.
- **Content**: Summarize the main change (e.g. "Add notes filter", "Fix todo toggle state", "Update dependencies").
- **Scope** (optional): `type(scope): message` e.g. `feat(notes): add search`.

## Edge cases

- **Nothing to commit**: If `git status` shows no changes after staging, do not run `git commit` or `git push`; report that there is nothing to commit.
- **Push rejected**: If `git push` fails (e.g. non-fast-forward), suggest pulling first: `git pull --rebase` then `git push`, or let the user resolve.
- **No remote/branch**: If there is no upstream, use `git push -u origin <current-branch>` when setting the branch for the first time.
