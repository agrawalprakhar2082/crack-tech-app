# Crack Tech: handoff notes

Attach this file (and the latest `index.html` if needed) to the new session and say: "Continue the Crack Tech website work using these notes."

## Where things stand

- Repo: github.com/agrawalprakhar2082/crack-tech-io (branch `main`). The homepage `index.html` is uploaded and is the current version.
- The older repo `agrawalprakhar2082/crack-tech` still has the old page; crack-tech-io is the one we're using now.
- Domain cracktech.io: the user thinks they still own it; not yet checked. It can be pointed at GitHub Pages later.
- GitHub Pages: on, deploying from `main`. The live site is https://agrawalprakhar2082.github.io/crack-tech-io/ and rebuilds automatically after each merge (check the Actions tab).

## Design decisions (already built)

- Single static `index.html`, no build step, for GitHub Pages.
- "Classy" ivory + olive theme. **Dark by default** (`data-theme="dark"` on `<html>`), with a toggle that remembers the visitor's choice in `localStorage["ct-theme"]`; a stored "light" switches to the light theme before first paint. Pages added later (e.g. the policy pages on the `claude/razorpay-credits` branch) should follow the same default.
- Fonts: Instrument Serif (headings), Geist (body), Geist Mono (small labels).
- Brand assets live in `brand/` (icon, circle-safe avatar for Cal.com and similar, and wordmark logos for light and dark backgrounds, as PNG and SVG; see `brand/README.md`). Olive `#4f5d2a`, ivory `#f6f3ec`.
- Sections: Hero with animated mock-interview card, How it works (Diagnose / Drill / Rehearse), Services (DSA, System design, Behavioral, Mock interviews), What interviewers score, Pricing, FAQ, Booking, Footer.
- Navigation: sticky header (How it works, Services, Pricing, FAQ, Book a free call), active-section highlight, full-screen mobile menu, pricing buttons jump to booking with the session pre-selected.
- Owner's identity is kept off the site: described only as "a senior engineer at a top tech company with 10+ years coaching".
- Claims: the hero shows "10+ years coaching engineers" and, below the facts row, "FAANG offers for Directors, Managers, Senior Engineers and college grads". Both were added at the owner's explicit request (October 2026); "500+ successful offers" was tried and replaced. The owner is responsible for being able to back these up. Don't add other unverifiable claims, and add testimonials only if the owner provides real ones.
- AI positioning (October 2026): the site mentions **code-with-AI interviews** (coding card, mock card, pricing, hero) and **agentic AI system design** alongside **high-level (HLD)** and **low-level design (LLD)** (system design card). The behavioral card adds **Prepare with AI** (using AI tools to draft, stress-test and rehearse stories). AI topics use highlighted `.chips span.ai` chips (✦). There's an FAQ "Do you cover AI interviews?", and the title, meta and og descriptions mention AI.
- Pricing: Mock interview $149 / 60 min; 1:1 coaching $299 / 90 min (changed from $150 / $300 in October 2026); Interview package "Custom".
- Package builder: the Interview package card's "Build my package" opens a pop-up (`#builder`; `#build-package` opens it from a link) with steppers for coaching and mocks, and a live total with volume discounts (`UNIT` and `TIERS` in the script). The discounts are sample values (3–4 sessions 5%, 5–7 10%, 8+ 15%).

## Booking (Cal.com, switched on)

- Cal.com username: `crack-tech-io` (`CAL_USERNAME` in the script near the bottom of `index.html`).
- Inline embed with tabs: Free 15-min call, Mock interview, 1:1 coaching. Expected event slugs: `intro-call` (15 min, free), `mock-interview` (60 min), `coaching` (90 min). They must match `CAL_EVENTS`.
- Payment is taken by Cal.com at booking (set up by the owner in Cal.com, October 2026), so "Requires confirmation" should be off on the paid event types. If payment ever stops working, turn it back on to stop unpaid bookings being confirmed.
- The calendar loads lazily when the visitor nears `#book`, and follows the site theme (brand colour `#4f5d2a`, dark `#b3c07a`).
- The package builder's "Book a free call to discuss" opens the free-call tab and pre-fills the booking notes with the chosen package (`notes` in the embed config and `?notes=` on the direct link).
- The request form (Formspree placeholder `YOUR_FORMSPREE_ID`) only shows if `CAL_USERNAME` is emptied again.
- Google Meet: connect Google Calendar first (Apps > Google Calendar), then Settings > Conferencing > Add > Google Meet, set as default; set each event type's Location to Google Meet.
- The cloud dev environment blocks cal.com by default, so the live calendar can't be tested there unless `cal.com`, `app.cal.com` and `api.cal.com` are allowed.

## Payments and packages: current plan (simple start)

- The business is a **sole proprietorship** in India (not a Pvt Ltd or LLP), so the owner may receive payments in their personal account; a separate account for the firm is recommended for clean books. GST registration applies above ₹20 lakh a year; file an LUT for clients abroad. Check details with the CA.
- **Single sessions:** one booking at a time through Cal.com, **paid at booking**. Payment is configured in Cal.com (PayPal app or Cal Pay; confirm which with the owner), with prices on `mock-interview` ($149) and `coaching` ($299); the Cal.com prices must match the site. The site deliberately doesn't name the provider: "Pay securely online when you book." PayPal India can't take payments from clients in India; offer them UPI or bank transfer by hand.
- **Custom packages:** the package pop-up is a price estimator. Its buttons open WhatsApp (`wa.me` link with the package pre-written) or email (`mailto:`), plus "Book a free call to discuss" (which pre-fills the Cal.com notes). Packages are agreed by message and paid by bank transfer (Wise Business supports sole proprietors in India) or PayPal. The owner then books the sessions or sends a Cal.com private link limited to the number of sessions.
- Contact details go in `CONTACT` (`whatsapp`: international format, digits only; `email`) in the script. While they're empty, the WhatsApp and email buttons and footer links stay hidden.
- Not viable or deferred: Stripe (invite-only in India, no Apple Pay); Razorpay pay-first with private-link credits (PR 6, closed; the branch `claude/razorpay-credits` keeps the work, including draft policy pages); a full credits system (Cloudflare Worker + D1 + Cal.com webhooks and API, which needs the Cal.com Teams plan), planned for later.

## To-do list (parked, October 2026)

The user parked these to come back to later. Ask before starting any of them, and tick or remove items as they're done.

### Needs something from the user first
- [ ] **Business WhatsApp number and email:** fill in `CONTACT` in `index.html`. That switches on the footer contact links and the package pop-up's "Discuss on WhatsApp" and "Email us" buttons.
- [ ] **Confirm payments:** which option is set up in Cal.com (PayPal or Cal Pay), and do a test booking on the live site that takes payment. "Requires confirmation" should be off on the paid events once payment works. PayPal India can't take payments from Indian clients; offer them UPI or bank transfer by hand.
- [ ] **Real package discounts:** replace the sample `TIERS` (5% / 10% / 15%) and remove the "Sample discounts" tag.

### Business email: Cloudflare Email Routing (free)
- [ ] Check that **cracktech.io** is still owned (registrar account), or buy a domain.
- [ ] Add the domain to Cloudflare (Free plan) and switch the registrar's nameservers to Cloudflare's.
- [ ] Email > Email Routing: create e.g. `hello@cracktech.io` forwarding to the owner's Gmail, verify the Gmail address, then "Add records and enable". Test by sending mail to it.
- [ ] Optional: send as hello@ from Gmail (Settings > Accounts > Send mail as, via `smtp.gmail.com:587` with a Google App password), and add `include:_spf.google.com` to the SPF TXT record. Some sent mail may still go to spam.
- [ ] Later upgrade: Google Workspace Starter (~₹270/user/month + 18% GST) for reliable sending.

### Custom domain for the website
- [ ] Point **cracktech.io** at GitHub Pages: DNS in Cloudflare, then Settings > Pages > Custom domain, and turn on Enforce HTTPS. Do this after the domain is on Cloudflare.

### Coupons
- [ ] **"Have a coupon?" box** in the booking section. Cal.com has no native coupon codes, so each coupon is a **hidden, discounted copy** of the paid event type (e.g. `coaching-launch20` at $240). The code reveals that event's link.
  - Store the links **encrypted with the code** (e.g. AES-GCM with a key derived from the code), so the page source doesn't expose them.
  - For limits or expiry, point a code at a Cal.com private link with a usage limit or expiry date.
  - Needs from the user: the first code, the discount, which sessions, and the limit or expiry.
- Calendly was considered for its built-in coupons and rejected: they only work with Stripe (invite-only in India), payments need its paid plan, and its free plan allows only one event type.

### Later phases
- [ ] Lower-fee payments: Razorpay (proprietorships supported; the work is kept on the `claude/razorpay-credits` branch, including draft policy pages: terms, privacy, refunds, contact) or a Stripe invite.
- [ ] Credits system and member portal: Cloudflare Worker + D1 ledger; Cal.com webhooks plus the API to confirm or decline bookings by credit balance (the API needs the Cal.com Teams plan, ~$12–15/month); magic-link login; an admin page to grant credits.
- [ ] Optional: make returning visitors who once chose "light" start in dark again (rename the `ct-theme` storage key).

### Housekeeping
- [ ] Delete merged branches on GitHub (the branches page), and turn on Settings > General > "Automatically delete head branches". Branch deletes are refused from the cloud environment, so the user does this.
- [ ] To test the live calendar from the cloud environment, allow `cal.com`, `app.cal.com` and `api.cal.com` in the environment's network settings. `github.io` and domain-lookup (RDAP) services are blocked there too.

## Working agreement for GitHub

- One branch per change, clear commits, a pull request with a summary and screenshots.
- Nothing goes to `main` without the user's OK.
- The user is not a git expert: explain the commands you run in plain language.
