// Verifies the coding practice sets end to end:
//   1. node _practice/check.js (sessions and problems are well formed)
//   2. python3 _practice/tests/generate.py --check (hidden tests are up to date, and the
//      reference agrees with a brute force on every case it can handle)
//   3. Every reference solution, in Python (through harness.py, as in Pyodide) and in
//      JavaScript (through runner-js.js, as in the page's worker), passes every sample and
//      hidden test, judged by judge.js exactly as the page judges it. Full-size hidden tests
//      are generated from their seed and compared by the SHA-256 of the output, as on Submit.
//   4. AI coding rounds: every buggy version (mutant) of the tests-first round fails a hidden
//      test; a thorough test suite passes the correct version and catches every mutant, in
//      both runners; the scripted assistant's first code answer for each round fails the
//      tests and its fully corrected answer passes them, in both languages.
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
vm.runInNewContext(fs.readFileSync(path.join(DIR, "problems.js"), "utf8") + fs.readFileSync(path.join(DIR, "ai-problems.js"), "utf8") + fs.readFileSync(path.join(DIR, "sessions.js"), "utf8"), ctx);
const PROBLEMS = ctx.window.PRACTICE_PROBLEMS;
globalThis.PRACTICE_PROBLEMS = PROBLEMS; // the scripted assistant builds on the given code
const assistant = require(path.join(DIR, "assistant.js"));
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
  if (p.inplace !== undefined) spec.inplace = p.inplace;
  if (p.env) spec.env = true;
  const trees = (p.params || []).map((x, i) => x[1] === "tree" ? i : -1).filter(i => i >= 0);
  if (trees.length) spec.trees = trees;
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
  // A deep copy, as postMessage makes in the browser (answers may change their input in place).
  runner.run({ code, spec: job.spec, cases: cases.map(c => JSON.parse(JSON.stringify(c.args))), stdout: false, nonce: "verify" }, m => { if (m.type === "case") out[m.i] = m; });
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

  console.log("4. AI coding rounds");
  const pyRun = (j, code, cases) => runPy([{ id: j.id, spec: pySpec(j), code, cases: cases.map(c => c.args) }])[0].results;
  const failsSome = async (lang, j, results) => {
    for (let i = 0; i < j.cases.length; i++) {
      const c = j.cases[i], r = results[i];
      if (!r || !r.ok) return true;
      const pass = c.sha ? (await judge.sha256(r.out)) === c.sha : judge.compare(j.p.compare, c.args, r.out, c.expected).pass;
      if (!pass) return true;
    }
    return false;
  };
  const passesAll = async (lang, j, results) => !(await failsSome(lang, j, results));
  // 4a. Tests-first: mutants are real bugs, and a thorough suite catches them all.
  for (const j of jobs.filter(x => x.p.testStarters)) {
    const doc = JSON.parse(fs.readFileSync(path.join(__dirname, "hidden", j.id + ".json"), "utf8"));
    for (const lang of ["python", "javascript"]) {
      const impls = doc.mutants[lang];
      for (let m = 1; m < impls.length; m++) {
        const res = lang === "python" ? pyRun(j, impls[m], j.cases) : runJs(impls[m], j, j.cases);
        const ok = await failsSome(lang, j, res);
        if (!ok) failures++;
        console.log(`  ${ok ? "OK  " : "FAIL"} ${j.id} ${lang} mutant ${m} (${j.p.mutantHints[m - 1]}) fails a test`);
      }
      const suite = fs.readFileSync(path.join(REF, j.id + ".tests." + (lang === "python" ? "py" : "js")), "utf8");
      const spec = { tests: lang === "python" ? j.p.fn : j.p.fn };
      let rows;
      if (lang === "python") rows = runPy([{ id: j.id, spec, code: suite, cases: impls.map(c => [c]) }])[0].results;
      else { rows = []; runner.run({ code: suite, spec, cases: impls.map(c => [c]), stdout: false, nonce: "v" }, msg => { if (msg.type === "case") rows[msg.i] = msg; }); }
      const correctOk = rows[0].ok && rows[0].out.length > 0 && rows[0].out.every(t => t[1]);
      const caught = rows.slice(1).filter(r => r.ok && r.out.some(t => !t[1])).length;
      const ok = correctOk && caught === impls.length - 1;
      if (!ok) failures++;
      console.log(`  ${ok ? "OK  " : "FAIL"} ${j.id} ${lang} thorough tests: pass the correct version ${correctOk}, catch ${caught}/${impls.length - 1} buggy versions`);
      // Gaming checks: a test that keeps state between implementations must see a clean state
      // each time (so it can't "catch" every buggy version), and async tests fail.
      const gaming = lang === "python"
        ? "import builtins\nseen = []\ndef test_stateful():\n    seen.append(1)\n    assert len(seen) == 1\nasync def test_async():\n    assert False\n"
        : "var seen = [];\nfunction testStateful() { seen.push(1); assert(seen.length === 1); globalThis.__n = (globalThis.__n || 0) + 1; assert(globalThis.__n === 1); }\nasync function testAsync() { assert(false); }\nfunction testGenerator() { return (function* () { assert(false); })(); }\n";
      let gr;
      if (lang === "python") gr = runPy([{ id: j.id, spec, code: gaming, cases: impls.map(c => [c]) }])[0].results;
      else { gr = []; runner.run({ code: gaming, spec, cases: impls.map(c => [c]), stdout: false, nonce: "v" }, msg => { if (msg.type === "case") gr[msg.i] = msg; }); }
      const stateOk = gr.every(r => r.ok && r.out.find(t => /tateful/.test(t[0]))[1]);
      const asyncOk = gr.every(r => r.ok && r.out.filter(t => /sync|enerator/.test(t[0])).every(t => !t[1] && /synchronous/.test(t[2])));
      if (!stateOk || !asyncOk) failures++;
      console.log(`  ${stateOk && asyncOk ? "OK  " : "FAIL"} ${j.id} ${lang} tests run from a clean state for each implementation (${stateOk}), async tests fail (${asyncOk})`);
      // The assistant's own (weak) tests, for comparison.
      const weak = assistant.reply("ai-round-4", "write some tests", [], lang).match(/```\w+\n([\s\S]*?)```/)[1];
      let wr;
      if (lang === "python") wr = runPy([{ id: j.id, spec, code: weak, cases: impls.map(c => [c]) }])[0].results;
      else { wr = []; runner.run({ code: weak, spec, cases: impls.map(c => [c]), stdout: false, nonce: "v" }, msg => { if (msg.type === "case") wr[msg.i] = msg; }); }
      console.log(`       (the assistant's quick tests catch ${wr.slice(1).filter(r => r.ok && r.out.some(t => !t[1])).length}/${impls.length - 1})`);
    }
  }
  // 4b. The scripted assistant: first answer has the round's flaw, the corrected one passes.
  const sessions = ctx.window.PRACTICE_SESSIONS.filter(s => s.ai);
  for (const s of sessions) {
    const pid = s.blocks.flatMap(b => b.prompts).find(p => p.chat).problem, j = jobs.find(x => x.id === pid);
    for (const lang of ["python", "javascript"]) {
      const code = text => { const m = text.match(/```\w+\n([\s\S]*?)```/); return m ? m[1] : null; };
      const ask = "Please write the code for this", firstReply = assistant.reply(s.id, ask, [], lang), first = code(firstReply);
      const words = Object.values(assistant.fixWords(s.id)).map(w => w[0]);
      const fixed = code(assistant.reply(s.id, "Please fix the " + words.join(" and the "), [{ role: "user", text: ask }, { role: "assistant", text: firstReply }], lang));
      // A first prompt that repeats the spec (parameter names, method names, words like "even"
      // or "properties") must still get the flawed first answer, with no "You're right".
      const statement = [].concat(j.p.statement || []).join(" ").replace(/<[^>]+>/g, "");
      for (const opener of ["Write the code for this spec: " + statement, "Implement it. Watch the gap, timeout, commit, release, split, tab, even, lower, event properties and retryable flag.", "Please fix the " + words.join(" and the ")]) {
        const r = assistant.reply(s.id, opener, [], lang), c = code(r);
        const flawed = !c || c.trim() === first.trim() || /Some tests to start with/.test(r), polite = !/^(\(.*\)\s*)?(you're right|good catch|right,|agreed|good point)/i.test(r.trim());
        if (!flawed || !polite) { failures++; console.log(`  FAIL ${s.id} ${lang}: first prompt "${opener.slice(0, 50)}…" got a corrected answer or an apology`); }
      }
      const res1 = lang === "python" ? pyRun(j, first, j.cases) : runJs(first, j, j.cases);
      const res2 = lang === "python" ? pyRun(j, fixed, j.cases) : runJs(fixed, j, j.cases);
      const a = await failsSome(lang, j, res1), b = await passesAll(lang, j, res2);
      if (!a || !b) failures++;
      console.log(`  ${a && b ? "OK  " : "FAIL"} ${s.id} ${lang}: assistant's first answer fails the tests (${a}), corrected answer passes (${b})`);
    }
    const help = assistant.reply(s.id, "hello", [], "python"), off = assistant.reply(s.id, "tell me a joke", [], "python");
    if (!/Ask me for code/.test(help) || !/only/.test(off)) { failures++; console.log(`  FAIL ${s.id}: generic replies`); }
  }

  if (process.argv.includes("--speed")) {
    console.log("5. Speed of the full-size tests (reference < 1.5 s each; naive fails or > 5 s)");
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
