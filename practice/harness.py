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
import weakref
from collections.abc import Iterable, Mapping

_dumps, _loads, _deepcopy = json.dumps, json.loads, copy.deepcopy
_StringIO, _extract_tb, _sub = io.StringIO, traceback.extract_tb, re.sub
_sys, _setlimit = sys, sys.setrecursionlimit
_Iterable, _Mapping, _weakref = Iterable, Mapping, weakref.ref
_ns = {}
MAX_STDOUT = 4000


class TreeNode:
    """Binary tree node given to the candidate's code (spec "trees": argument indexes)."""
    def __init__(self, val=0, left=None, right=None):
        self.val, self.left, self.right = val, left, right


class _Fixed:
    __slots__ = ("v",)

    def __init__(self, v):
        self.v = v


def _complete_tree(n):
    # A huge complete binary tree with n nodes (full-size tests: {"$complete": n}), made only
    # as it's visited. n lives only in this closure, so the tree's size can't be read off a
    # node. Nodes are TreeNodes, accept new attributes, and keep their children through weak
    # references: node.left is node.left while you hold it, but a full traversal doesn't keep
    # the whole tree in memory. Assigning node.left or node.right replaces that child.
    def child(node, key, j):
        ref = node.__dict__.get(key)
        if isinstance(ref, _Fixed):
            return ref.v
        got = ref() if ref is not None else None
        if got is None:
            got = Node(j) if j < n else None
            node.__dict__[key] = _Fixed(None) if got is None else _weakref(got)
        return got

    class Node(TreeNode):
        def __init__(self, i):
            self.__dict__["val"] = i + 1
            self.__dict__["_index"] = i

        left = property(lambda self: child(self, "_left", 2 * self._index + 1),
                        lambda self, v: self.__dict__.__setitem__("_left", _Fixed(v)))
        right = property(lambda self: child(self, "_right", 2 * self._index + 2),
                         lambda self, v: self.__dict__.__setitem__("_right", _Fixed(v)))

    Node.__name__ = Node.__qualname__ = "TreeNode"
    return Node(0) if n > 0 else None


# ---- AI coding rounds: fake clock for classes, a flaky service, and tests-first grading ----
class _FakeClock:
    """{"$clock": t} in a constructor's arguments: a clock function starting at t; the
    test step "$advance" [seconds] moves every fake clock forward."""
    def __init__(self, t=0):
        self.t = t

    def __call__(self):
        return self.t


class ServiceError(Exception):
    """Raised by the fake service in the resilience round (available to the candidate)."""
    def __init__(self, kind, retryable):
        Exception.__init__(self, kind)
        self.kind, self.retryable = kind, retryable


_RETRYABLE = ("timeout", "unavailable")


class _EnvClock:
    def __init__(self):
        self.t, self.sleeps = 0.0, []

    def now(self):
        return self.t

    def sleep(self, seconds):
        if not isinstance(seconds, (int, float)) or isinstance(seconds, bool) or seconds < 0:
            raise ValueError("clock.sleep needs a non-negative number of seconds")
        self.sleeps.append(seconds)
        self.t += seconds


class _EnvService:
    def __init__(self, outcomes, clock):
        self.outcomes, self.clock, self.calls = outcomes, clock, 0

    def call(self):
        kind, latency, *value = self.outcomes[min(self.calls, len(self.outcomes) - 1)]
        self.calls += 1
        self.clock.t += latency
        if kind == "ok":
            return value[0] if value else None
        raise ServiceError(kind, kind in _RETRYABLE)


def _run_env(fn, args):
    # args: [{"outcomes": [[kind, latency, value?], ...], "rand": [...]}, policy]
    scenario, policy = args
    clock = _EnvClock()
    service = _EnvService(scenario["outcomes"], clock)
    seq, used = scenario.get("rand") or [0.5], [0]

    def rand():
        v = seq[min(used[0], len(seq) - 1)]
        used[0] += 1
        return v

    result = error = None
    try:
        result = fn(service, clock, rand, policy)
    except ServiceError as e:
        error = e.kind
    return {"result": _jsonable(result), "error": error, "attempts": service.calls,
            "sleeps": [round(x, 9) for x in clock.sleeps]}


_code = ""


def _fresh_ns():
    return {"__name__": "solution", "TreeNode": TreeNode, "ServiceError": ServiceError}


def _test_names(ns):
    return [n for n, f in list(ns.items()) if n.startswith("test") and callable(f) and getattr(f, "__code__", None) is not None]


def _run_tests(target, impl):
    # Tests-first round: run the candidate's test_* functions against one implementation.
    # Each implementation starts from a fresh namespace (the candidate's code runs again), so
    # state a test leaves behind for one implementation doesn't reach the next.
    global _ns
    _ns = _fresh_ns()
    _setlimit(RECURSION_LIMIT)
    exec(compile(_code, "solution.py", "exec"), _ns)
    names = _test_names(_ns)
    exec(compile(impl, "implementation.py", "exec"), _ns)
    if not callable(_ns.get(target)):
        raise NameError("internal: implementation missing")
    out = []
    for name in names:
        try:
            r = _ns[name]()
            if r is not None and (hasattr(r, "__await__") or (hasattr(r, "send") and hasattr(r, "throw"))):
                if hasattr(r, "close"):
                    r.close()
                out.append([name, False, "tests must be synchronous: define it with def, not async def, and don't yield"])
                continue
            out.append([name, True, ""])
        except AssertionError as e:
            line = None
            for fr in _extract_tb(e.__traceback__):
                if fr.filename == "solution.py":
                    line = fr.lineno
            out.append([name, False, (str(e) or "assertion failed") + (" (line %d)" % line if line else "")])
        except BaseException as e:  # noqa: BLE001
            info = _err(e)
            out.append([name, False, "%s: %s" % (info["type"], info["msg"]) + (" (line %d)" % info["line"] if info["line"] else "")])
    return out


def _build_tree(v):
    # Level-order list with None for a missing child, e.g. [5, 3, 8, None, 4].
    if isinstance(v, dict) and "$complete" in v:
        return _complete_tree(v["$complete"])
    if not v or v[0] is None:
        return None
    root = TreeNode(v[0])
    queue, head, i = [root], 0, 1
    while i < len(v):
        node = queue[head]
        head += 1
        if v[i] is not None:
            node.left = TreeNode(v[i])
            queue.append(node.left)
        i += 1
        if i < len(v) and v[i] is not None:
            node.right = TreeNode(v[i])
            queue.append(node.right)
        i += 1
    return root
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
    obj, out, clocks = None, [], []
    for op, a in zip(ops, op_args):
        if op == "$advance":
            for c in clocks:
                c.t += a[0]
            out.append(None)
            continue
        if op == spec["cls"]:
            real = []
            for x in a:
                if isinstance(x, dict) and "$clock" in x:
                    clocks.append(_FakeClock(x["$clock"]))
                    x = clocks[-1]
                real.append(x)
            obj = cls(*real)
            out.append(None)
            continue
        m = getattr(obj, _snake(op), None) or getattr(obj, op, None)
        if not callable(m):
            raise AttributeError("%s has no method %s" % (spec["cls"], _snake(op)))
        out.append(_jsonable(m(*a)))
    return out


def ct_load(code):
    global _ns
    global _code
    _ns = _fresh_ns()
    _code = code
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
    for i in spec.get("trees", []):
        args[i] = _build_tree(args[i])
    buf, old = _Capture(), _sys.stdout
    _sys.stdout = buf
    try:
        if spec.get("cls"):
            out = _run_ops(spec, args)
        elif spec.get("tests"):
            out = _run_tests(_snake(spec["tests"]), args[0])
        elif spec.get("env"):
            out = _run_env(_find(spec["fn"]), args)
        else:
            out = _find(spec["fn"])(*args)
            if out is None and "inplace" in spec:
                out = args[spec["inplace"]]  # changed the list in place and returned nothing
            out = _jsonable(out)
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
