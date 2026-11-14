# Crack Tech blog

To add an article:

1. Add an entry to the top of `_blog/posts.rb`: title, category, date, summary, takeaways, cover image and Medium link.
2. Run `ruby _blog/build.rb` from the site folder.
3. Upload the changed files to the site's GitHub repository.

To show a video on an article's page, add `youtube: "<YouTube link>"` to its entry (optional: `video_note: "…"`, `video_title: "…"`, and `video_start: 150` to start at a given second). The page then embeds the video below the summary, and the article list marks it "▶ Video".

To host a cover image with the site instead of on Medium, put it in `_blog/images/` and set `image:` to `https://cracktech.app/blog/images/<file>`; the build copies it to `blog/images/`.

Files in `blog/` are generated, so edit `_blog/` rather than `blog/`.

## Practice page

`ruby _blog/build.rb` also builds the Practice page (`/practice/`) from `_practice/`:

- `_practice/sessions.js`: the practice sessions (questions, timings, "what interviewers look for"). Each session must add up to 45 minutes; the build runs `node _practice/check.js` to check this when Node is installed.
- `_practice/practice.js`: the app (timer, autosave, dictation, code editor, whiteboard, send for review). `FORM_ENDPOINT` at the top sets where answers are sent.
- `_practice/practice.css`: its styles.

Files in `practice/` are generated, so edit `_practice/` rather than `practice/`.
