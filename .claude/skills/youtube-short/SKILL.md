---
name: youtube-short
description: Make and package a Crack Tech YouTube Short in the visual explainer style (a step-by-step trace of code or a system design idea, e.g. Unique Paths with a robot on a grid), plus its cover, title, description, tags and posting checklist. Use when the owner asks for a YouTube Short or video on a coding/DSA or system design topic, a YouTube thumbnail, or YouTube tags/title for a video. For the Instagram cut use instagram-reel (same build, run both).
---

# YouTube Short (visual explainer)

Build with the toolkit in `_content/visual/` (read its `README.md` first). One spec makes the Short and the Reel, so make both unless told otherwise, and use the `instagram-reel` skill for the Instagram half.

## 1. Plan the script (the part that decides views)
- **Simple beats clever.** The owner wants explanations a beginner follows on first watch:
  - the smallest example that shows the idea (a 2×3 grid, fib(4), 5 array cells);
  - plain words ("step back", "save the answer"), no game jargon;
  - one idea per line, at most ~12 spoken words a line.
- **Shape (30–45 s):**
  1. **Hook (0–3 s):** a question or a surprising number, with the visual already on screen. "How many ways can this robot reach the flag?" / "fib(50) makes 40 billion calls."
  2. **Rules (≈8 s):** each rule lights its code line.
  3. **Trace (≈10 s):** the animation does the explaining. Add a counter and the current call ("paths(0, 2)").
  4. **Aha (≈10 s):** the trick, plus a bigger number (48,620 paths → about 100 steps).
  5. **CTA (≈4 s):** Subscribe and "Practice free at crack tech dot app".
- **Accuracy:** compute every number (Python) before it goes in the script, and never copy LeetCode's problem text. Use your own words; naming the problem ("Unique Paths") is fine.
- **Series:** end on an idea that links to the next video (Fibonacci and Unique Paths both end on "save answers"). Name the next topic in the caption or a pinned comment.

## 2. Build
1. Write `_content/visual/examples/<name>.json` and `_content/visual/<name>.html` (copy `unique-paths.*`). Theme: `neon` by default, `--theme olive` for the A/B test (see step 4).
2. Run `make.py`, then `render.sh <out>/yt preview`. Check `sheet.jpg` for:
   - text overlapping moving things;
   - captions splitting a phrase;
   - the code card clipping.

   Fix it and repeat. Then do the full render. Send the MP4 with `SendUserFile`.

## 3. Cover (thumbnail)
Copy `_content/covers/unique-paths-cover.html` and render both sizes:
- **1080×1920:** upload it as the Short's thumbnail in the YouTube mobile app.
- **1280×720:** for long videos, playlists and community posts.

Make neon and olive both, so the owner can pick. The cover asks the hook question or shows the shocking number; it never explains.

## 4. Copy to give the owner
- **Title** (≤ 60 characters, hook first, ends with `#shorts`): `How a Robot Finds Every Path (Recursion Explained) 🤖 #shorts`.
- **Description:**
  - the 3 rules or key points as short lines;
  - "Practice free: https://cracktech.app/practice/";
  - the previous and next videos in the series;
  - a question to comment on;
  - then hashtags (the first 3 show above the title): `#recursion #dynamicprogramming #codinginterview #shorts #leetcode`.
- **Tags** (comma-separated, under 500 characters, most specific first): the problem name and its LeetCode number, the technique (recursion, backtracking, memoization, dynamic programming), "coding interview", "coding interview questions", "dsa", the language, "learn to code", "programming shorts", "crack tech", "cracktech". Tags matter less than the title and description; say so.
- **Related video:** set the previous or next video in the series (the only clickable link on a Short). Add the Short to a playlist ("Recursion, visualized", "System design, visualized").
- **Pinned comment:** the answer to the caption's question, or "Full walkthrough + free practice: cracktech.app".

## 5. Posting and learning
- Post a few hours apart from the Instagram Reel, not at the same minute. Reply to early comments in the first hour.
- **Theme test:** alternate neon and olive across similar videos. Ask the owner for 48-hour views, average view duration (% viewed) and subscribers gained, and record them in `_content/visual/LOG.md`. Then keep the winner as the default, and say what the data shows (a few posts is noise; look for a trend over 6+).
- Don't promise follower or view numbers. Explain what drives them: the hook in the first second, viewers staying past 70%, replays, shares and saves.

## House rules
- Voice: Kokoro `am_michael` only (the owner rejected cloned and accented voices).
- Say "mentorship", never "coaching". No owner surname or employer.
- Videos and covers stay in `out/` folders (git-ignored); commit only the spec, the page and toolkit changes, on the session branch. Update `_content/visual/README.md` when you learn something reusable.
