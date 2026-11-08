# Crack Tech blog

To add an article:

1. Add an entry to the top of `_blog/posts.rb`: title, category, date, summary, takeaways, cover image and Medium link.
2. Run `ruby _blog/build.rb` from the site folder.
3. Upload the changed files to the site's GitHub repository.

To show a video on an article's page, add `youtube: "<YouTube link>"` to its entry (optional: `video_note: "…"`). The page then embeds the video below the summary, and the article list marks it "▶ Video".

Files in `blog/` are generated, so edit `_blog/` rather than `blog/`.
