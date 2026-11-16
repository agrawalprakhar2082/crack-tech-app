---
name: pr-with-screenshots
description: The Crack Tech way to ship a change: designated branch, verify, a PR whose description shows screenshots, then merge only on the owner's OK and confirm the Pages deploy. Use for any website change that goes to main.
---

# Ship a change (working agreement)

The owner isn't a git expert. Explain what you do in plain words, and nothing goes to `main` without their OK ("merge PR N", or an explicit "once done, merge").

## 1. Branch
- Work on the session's designated branch, started from the latest main: `git fetch origin main && git checkout -B <branch> origin/main`.
- If the remote branch still holds old, already-merged commits, run `git merge origin/<branch>`, which changes no content, so the push is a normal one.
- Never force-push or rewrite history. Branch deletes are refused from the cloud; the owner does those.

## 2. Verify before pushing
- Run `ruby _blog/build.rb`. It must change nothing extra; never hand-edit `blog/` or `practice/`.
- For practice changes, run `node _practice/tests/verify.js` (add `--speed` when tests change). For Worker changes, run `node worker/practice-review/test.mjs`.
- Run `node --check` on edited JS.
- Look at the result in a real browser (Playwright against `python3 -m http.server`, external hosts aborted or served locally), in light and dark, desktop and phone.

## 3. Commit
- Use clear messages ending with the session's attribution trailer lines.
- Never include a model name in commits or PRs.

## 4. Screenshots in the PR body
GitHub can't host images from here, so:
1. Copy the PNGs to `docs/pr-shots/`, commit "Add PR screenshots (temporary)" and push.
2. Use `https://raw.githubusercontent.com/agrawalprakhar2082/crack-tech-app/<that commit sha>/docs/pr-shots/<file>.png` in `<img src="…" width="800">` tags. Use HTML, not markdown images.
3. Open the PR with the GitHub MCP tool `create_pull_request` (owner `agrawalprakhar2082`, repo `crack-tech-app`, base `main`), with a summary, how it was checked, what wasn't verified, and the screenshots.
4. Then `git rm -r docs/pr-shots`, commit "Remove PR screenshots" and push. The images stay visible because they're pinned to the earlier commit.

## 5. Merge (only with the owner's OK)
- Use `merge_pull_request` with `merge_method: "squash"` and `expectedHeadSha` set to the branch head.
- Check the deploy with `actions_list` (`list_workflow_runs`, perPage 1): "pages build and deployment" should end in `success`.
- Tell the owner it's live, and what to check on cracktech.app. The live site can't be opened from the cloud environment.

## Hook noise
A stop hook may complain about uncommitted files while a background agent is still editing. Don't commit an agent's half-finished work; say that it will commit when done.
