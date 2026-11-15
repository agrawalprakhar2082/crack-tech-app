# Test harness for Python answers on /practice/. Runs inside Pyodide in a Web Worker
# (practice/runner-py.js) and, unchanged, in CPython for `node _practice/tests/verify.js`.
# ct_load(code) runs the candidate's code once; ct_case(spec, args) calls their function
# (or replays class operations) for one test and returns JSON: {ok, out | err, stdout}.
# The page runs each run in a fresh Pyodide, so nothing a run changes (modules, recursion
# limit) carries over. Within a run, the harness keeps its own references to what it uses,
# so candidate code that patches json, io or sys can't change how results are reported.
import copy
import io
import json
import re
import sys
import traceback
from collections.abc import Iterable, Mapping

_dumps, _loads, _deepcopy = json.dumps, json.loads, copy.deepcopy
_StringIO, _extract_tb, _sub = io.StringIO, traceback.extract_tb, re.sub
_sys, _setlimit = sys, sys.setrecursionlimit
_Iterable, _Mapping = Iterable, Mapping
_ns = {}
MAX_STDOUT = 4000
RECURSION_LIMIT = 3000


def _snake(name):
    return _sub(r"(?<=[a-z0-9])([A-Z])", r"_\1", name).lower()


def _err(e):
    line = None
    for fr in _extract_tb(e.__traceback__):
        if fr.filename == "solution.py":
            line = fr.lineno
    if isinstance(e, SyntaxError) and e.filename == "solution.py":
        line = e.lineno
    msg = str(e) if not isinstance(e, SyntaxError) else (e.msg or "invalid syntax")
    if isinstance(e, RecursionError):
        msg = "maximum recursion depth exceeded (try an iterative version)"
    return {"type": type(e).__name__, "msg": msg[:500], "line": line}


class _Capture(_StringIO):
    # Keeps only the first MAX_STDOUT characters of what the candidate prints.
    def write(self, s):
        room = MAX_STDOUT + 100 - self.tell()
        if room > 0:
            _StringIO.write(self, str(s)[:room])
        return len(s)


def _jsonable(x):
    if isinstance(x, (list, tuple)):
        return [_jsonable(v) for v in x]
    if isinstance(x, (set, frozenset)):
        return sorted((_jsonable(v) for v in x), key=lambda v: _dumps(v))
    if isinstance(x, _Mapping):
        return {str(k): _jsonable(v) for k, v in x.items()}
    if x is None or isinstance(x, (bool, int, str)):
        return x
    if isinstance(x, float):
        if x != x or x in (float("inf"), float("-inf")):
            return str(x)
        return x
    if isinstance(x, _Iterable) and not isinstance(x, (bytes, bytearray)):
        return [_jsonable(v) for v in x]  # deque, generator, range, map, ...
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
    _setlimit(RECURSION_LIMIT)
    buf, old = _Capture(), _sys.stdout
    _sys.stdout = buf
    try:
        exec(compile(code, "solution.py", "exec"), _ns)
        res = {"ok": True}
    except BaseException as e:  # noqa: BLE001 - report any error in the candidate's code
        res = {"ok": False, "err": _err(e)}
    finally:
        _sys.stdout = old
    res["stdout"] = buf.getvalue()[:MAX_STDOUT]
    return _dumps(res)


def ct_case(spec_json, args_json):
    spec, args = _loads(spec_json), _loads(args_json)
    keep = {i: _deepcopy(args[i]) for i in spec.get("keep", [])}
    buf, old = _Capture(), _sys.stdout
    _sys.stdout = buf
    try:
        if spec.get("cls"):
            out = _run_ops(spec, args)
        else:
            out = _jsonable(_find(spec["fn"])(*args))
        changed = [i for i, v in keep.items() if args[i] != v]
        if changed:
            res = {"ok": False, "err": {"type": "Changed input", "msg": "your function changed its input list; it must leave it as it was", "line": None}}
        else:
            res = {"ok": True, "out": out}
    except BaseException as e:  # noqa: BLE001
        res = {"ok": False, "err": _err(e)}
    finally:
        _sys.stdout = old
    res["stdout"] = buf.getvalue()[:MAX_STDOUT]
    return _dumps(res)
