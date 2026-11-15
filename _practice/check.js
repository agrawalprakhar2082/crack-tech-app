// Checks the practice sessions: each adds up to 45 minutes and has the fields the page needs,
// and every runnable question (problems.js) has what the statement, starter code and tests use.
// Run: node _practice/check.js   (also run by ruby _blog/build.rb when node is installed)
const fs = require("fs"), path = require("path"), vm = require("vm");
const ctx = { window: {} };
for (const f of ["problems.js", "ai-problems.js", "sessions.js"]) vm.runInNewContext(fs.readFileSync(path.join(__dirname, f), "utf8"), ctx, { filename: f });
const sessions = ctx.window.PRACTICE_SESSIONS || [], problems = ctx.window.PRACTICE_PROBLEMS || {};
const errors = [], ids = new Set(), used = new Set();
const tracks = { Behavioral: 0, "System design": 0, Coding: 0, "Coding practice sets": 0, "AI coding rounds": 0 };
const TYPES = ["int", "long", "bool", "string", "int[]", "int[][]", "tree"];
for (const s of sessions) {
  if (!s.id || ids.has(s.id)) errors.push(`missing or duplicate id: ${s.id}`); ids.add(s.id);
  if (!(s.track in tracks)) errors.push(`${s.id}: unknown track "${s.track}"`); else tracks[s.track]++;
  if (!s.title || !s.blurb) errors.push(`${s.id}: needs a title and blurb`);
  const total = (s.blocks || []).reduce((n, b) => n + b.min, 0);
  if (total !== 45) errors.push(`${s.id}: blocks add up to ${total} minutes, not 45`);
  for (const b of s.blocks || []) {
    if (b.problem && !problems[b.problem]) errors.push(`${s.id} / ${b.name}: unknown problem "${b.problem}"`);
    for (const p of b.prompts || []) {
      if (!p.q || !Array.isArray(p.look) || !p.look.length) errors.push(`${s.id} / ${b.name}: each prompt needs q and look`);
      if (p.kind && !["text", "code"].includes(p.kind)) errors.push(`${s.id} / ${b.name}: kind must be text or code`);
      if (p.testsFor) {
        if (!problems[p.testsFor] || !problems[p.testsFor].testStarters) errors.push(`${s.id} / ${b.name}: testsFor needs a problem with testStarters`);
        if (p.kind !== "code") errors.push(`${s.id} / ${b.name}: a tests prompt must be kind "code"`);
      }
      if (p.chat && !(p.problem && s.ai)) errors.push(`${s.id} / ${b.name}: chat needs a problem in an AI round`);
      if (p.problem) {
        used.add(p.problem);
        if (!problems[p.problem]) errors.push(`${s.id} / ${b.name}: unknown problem "${p.problem}"`);
        if (p.kind !== "code") errors.push(`${s.id} / ${b.name}: a prompt with a problem must be kind "code"`);
      }
    }
  }
}
for (const [id, p] of Object.entries(problems)) {
  const where = `problem ${id}`;
  for (const f of ["title", "statement", "input", "output", "constraints", "samples", "clarify", "look", "testing"]) if (!p[f] || (Array.isArray(p[f]) && !p[f].length)) errors.push(`${where}: needs ${f}`);
  if (!p.fn === !p.cls) errors.push(`${where}: needs fn (a function) or cls (a class), not both`);
  const note = p.otherLangs === "note";
  if (note && !(p.starters && p.starters.python && p.starters.javascript)) errors.push(`${where}: otherLangs "note" needs Python and JavaScript starters`);
  if (p.testStarters && !(p.testStarters.python && p.testStarters.javascript && (p.mutantHints || []).length)) errors.push(`${where}: a tests-first problem needs test starters and mutant hints`);
  if (p.fn && !note) {
    if (!Array.isArray(p.params) || p.params.some(([n, t]) => !n || !TYPES.includes(t))) errors.push(`${where}: params must be [name, type] with a type from ${TYPES.join(", ")}`);
    if (!TYPES.includes(p.returns) || p.returns === "tree") errors.push(`${where}: unknown return type ${p.returns}`);
    if (p.inplace !== undefined && !(p.params[p.inplace] && /\[\]/.test(p.params[p.inplace][1]))) errors.push(`${where}: inplace must point at a list argument`);
  }
  if (p.cls && !note && !(p.starters && ["python", "javascript", "typescript", "java", "cpp", "go", "csharp"].every(l => p.starters[l]))) errors.push(`${where}: a class question needs starters for every language`);
  (p.samples || []).forEach((t, i) => {
    if (!Array.isArray(t.args) || !("expected" in t)) errors.push(`${where}: sample ${i + 1} needs args and expected`);
    else if (p.fn && t.args.length !== (p.env ? 2 : p.params.length)) errors.push(`${where}: sample ${i + 1} has ${t.args.length} args, expected ${p.params.length}`);
  });
  if (!fs.existsSync(path.join(__dirname, "tests/hidden", id + ".json"))) errors.push(`${where}: no hidden tests (run python3 _practice/tests/generate.py)`);
  if (!used.has(id)) errors.push(`${where}: not used by any session`);
}
if (errors.length) { console.error("Practice sessions have problems:\n- " + errors.join("\n- ")); process.exit(1); }
console.log(`Practice sessions OK: ${sessions.length} sessions (${Object.entries(tracks).map(([t, n]) => `${n} ${t}`).join(", ")}), all 45 minutes; ${Object.keys(problems).length} runnable questions.`);
