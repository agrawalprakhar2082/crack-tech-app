// Checks the practice sessions: each adds up to 45 minutes and has the fields the page needs.
// Run: node _practice/check.js   (also run by ruby _blog/build.rb when node is installed)
const fs = require("fs"), path = require("path"), vm = require("vm");
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "sessions.js"), "utf8"), ctx);
const sessions = ctx.window.PRACTICE_SESSIONS || [];
const errors = [], ids = new Set();
const tracks = { Behavioral: 0, "System design": 0, Coding: 0 };
for (const s of sessions) {
  if (!s.id || ids.has(s.id)) errors.push(`missing or duplicate id: ${s.id}`); ids.add(s.id);
  if (!(s.track in tracks)) errors.push(`${s.id}: unknown track "${s.track}"`); else tracks[s.track]++;
  if (!s.title || !s.blurb) errors.push(`${s.id}: needs a title and blurb`);
  const total = (s.blocks || []).reduce((n, b) => n + b.min, 0);
  if (total !== 45) errors.push(`${s.id}: blocks add up to ${total} minutes, not 45`);
  for (const b of s.blocks || []) for (const p of b.prompts || []) {
    if (!p.q || !Array.isArray(p.look) || !p.look.length) errors.push(`${s.id} / ${b.name}: each prompt needs q and look`);
    if (p.kind && !["text", "code"].includes(p.kind)) errors.push(`${s.id} / ${b.name}: kind must be text or code`);
  }
}
if (errors.length) { console.error("Practice sessions have problems:\n- " + errors.join("\n- ")); process.exit(1); }
console.log(`Practice sessions OK: ${sessions.length} sessions (${Object.entries(tracks).map(([t, n]) => `${n} ${t}`).join(", ")}), all 45 minutes.`);
