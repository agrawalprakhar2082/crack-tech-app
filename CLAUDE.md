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

## Booking (Cal.com, switched on)

- Cal.com username: `crack-tech-io` (`CAL_USERNAME` in the script near the bottom of `index.html`).
- Inline embed with tabs: Free 15-min call, Mock interview, 1:1 coaching. Expected event slugs: `intro-call` (15 min, free), `mock-interview` (60 min), `coaching` (90 min). They must match `CAL_EVENTS`.
- With payments paused, the paid event types should be set to "Requires confirmation" on Cal.com; the owner arranges payment by hand before confirming.
- The calendar loads lazily when the visitor nears `#book`, and follows the site theme (brand colour `#4f5d2a`, dark `#b3c07a`).
- The package builder's "Request this package" opens the free-call tab and pre-fills the booking notes with the chosen package (`notes` in the embed config and `?notes=` on the direct link).
- The request form (Formspree placeholder `YOUR_FORMSPREE_ID`) only shows if `CAL_USERNAME` is emptied again.
- Google Meet: connect Google Calendar first (Apps > Google Calendar), then Settings > Conferencing > Add > Google Meet, set as default; set each event type's Location to Google Meet.
- The cloud dev environment blocks cal.com by default, so the live calendar can't be tested there unless `cal.com`, `app.cal.com` and `api.cal.com` are allowed.

- Payments: on hold (see PR 6, a Razorpay pay-first draft). Stripe isn't viable because the company is registered in India.

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