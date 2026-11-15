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

  const api = { compare, same, show, expectedText, decode, validParens };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PracticeJudge = api;
})(typeof self !== "undefined" ? self : this);
