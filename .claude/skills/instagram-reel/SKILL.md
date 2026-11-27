---
name: instagram-reel
description: Make and package a Crack Tech Instagram Reel, by default a 10-second music-only loop that animates an algorithm or system design idea (like the BFS and DFS Reels, which performed best), or a narrated visual explainer when the owner wants one explained. Includes the cover, caption, hashtags, audio advice and posting checklist. Use when the owner asks for a Reel, an Instagram video, cover or caption for a coding or system design topic, or the Instagram version of a YouTube Short.
---

# Instagram Reel

Two formats, built with the toolkit in `_content/visual/` (read its `README.md` first):

1. **Loop Reel (the default):** 10 s, no voice, music only, and the animation does all the explaining. The BFS and DFS Reels (Nov 2026) did better than the narrated ones, so use this unless the owner asks for an explanation.
2. **Narrated explainer:** 30–45 s with the Kokoro voice and captions (Unique Paths, Climbing Stairs). Use it when the owner wants a concept explained step by step. The script rules are in the `youtube-short` skill.

Both formats follow **"Lessons from posting"** in the `youtube-short` skill:
- the question or title goes in the very first frame;
- each Reel looks different from the last;
- prefer fresh angles;
- never post near-copies close together;
- diagnose with skip rate and watch time.

## 1. Loop Reel recipe (what worked)
Start from `_content/visual/dfs.html` (recursive, uses a stack) or `bfs.html` (iterative, uses a queue). Copy one to `<topic>.html` and change the data and drawing, keeping the structure.

- **Length and loop:**
  - 10 s on a beat grid (144 BPM, 24 beats).
  - The action fills about 8.5 s, then a short finished state and a quick fade back to the start, so the last frame equals the first and it loops.
  - No idle tail: the owner cut BFS from 15 s because "nothing much happens at the end".
- **First frame:** it already shows the title and the whole puzzle (the graph, array or grid) in its starting state. No intro card.
- **Layout (dark panels, top to bottom), all inside `#stage` (translate(-5px,170px) scale(.898)):**
  - `cracktech.app` centred at the very top (owner's request, Nov 2026);
  - title row: short name + coloured pill with the full name ("DFS [Depth-First Search]");
  - the visual panel;
  - the code panel: ≤ 6 lines, with the running line highlighted (red for "skip"), next to a big Big-O and a 2–4 word reason;
  - one data-structure row (QUEUE / STACK / heap / window) plus a result row (VISITED / output).
- **How the motion reads:**
  - shapes start outlined and fill in when active;
  - the current item glows with a rotating dashed ring;
  - pulses travel along edges or pointers;
  - "already seen" or "rejected" gets a short red spark;
  - one colour per level or depth, with a small legend;
  - a wave ring when a new level is reached.
- **Vary the look between consecutive Reels:** change the accent colour (BFS green, DFS pink) and the colour ramp. Pairs on the **same example** work well (BFS and DFS on one graph), and the caption can compare the two orders.
- **Music:**
  - Run `bfs_music.py <dir> 144 24`. It makes original 8-bit music from the page's `window.SFX` events (`pop`, `enq`, `seen`, `back`, `clear`), and the loop is seamless.
  - Always also export a **no-music** version, so the owner can add a track from Instagram's library.
  - **Never use copyrighted game music or sound effects.** The owner asked for Mario; Nintendo's music would get the Reel muted. Make an original track in that spirit instead.
- **Render** (details under "Loop Reels" in the README):
  1. Copy the page to `out/<name>/frame.html`, with `timeline.json` set to `{"duration": 10.0, "scenes": []}`.
  2. Run `node render.js out/<name> 30`, then `bfs_music.py`.
  3. Run ffmpeg twice: once with the music (loudnorm −14), once without.
  4. Check a contact sheet of the MP4 before sending.
- **Safe area:** run `safecheck.sh` on 2–3 frames and the cover. Nothing may sit under Instagram's buttons (x > 940 from y ≈ 880), its header (y < 130) or the username and caption (y > 1640). The owner saw earlier Reels get covered.

## 2. Narrated explainer build
- Run `make.py` on a spec, then `render.sh <out>/ig`. It ends with a **Follow** button and **Save** ("Save this for your next interview"). It has no link, because Reels have no clickable links.
- It uses the same `#stage` safe box (it's in `theme.css`), and the same `safecheck.sh`.
- Hinglish versions: see "Other languages" in the README. Post them days apart from the English version.

## 3. Cover
- **Loop Reels:** use a frame of the finished state (everything visited or filled, before the fade starts), with `cracktech.app` at the top. Render it with `node render.js out/<name> 30 "<seconds>"`, picking a moment just after the last item finishes, when nothing is mid-animation (e.g. DFS 8.667 s, BFS 8.8 s).
- **Narrated explainers:** use `_content/covers/<name>-cover.html?size=v`. Send neon and olive versions, and add `&lang=hi` for the Hindi badge.
- **Checks:**
  - the 3:4 profile-grid crop (`convert cover -crop 1080x1440+0+240`);
  - `safecheck.sh`.
- Tell the owner to set it with "Edit cover → Add from camera roll", with "Show on profile grid" on.

## 4. Caption (give it ready to paste)
For loop Reels, use this shape (it worked for BFS and DFS):
```
<ALGO> in 10 seconds 👀 <what it does in 6 words>

🔵 step one
🟣 step two
🔴 Already seen? Skip it
<the secret: QUEUE / STACK / two pointers…, one line why it matters>

⏱️ O(…): <reason>

💬 <a question with a one-word or one-line answer>
🔖 Save this for your next interview
➕ Follow for more algorithms, visualized

#<algo> #<topic> #datastructures #codinginterview #learntocode
```
- Give the owner the answer to the question (to reply with in the comments), and a pinned comment linking the pair ("DFS version is up 👀").
- For narrated explainers:
  - the first line is the hook question or number;
  - 2–4 emoji bullets;
  - the trick with the big number;
  - a question, Save and Follow;
  - 5 specific hashtags.
- Code in a caption must run as written. Never put a URL in the caption: say "link in bio".

## 5. Audio advice for the owner
- **For reach:** use the no-music version with a **trending** track from Instagram's library. Look for the ↗ arrow, and prefer tracks used by roughly 1,000–50,000 Reels that are still rising. Choose an instrumental with a beat in the first second, and trim it so a drop lands on the first highlight. Good searches: "8 bit", "video game", "arcade", "phonk", "lofi beat", "electronic instrumental".
- **For a series sound:** use our original 8-bit track. It's safe from copyright problems and appears as "Original audio – cracktech.app".
- Use the same track across a pair or series.
- We can't see what's trending from the cloud environment, so never name a "trending" song.

## 6. Posting checklist
- Upload at the highest quality (Settings → Data usage).
- New format or theme: post it as a **Trial reel** first.
- **One Reel every 24–48 hours, at roughly the same time of day.** Post the second of a pair (e.g. DFS) 1–2 days after the first.
- Pin a comment, and reply to comments in the first hour.
- Wait 48 hours before judging. Never delete and repost.
- If reach suddenly drops, check Settings → Account status.
- Keep the account separate from personal contacts (owner's rule).

## 7. Learning
- Ask the owner for the 48-hour numbers: views, **skip rate**, average watch time or % watched, saves, shares, follows. Record them in `_content/visual/LOG.md` with the format, theme, audio and hours since the previous post.
- How to read them:
  - a high skip rate means the opening failed;
  - a similar skip rate but fewer views means timing or luck.
- So far: loop Reels (BFS, DFS) beat the narrated explainers. Unique Paths beat Climbing Stairs (fresh topic and stronger first frame).
- Don't promise follower or view numbers.

## House rules
- Voices: Kokoro `am_michael`, or the Hinglish blend `hm_omega:0.7+am_michael:0.3`.
- Say "mentorship", never "coaching". No surname or employer.
- Outputs go in `out/` (git-ignored). Commit only pages, specs and tools.
