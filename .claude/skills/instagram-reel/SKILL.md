---
name: instagram-reel
description: Make and package a Crack Tech Instagram Reel in the visual explainer style (a step-by-step trace of code or a system design idea, e.g. Unique Paths with a robot on a grid), plus its cover, caption, hashtags and posting checklist. Use when the owner asks for a Reel, an Instagram caption/cover for a coding or system design video, or the Instagram version of a YouTube Short. For the YouTube cut use youtube-short (same build, run both).
---

# Instagram Reel (visual explainer)

Build with the toolkit in `_content/visual/` (read its `README.md` first). The script rules are in the `youtube-short` skill, section 1: simple, the smallest example, hook in the first second, 30–45 s, numbers verified. Use them here too, including **"Lessons from posting"** there:
- the question goes in the very first frame;
- each Reel looks different from the last;
- prefer fresh angles;
- never post near-copies close together;
- diagnose with skip rate and watch time.

## Reel-specific build
- `make.py` already writes `out/<name>/ig`:
  - the ending says **Follow** (blue button) and **Save** ("Save this for your next interview");
  - there is no link, because Instagram has no links under a Reel;
  - the tail is short, so the end flows back into the hook. Replays count.
- Everything important stays between y 180 and 1480. The caption pill stays within x 110–970: Instagram's like, comment and share buttons sit on the right below y≈1150, and its caption text covers the bottom.
- Render with `render.sh <out>/ig`. Check the contact sheet, then send the MP4 with `SendUserFile`.

## Loop Reels (Instagram only, no voice)
When the owner asks for a short looping Reel with music and no explanation (e.g. "show how BFS works"), follow "Loop Reels" in `_content/visual/README.md`:
- 10–15 s, and the first frame already shows the title and the whole puzzle;
- the last frame equals the first, so it loops;
- the dark-panel style;
- original music from `bfs_music.py` (or a copy of it), plus a no-music version for an Instagram library track.

Reference look: the owner's screenshots of an animation-only algorithm account (dark navy panels, code + visual + Big-O). Take the feel, not the design.

## Cover
- Use the same 1080×1920 cover as YouTube (`_content/covers/<name>-cover.html?size=v`).
- Instagram's profile grid shows only the middle 1080×1350 (y 285–1635). Check it with `convert cover.png -crop 1080x1350+0+285 grid.png` and look at it before sending.
- Send neon and olive versions.
- Tell the owner to set it with "Edit cover → Add from camera roll" and to keep "Show on profile grid" on.

## Caption (give it ready to paste)
1. **First line = the hook.** Only it shows before "more". Use a question or a number, plus 1–2 emoji. Example: "How many ways can this robot reach the flag? 🤖🏁"
2. **2–4 short lines with the idea,** one emoji bullet each (➡️⬇️ / 🏁 / ❌). Then the trick with the big number.
3. 💬 **A question people can answer in one word or number,** e.g. "How many paths does a 3×3 grid have?" Give the owner the answer (6) to reply with.
4. 🔖 "Save this for your next interview" · ➕ "Follow for more coding, visualized"
5. **5 specific hashtags** (not 20 broad ones): e.g. `#recursion #dynamicprogramming #codinginterview #leetcode #learntocode`. For system design: `#systemdesign #softwareengineering #backend #codinginterview #learntocode`.
- If the caption has code, it must run as written (e.g. `@cache` needs `from functools import cache`). Point that out in a suggested pinned comment.
- "Link in bio" for the site; never put a URL in the caption (it isn't clickable).

## Posting checklist for the owner
- Upload at the highest quality (Settings → Data usage → Upload at highest quality).
- Add an instrumental track **in the app**, at 5–10% under the voice: the same lo-fi or energetic beat for the whole series. Trending audio helps only if it fits.
- New series or a new theme: post it as a **Trial reel** first. It's shown to non-followers, which tells you whether the hook works. Share it to the main grid if it does well after 24–48 hours.
- Pin a comment (the answer, or "Full walkthrough + free practice: link in bio"). Reply to comments in the first hour.
- **One Reel every 24–48 hours, at roughly the same time of day.** On a new account, Reels posted close together compete for the same small test audience of non-followers.
- **Wait 48 hours before judging,** because Reels often pick up late. Never delete and repost.
- **Check Account status** if reach suddenly drops: Settings → Account status, where nothing should be listed under "Content that may not be recommended".
- Keep the account separate from personal contacts: no contact syncing or personal invites (owner's rule).

## Learning
- Ask the owner for the 48-hour numbers: views, **skip rate**, average watch time or % watched to the end, saves, shares, follows. Record them in `_content/visual/LOG.md` with the theme, the hook and the hours since the previous post.
- Read the numbers like this:
  - a higher skip rate than usual means the opening failed (fix the first frame or hook);
  - similar skip rate and watch time but fewer views means timing or luck.
- After 6 or more posts, keep the theme and hook style that win on watch time and saves.
- Don't promise follower or view numbers.

## House rules
Same as `youtube-short`: Kokoro `am_michael`; "mentorship", never "coaching"; no surname or employer. Outputs go in `out/` (git-ignored).
