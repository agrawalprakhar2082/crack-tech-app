---
name: monthly-offer
description: Change the site's monthly offer (PROMO: name, prices, end date, packages) at the start of a month, and remind the owner to match Cal.com prices. Use when the owner names a new offer or a month is ending.
---

# Monthly offer

1. **Ask the owner, or use what they said:** the offer name (shown as the title, e.g. "Holiday offer" with code `HAPPYHOLIDAYS`), the prices (mentorship and mock), the last day, and whether package prices also drop (`packages`).
   - The planned names are in CLAUDE.md: THANKSGIVING (Nov), then e.g. HAPPYHOLIDAYS (Dec), NEWYEARNEWJOB (Jan), and OFFERSEASON as a fallback.
2. **Edit `PROMO` in `index.html`:**

   `const PROMO = { code: "…", title: "…", ends: "YYYY-MM-DD", price: { coaching: N, mock: N }, packages: false };`

   `coaching` is the internal key for 1:1 mentorship; leave the key as it is. `code: ""` turns the offer off, and everything returns to `UNIT` after `ends` by itself.
3. **Update the "Monthly offer" bullet in CLAUDE.md:** which offer runs now, the prices and the owner's decision date.
4. **Check locally:** the banner, the pricing cards and the booking tabs show ~~list~~ offer prices with an "ends" tag.
5. **Open a PR** following the `pr-with-screenshots` skill. Merge on "merge PR N".
6. **Remind the owner** to change the **Cal.com event prices** to match (`mock-interview`, `coaching`). The site never charges anything itself.
