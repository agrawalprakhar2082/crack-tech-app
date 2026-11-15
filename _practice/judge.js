// Checks answers for the runnable coding questions on /practice/: compares a test's output
// with the expected value. Shared by the page (practice.js) and the verify script
// (node _practice/tests/verify.js), so both judge the same way.
// compare: "exact" (deep equal), "unordered" (same items, any order), "float" (1e-6),
// or a named checker for questions with more than one right answer.
(function (root) {
  function same(a, b) {
    if (a === b) return true;
    if (typeof a === "number" && typeof b === "number") return a === b || (a !== a && b !== b);
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => same(x, b[i]));
    if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
      const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
      return same(ka, kb) && ka.every(k => same(a[k], b[k]));
    }
    return false;
  }
  const key = v => JSON.stringify(v);
  function validParens(t) {
    let depth = 0;
    for (const ch of t) { depth += ch === "(" ? 1 : ch === ")" ? -1 : 0; if (depth < 0) return false; }
    return depth === 0;
  }
  function isSubsequence(t, s) { let i = 0; for (const ch of s) if (i < t.length && t[i] === ch) i++; return i === t.length; }

  const CHECKERS = {
    // Any valid string left after removing the fewest characters: valid, taken from s in
    // order, and as long as the reference answer.
    parens(args, got, expected) {
      if (typeof got !== "string") return { pass: false, why: "should return a string" };
      if (!validParens(got)) return { pass: false, why: "the parentheses in your string aren't balanced" };
      if (!isSubsequence(got, args[0])) return { pass: false, why: "your string isn't the input with some characters removed" };
      if (got.length !== expected.length) return { pass: false, why: got.length < expected.length ? "removed more characters than needed" : "kept too many characters" };
      return { pass: true };
    }
  };
  const describe = {
    parens: expected => `any valid string of length ${expected.length}, e.g. ${JSON.stringify(expected)}`
  };

  function compare(how, args, got, expected) {
    how = how || "exact";
    if (CHECKERS[how]) return CHECKERS[how](args, got, expected);
    if (how === "unordered") {
      if (!Array.isArray(got)) return { pass: false };
      return { pass: same(got.map(key).sort(), expected.map(key).sort()) };
    }
    if (how === "float") return { pass: typeof got === "number" && Math.abs(got - expected) <= 1e-6 * Math.max(1, Math.abs(expected)) };
    return { pass: same(got, expected) };
  }
  // How the expected value is shown to the candidate (samples only).
  const expectedText = (how, expected, lang) => describe[how] ? describe[how](expected) : show(expected, 0, lang);

  // Compact display of a value: JSON, with long output cut.
  // In Python, null and booleans read as None, True and False.
  function show(v, max, lang) {
    max = max || 600;
    const py = lang === "python";
    const f = x => x === undefined ? "undefined" : Array.isArray(x) ? "[" + x.map(f).join(", ") + "]"
      : x && typeof x === "object" ? "{" + Object.keys(x).map(k => JSON.stringify(k) + ": " + f(x[k])).join(", ") + "}"
      : typeof x === "string" ? JSON.stringify(x)
      : py && x === null ? "None" : py && typeof x === "boolean" ? (x ? "True" : "False") : String(x);
    const s = f(v);
    return s.length > max ? s.slice(0, max) + " …" : s;
  }
  // Hidden tests ship base64-encoded (practice/hidden/<id>.txt): not secret, just not readable at a glance.
  function decode(text) {
    const bin = typeof atob === "function" ? atob(text.trim()) : Buffer.from(text.trim(), "base64").toString("binary");
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  /* ---------- full-size tests ----------
     Hidden tests that check speed use inputs too big to ship. They're made here from a seed
     (the same in the page and in _practice/tests), and only the SHA-256 of the expected
     output's JSON ships. generate.py gets the inputs from this code (node), so Python and
     JavaScript test exactly the same thing. */
  function rng(seed) { // mulberry32
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const GENS = {
    "fence-coats": (r, g) => { const days = []; for (let i = 0; i < g.n; i++) { const a = 1 + Math.floor(r() * 1e9); days.push([a, Math.min(1e9, a + Math.floor(r() * g.len))]); } return [days, g.k]; },
    "balloon-arrows": (r, g) => { const b = []; for (let i = 0; i < g.n; i++) { const s = Math.floor(r() * 4e9) - 2e9; b.push([s, Math.min(2e9, s + Math.floor(r() * g.len))]); } return [b]; },
    "window-maximum": (r, g) => { const a = []; for (let i = 0; i < g.n; i++) a.push(Math.floor(r() * 20001) - 10000); return [a, g.k]; },
    "longest-ones-flips": (r, g) => { const a = []; for (let i = 0; i < g.n; i++) a.push(r() < g.p ? 1 : 0); return [a, g.k]; },
    "tank-capacity": (r, g) => { const d = []; for (let i = 0; i < g.n; i++) d.push(1 + Math.floor(r() * 10000)); return [d, g.k]; },
    "scoreboard": (r, g) => {
      const ops = ["Scoreboard"], args = [[]];
      for (let i = 0; i < g.names; i++) { ops.push("assign"); args.push(["p" + i, Math.floor(r() * 1e9)]); }
      while (ops.length < g.ops) {
        const x = r(), name = "p" + Math.floor(r() * g.names);
        if (x < 0.5) { ops.push("maxScore"); args.push([]); }
        else if (x < 0.8) { ops.push("assign"); args.push([name, Math.floor(r() * 1e9)]); }
        else if (x < 0.9) { ops.push("remove"); args.push([name]); }
        else { ops.push("getScore"); args.push([name]); }
      }
      return [ops, args];
    },
    "subarray-sum-k": (r, g) => { const a = []; for (let i = 0; i < g.n; i++) a.push(Math.floor(r() * 2001) - 1000); return [a, g.k]; },
    "age-halves": (r, g) => { const a = [], s = []; for (let i = 0; i < g.n; i++) { a.push(1 + Math.floor(r() * 100)); s.push(Math.floor(r() * 10001)); } return [a, s]; },
    // A complete tree too big to list: the runners build its nodes only when visited.
    "complete-tree-count": (r, g) => [{ $complete: g.lo + Math.floor(r() * (g.hi - g.lo)) }],
    // Mostly falling temperatures (the slow case for scanning ahead), then one warm day.
    "warmer-days": (r, g) => { const t = []; for (let i = 0; i < g.n - 1; i++) t.push(Math.floor(r() * 76) - 30); t.sort((a, b) => b - a); t.push(46); return [t]; },
    // One long falling run of ratings (the slow case for repeated fixing passes), then noise.
    "fair-candies": (r, g) => { const a = []; for (let i = 0; i < g.n; i++) a.push(i < g.n * 0.98 ? g.n - i : Math.floor(r() * g.n)); return [a]; },
    // A palindrome with some stray letters inserted.
    "k-palindrome": (r, g) => {
      const half = []; for (let i = 0; i < g.n / 2 - 20; i++) half.push("abcdef"[Math.floor(r() * 6)]);
      const s = half.concat(half.slice().reverse());
      for (let i = 0; i < 40; i++) s.splice(Math.floor(r() * (s.length + 1)), 0, "xyz"[Math.floor(r() * 3)]);
      return [s.join(""), 30 + Math.floor(r() * 20)];
    },
    "nearest-exit": (r, g) => { const grid = []; for (let i = 0; i < g.rows; i++) { const row = []; for (let j = 0; j < g.cols; j++) { const x = r(); row.push(x < 0.2 ? -1 : x < 0.201 ? 0 : 2147483647); } grid.push(row); } return [grid]; },
    "min-effort-path": (r, g) => { const h = []; for (let i = 0; i < g.rows; i++) { const row = []; for (let j = 0; j < g.cols; j++) row.push(1 + Math.floor(r() * 1e6)); h.push(row); } return [h]; },
    "heater-radius": (r, g) => { const a = [], b = []; for (let i = 0; i < g.n; i++) a.push(1 + Math.floor(r() * 1e9)); for (let i = 0; i < g.m; i++) b.push(1 + Math.floor(r() * 1e9)); return [a, b]; }
  };
  function generate(id, g) {
    if (!GENS[id]) throw new Error("no generator for " + id);
    return GENS[id](rng(g.seed), g);
  }
  // SHA-256 (hex) of a value's JSON, for comparing big outputs.
  async function sha256(value) {
    const text = JSON.stringify(value === undefined ? null : value);
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    }
    return require("crypto").createHash("sha256").update(text).digest("hex");
  }

  const api = { compare, same, show, expectedText, decode, validParens, generate, sha256, GENERATED: Object.keys(GENS) };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PracticeJudge = api;
})(typeof self !== "undefined" ? self : this);
