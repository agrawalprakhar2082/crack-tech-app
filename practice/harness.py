# Test harness for Python answers on /practice/. Runs inside Pyodide in a Web Worker
# (practice/runner-py.js) and, unchanged, in CPython for `node _practice/tests/verify.js`.
# ct_load(code) runs the candidate's code once; ct_case(spec, args) calls their function
# (or replays class operations) for one test and returns JSON: {ok, out | err, stdout}.
import io
import json
import re
import sys
import traceback

sys.setrecursionlimit(3000)
_ns = {}
MAX_STDOUT = 4000


def _snake(name):
    return re.sub(r"(?<=[a-z0-9])([A-Z])", r"_\1", name).lower()


def _err(e):
    line = None
    for fr in traceback.extract_tb(e.__traceback__):
        if fr.filename == "solution.py":
            line = fr.lineno
    if isinstance(e, SyntaxError) and e.filename == "solution.py":
        line = e.lineno
    msg = str(e) if not isinstance(e, SyntaxError) else (e.msg or "invalid syntax")
    if isinstance(e, RecursionError):
        msg = "maximum recursion depth exceeded (try an iterative version)"
    return {"type": type(e).__name__, "msg": msg[:500], "line": line}


class _Capture(io.StringIO):
    def write(self, s):
        if self.tell() < MAX_STDOUT + 100:
            return super().write(s)
        return len(s)


def _jsonable(x):
    if isinstance(x, (list, tuple)):
        return [_jsonable(v) for v in x]
    if isinstance(x, (set, frozenset)):
        return sorted((_jsonable(v) for v in x), key=lambda v: json.dumps(v))
    if isinstance(x, dict):
        return {str(k): _jsonable(v) for k, v in x.items()}
    if x is None or isinstance(x, (bool, int, str)):
        return x
    if isinstance(x, float):
        if x != x or x in (float("inf"), float("-inf")):
            return str(x)
        return x
    raise TypeError("returned a value of type %s, which can't be checked" % type(x).__name__)


def _find(name):
    # The function by its Python name; also accept the camelCase name, or a common
    # class Solution with that method.
    for n in (_snake(name), name):
        f = _ns.get(n)
        if callable(f) and not isinstance(f, type):
            return f
    sol = _ns.get("Solution")
    if isinstance(sol, type):
        inst = sol()
        for n in (_snake(name), name):
            if callable(getattr(inst, n, None)):
                return getattr(inst, n)
    raise NameError("define a function named %s" % _snake(name))


def _run_ops(spec, args):
    ops, op_args = args
    cls = _ns.get(spec["cls"])
    if not isinstance(cls, type):
        raise NameError("define a class named %s" % spec["cls"])
    obj, out = None, []
    for op, a in zip(ops, op_args):
        if op == spec["cls"]:
            obj = cls(*a)
            out.append(None)
            continue
        m = getattr(obj, _snake(op), None) or getattr(obj, op, None)
        if not callable(m):
            raise AttributeError("%s has no method %s" % (spec["cls"], _snake(op)))
        out.append(_jsonable(m(*a)))
    return out


def ct_load(code):
    global _ns
    _ns = {"__name__": "solution"}
    buf, old = _Capture(), sys.stdout
    sys.stdout = buf
    try:
        exec(compile(code, "solution.py", "exec"), _ns)
        res = {"ok": True}
    except BaseException as e:  # noqa: BLE001 - report any error in the candidate's code
        res = {"ok": False, "err": _err(e)}
    finally:
        sys.stdout = old
    res["stdout"] = buf.getvalue()[:MAX_STDOUT]
    return json.dumps(res)


def ct_case(spec_json, args_json):
    spec, args = json.loads(spec_json), json.loads(args_json)
    buf, old = _Capture(), sys.stdout
    sys.stdout = buf
    try:
        if spec.get("cls"):
            out = _run_ops(spec, args)
        else:
            out = _jsonable(_find(spec["fn"])(*args))
        res = {"ok": True, "out": out}
    except BaseException as e:  # noqa: BLE001
        res = {"ok": False, "err": _err(e)}
    finally:
        sys.stdout = old
    res["stdout"] = buf.getvalue()[:MAX_STDOUT]
    return json.dumps(res)
