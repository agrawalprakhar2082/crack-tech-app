# practice-review Worker

Receives "Send for review" from `/practice/` and emails the answers to the owner, with
the answers (`.md`) and the drawing (`.excalidraw`) attached. Reply-To is the candidate.

- Live at `https://practice-review.cracktech-app.workers.dev` (deployed Nov 15, 2026);
  `FORM_ENDPOINT` in `_practice/practice.js` points here.
- Accepts POST JSON only from `https://cracktech.app` (CORS + Origin check).
- Honeypot `_gotcha`, size limits, and a rate limit of 5 sends per minute per IP.
- Sends from `practice@cracktech.app` through Cloudflare Email Routing's `send_email`
  binding, which can only deliver to a verified destination address (the owner's Gmail,
  the one hello@cracktech.app forwards to).

## Redeploy (Cloudflare API, no wrangler)

With a Cloudflare API token ("Edit Cloudflare Workers" template), from this folder:

1. `GET /accounts` gives the account ID.
2. `PUT /accounts/{id}/workers/scripts/practice-review` as multipart: a `metadata` part
   (`{"main_module":"index.js","compatibility_date":"2026-11-01","bindings":[...]}`) and
   `src/index.js` uploaded as `index.js` with type `application/javascript+module`.
   Bindings: `{"type":"send_email","name":"EMAIL","destination_address":"<owner's Gmail>"}`,
   `{"type":"plain_text","name":"REVIEW_TO","text":"<owner's Gmail>"}`,
   `{"type":"ratelimit","name":"RATE","namespace_id":"1001","simple":{"limit":5,"period":60}}`.
3. Only needed the first time: `POST .../scripts/practice-review/subdomain` with
   `{"enabled":true}` to switch on the workers.dev URL.
4. Test: POST JSON with `Origin: https://cracktech.app` (fields `name`, `email`,
   `session`, `answers`, optional `target`, `time_used`, `diagram_excalidraw`).

Test the MIME builder locally: `node worker/practice-review/test.mjs`.
