// Local check of the MIME builder (the Cloudflare import is stubbed).
import { readFileSync } from "node:fs";
const src = readFileSync(new URL("./src/index.js", import.meta.url), "utf8").replace(/^import .*cloudflare:email.*$/m, "const EmailMessage = class {};");
const mod = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
const mime = mod.buildMime({ name: "Asha R\r\nBcc: evil@x.com", email: "asha@example.com", target: "Senior engineer", session: "Design a calendar app", time_used: "41 min", answers: "# Practice\n\nAnswer with ünïcode — and ```code```", diagram: '{"type":"excalidraw","elements":[]}' }, "owner@example.com");
const head = mime.split("\r\n\r\n")[0];
const ok = (c, m) => { if (!c) { console.error("FAIL", m); process.exitCode = 1; } else console.log("ok", m); };
ok(!/^Bcc:/mi.test(head), "no header injection from the name");
ok(/^Reply-To: .*<asha@example.com>$/m.test(head), "reply-to is the candidate");
ok(/^To: <owner@example.com>$/m.test(head), "to is the owner");
ok(/^Subject: =\?UTF-8\?B\?/m.test(head), "subject encoded (contains a dash)");
ok(/filename=".*\.md"/.test(mime) && /filename=".*\.excalidraw"/.test(mime), "both attachments present");
const parts = mime.split(/\r\n--ct-[^\r\n]+/);
const body = Buffer.from(parts[1].split("\r\n\r\n")[1].replace(/\r\n/g, ""), "base64").toString("utf8");
ok(body.includes("ünïcode") && body.includes("asha@example.com"), "body decodes as UTF-8 with details");
ok(mime.split("\r\n").every(l => l.length <= 998), "no line over 998 chars");
