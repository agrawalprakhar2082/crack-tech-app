# practice-review Worker

Receives "Send for review" from `/practice/` and emails the answers to the owner, with
the answers (`.md`) and the drawing (`.excalidraw`) attached. Reply-To is the candidate.
It also answers `POST /ai`, the assistant in the AI coding rounds (written November 2026,
**not deployed yet**: see "Switch on the AI assistant" below).

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

Test locally (MIME builder and the /ai route, with stubs): `node worker/practice-review/test.mjs`.

## Switch on the AI assistant (POST /ai)

The AI coding rounds on `/practice/` use a scripted offline assistant until this is done.

- `POST /ai` takes `{round, lang, code?, messages: [{role: "user"|"assistant", content}]}`
  from `https://cracktech.app` only and returns `{ok, reply}`. Messages must alternate
  user / assistant, starting and ending with the user. Limits: 16 messages, 4,000
  characters per user message and 3,000 per assistant message, 24,000 in total, 8,000
  characters of editor code (cut, not refused), 40 KB per request (counted while reading,
  whatever Content-Length says); 600 output tokens. Each round has a fixed system prompt
  (help with this round's code only, refuse other chat, never claim to know the hidden
  tests); the editor's code goes in as the candidate's own first message, never into the
  system prompt, so code can't rewrite the instructions. Prompt contents are never logged.
  The page keeps its requests well inside these limits and, on a 413, retries once with
  only the latest prompt.
- Model: `AI_MODEL` in `src/index.js` (`@cf/meta/llama-3.2-1b-instruct`, deliberately
  small). **Confirm it's still in the Workers AI catalogue** (dashboard > AI > Workers AI >
  Models) before deploying; swap in another small instruct model if not.
- Rate limit: `AI_RATE` (10 prompts per minute per IP), falling back to `RATE` if missing.
  Optional `AI_GLOBAL` (e.g. 60 prompts per minute, one key shared by every visitor) caps
  spend further. Rate-limit bindings count per Cloudflare location, so neither is an exact
  worldwide or daily cap: someone with many IP addresses can still use up the daily free
  allocation (see step 4).

Steps, with a Cloudflare API token that can edit Workers and use Workers AI:

1. Redeploy as above with more bindings: `{"type":"ai","name":"AI"}`,
   `{"type":"ratelimit","name":"AI_RATE","namespace_id":"1002","simple":{"limit":10,"period":60}}`
   and, recommended, `{"type":"ratelimit","name":"AI_GLOBAL","namespace_id":"1003","simple":{"limit":60,"period":60}}`.
2. Test: `POST https://practice-review.cracktech-app.workers.dev/ai` with
   `Origin: https://cracktech.app` and
   `{"round":"ai-round-1","lang":"python","messages":[{"role":"user","content":"Write rank_scores"}]}`.
3. Set `AI_ENDPOINT` at the top of `_practice/practice.js` to
   `https://practice-review.cracktech-app.workers.dev/ai`, run `ruby _blog/build.rb`, and
   open a pull request.
4. Daily spend: Workers AI bills by "neurons", with a free daily allocation on every plan
   (10,000 neurons a day at the time of writing); beyond it, usage is billed only on the
   Workers Paid plan. Check usage under AI > Workers AI, and if needed lower `AI_RATE` or
   `AI_MAX_TOKENS`. When the allocation runs out or the model errors, the page falls back to
   the offline assistant automatically. **Residual risk:** there's no exact daily cap without
   a paid store (KV or Durable Objects), so on the Workers Paid plan abuse could cost money.
   Set a billing notification for Workers AI usage (dashboard > Notifications > Add >
   usage-based billing) so a spike is noticed the same day; on the Free plan, requests just
   fail once the free allocation is used, and the page falls back to the offline assistant.
5. Delete or expire the API token afterwards.
