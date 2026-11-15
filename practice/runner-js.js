// Runs a candidate's JavaScript answer against tests, in a Web Worker started fresh for
// each run (practice.js terminates it if a test takes too long). Also loads in Node for
// `node _practice/tests/verify.js`.
// Message in: { code, spec: { fn } or { cls }, cases: [args, ...], stdout: true|false, nonce }
// Messages out: { type: "case", i, ok, out | err, stdout, nonce } per test, then { type: "done", nonce }.
// The nonce (kept out of reach of the candidate's code) lets the page ignore any message the
// candidate's code posts itself.
(function () {
  const post = typeof self !== "undefined" && typeof self.postMessage === "function" ? self.postMessage.bind(self) : null;
  const stringify = JSON.stringify, isView = ArrayBuffer.isView, toArray = Array.from;
  const MAX_STDOUT = 4000;
  // new Function puts two lines ("function anonymous(console\n) {") before the code.
  const LINE_OFFSET = 2;

  function errInfo(e) {
    const type = e && e.name ? e.name : "Error";
    const msg = e && e.message !== undefined ? String(e.message) : String(e);
    let line = null;
    // Chrome: "<anonymous>:5:9"; Firefox: "> Function:5:9".
    const m = e && e.stack && String(e.stack).match(/(?:<anonymous>|> Function):(\d+):\d+/);
    if (m) line = Math.max(1, +m[1] - LINE_OFFSET);
    if (e instanceof RangeError && /call stack/i.test(msg)) return { type, msg: "Maximum call stack size exceeded (try an iterative version)", line };
    return { type, msg: msg.slice(0, 500), line };
  }
  function fmt(v) {
    if (typeof v === "string") return v;
    try { const s = JSON.stringify(v); return s === undefined ? String(v) : s; } catch (e) { return String(v); }
  }
  // Values the page can compare: plain JSON (undefined becomes null).
  function plain(v) {
    if (v === undefined) return null;
    if (v instanceof Set) v = [...v];
    if (v instanceof Map) v = Object.fromEntries(v);
    if (typeof v === "bigint") return Number(v);
    if (isView(v)) v = toArray(v); // typed arrays
    if (Array.isArray(v)) return v.map(plain);
    if (v && typeof v === "object") { const o = {}; for (const k of Object.keys(v)) o[k] = plain(v[k]); return o; }
    if (typeof v === "function") throw new TypeError("returned a function, not a value");
    return v;
  }

  // Binary trees (spec.trees: argument indexes) arrive as level-order lists with null for a
  // missing child; TreeNode is a global the candidate's code can use. {$complete: n} is a
  // huge complete tree whose nodes are made only when visited (full-size tests).
  class TreeNode { constructor(val = 0, left = null, right = null) { this.val = val; this.left = left; this.right = right; } }
  // The huge tree's size lives only in this closure; nodes are TreeNodes whose index and
  // children are private. Children are kept through weak references: node.left === node.left
  // while you hold it, but a full traversal doesn't keep the whole tree in memory.
  function completeTree(n) {
    const state = new WeakMap(); // node -> { i, l, r }, out of reach of the candidate's code
    function CompleteNode(i) { this.val = i + 1; state.set(this, { i, l: undefined, r: undefined }); }
    function child(node, side, j) {
      const st = state.get(node), slot = side ? st.r : st.l;
      if (slot && slot.fixed) return slot.v;
      let got = slot ? slot.deref() : undefined;
      if (!got) {
        got = j < n ? new CompleteNode(j) : null;
        const keep = got ? new WeakRef(got) : { fixed: true, v: null };
        if (side) st.r = keep; else st.l = keep;
      }
      return got;
    }
    CompleteNode.prototype = Object.create(TreeNode.prototype, {
      constructor: { value: TreeNode },
      left: { get() { return child(this, 0, 2 * state.get(this).i + 1); }, set(v) { state.get(this).l = { fixed: true, v }; } },
      right: { get() { return child(this, 1, 2 * state.get(this).i + 2); }, set(v) { state.get(this).r = { fixed: true, v }; } }
    });
    return n > 0 ? new CompleteNode(0) : null;
  }
  function buildTree(v) {
    if (v && !Array.isArray(v) && typeof v === "object" && "$complete" in v) return completeTree(v.$complete);
    if (!v || !v.length || v[0] === null) return null;
    const root = new TreeNode(v[0]), queue = [root];
    let head = 0, i = 1;
    while (i < v.length) {
      const node = queue[head++];
      if (v[i] !== null) { node.left = new TreeNode(v[i]); queue.push(node.left); }
      i++;
      if (i < v.length && v[i] !== null) { node.right = new TreeNode(v[i]); queue.push(node.right); }
      i++;
    }
    return root;
  }
  if (typeof globalThis !== "undefined") globalThis.TreeNode = TreeNode;

  /* ---- AI coding rounds: fake clock for classes, a flaky service, tests-first grading ---- */
  class ServiceError extends Error { constructor(kind, retryable) { super(kind); this.name = "ServiceError"; this.kind = kind; this.retryable = retryable; } }
  if (typeof globalThis !== "undefined") globalThis.ServiceError = ServiceError;
  const RETRYABLE = ["timeout", "unavailable"];
  function runEnv(entry, args) {
    const [scenario, policy] = args, sleeps = [];
    let t = 0, calls = 0, used = 0;
    const seq = scenario.rand && scenario.rand.length ? scenario.rand : [0.5];
    const clock = {
      now: () => t,
      sleep: s => { if (typeof s !== "number" || !(s >= 0)) throw new RangeError("clock.sleep needs a non-negative number of seconds"); sleeps.push(s); t += s; }
    };
    const service = {
      call: () => {
        const [kind, latency, value] = scenario.outcomes[Math.min(calls, scenario.outcomes.length - 1)];
        calls++; t += latency;
        if (kind === "ok") return value === undefined ? null : value;
        throw new ServiceError(kind, RETRYABLE.includes(kind));
      }
    };
    const rand = () => seq[Math.min(used++, seq.length - 1)];
    let result = null, error = null;
    try { result = entry(service, clock, rand, policy); }
    catch (e) { if (e instanceof ServiceError) error = e.kind; else throw e; }
    return { result: plain(result), error, attempts: calls, sleeps: sleeps.map(x => Math.round(x * 1e9) / 1e9) };
  }
  // Tests-first round: the candidate's test functions (names starting with "test") run
  // against one implementation; assert(cond) and assertEqual(actual, expected) are provided.
  function testNames(code) {
    const names = [], re = /(?:function\s+(test\w*)\s*\(|(?:const|let|var)\s+(test\w*)\s*=)/g;
    let m;
    while ((m = re.exec(code))) { const n = m[1] || m[2]; if (!names.includes(n)) names.push(n); }
    return names;
  }
  function runTests(code, impl, con) {
    const names = testNames(code);
    const assert = (cond, msg) => { if (!cond) { const e = new Error(msg || "assertion failed"); e.name = "AssertionError"; throw e; } };
    const assertEqual = (actual, expected, msg) => {
      const a = stringify(plain(actual)), b = stringify(expected);
      if (a !== b) { const e = new Error((msg ? msg + ": " : "") + "expected " + b + ", got " + a); e.name = "AssertionError"; throw e; }
    };
    // eslint-disable-next-line no-new-func
    const fns = new Function("console", "assert", "assertEqual", code + "\n;" + impl + "\n;return {" + names.map(n => `${stringify(n)}: typeof ${n} === "function" ? ${n} : undefined`).join(",") + "};")(con, assert, assertEqual);
    return names.filter(n => fns[n]).map(n => {
      try { fns[n](); return [n, true, ""]; }
      catch (e) { const info = errInfo(e); return [n, false, (info.type === "AssertionError" ? info.msg : info.type + ": " + info.msg) + (info.line ? ` (line ${info.line})` : "")]; }
    });
  }

  function makeConsole(sink) {
    const log = (...a) => sink(a.map(fmt).join(" ") + "\n");
    return { log, info: log, warn: log, error: log, debug: log, table: log, dir: log };
  }

  // Returns the entry (function or class) the spec names, or throws.
  function compile(code, spec, con) {
    const name = spec.cls || spec.fn;
    if (!/^[A-Za-z_$][\w$]*$/.test(name)) throw new Error("bad entry name");
    // eslint-disable-next-line no-new-func
    const factory = new Function("console", code + `\n;return typeof ${name} !== "undefined" ? ${name} : undefined;`);
    const entry = factory(con);
    if (typeof entry !== "function") {
      const e = new ReferenceError(spec.cls ? `define a class named ${name}` : `define a function named ${name}`);
      e.stack = ""; throw e;
    }
    return entry;
  }

  function runOne(entry, spec, args) {
    if (spec.env) return runEnv(entry, args);
    if (!spec.cls) {
      const keep = (spec.keep || []).map(i => [i, stringify(args[i])]);
      args = args.slice();
      (spec.trees || []).forEach(i => { args[i] = buildTree(args[i]); });
      let out = entry(...args);
      if ((out === undefined || out === null) && spec.inplace !== undefined) out = args[spec.inplace]; // changed in place, returned nothing
      if (keep.some(([i, before]) => stringify(args[i]) !== before)) {
        const e = new Error("your function changed its input list; it must leave it as it was"); e.name = "Changed input"; e.stack = ""; throw e;
      }
      return out;
    }
    const [ops, opArgs] = args, out = [], clocks = [];
    let obj = null;
    ops.forEach((op, i) => {
      if (op === "$advance") { clocks.forEach(c => { c.t += opArgs[i][0]; }); out.push(null); return; }
      if (op === spec.cls) {
        const real = opArgs[i].map(x => {
          if (x && typeof x === "object" && !Array.isArray(x) && "$clock" in x) { const c = () => c.t; c.t = x.$clock; clocks.push(c); return c; }
          return x;
        });
        obj = new entry(...real); out.push(null); return;
      }
      if (!obj || typeof obj[op] !== "function") throw new TypeError(`${spec.cls} has no method ${op}`);
      out.push(plain(obj[op](...opArgs[i])));
    });
    return out;
  }

  // Runs all cases; calls post(message) for each. Used by the worker and by Node.
  function run(msg, post) {
    let buf = "";
    const sink = s => { if (buf.length < MAX_STDOUT + 100) buf += s; };
    const con = makeConsole(sink);
    let entry, loadErr = null;
    if (msg.spec.tests) {
      // Tests-first: each case is one implementation to test the candidate's tests against.
      msg.cases.forEach((args, i) => {
        const res = { type: "case", i, nonce: msg.nonce };
        try { res.out = runTests(msg.code, args[0], con); res.ok = true; } catch (e) { res.ok = false; res.err = errInfo(e); }
        res.stdout = msg.stdout ? buf.slice(0, MAX_STDOUT) : ""; buf = "";
        post(res);
      });
      post({ type: "done", nonce: msg.nonce });
      return;
    }
    try { entry = compile(msg.code, msg.spec, con); } catch (e) { loadErr = errInfo(e); }
    const loadOut = buf; buf = "";
    msg.cases.forEach((args, i) => {
      const res = { type: "case", i, nonce: msg.nonce };
      if (loadErr) Object.assign(res, { ok: false, err: loadErr });
      else {
        try { res.out = plain(runOne(entry, msg.spec, args)); res.ok = true; }
        catch (e) { res.ok = false; res.err = errInfo(e); }
      }
      res.stdout = msg.stdout ? ((i === 0 ? loadOut : "") + buf).slice(0, MAX_STDOUT) : "";
      buf = "";
      post(res);
    });
    post({ type: "done", nonce: msg.nonce });
  }

  if (typeof module === "object" && module.exports) module.exports = { run };
  else if (typeof importScripts === "function") {
    self.onmessage = e => run(e.data, post);
  }
})();
