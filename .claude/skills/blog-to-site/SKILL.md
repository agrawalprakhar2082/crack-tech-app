---
name: blog-to-site
description: Add a published Medium article (or a YouTube video for an existing article) to the cracktech.app blog, then open a PR with screenshots. Use when the owner shares a Medium link and wants it on the website, or gives a video link for a post.
---

# Add an article to the site blog

1. **Start a fresh branch** from the latest main, on the session's designated branch:
   - `git fetch origin main && git checkout -B <branch> origin/main`.
   - If the remote branch only holds already-merged history, merge it in so a normal push works. Never force-push.
2. **Add an entry at the top of `_blog/posts.rb`**, copying an existing one:
   - Required fields:
     - `slug`, `title` (exactly as on Medium) and `category` (System Design, Agentic AI or Coding; a new category adds a filter button automatically);
     - `date` (YYYY-MM-DD), `minutes`, `image` and `medium` (the full URL; publication URLs such as `medium.com/stackademic/…` are fine);
     - `teaser` (one line), `summary` (2 paragraphs) and `takeaways` (5 bullets).
   - Write the summary and takeaways from the article's real content, in plain language.
   - Optional fields: `youtube` (a link or 11-character id), `video_start` (seconds), `video_title` and `video_note`.
   - **Cover:** prefer a local copy. Save the cover as `_blog/images/<slug>.jpg` (1024 px wide, 16:9, e.g. `ffmpeg -i cover.png -vf scale=1024:-1 -q:v 3 …`) and set `image: "https://cracktech.app/blog/images/<slug>.jpg"`. The build copies it to `blog/images/`.
3. **Build:** run `ruby _blog/build.rb`, which also rebuilds `practice/` and checks the practice sessions. Never edit `blog/` by hand.
4. **Screenshot locally:**
   - Serve the repo with `python3 -m http.server`.
   - In Playwright, route `cracktech.app/blog/images/*` to the local files, proxy Google Fonts via curl, and abort other external requests.
   - Capture `/blog/` and the article page.
5. **Commit and open the PR** following the `pr-with-screenshots` skill, then ask the owner to say "merge PR N". Merge only with the owner's OK.
