---
name: carousel
description: Make a branded carousel (LinkedIn PDF document post or Instagram slides, 1080×1350) from an article, a cheat sheet or an intro. Use when the owner asks for a carousel, slides for LinkedIn/Instagram, or a portrait cheat sheet.
---

# Carousel (LinkedIn PDF / Instagram slides)

## Steps
1. **Copy the template:** copy `_content/carousel/example-carousel.html` (5 slides, each `.s` is 1080×1350; `common.css` holds the brand tokens) to a scratch folder with `common.css` and `shot.js`.
2. **Write 5–7 slides:**
   - **Slide 1:** a hook title and "Swipe →".
   - **Middle slides:** one idea each (code, a test, a list), with "n/N" in the corner.
   - **Last slide:** the takeaway, "Practise free at cracktech.app/practice" and "♻ Repost to help a friend prepping".
   - Keep text large: body 36–44 px, titles 76–96 px.
3. **Render:** `node shot.js <abs html> <outdir>` writes `slide-N.png` and a multi-page PDF (`@page` 1080×1350).
4. **Check:** make a contact sheet (`montage slide-*.png -tile 5x1 -geometry 400x500+4+4 sheet.jpg`) and look for overlaps or crowding. Shrink spacing rather than font size.
5. **Deliver:**
   - **LinkedIn:** send the PDF. The owner posts it with **+ → Add a document** and gives it a title.
   - **Instagram:** send the slides as JPGs (`ffmpeg -i slide-1.png -q:v 2 slide-1.jpg`), zipped as a separate set if asked.

## Rules
- Quotes and testimonials: use the website's exact words only. No surname or employer for the owner. "Mentorship" wording.
- Only claims already on the site, e.g. "10+ years mentoring engineers" and "Offers landed at: Meta, Apple, Google, Amazon, Microsoft, Salesforce".
