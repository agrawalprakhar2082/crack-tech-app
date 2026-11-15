"""Runs Python answers through _practice/harness.py (the same harness the page runs in
Pyodide). Reads [{id, spec, code, cases: [args, ...]}] as JSON on stdin and prints
[{id, results: [...], seconds}] as JSON. Used by verify.js."""
import json
import os
import sys
import time

HARNESS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "harness.py")
h = {"__name__": "harness"}
exec(compile(open(HARNESS, encoding="utf-8").read(), "harness.py", "exec"), h)
jobs = json.load(sys.stdin)
out = []
for job in jobs:
    t = time.time()
    loaded = json.loads(h["ct_load"](job["code"]))
    spec = json.dumps(job["spec"])
    results = [json.loads(h["ct_case"](spec, json.dumps(a))) if loaded["ok"] else loaded for a in job["cases"]]
    out.append({"id": job["id"], "results": results, "seconds": round(time.time() - t, 3)})
json.dump(out, sys.stdout)
