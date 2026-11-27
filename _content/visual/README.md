# Visual explainer videos (code and system design)

Vertical 1080×1920 videos that **trace an idea step by step**: highlighted code, one visual (a grid, a tree, boxes and arrows), a counter, and big 2–3 word captions with one coloured word. One spec makes both the YouTube Short and the Instagram Reel. First video: `examples/unique-paths.json` + `unique-paths.html`.

The skills `youtube-short` and `instagram-reel` (in `.claude/skills/`) say when and how to use this. This file explains the toolkit itself.

## Files
- `theme.css`: shared look. Themes `neon` (default: dark navy, neon green/yellow/red/cyan/pink) and `olive` (Crack Tech brand). Header, progress bar, cards, code block, caption pill.
- `runtime.js`: shared timing. `RT.L(scene, i)` (a line's start/end), `RT.at(t)` (the current line), `RT.p(t, a, b)` (0–1 progress), `RT.ease`, `RT.pop` (bounce-in scale), `RT.addSfx(t, kind)`, and `RT.frame(t)` (progress bar + captions).
- `<topic>.html`: the video's own page: layout and `window.setup(tl)` / `window.setT(t)`. **State is a pure function of t** (no CSS transitions, no timers), because each frame is a screenshot.
- `make.py spec.json out [--theme olive]`: writes `out/yt` and `out/ig` (frame.html + script.json). The only difference is the ending (`cta_yt` Subscribe + cracktech.app, `cta_ig` Follow + Save).
- `render.sh <dir> [preview]`: voice (Kokoro `am_michael` via `../video/synth.py`), then a 14-frame contact sheet (`sheet.jpg`); without `preview`, all frames, sound effects (`sfx.py`, all synthesized, no third-party audio) and the MP4 (`<name>-<theme>-short.mp4` / `-reel.mp4`).
- `render.js <dir> 30 "t1,t2"`: screenshots just those moments (`preview-NN.png`). Use it to check a particular beat.

## Spec
```json
{"name": "unique-paths", "frame": "unique-paths.html", "speed": 1.1,
 "scenes": [{"id": "hook", "lines": [["spoken text", "Caption | with *highlight*"]]}, ...],
 "cta_yt": [[...]], "cta_ig": [[...]]}
```
- Spoken text spells things out ("crack tech dot app", "forty-eight thousand"); captions use digits and symbols.
- `|` splits a caption into the chunks shown one after another (keep each 1–4 words and never split a phrase like "or down"); `*...*` is the coloured word. Without `|` it splits every 3 words.
- Scene ids are free, except the last scene is always `cta` (added by make.py). The progress bar has one segment per scene.

## Other languages
- **Hinglish (owner's pick, Nov 2026):** add `"voice": "hm_omega:0.7+am_michael:0.3", "lang": "hinglish"` to the spec. Write the spoken text with Hindi words in Devanagari and English words in Latin letters ("यह robot flag तक कितने ways से पहुँच सकता है?"); `_content/video/hinglish.py` gives each word its own language's pronunciation, so English words sound English. Use plenty of English (the owner prefers it). Captions in Roman Hinglish with `|` chunks. Keep the same scene ids and line counts as the English spec, because the page times its animation by line. Example: `examples/unique-paths-hinglish.json` (46 s vs 39 s in English). The plain Hindi voices (`hm_omega`/`hm_psi` with `"lang": "hi"`) mispronounce English words; don't use them alone.

## Layout rules (safe for both apps)
- Header y≈190, progress y=290, code card y 330–722, visual card y 735–1335, caption pill top 1360, nothing important below ~1480 (app UI: title, caption, buttons). Caption pill stays within x 110–970 (Instagram's buttons sit on the right).
- Code: ≤ 6 lines, ≤ 40 characters a line at 33px. Highlight the line that is running (`.on`). Colour the parts the visual uses (e.g. right call cyan, down call pink).
- Keep text off moving things: hide the robot/trails when numbers appear on them.

## Making a new one
1. Copy `unique-paths.html` (grid + robot + counter + code) as the starting point, and keep its structure: compute the whole animation in `setup` (e.g. the DFS steps with start/end times spread over a line), then draw from t in `setT`. Add SFX in `setup` with `RT.addSfx` (`tick`, `tick2`, `off`, `found`, `whoosh`).
2. For system design, draw boxes and arrows in the visual card (SVG) and move "request" dots along arrows with `RT.p`; same code card, or a small table (e.g. a cache hit/miss) in its place.
3. `python3 _content/visual/make.py _content/visual/examples/<name>.json _content/visual/out/<name>`
4. `bash _content/visual/render.sh _content/visual/out/<name>/yt preview`, look at `sheet.jpg`, fix, repeat. Check single beats with `render.js`.
5. Full render of both (in parallel, about 3 minutes): `bash render.sh out/<name>/yt & bash render.sh out/<name>/ig & wait`.
6. Check the result: a contact sheet of the MP4 (`ffmpeg -i x.mp4 -vf "fps=1/2.8,scale=270:-1,tile=7x2" -frames:v 1 s.png`) and the loudness (`-af volumedetect`, mean about −16 dB).

## Setup (cloud session)
- Voice: download the two Kokoro files listed at the top of `_content/video/synth.py` into `_content/video/model/` (git-ignored) and `pip install kokoro-onnx soundfile numpy`.
- Playwright and Chromium are preinstalled (`NODE_PATH=$(npm root -g)`), as are ffmpeg and ImageMagick. Emoji render with Noto Color Emoji.
- Output goes in `_content/visual/out/` and `_content/covers/out/` (git-ignored). Never commit videos or images made for posting.

## Covers
`_content/covers/<name>-cover.html?size=v|h&theme=neon|olive`, rendered with `node _content/covers/shot.js "<abs path>?size=v&theme=neon" out.png 1080 1920` (or `size=h`, 1280 720). Copy `unique-paths-cover.html` or `fibonacci-cover.html`. Rules: one big hook (a number or a question, ≤ 5 words), one picture of the idea, one small pill ("Watch it try them all →"). In the 1080×1920 version keep everything important inside the middle 1080×1350 (y 285–1635), the part Instagram's profile grid shows; check with `convert in.png -crop 1080x1350+0+285 grid.png`.

## Loop Reels (no voice, music only)
- For Instagram-only "watch it loop" Reels: 10–15 s, no narration, the animation does all the explaining. Examples: `bfs.html` and its pair `dfs.html` (same graph, recursive DFS with the call stack; pink accent so the two don't look alike). First one: `bfs.html` (BFS on a 10-node graph, Nov 2026), styled after the owner's reference (an animation-only algorithm account): near-black navy, dark rounded panels, crisp outlined shapes that fill when active, code with the running line highlighted, a big Big-O, small monospace labels, one colour per BFS level. Use our own layout and branding; never copy another account's design.
- Keep them tight: the owner cut BFS to 10 s ("nothing much happens at the end"), so the action fills the loop, with only a short done-state and a quick fade back.
- The page has no voice timeline: it runs on a beat grid (BFS: 144 BPM, 24 beats = 10 s) and its `window.SFX` events (pop/enq/seen/clear) drive the music. The last frame equals the first (everything fades back to the start), so it loops seamlessly.
- Render: copy the page to `out/<name>/frame.html`, write `{"duration": 10.0, "scenes": []}` to `timeline.json`, `node render.js out/<name> 30` (writes the frames and `sfx.json`), `python3 bfs_music.py out/<name> <bpm> <beats>` (original 8-bit chiptune made by the script on the same grid; it wraps the tail into the start so the audio loops too), then ffmpeg the frames with `music.wav` (loudnorm −14) and once without audio, so the owner can add a track from Instagram's library instead.
- Music: never use copyrighted game music or sound effects (the owner asked for Mario; Nintendo's music would get the Reel muted). Make an original track in that spirit, or suggest a licensed track from Instagram's library.
- Gotchas: an SVG filter on a perfectly vertical or horizontal line disappears unless the filter uses `filterUnits="userSpaceOnUse"` with a full-frame region. Clip effects (wave rings) to their panel. In code blocks, put `white-space:pre` on the line divs, not the container, or the whitespace between them shows as blank lines.

## Safe area (Instagram and Shorts)
- Measured from a phone screenshot (Nov 2026), in 1080×1920 video pixels:
  - the app's header covers y < 130;
  - the like/comment/share buttons cover x > 940 from y ≈ 880 down;
  - the username and caption cover y > 1640;
  - tall phones crop ~25 px at each side.
- Every page wraps its content in `#stage`, scaled to 0.898 into roughly x 40–920, y 270–1460 (rule in `theme.css`; `bfs.html` has its own copy). The background still fills the frame. Covers do the same for `size=v`, and keep everything inside the 3:4 profile-grid crop (y 240–1680).
- Check before rendering: `bash safecheck.sh out.png frame1.png …` draws the covered zones in red over frames.
- Branding: loop Reels show `cracktech.app` centred above the title (owner, Nov 2026), so it's on the cover and in every frame; their `#stage` sits a little lower (translate y 170) to make room.
