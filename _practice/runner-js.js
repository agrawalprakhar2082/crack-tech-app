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
  class CompleteNode {
    constructor(i, n) { this.val = i + 1; this._i = i; this._n = n; }
    get left() { const j = 2 * this._i + 1; return j < this._n ? new CompleteNode(j, this._n) : null; }
    get right() { const j = 2 * this._i + 2; return j < this._n ? new CompleteNode(j, this._n) : null; }
  }
  function buildTree(v) {
    if (v && !Array.isArray(v) && typeof v === "object" && "$complete" in v) return v.$complete > 0 ? new CompleteNode(0, v.$complete) : null;
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
    const [ops, opArgs] = args, out = [];
    let obj = null;
    ops.forEach((op, i) => {
      if (op === spec.cls) { obj = new entry(...opArgs[i]); out.push(null); return; }
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
