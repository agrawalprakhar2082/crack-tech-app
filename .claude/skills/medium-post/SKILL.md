---
name: medium-post
description: Draft a Crack Tech Medium article in the owner's voice, with a cover image, a LinkedIn post and its first comment. Use when the owner asks for the next blog or Medium post, a post for a publication like Stackademic, or a LinkedIn post for an article.
---

# Medium post (+ cover + LinkedIn)

## Find the source first
- **The owner's own notes** come first. Search Google Drive with the connector, e.g. `fullText contains '<topic>'`. Useful docs: "Interview Prep - Vivek", "Interview Prep - Sandeep", "Mock Interview - Anshul", "Mock Interview Questions", and "Designing Google Calendar…".
- **Use notes as material, never copy private details:** no mentee names, rates, prices or company-internal links.
- **Verify every factual claim** (limits, APIs, complexities). Run code examples before including them.

## Voice and structure (match the published posts)
- **Voice:** simple, first person ("I"), short sentences, practical, no hype.
- **Opening:** the title, an italic subtitle line, `---`, then a hook naming the interview pain.
- **Body:** sections with `##`, a worked example, a comparison table where useful, "mistakes I see a lot", how to practise, and a bold one-line takeaway.
- **Close:** a question for the comments, then a footer:
  - "If you're preparing for … you can book a free 15-minute call at [cracktech.app](https://cracktech.app)."
  - A "More from me" line linking related posts and YouTube.
  - Where it fits, a link to the matching free session at `https://cracktech.app/practice/`.
- **Existing posts to link:** the 4-step plan, the 10⁵ estimation trick, the Calendar walkthrough (video `https://youtu.be/ZU1uMp7jlsQ`), AI agent jargon, "The Model Isn't the Agent", delay queues and code-with-AI (Stackademic).
- **Medium settings note** (at the end of the file, for the owner only): subtitle, 5 tags, cover alt text.

## Cover image
Copy `_content/covers/example-cover.html` (1400×788, brand tokens in `common.css`) and run:

`node _content/covers/shot.js <abs html> <out.png> 1400 788`

Check that the title doesn't overlap the visual (narrow the `h1` width if needed).

## LinkedIn post
- **Hook:** the first 2 lines must earn the "see more" click.
- **Body:** short lines, the problem, ❌/✅ contrasts or numbered points, and the one line to remember.
- **Close:** "Link in the first comment", a question, and 5 hashtags.
- **First comment:** the article link, the matching practice session, and YouTube.
- **Media:** attach the cover. A 5-slide PDF carousel gets more reach (see the `carousel` skill).

## Deliver
- Save drafts to the scratchpad (`excal/medium-<slug>.md`, `excal/linkedin-<slug>.md`) and send them with SendUserFile.
- Show the full text inline if asked.
- Once published, offer to add it to the site blog with the `blog-to-site` skill.
