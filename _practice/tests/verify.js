// Verifies the coding practice sets end to end:
//   1. node _practice/check.js (sessions and problems are well formed)
//   2. python3 _practice/tests/generate.py --check (hidden tests are up to date, and the
//      reference agrees with a brute force on every case it can handle)
//   3. Every reference solution, in Python (through harness.py, as in Pyodide) and in
//      JavaScript (through runner-js.js, as in the page's worker), passes every sample and
//      hidden test, judged by judge.js exactly as the page judges it. Full-size hidden tests
//      are generated from their seed and compared by the SHA-256 of the output, as on Submit.
//   With --speed: also times the full-size tests. The references must finish each in under
//   1.5 s, and the naive solutions in tests/naive/ must fail or take over the page's 5 s
//   limit (in CPython and Node, which are faster than Pyodide in the browser).
// Run from anywhere: node _practice/tests/verify.js [--speed]
const fs = require("fs"), path = require("path"), vm = require("vm"), { execFileSync, spawnSync } = require("child_process");
const DIR = path.join(__dirname, ".."), REF = path.join(__dirname, "ref"), NAIVE = path.join(__dirname, "naive");
const step = (label, file, args) => {
  process.stdout.write(label + "\n");
  execFileSync(file, args, { stdio: ["ignore", "inherit", "inherit"] });
};
step("1. Sessions", "node", [path.join(DIR, "check.js")]);
step("2. Hidden tests", "python3", [path.join(__dirname, "generate.py"), "--check"]);

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(DIR, "problems.js"), "utf8"), ctx);
const PROBLEMS = ctx.window.PRACTICE_PROBLEMS;
const judge = require(path.join(DIR, "judge.js"));
const runner = require(path.join(DIR, "runner-js.js"));

const jobs = Object.entries(PROBLEMS).map(([id, p]) => {
  const hidden = JSON.parse(fs.readFileSync(path.join(__dirname, "hidden", id + ".json"), "utf8")).cases;
  const cases = [
    ...p.samples.map((s, i) => ({ ...s, label: `sample ${i + 1}` })),
    ...hidden.map((h, i) => ({ ...h, args: h.gen ? judge.generate(id, h.gen) : h.args, label: `hidden ${i + 1}${h.gen ? " (full size)" : ""}` }))
  ];
  if (p.speed && !hidden.some(h => h.gen)) throw new Error(`${id}: speed: true but no full-size hidden tests`);
  if (!p.speed && hidden.some(h => h.gen)) throw new Error(`${id}: full-size hidden tests but no speed: true`);
  const spec = p.cls ? { cls: p.cls } : { fn: p.fn };
  if (p.keep) spec.keep = p.keep;
  return { id, p, cases, spec };
});
const pySpec = j => j.p.cls ? j.spec : { ...j.spec, fn: j.p.fn };

let failures = 0;
async function judgeAll(lang, job, results) {
  let passed = 0;
  for (let i = 0; i < job.cases.length; i++) {
    const c = job.cases[i], r = results[i];
    let v;
    if (!r || !r.ok) v = { pass: false, why: r && r.err ? `${r.err.type}: ${r.err.msg}` : "no result" };
    else if (c.sha) v = { pass: (await judge.sha256(r.out)) === c.sha, why: "output hash differs" };
    else v = judge.compare(job.p.compare, c.args, r.out, c.expected);
    if (v.pass) passed++;
    else { failures++; console.log(`  FAIL ${lang} ${job.id} ${c.label}: ${v.why || "got " + judge.show(r && r.out, 120)}`); }
  }
  return passed;
}
const runPy = (list, timeoutMs) => {
  const r = spawnSync("python3", [path.join(__dirname, "run_py.py")], { input: JSON.stringify(list), maxBuffer: 1 << 29, stdio: ["pipe", "pipe", "ignore"], timeout: timeoutMs });
  if (r.error || r.status !== 0) return null;
  return JSON.parse(r.stdout.toString());
};
const runJs = (code, job, cases) => {
  const out = [];
  runner.run({ code, spec: job.spec, cases: cases.map(c => c.args), stdout: false, nonce: "verify" }, m => { if (m.type === "case") out[m.i] = m; });
  return out;
};

(async () => {
  console.log("3. Reference solutions");
  const py = runPy(jobs.map(j => ({ id: j.id, spec: pySpec(j), code: fs.readFileSync(path.join(REF, j.id + ".py"), "utf8"), cases: j.cases.map(c => c.args) })));
  if (!py) { console.error("Python references failed to run"); process.exit(1); }
  let total = 0;
  for (const job of jobs) {
    const t = Date.now(), js = runJs(fs.readFileSync(path.join(REF, job.id + ".js"), "utf8"), job, job.cases);
    const jsMs = Date.now() - t, pyRes = py.find(x => x.id === job.id);
    const a = await judgeAll("python", job, pyRes.results), b = await judgeAll("javascript", job, js);
    total += job.cases.length;
    const full = job.cases.filter(c => c.gen).length;
    console.log(`  ${job.id.padEnd(24)} ${String(job.p.samples.length).padStart(2)} samples + ${String(job.cases.length - job.p.samples.length).padStart(2)} hidden${full ? ` (${full} full size)` : "              "}   Python ${a}/${job.cases.length} (${pyRes.seconds}s)   JavaScript ${b}/${job.cases.length} (${jsMs} ms)`);
  }

  if (process.argv.includes("--speed")) {
    console.log("4. Speed of the full-size tests (reference < 1.5 s each; naive fails or > 5 s)");
    for (const job of jobs.filter(j => j.p.speed)) {
      for (const c of job.cases.filter(x => x.gen)) {
        const one = { ...job, cases: [c] };
        const refPy = runPy([{ id: job.id, spec: pySpec(job), code: fs.readFileSync(path.join(REF, job.id + ".py"), "utf8"), cases: [c.args] }]);
        let t = Date.now(); runJs(fs.readFileSync(path.join(REF, job.id + ".js"), "utf8"), one, [c]); const refJs = Date.now() - t;
        t = Date.now(); const nPy = runPy([{ id: job.id, spec: pySpec(job), code: fs.readFileSync(path.join(NAIVE, job.id + ".py"), "utf8"), cases: [c.args] }], 8000);
        const nPyMs = Date.now() - t, nPyOk = nPy && nPy[0].results[0].ok && (await judge.sha256(nPy[0].results[0].out)) === c.sha && nPyMs <= 5000;
        // Naive JavaScript can run for hours, so it gets its own process with a time limit.
        const script = `const r=require(${JSON.stringify(path.join(DIR, "runner-js.js"))}),J=require(${JSON.stringify(path.join(DIR, "judge.js"))});let o;r.run({code:require("fs").readFileSync(${JSON.stringify(path.join(NAIVE, job.id + ".js"))},"utf8"),spec:${JSON.stringify(job.spec)},cases:[J.generate(${JSON.stringify(job.id)},${JSON.stringify(c.gen)})],stdout:false,nonce:"n"},m=>{if(m.type==="case")o=m});J.sha256(o.ok?o.out:null).then(h=>console.log(o.ok&&h===${JSON.stringify(c.sha)}?"PASS":"FAIL"))`;
        t = Date.now(); const nJs = spawnSync("node", ["-e", script], { timeout: 8000 }); const nJsMs = Date.now() - t;
        const nJsOk = nJs.status === 0 && String(nJs.stdout).includes("PASS") && nJsMs <= 5000;
        const refOk = refPy && refPy[0].seconds < 1.5 && refJs < 1500;
        if (!refOk || nPyOk || nJsOk) failures++;
        console.log(`  ${(refOk && !nPyOk && !nJsOk ? "OK  " : "FAIL")} ${job.id.padEnd(20)} ${c.label.padEnd(22)} reference: Python ${refPy ? refPy[0].seconds + "s" : "?"}, JS ${refJs} ms   naive: Python ${nPyOk ? "passed in " + nPyMs + " ms" : nPyMs >= 7900 ? "> 8 s" : "failed"}, JS ${nJsOk ? "passed in " + nJsMs + " ms" : nJsMs >= 7900 ? "> 8 s" : "failed"}`);
      }
    }
  }
  if (failures) { console.error(`\n${failures} failures.`); process.exit(1); }
  console.log(`\nAll ${jobs.length} questions: ${total} tests pass in Python and JavaScript.`);
})();
