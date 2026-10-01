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
- Custom package builder: the Interview package card's "Build my package" button opens a pop-up (`#builder` dialog; `#build-package` opens it from a link). Clients choose a number of coaching sessions and mocks and see a live total with volume discounts. "Request this package" pre-fills the booking request. Prices and discounts are in `UNIT` and `TIERS` in the script. The discounts are sample values (3–4 sessions 5%, 5–7 10%, 8+ 15%) until the user gives real ones.
- Tried and dropped: a package-first flow with "Buy a package" buttons, a Wise payment page (`pay.html`) and package codes. The user preferred per-session pricing.

## Booking (built, switched off until configured)

- Cal.com inline embed with tabs: Free 15-min call, Mock interview, 1:1 coaching.
- To switch on: set `CAL_USERNAME` in the script near the bottom of `index.html`.
- Expected Cal.com event slugs: `intro-call` (15 min, free), `mock-interview` (60 min), `coaching` (90 min).
- Until then, a request form shows instead (Formspree placeholder `YOUR_FORMSPREE_ID`, not yet set up).
- Cal.com account tips: display name "Crack Tech", username like `cracktech`, Google Meet as location.

## Payments: current decision

- Stripe, for now. The user wants to find a better long-term setup later because of the ~3% card fees.
- Single sessions: Stripe connected inside Cal.com, so paid event types (`mock-interview` $150, `coaching` $300) charge at booking. Stripe Checkout shows card, Apple Pay and Google Pay automatically. The free `intro-call` stays free.
- Custom packages: agreed on the free call, then the owner sends a Stripe payment link for the agreed amount from the Stripe dashboard. A bank transfer (Zelle or Wise) can be offered for large packages to avoid the fee.
- Apple Pay (and Google Pay) come through Stripe, so there is no separate integration. They work on Stripe-hosted checkout and Payment Links with no domain registration. Check they are on under Stripe Dashboard > Settings > Payment methods. Domain registration is only needed if the site ever embeds Stripe Elements or Embedded Checkout on its own domain.
- The pricing section shows a payment badge row (Apple Pay, Google Pay, cards, "Secure checkout by Stripe"). These are text badges, not official logos.
- Payouts: Stripe can pay out to the user's Wise USD account details.
- Fees: Stripe in the US is 2.9% + 30¢ per domestic card payment, plus 1.5% for international cards and 1% more if currency is converted.
- Alternatives considered: PayPal (also integrates with Cal.com, higher fees); Square, Venmo Business, Zelle and Wise (no Cal.com integration, so manual); Paddle and Lemon Squeezy (merchant of record, ~5% + 50¢, built for software).

## Open questions for the user

- Cal.com username (once the account is created).
- Real package discount levels (the builder shows sample ones).
- Stripe account (and payout to Wise) and connecting Stripe in Cal.com.
- Cancellation and refund policy now that sessions are paid at booking.
- A better long-term way to handle payments (lower fees and/or automation).
- Whether GitHub Pages is on, and whether to connect cracktech.io.

## Next steps

1. Switch on Cal.com once the username is provided, with Stripe connected for the paid event types.
2. Replace the sample package discounts with real ones, and add the refund policy to the FAQ.
3. Revisit payments for a better long-term setup.
4. Later phases: member portal (session credits, bookings), admin portal, payment automation (for example taking package payments directly from the builder via a small serverless function and Stripe Checkout).

## Working agreement for GitHub

- One branch per change, clear commits, a pull request with a summary and screenshots.
- Nothing goes to `main` without the user's OK.