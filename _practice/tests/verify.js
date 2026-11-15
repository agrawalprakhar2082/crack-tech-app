// Verifies the coding practice sets end to end:
//   1. node _practice/check.js (sessions and problems are well formed)
//   2. python3 _practice/tests/generate.py --check (hidden tests are up to date, and the
//      reference agrees with a brute force on every case it can handle)
//   3. Every reference solution, in Python (through harness.py, as in Pyodide) and in
//      JavaScript (through runner-js.js, as in the page's worker), passes every sample and
//      hidden test, judged by judge.js exactly as the page judges it.
// Run from anywhere: node _practice/tests/verify.js
const fs = require("fs"), path = require("path"), vm = require("vm"), { execFileSync } = require("child_process");
const DIR = path.join(__dirname, ".."), REF = path.join(__dirname, "ref");
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
  const cases = [...p.samples.map((s, i) => ({ ...s, label: `sample ${i + 1}` })), ...hidden.map((h, i) => ({ ...h, label: `hidden ${i + 1}` }))];
  return { id, p, cases, spec: p.cls ? { cls: p.cls } : { fn: p.fn } };
});

let failures = 0;
const judgeAll = (lang, job, results) => {
  let passed = 0;
  job.cases.forEach((c, i) => {
    const r = results[i];
    const v = r && r.ok ? judge.compare(job.p.compare, c.args, r.out, c.expected) : { pass: false, why: r && r.err ? `${r.err.type}: ${r.err.msg}` : "no result" };
    if (v.pass) passed++;
    else { failures++; console.log(`  FAIL ${lang} ${job.id} ${c.label}: ${v.why || "got " + judge.show(r && r.out, 120)} expected ${judge.show(c.expected, 120)}`); }
  });
  return passed;
};

console.log("3. Reference solutions");
const py = JSON.parse(execFileSync("python3", [path.join(__dirname, "run_py.py")], {
  input: JSON.stringify(jobs.map(j => ({ id: j.id, spec: j.spec, code: fs.readFileSync(path.join(REF, j.id + ".py"), "utf8"), cases: j.cases.map(c => c.args) }))),
  maxBuffer: 1 << 28, stdio: ["pipe", "pipe", "ignore"]
}).toString());
let total = 0;
for (const job of jobs) {
  const t = Date.now(), js = [];
  runner.run({ code: fs.readFileSync(path.join(REF, job.id + ".js"), "utf8"), spec: job.spec, cases: job.cases.map(c => c.args), stdout: false }, m => { if (m.type === "case") js[m.i] = m; });
  const jsMs = Date.now() - t, pyRes = py.find(x => x.id === job.id);
  const a = judgeAll("python", job, pyRes.results), b = judgeAll("javascript", job, js);
  total += job.cases.length;
  console.log(`  ${job.id.padEnd(24)} ${String(job.p.samples.length).padStart(2)} samples + ${String(job.cases.length - job.p.samples.length).padStart(2)} hidden   Python ${a}/${job.cases.length} (${pyRes.seconds}s)   JavaScript ${b}/${job.cases.length} (${jsMs} ms)`);
}
if (failures) { console.error(`\n${failures} test failures.`); process.exit(1); }
console.log(`\nAll ${jobs.length} questions: ${total} tests pass in Python and JavaScript.`);
