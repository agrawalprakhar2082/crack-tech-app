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
# Crack Tech: handoff notes

Attach this file (and the latest `index.html` if needed) to the new session and say: "Continue the Crack Tech website work using these notes."

## Where things stand

- Repo: github.com/agrawalprakhar2082/crack-tech-io (branch `main`). The homepage `index.html` is uploaded and is the current version.
- The older repo `agrawalprakhar2082/crack-tech` still has the old page; crack-tech-io is the one we're using now.
- Domain cracktech.io: the user thinks they still own it; not yet checked. It can be pointed at GitHub Pages later.
- GitHub Pages: not confirmed yet. Turn on under Settings > Pages > Deploy from branch > main / root.

## Design decisions (already built)

- Single static `index.html`, no build step, for GitHub Pages.
- "Classy" ivory + olive theme. Light by default, with a dark-mode toggle that remembers the visitor's choice.
- Fonts: Instrument Serif (headings), Geist (body), Geist Mono (small labels).
- Sections: Hero with animated mock-interview card, How it works (Diagnose / Drill / Rehearse), Services (DSA, System design, Behavioral, Mock interviews), What interviewers score, Pricing, FAQ, Booking, Footer.
- Navigation: sticky header (How it works, Services, Pricing, FAQ, Book a free call), active-section highlight, full-screen mobile menu, pricing buttons jump to booking with the session pre-selected.
- Owner's identity is kept off the site: described only as "a senior engineer at a top tech company with 7+ years coaching".
- No unverifiable claims (removed "hundreds of FAANG offers"). Add real testimonials only if the user provides them.
- Pricing: Mock interview $150 / 60 min; 1:1 coaching $300 / 90 min; Interview package "Custom".

## Booking (built, switched off until configured)

- Cal.com inline embed with tabs: Free 15-min call, Mock interview, 1:1 coaching.
- To switch on: set `CAL_USERNAME` in the script near the bottom of `index.html`.
- Expected Cal.com event slugs: `intro-call` (15 min, free), `mock-interview` (60 min), `coaching` (90 min).
- Until then, a request form shows instead (Formspree placeholder `YOUR_FORMSPREE_ID`, not yet set up).
- Cal.com account tips: display name "Crack Tech", username like `cracktech`, Google Meet as location.

## Payments: agreed direction

- The user wants Wise. Wise card-payment links aren't available to new Wise Business customers, and no scheduler integrates Wise.
- Preferred model: package first, then booking.
  1. Anyone can view available slots.
  2. Client buys a package and pays via Wise transfer, with a reference like CT-1042.
  3. Once paid, the owner emails a package code and the number of sessions.
  4. Paid session types on Cal.com require a "Package code" answer and are set to "Requires confirmation". The owner approves valid codes.
  5. The free intro call stays open to everyone.
- Later: the member portal tracks session credits automatically, and the Wise API or webhooks could detect payments.
- Alternative if smoother checkout is wanted: Cal.com + Stripe, with payouts to Wise USD account details.

## Open questions for the user

- Cal.com username (once the account is created).
- Package sizes and prices (e.g. 3 coaching sessions for $X, or a mix of coaching and mocks).
- Whether GitHub Pages is on, and whether to connect cracktech.io.

## Next steps

1. Update the site for the package-first flow: "Buy a package" buttons, a Wise payment instructions page, and "Have a package code? Book here" on the paid tabs.
2. Switch on Cal.com once the username is provided.
3. Later phases: member portal (session credits, bookings), admin portal, Wise payment automation.

## Working agreement for GitHub

- One branch per change, clear commits, a pull request with a summary and screenshots.
- Nothing goes to `main` without the user's OK.
