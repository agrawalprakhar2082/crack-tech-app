# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Crack Tech is a single-page marketing site for 1:1 tech-interview coaching. The whole site is one self-contained `index.html`: inline `<style>`, inline `<script>`, and an inline SVG favicon. There is no build step, package manager, linter or test suite.

## Running locally

Open `index.html` directly, or serve the folder so `fetch` and the external embeds behave as they do in production:

    python3 -m http.server 8000   # then visit http://localhost:8000

## Structure of index.html

- **`<head>`**: A tiny blocking script reads `localStorage["ct-theme"]` and sets `data-theme="dark"` on `<html>` before first paint, which prevents a light-to-dark flash. Fonts (Instrument Serif, Geist, Geist Mono) load from Google Fonts.
- **CSS**: All colors are custom properties on `:root` (light theme: ivory and olive). `[data-theme="dark"]` overrides the same tokens. Use these tokens for new styles rather than hard-coded colors. The font tokens are `--serif`, `--sans` and `--mono`.
- **Sections**: `#how`, `#services`, `#signals`, `#pricing`, `#faq` and `#book`. The scroll-spy nav highlighting uses a hard-coded list of these IDs in the script. Update that list if you add, remove or rename a section.
- **Script**: One IIFE at the bottom of the page. It handles the header scroll state, theme toggle, mobile menu, scroll-spy, `.rv` scroll-reveal (IntersectionObserver adds `.in`), the booking flow, the lead form and the animated mock-interview card. All motion respects `prefers-reduced-motion`.

## Booking and lead form (config lives in the script)

- **Cal.com**: Set `CAL_USERNAME` to switch the `#book` section from the request form to an inline Cal.com calendar. While it is empty (`""`), the form shows instead. The calendar loads lazily, only when the visitor scrolls near `#book`, and follows the site theme.
- **Event slugs**: `CAL_EVENTS` maps the tab keys `intro`, `mock` and `coaching` to Cal.com event slugs. These keys must match the `data-event` attributes on the `.tab` buttons.
- **Pricing buttons**: These carry `data-service="<label>"`. When Cal.com is on, `SERVICE_TO_EVENT` maps that label to a calendar tab. When it's off, the label sets the `#f-svc` `<select>`, so it must exactly match an `<option>` text. Keep `data-service` values, `<option>` texts and `SERVICE_TO_EVENT` keys in sync.
- **Lead form**: `#lead` posts to Formspree. While its `action` still contains the placeholder `YOUR_FORMSPREE_ID`, submit runs in demo mode: it shows the success state without sending anything.

## Mock-interview hero card

`lines` is an array of token rows `[cls, text, cls, text, ...]`, where `cls` is one of `k`, `f`, `c`, `n` or `p`, mapped to `tk-*` classes. `milestones` maps a line index to the scorecard bars that fill when that line finishes typing. If you edit `lines`, recheck the `milestones` indices.
