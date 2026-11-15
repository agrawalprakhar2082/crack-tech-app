// Practice-review Worker: receives "Send for review" from https://cracktech.app/practice/
// and emails the answers to the owner through Cloudflare Email Routing (send_email binding).
//
// Bindings (set at deploy time, not in this repo):
//   EMAIL      send_email binding, restricted to the owner's verified destination address
//   REVIEW_TO  plain-text var: that same destination address
//   RATE       optional rate-limit binding (e.g. 5 requests / 60 s per IP)
// From address: practice@cracktech.app (any address on the Email Routing domain works).

import { EmailMessage } from "cloudflare:email";

const ALLOWED_ORIGINS = ["https://cracktech.app", "https://www.cracktech.app"];
const FROM = { name: "Crack Tech Practice", addr: "practice@cracktech.app" };
const MAX_BODY = 2_000_000; // bytes of JSON accepted
const LIMITS = { name: 120, email: 254, target: 200, session: 200, time_used: 60, answers: 500_000, diagram: 1_200_000 };

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = ALLOWED_ORIGINS.includes(origin)
      ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Accept", "Access-Control-Max-Age": "86400" }
      : { "Vary": "Origin" };
    const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

    if (request.method === "OPTIONS") return new Response(null, { status: ALLOWED_ORIGINS.includes(origin) ? 204 : 403, headers: cors });
    if (request.method !== "POST") return reply(405, { ok: false, error: "method" });
    if (!ALLOWED_ORIGINS.includes(origin)) return reply(403, { ok: false, error: "origin" });

    if (env.RATE) {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const { success } = await env.RATE.limit({ key: ip });
      if (!success) return reply(429, { ok: false, error: "rate" });
    }

    const len = Number(request.headers.get("Content-Length") || 0);
    if (len > MAX_BODY) return reply(413, { ok: false, error: "size" });
    let raw;
    try { raw = await request.text(); } catch (e) { return reply(400, { ok: false, error: "body" }); }
    if (raw.length > MAX_BODY) return reply(413, { ok: false, error: "size" });
    let d;
    try { d = JSON.parse(raw); } catch (e) { return reply(400, { ok: false, error: "json" }); }
    if (!d || typeof d !== "object") return reply(400, { ok: false, error: "json" });

    // Honeypot: real people leave it empty. Pretend success so bots learn nothing.
    if (d._gotcha) return reply(200, { ok: true });

    const s = k => (typeof d[k] === "string" ? d[k] : "").trim();
    const f = { name: s("name"), email: s("email"), target: s("target"), session: s("session"), time_used: s("time_used"), answers: s("answers"), diagram: s("diagram_excalidraw") };
    for (const [k, max] of Object.entries(LIMITS)) if (f[k].length > max) return reply(413, { ok: false, error: "too_long", field: k });
    if (!f.name || !f.session || !f.answers) return reply(400, { ok: false, error: "missing" });
    if (!/^[^\s@<>"(),;:]+@[^\s@<>"(),;:]+\.[^\s@<>"(),;:]{2,}$/.test(f.email)) return reply(400, { ok: false, error: "email" });
    if (f.diagram) { try { JSON.parse(f.diagram); } catch (e) { f.diagram = ""; } }
    if (!env.EMAIL || !env.REVIEW_TO) return reply(500, { ok: false, error: "config" });

    const mime = buildMime(f, env.REVIEW_TO);
    try {
      await env.EMAIL.send(new EmailMessage(FROM.addr, env.REVIEW_TO, mime));
    } catch (e) {
      console.log("send failed", e && e.message);
      return reply(502, { ok: false, error: "send" });
    }
    return reply(200, { ok: true });
  }
};

/* ---------------- MIME ---------------- */
const oneLine = v => String(v).replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
const b64 = str => { const bytes = new TextEncoder().encode(str); let bin = ""; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(bin); };
const wrap76 = str => str.replace(/.{1,76}/g, "$&\r\n");
const encWord = v => /^[\x20-\x7e]*$/.test(v) ? v : `=?UTF-8?B?${b64(v)}?=`;
const addr = (name, email) => `${/^[\w .'-]*$/.test(name) ? `"${name.replace(/"/g, "")}"` : encWord(name)} <${email}>`;
const slug = v => (v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "practice").slice(0, 60);

export function buildMime(f, to) {
  const name = oneLine(f.name), session = oneLine(f.session);
  const boundary = "ct-" + crypto.randomUUID();
  const subject = `Practice for review: ${session} — ${name}`;
  const file = `${slug(name)}-${slug(session)}`;
  const intro = [
    `${name} sent "${session}" for review.`,
    "",
    `Email: ${f.email}`,
    f.target ? `Target: ${oneLine(f.target)}` : null,
    f.time_used ? `Time used: ${oneLine(f.time_used)}` : null,
    f.diagram ? `Drawing: attached as ${file}.excalidraw (open it at excalidraw.com, menu > Open).` : null,
    "Reply to this email to answer the candidate directly.",
    "",
    "----------------------------------------",
    ""
  ].filter(x => x !== null).join("\n");
  const part = (headers, body) => `--${boundary}\r\n${headers.join("\r\n")}\r\n\r\n${body}`;
  const parts = [
    part(["Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64"], wrap76(b64(intro + f.answers))),
    part([`Content-Type: text/markdown; charset=UTF-8; name="${file}.md"`, "Content-Transfer-Encoding: base64", `Content-Disposition: attachment; filename="${file}.md"`], wrap76(b64(f.answers)))
  ];
  if (f.diagram) parts.push(part([`Content-Type: application/json; name="${file}.excalidraw"`, "Content-Transfer-Encoding: base64", `Content-Disposition: attachment; filename="${file}.excalidraw"`], wrap76(b64(f.diagram))));
  const headers = [
    `From: ${addr(FROM.name, FROM.addr)}`,
    `To: <${to}>`,
    `Reply-To: ${addr(name, f.email)}`,
    `Subject: ${encWord(oneLine(subject))}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@cracktech.app>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`
  ];
  return `${headers.join("\r\n")}\r\n\r\n${parts.join("\r\n")}\r\n--${boundary}--\r\n`;
}
