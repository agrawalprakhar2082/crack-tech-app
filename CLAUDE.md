# Crack Tech: handoff notes

Attach this file (and the latest `index.html` if needed) to the new session and say: "Continue the Crack Tech website work using these notes."

## Where things stand

- Repo: github.com/agrawalprakhar2082/crack-tech-io (branch `main`).
- Files: `index.html` (the whole homepage: inline CSS and JS), policy pages `terms.html`, `privacy.html`, `refund-policy.html` and `contact.html` (all share `legal.css`), and this file.
- The older repo `agrawalprakhar2082/crack-tech` still has the old page; crack-tech-io is the one we're using now.
- The business is a company registered in India. This drives the payment choices below.
- Domain cracktech.io: the user thinks they still own it; not yet checked. It can be pointed at GitHub Pages later.
- GitHub Pages: not on yet. Turn on under Settings > Pages > Deploy from branch > main / root. The site will then be at https://agrawalprakhar2082.github.io/crack-tech-io/.
- A daily "Crack Tech repo check" routine (8:53am Pacific) reports on the repo. It is report-only.

## Design decisions (already built)

- Static site, no build step, for GitHub Pages. The homepage is a single `index.html`.
- "Classy" ivory + olive theme. Light by default, with a dark-mode toggle that remembers the visitor's choice (`localStorage["ct-theme"]`; the policy pages read it too).
- Fonts: Instrument Serif (headings), Geist (body), Geist Mono (small labels).
- Sections: Hero with animated mock-interview card, How it works (Diagnose / Drill / Rehearse), Services (DSA, System design, Behavioral, Mock interviews), What interviewers score, Pricing, FAQ, Booking, Footer (with policy links).
- Navigation: sticky header (How it works, Services, Pricing, FAQ, Book a free call), active-section highlight, full-screen mobile menu.
- Owner's identity is kept off the site: described only as "a senior engineer at a top tech company with 7+ years coaching". The policy and contact pages must show the company's legal name and address (Razorpay requires it), but not the owner's personal name.
- No unverifiable claims (removed "hundreds of FAANG offers"). Add real testimonials only if the user provides them.
- Pricing: Mock interview $150 / 60 min; 1:1 coaching $300 / 90 min; Interview package "Custom".
- Custom package builder: the Interview package card's "Build my package" button opens a pop-up (`#builder` dialog; `#build-package` opens it from a link). Clients choose a number of coaching sessions and mocks and see a live total with volume discounts. "Request this package" pre-fills the booking request. Prices and discounts are in `UNIT` and `TIERS` in the script. The discounts are sample values (3–4 sessions 5%, 5–7 10%, 8+ 15%) until the user gives real ones.
- Tried and dropped: a "Buy a package" flow with a Wise payment page (`pay.html`) and package codes (the user preferred per-session pricing), and a Stripe + Apple Pay setup (not viable for an Indian company, see below).

## Payments and booking: current plan (pay first, then book)

1. **Free intro call:** public on Cal.com (`intro-call`, 15 min). Anyone can book it from the site.
2. **Pay first:** "Buy a mock" and "Buy coaching" open Razorpay Payment Pages (international cards; UPI, cards and netbanking for Indian clients). The URLs go in `PAY_LINKS` in the script. While they're empty, the buttons fall back to the request form with that session selected. Custom packages are agreed on the free call, then the owner sends a Razorpay payment link, or bank details (Skydo or Xflow USD account) for large packages to avoid card fees.
3. **Credits = Cal.com private links:** after payment, the owner creates a private link on the hidden paid event type (`mock-interview` or `coaching`) under Event type > Advanced > Private links, with a usage limit equal to the sessions paid for, and emails it. Mixed packages get one link per event type. The link stops working once the sessions are used.
4. **Booking:** the client books each session through their link. Cancellations with 24h+ notice: send a new one-use link.
   - Google Meet as the location: first connect Google Calendar (Apps > Google Calendar). Then go to Settings > Conferencing > Add > Google Meet > Install, and set it as the default. In each event type, set Location to Google Meet (or "Organizer's default app").
   - Cal.com has a free plan for one user. Signup may offer a Teams trial first; the free individual plan is enough here.
5. On the site, the Mock and Coaching booking tabs show a "book with your private link" panel with a Buy button instead of a calendar. Only `intro-call` is embedded (`CAL_EVENTS`).

Why this setup:
- Stripe is invite-only for Indian businesses (since May 2024), and Indian Stripe accounts don't support Apple Pay or Google Pay.
- Razorpay doesn't integrate with Cal.com, so payment happens before booking instead of at booking.
- Fees: Razorpay international cards ~3% + 18% GST plus currency conversion; domestic ~2% + GST. PayPal India integrates with Cal.com but costs ~5–8% all-in. Skydo or Xflow charge a flat ~$12–19 per transfer with no currency markup. Wise business accounts in India are for sole proprietors only.
- Building our own calendar was considered and rejected for now: Cal.com handles availability, time zones, invites, Meet links and reminders. The member portal can later use Cal.com's API with our own UI and credit checks.
- Compliance (for the user's CA): export of services, so file an LUT for zero-rated GST, keep eFIRA/FIRC records (Razorpay and Skydo generate them), and use the right RBI purpose code.
- Before relying on private links: confirm which Cal.com plan includes usage-limited private links, and whether a cancellation gives the use back (assume not).

## Policy pages (drafts)

- `terms.html`, `privacy.html`, `refund-policy.html`, `contact.html` are drafts written for Razorpay's website checks. Each shows a "Draft for review" banner (remove it when final) and `[bracketed]` placeholders: company legal name, registered address, contact email, phone, city for jurisdiction, dates, support hours, and data retention.
- The refund policy uses suggested defaults: free reschedule 24h+ before; cancel 24h+ before → session back; less than 24h or no-show → used; full refund within 14 days if nothing used; unused sessions valid 6 months. The user must confirm these.

## Open questions for the user

- Cal.com username (once the account and event types are created).
- Razorpay account (with international payments enabled) and the two Payment Page URLs.
- Company details for the policy pages, and the final refund policy.
- Real package discount levels (the builder shows sample ones).
- Formspree ID for the request form.
- Whether GitHub Pages is on, and whether to connect cracktech.io.

## Next steps

1. Fill in `PAY_LINKS`, `CAL_USERNAME` and the policy placeholders once the user provides them; remove the draft banners after review.
2. Replace the sample package discounts with real ones.
3. Stage 2 automation: Zapier or Make, so a Razorpay payment logs to a Google Sheet and emails the client.
4. Stage 3: member portal (login, credit balance, booking through Cal.com's API with our own credit check), admin portal, payment automation via Razorpay webhooks.

## Working agreement for GitHub

- One branch per change, clear commits, a pull request with a summary and screenshots.
- Nothing goes to `main` without the user's OK.
- The user is not a git expert: explain the commands you run in plain language.
