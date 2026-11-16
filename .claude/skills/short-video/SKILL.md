---
name: short-video
description: Make a Crack Tech YouTube Short and its Instagram Reel cut (AI male voice, brand visuals, captions), plus title, description, tags and captions. Use when the owner asks for a Short, a Reel, an Instagram version of a Short, or the next part of a video series (e.g. AI terms Part 6).
---

# Short + Reel

Both are made from one spec with the toolkit in `_content/video/` (not published on the site).

## Steps
1. **Write the spec** (copy `_content/video/examples/ai-terms-part-5.json`):
   - `scenes`: exactly `hook`, `t1`, `t2`, `t3` (the progress bar has 3 steps). Each has `html` and `lines` (`[spoken, caption]` pairs). Animate an element in with `class="a" data-l="<line index>"`.
   - Spoken text spells things out ("crack tech dot app", "ten to the five"); captions use symbols ("cracktech.app", "10⁵").
   - `cta_yt`: Subscribe button, "linked below", and the line "For more videos and blogs, visit crack tech dot app."
   - `cta_ig`: Follow button ("Follow for Part N" in a series), "🔖 Save", "on my profile" instead of "linked below", and "link in bio". Instagram has no links under a Reel.
   - Aim for 30–45 seconds. Put the hook in the first second. One idea per scene.
   - Content must be accurate: verify claims, and never copy published problem text.
2. **Build:** `python3 _content/video/make_short.py spec.json <outdir>` writes `<outdir>/yt` and `<outdir>/ig`.
3. **Voice model:** if missing, download the two Kokoro files listed at the top of `_content/video/synth.py` into `_content/video/model/`, and `pip install kokoro-onnx soundfile numpy`. Kokoro needs Python ≥ 3.10; set `PYTHON=python3.13` if the default is older.
4. **Preview first:** run `bash _content/video/render.sh <outdir>/yt preview`, then look at `sheet.jpg` (the last frame of each scene). Check for:
   - text overlapping the captions;
   - lines wrapping badly (use `white-space:nowrap` or a smaller size);
   - content cut off on the right.

   Do the same for `ig`.
5. **Render:** `bash _content/video/render.sh <dir>` writes `<name>.mp4` and `cover.png`, the end of the hook, to use as the Reel cover.
6. **Send both videos and the IG cover** to the owner with SendUserFile.

## Copy to give the owner
- **YouTube:** a title ending in `#shorts`, a description with the key points, links (playlist or Parts, the long video, `https://cracktech.app`), a question, a Subscribe line and 5–6 hashtags, plus comma-separated tags. Suggest setting the **Related video** (the only clickable link on a Short).
- **Instagram:** a caption whose first line is the hook (only that line shows before "more"), the points, then 💬 question, 🔖 Save, ➕ Follow, "Missed Part N? It's on my profile", and 5 specific hashtags.
- **Music:** an instrumental at 5–10% under the voice, the same track per series. Upload at highest quality. Suggest posting as a Trial reel.

## House rules
- Voice: Kokoro `am_michael` only. The owner rejected cloned and accented voices.
- Brand: olive and ivory, Instrument Serif, Geist and Geist Mono.
- No owner surname or employer. Say "mentorship", not "coaching".
- Keep outputs in the scratchpad or `_content/**/out/` (git-ignored). Never commit videos.
