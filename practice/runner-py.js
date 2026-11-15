// Runs a candidate's Python answer against tests with Pyodide (CPython compiled to
// WebAssembly), in a Web Worker. Pyodide loads once per worker (about 10 MB, cached by
// the browser after the first time). If a test runs too long, practice.js terminates
// this worker and starts a new one for the next run.
// Message in: { base: [pyodide URLs to try], harness: URL of harness.py, code, spec, cases, stdout }
// Messages out: { type: "status", text }, { type: "case", i, ok, out | err, stdout } per test,
// { type: "done" }, or { type: "fail", msg } if Python couldn't load.
let ready = null, ctLoad = null, ctCase = null;

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
  try {
    if (!ctCase) self.postMessage({ type: "status", text: "loading" });
    await load(m.base, m.harness);
  } catch (err) {
    self.postMessage({ type: "fail", msg: String(err && err.message || err) });
    return;
  }
  self.postMessage({ type: "status", text: "running" });
  const loaded = JSON.parse(ctLoad(m.code));
  const spec = JSON.stringify(m.spec);
  m.cases.forEach((args, i) => {
    let res;
    if (!loaded.ok) res = { ok: false, err: loaded.err, stdout: "" };
    else res = JSON.parse(ctCase(spec, JSON.stringify(args)));
    if (i === 0 && loaded.stdout) res.stdout = loaded.stdout + (res.stdout || "");
    if (!m.stdout) res.stdout = "";
    self.postMessage(Object.assign({ type: "case", i }, res));
  });
  self.postMessage({ type: "done" });
};
