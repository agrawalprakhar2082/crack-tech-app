// Runs a candidate's Python answer against tests with Pyodide (CPython compiled to
// WebAssembly), in a Web Worker. Each worker runs exactly one run and is then thrown away,
// so nothing a run changes (patched modules, recursion limit, globals) reaches the next
// one; practice.js loads the next worker in the background so it's ready when needed.
// Pyodide's files come from the browser cache after the first load.
// Messages in:  { type: "load", base: [pyodide URLs to try], harness: URL of harness.py }
//               { type: "run", code, spec, cases, stdout, nonce }
// Messages out: { type: "ready" } or { type: "fail", msg } after loading;
//               { type: "status", text: "running", nonce }, { type: "case", i, ok, out | err, stdout, nonce }
//               per test, then { type: "done", nonce }.
// The nonce stays in this script's local variables, out of reach of the candidate's code,
// so the page can ignore any message their code posts itself.
const post = self.postMessage.bind(self), parse = JSON.parse, stringify = JSON.stringify, assign = Object.assign;
let ready = null, ctLoad = null, ctCase = null, used = false;

function load(bases, harnessUrl) {
  if (ready) return ready;
  ready = (async () => {
    let lastErr = null;
    for (const base of bases) {
      try {
        importScripts(base + "pyodide.js");
        const py = await self.loadPyodide({ indexURL: base });
        const harness = await (await fetch(harnessUrl)).text();
        py.runPython(harness);
        ctLoad = py.globals.get("ct_load");
        ctCase = py.globals.get("ct_case");
        return py;
      } catch (e) { lastErr = e; }
    }
    ready = null;
    throw lastErr || new Error("Python couldn't load");
  })();
  return ready;
}

self.onmessage = async e => {
  const m = e.data;
  if (m.type === "load") {
    try { await load(m.base, m.harness); post({ type: "ready" }); }
    catch (err) { post({ type: "fail", msg: String(err && err.message || err) }); }
    return;
  }
  if (m.type !== "run" || used) return;
  used = true;
  const nonce = m.nonce, stdout = m.stdout, cases = m.cases, spec = stringify(m.spec);
  try { await load(m.base, m.harness); }
  catch (err) { post({ type: "fail", msg: String(err && err.message || err), nonce }); return; }
  post({ type: "status", text: "running", nonce });
  // Deep recursion can overflow the browser's own stack before Python's recursion limit is
  // reached (memoized recursion such as @cache is the usual case). Pyodide then stops with a
  // fatal error and can't run anything else, so report it and leave the other tests not run.
  const crashed = i => {
    post({ type: "case", i, ok: false, stdout: "", nonce, err: { type: "RecursionError", line: null,
      msg: "Recursion too deep for Python in the browser (memoized recursion such as @cache fails after a few hundred levels): use a bottom-up table or an explicit stack." } });
    post({ type: "done", nonce });
  };
  let loaded;
  try { loaded = parse(ctLoad(m.code)); } catch (err) { return crashed(0); }
  for (let i = 0; i < cases.length; i++) {
    let res;
    if (!loaded.ok) res = { ok: false, err: loaded.err, stdout: "" };
    else { try { res = parse(ctCase(spec, stringify(cases[i]))); } catch (err) { return crashed(i); } }
    if (i === 0 && loaded.stdout) res.stdout = loaded.stdout + (res.stdout || "");
    if (!stdout) res.stdout = "";
    post(assign({}, res, { type: "case", i, nonce }));
  }
  post({ type: "done", nonce });
};
