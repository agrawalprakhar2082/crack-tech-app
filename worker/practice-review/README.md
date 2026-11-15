# practice-review Worker

Receives "Send for review" from `/practice/` and emails the answers to the owner, with
the answers (`.md`) and the drawing (`.excalidraw`) attached. Reply-To is the candidate.

- Accepts POST JSON only from `https://cracktech.app` (CORS + Origin check).
- Honeypot `_gotcha`, size limits, and a rate limit of 5 sends per minute per IP.
- Sends from `practice@cracktech.app` through Cloudflare Email Routing's `send_email`
  binding, which can only deliver to a verified destination address.

Deployed through the Cloudflare API (no wrangler needed): script `practice-review` with
bindings `EMAIL` (send_email, destination = owner's verified address), `REVIEW_TO`
(plain text, same address) and `RATE` (rate limit). Its workers.dev URL goes in
`FORM_ENDPOINT` in `_practice/practice.js`.

Test the MIME builder locally: `node worker/practice-review/test.mjs`.
