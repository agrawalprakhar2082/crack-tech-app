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
- Package builder: the Interview package card's "Build my package" opens a pop-up (`#builder`; `#build-package` opens it from a link) with steppers for coaching and mocks, and a live total with volume discounts (`UNIT` and `TIERS` in the script). The discounts are sample values (3–4 sessions 5%, 5–7 10%, 8+ 15%).

## Booking (Cal.com, switched on)

- Cal.com username: `crack-tech-io` (`CAL_USERNAME` in the script near the bottom of `index.html`).
- Inline embed with tabs: Free 15-min call, Mock interview, 1:1 coaching. Expected event slugs: `intro-call` (15 min, free), `mock-interview` (60 min), `coaching` (90 min). They must match `CAL_EVENTS`.
- With payments paused, the paid event types should be set to "Requires confirmation" on Cal.com; the owner arranges payment by hand before confirming.
- The calendar loads lazily when the visitor nears `#book`, and follows the site theme (brand colour `#4f5d2a`, dark `#b3c07a`).
- The package builder's "Book a free call to discuss" opens the free-call tab and pre-fills the booking notes with the chosen package (`notes` in the embed config and `?notes=` on the direct link).
- The request form (Formspree placeholder `YOUR_FORMSPREE_ID`) only shows if `CAL_USERNAME` is emptied again.
- Google Meet: connect Google Calendar first (Apps > Google Calendar), then Settings > Conferencing > Add > Google Meet, set as default; set each event type's Location to Google Meet.
- The cloud dev environment blocks cal.com by default, so the live calendar can't be tested there unless `cal.com`, `app.cal.com` and `api.cal.com` are allowed.

## Payments and packages: current plan (simple start)

- The business is a **sole proprietorship** in India (not a Pvt Ltd or LLP), so the owner may receive payments in their personal account; a separate account for the firm is recommended for clean books. GST registration applies above ₹20 lakh a year; file an LUT for clients abroad. Check details with the CA.
- **Single sessions:** one booking at a time through Cal.com. The plan is to connect **PayPal in Cal.com** (Apps > PayPal) and set prices on `mock-interview` ($150) and `coaching` ($300), so clients pay at booking and "Requires confirmation" can be turned off. The site says "Pay securely by card or PayPal when you book."
- **Custom packages:** the package pop-up is a price estimator. Its buttons open WhatsApp (`wa.me` link with the package pre-written) or email (`mailto:`), plus "Book a free call to discuss" (which pre-fills the Cal.com notes). Packages are agreed by message and paid by bank transfer (Wise Business supports sole proprietors in India) or PayPal. The owner then books the sessions or sends a Cal.com private link limited to the number of sessions.
- Contact details go in `CONTACT` (`whatsapp`: international format, digits only; `email`) in the script. While they're empty, the WhatsApp and email buttons and footer links stay hidden.
- Not viable or deferred: Stripe (invite-only in India, no Apple Pay); Razorpay pay-first with private-link credits (PR 6, on hold, includes draft policy pages); a full credits system (Cloudflare Worker + D1 + Cal.com webhooks and API, which needs the Cal.com Teams plan), planned for later.

## Open questions for the user

- Business WhatsApp number and email (for `CONTACT`).
- PayPal connected in Cal.com, with prices set on the paid event types.
- Real package discount levels (the builder shows sample ones).
- Whether GitHub Pages is on, and whether to connect cracktech.io.

## Next steps

1. Fill in `CONTACT` once the user shares their WhatsApp and email.
2. After PayPal is connected in Cal.com, check that a test booking takes payment.
3. Turn on GitHub Pages and test the live calendar.
4. Later: payments with lower fees (Razorpay or a Stripe invite), then a credits system and member portal.

## Working agreement for GitHub

- One branch per change, clear commits, a pull request with a summary and screenshots.
- Nothing goes to `main` without the user's OK.
- The user is not a git expert: explain the commands you run in plain language.
