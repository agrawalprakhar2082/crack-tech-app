"""Generates the hidden tests for the coding practice sets.

    python3 _practice/tests/generate.py          # write _practice/tests/hidden/<id>.json
    python3 _practice/tests/generate.py --check  # check the files are up to date (no writes)

Each problem has a reference solution in ref/<id>.py (written like a candidate's answer),
a brute force, and a generator of test inputs (fixed seed, so the output is stable).
Expected outputs come from the reference; every generated case, plus a few hundred extra
small random cases, is checked against the brute force. The build (ruby _blog/build.rb)
base64-encodes the files into practice/hidden/ for the Submit button.

Questions where speed matters also get full-size cases (FULL below): their inputs are made
by the seeded generators in _practice/judge.js (run here with node, and in the page on
Submit), so only the seed and the SHA-256 of the expected output's JSON are stored.
"""
import hashlib
import itertools
import subprocess
import json
import os
import random
import sys
import zlib
from collections import Counter, deque

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "ref")
OUT = os.path.join(HERE, "hidden")


def load(pid, name):
    ns = {"__name__": "ref"}
    with open(os.path.join(REF, pid + ".py"), encoding="utf-8") as f:
        exec(compile(f.read(), pid + ".py", "exec"), ns)
    return ns[name]


# ---------------------------------------------------------------- brute forces

def b_unpaired(nums):
    return [v for v, c in Counter(nums).items() if c == 1][0]


def b_typed(s):
    t = ""
    for ch in s:
        t = t[:-1] if ch == "_" else t + ch
    return t


def valid_parens(t):
    depth = 0
    for ch in t:
        depth += (ch == "(") - (ch == ")")
        if depth < 0:
            return False
    return depth == 0


def is_subsequence(t, s):
    it = iter(s)
    return all(ch in it for ch in t)


def b_paren_len(s):
    # Longest valid subsequence, by trying every subset of positions to keep (small s only).
    n = len(s)
    for keep in range(n, -1, -1):
        for idx in itertools.combinations(range(n), keep):
            if valid_parens("".join(s[i] for i in idx)):
                return keep
    return 0


def b_coated(days, k):
    c = Counter()
    for a, b in days:
        for x in range(a, b + 1):
            c[x] += 1
    return sum(1 for v in c.values() if v >= k)


def b_arrows(balloons):
    if not balloons:
        return 0
    pts = sorted({x for b in balloons for x in b})
    for m in range(1, len(balloons) + 1):
        for shot in itertools.combinations(pts, m):
            if all(any(s <= x <= e for x in shot) for s, e in balloons):
                return m
    return len(balloons)


def b_window(nums, k):
    return [max(nums[i:i + k]) for i in range(len(nums) - k + 1)]


def b_ones(nums, k):
    best = 0
    for i in range(len(nums)):
        z = 0
        for j in range(i, len(nums)):
            z += nums[j] == 0
            if z > k:
                break
            best = max(best, j - i + 1)
    return best


def b_matrix(matrix, target):
    return any(target in row for row in matrix)


def b_tank(draws, k):
    cap = max(draws)
    while True:
        water = fills = 0
        for d in draws:
            if water < d:
                water, fills = cap, fills + 1
            water -= d
        if fills <= k:
            return cap
        cap += 1


def b_paint(costs):
    if not costs:
        return 0
    best = None
    for colours in itertools.product(range(3), repeat=len(costs)):
        if all(colours[i] != colours[i + 1] for i in range(len(costs) - 1)):
            t = sum(costs[i][c] for i, c in enumerate(colours))
            best = t if best is None else min(best, t)
    return best


def b_subsets(nums, target, k):
    n = 0
    for counts in itertools.product(range(k + 1), repeat=len(nums)):
        if sum(c * v for c, v in zip(counts, nums)) == target:
            n += 1
    return n % (10**9 + 7)


def b_cycle(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
    colour = [0] * n

    def dfs(u):
        colour[u] = 1
        for v in adj[u]:
            if colour[v] == 1 or (colour[v] == 0 and dfs(v)):
                return True
        colour[u] = 2
        return False

    return any(colour[u] == 0 and dfs(u) for u in range(n))


def b_semesters(n, prereqs):
    if b_cycle(n, prereqs):
        return -1
    preds = [[] for _ in range(n)]
    for a, b in prereqs:
        preds[b].append(a)
    memo = {}

    def depth(u):
        if u not in memo:
            memo[u] = 1 + max((depth(p) for p in preds[u]), default=0)
        return memo[u]

    return max(depth(u) for u in range(n))


def b_sudoku(board):
    groups = [board[r] for r in range(9)]
    groups += [[board[r][c] for r in range(9)] for c in range(9)]
    groups += [[board[r][c] for r in range(br, br + 3) for c in range(bc, bc + 3)] for br in (0, 3, 6) for bc in (0, 3, 6)]
    for g in groups:
        vals = [v for v in g if v]
        if len(vals) != len(set(vals)):
            return False
    return True


def b_moves(a, b):
    start, goal = tuple(b), tuple(a)
    dist, q = {start: 0}, deque([start])
    while q:
        cur = q.popleft()
        if cur == goal:
            return dist[cur]
        for i in range(len(cur)):
            rest = cur[:i] + cur[i + 1:]
            for nxt in ((cur[i],) + rest, rest + (cur[i],)):
                if nxt not in dist:
                    dist[nxt] = dist[cur] + 1
                    q.append(nxt)
    return -1


def b_scoreboard(ops, args):
    scores, out = {}, []
    for op, a in zip(ops, args):
        if op == "Scoreboard":
            scores = {}
            out.append(None)
        elif op == "assign":
            scores[a[0]] = a[1]
            out.append(None)
        elif op == "remove":
            scores.pop(a[0], None)
            out.append(None)
        elif op == "maxScore":
            out.append(list(min(scores.items(), key=lambda kv: (-kv[1], kv[0]))) if scores else None)
        elif op == "getScore":
            out.append(scores.get(a[0]))
    return out


def b_klargest(heap, k):
    return sorted(heap, reverse=True)[:k]


def b_subarrays(nums, k):
    return sum(1 for i in range(len(nums)) for j in range(i, len(nums)) if sum(nums[i:j + 1]) == k)


def b_halves(ages, skills):
    out = []
    for d in range(1, len(ages) + 1):
        people = sorted(range(d), key=lambda i: (ages[i], i))
        y = (d + 1) // 2
        out.append(abs(sum(skills[i] for i in people[:y]) - sum(skills[i] for i in people[y:])))
    return out


# ---------------------------------------------------------------- generators

def g_unpaired(rng, small):
    def make(pairs, lo=-10**9, hi=10**9):
        vals = rng.sample(range(lo, hi), pairs + 1)
        nums = vals[:pairs] * 2 + [vals[pairs]]
        rng.shuffle(nums)
        return [nums]
    if small:
        return make(rng.randint(0, 5), -9, 10)
    cases = [[[7]], [[0, 5, 5]], [[-3, 2, 2]], [[1, 1, -1000000000]], [[2147, 2147, 999999999, -5, -5]]]
    cases += [make(rng.randint(2, 30), -50, 50) for _ in range(4)]
    cases += [make(2500), make(3000)]
    return cases


def g_sorted(rng, small):
    def make(pairs, lo=-10**9, hi=10**9):
        vals = sorted(rng.sample(range(lo, hi), pairs + 1))
        single = rng.randrange(pairs + 1)
        nums = []
        for i, v in enumerate(vals):
            nums += [v] if i == single else [v, v]
        return [nums]
    if small:
        return make(rng.randint(0, 6), -9, 10)
    cases = [[[4]], [[1, 2, 2]], [[1, 1, 2]], [[-5, -5, 0, 3, 3]], [[1, 1, 2, 2, 3, 3, 4]]]
    cases += [make(rng.randint(3, 40), -100, 100) for _ in range(4)]
    cases += [make(3000), make(4000)]
    return cases


def g_typed(rng, small):
    def make(n, p=0.35):
        return ["".join("_" if rng.random() < p else rng.choice("abcxyz") for _ in range(n))]
    if small:
        return make(rng.randint(0, 10), 0.4)
    cases = [[""], ["abc"], ["___"], ["a_b_c_"], ["__ab"], ["ab__cd_e"], ["x_y_z_q"]]
    cases += [make(rng.randint(10, 60)) for _ in range(3)] + [make(5000, 0.45), make(5000, 0.2)]
    return cases


def g_parens(rng, small):
    def make(n, letters=0.3):
        return ["".join(rng.choice("abc") if rng.random() < letters else rng.choice("()") for _ in range(n))]
    if small:
        return make(rng.randint(0, 11))
    cases = [[""], ["abc"], ["()"], [")("], ["((("], [")))a"], ["(a)(b"], ["())()("], ["a(b(c)d"]]
    cases += [make(rng.randint(10, 40)) for _ in range(3)] + [make(4000), make(4000, 0)]
    return cases


def g_coated(rng, small):
    def make(n, hi, maxlen):
        days = []
        for _ in range(n):
            a = rng.randint(1, hi)
            days.append([a, min(hi, a + rng.randint(0, maxlen))])
        return [days, rng.randint(1, 3)]
    if small:
        return make(rng.randint(0, 6), 15, 8)
    cases = [[[], 1], [[[5, 5]], 1], [[[5, 5]], 2], [[[1, 3], [4, 6]], 2], [[[1, 10], [1, 10], [1, 10]], 3],
             [[[1, 1000000000], [1, 1000000000]], 2], [[[1, 4], [4, 8]], 2]]
    cases += [make(rng.randint(5, 20), 60, 20) for _ in range(3)]
    big = make(1500, 10**9, 10**6)
    big[1] = 2
    cases += [big, [make(1500, 10**9, 10**8)[0], 3]]
    return cases


def g_arrows(rng, small):
    def make(n, hi, maxlen):
        out = []
        for _ in range(n):
            a = rng.randint(-hi, hi)
            out.append([a, a + rng.randint(0, maxlen)])
        return [out]
    if small:
        return make(rng.randint(0, 6), 10, 6)
    cases = [[[]], [[[1, 1]]], [[[1, 2], [2, 3], [3, 4], [4, 5]]], [[[1, 5], [2, 3], [4, 6]]], [[[1, 2], [3, 4], [5, 6]]], [[[-5, -1], [-1, 3]]],
             [[[0, 10], [0, 10], [0, 10]]], [[[-1000000000, 1000000000], [5, 5]]]]
    cases += [make(rng.randint(5, 20), 50, 15) for _ in range(3)]
    cases += [make(3000, 10**9, 10**7), make(3000, 10**5, 10)]
    return cases


def g_window(rng, small):
    def make(n, lo=-10**4, hi=10**4):
        nums = [rng.randint(lo, hi) for _ in range(n)]
        return [nums, rng.randint(1, n)]
    if small:
        return make(rng.randint(1, 9), -5, 5)
    cases = [[[5], 1], [[1, 2, 3], 3], [[3, 2, 1], 1], [[2, 2, 2, 2], 2], [[-1, -3, -2, -5], 2], [[1, 3, 1, 2, 0, 5], 3]]
    cases += [make(rng.randint(5, 40), -20, 20) for _ in range(4)]
    big = make(4000)
    big[1] = 50
    cases += [big, [list(range(4000, 0, -1)), 300]]
    return cases


def g_ones(rng, small):
    def make(n, p=0.6):
        nums = [1 if rng.random() < p else 0 for _ in range(n)]
        return [nums, rng.randint(0, max(0, n // 3))]
    if small:
        return make(rng.randint(1, 10))
    cases = [[[0], 0], [[0], 1], [[1, 1, 1], 0], [[0, 0, 0], 2], [[1, 0, 1, 0, 1], 0], [[1, 0, 1, 0, 1], 5], [[0, 1, 1, 0, 0, 1, 1, 1, 0, 1], 2]]
    cases += [make(rng.randint(10, 50)) for _ in range(3)] + [make(5000, 0.7), make(5000, 0.3)]
    return cases


def g_matrix(rng, small):
    def make(m, n, step=5):
        grid = [[0] * n for _ in range(m)]
        for r in range(m):
            for c in range(n):
                base = max(grid[r - 1][c] if r else -50, grid[r][c - 1] if c else -50)
                grid[r][c] = base + rng.randint(0, step)
        flat = [v for row in grid for v in row]
        target = rng.choice(flat) if rng.random() < 0.5 else rng.randint(min(flat) - 3, max(flat) + 3)
        return [grid, target]
    if small:
        return make(rng.randint(1, 4), rng.randint(1, 4), 3)
    cases = [[[], 1], [[[5]], 5], [[[5]], 4], [[[1, 3, 5]], 3], [[[1], [3], [5]], 4], [[[1, 2], [3, 4]], 4],
             [[[1, 4, 7], [2, 5, 8], [3, 6, 9]], 10], [[[1, 4, 7], [2, 5, 8], [3, 6, 9]], 0]]
    cases += [make(rng.randint(2, 8), rng.randint(2, 8)) for _ in range(3)]
    g, _ = make(60, 60)
    cases += [[g, g[37][11]], [g, g[59][59] + 1]]
    return cases


def g_tank(rng, small):
    def make(n, hi):
        d = [rng.randint(1, hi) for _ in range(n)]
        return [d, rng.randint(1, n)]
    if small:
        return make(rng.randint(1, 7), 8)
    cases = [[[5], 1], [[1, 1, 1, 1], 4], [[1, 1, 1, 1], 1], [[2, 9, 2], 2], [[4, 4, 4, 4], 2], [[10, 1, 1, 1, 10], 2]]
    cases += [make(rng.randint(5, 30), 30) for _ in range(4)]
    cases += [make(3000, 10**4), [[rng.randint(1, 10**4) for _ in range(3000)], 1]]
    return cases


def g_paint(rng, small):
    def make(n, hi=20):
        return [[[rng.randint(0, hi) for _ in range(3)] for _ in range(n)]]
    if small:
        return make(rng.randint(0, 7), 9)
    cases = [[[]], [[[4, 2, 9]]], [[[1, 1, 1], [1, 1, 1]]], [[[1, 50, 50], [1, 50, 50]]], [[[5, 5, 1], [9, 9, 1], [5, 5, 1]]]]
    cases += [make(rng.randint(3, 30)) for _ in range(4)] + [make(3000, 10**4), make(3000, 3)]
    return cases


def g_subsets(rng, small):
    def make(n, maxv, target, k):
        return [sorted(rng.sample(range(1, maxv + 1), n)), target, k]
    if small:
        n = rng.randint(1, 4)
        return make(n, 8, rng.randint(0, 20), rng.randint(1, 3))
    cases = [[[5], 0, 3], [[5], 5, 1], [[5], 10, 1], [[5], 15, 3], [[1, 2], 3, 1], [[1, 2, 3], 6, 1], [[2, 4], 7, 5]]
    cases += [make(rng.randint(3, 8), 20, rng.randint(10, 40), rng.randint(1, 4)) for _ in range(3)]
    cases += [make(60, 200, 1000, 5), make(40, 60, 1000, 100)]
    return cases


def g_cycle(rng, small, dag=None):
    def make(n, m, acyclic):
        order = list(range(n))
        rng.shuffle(order)
        rank = {v: i for i, v in enumerate(order)}
        edges = set()
        tries = 0
        while len(edges) < m and tries < m * 20:
            tries += 1
            u, v = rng.randrange(n), rng.randrange(n)
            if u == v:
                continue
            if acyclic and rank[u] > rank[v]:
                u, v = v, u
            edges.add((u, v))
        return [n, [list(e) for e in edges]]
    if small:
        n = rng.randint(1, 6)
        return make(n, rng.randint(0, n * 2), rng.random() < 0.5)
    cases = [[1, []], [1, [[0, 0]]], [2, [[0, 1]]], [2, [[0, 1], [1, 0]]], [3, [[0, 1], [1, 2], [2, 0]]],
             [4, [[0, 1], [0, 2], [1, 3], [2, 3]]], [5, [[0, 1], [3, 4], [4, 3]]], [3, [[0, 1], [0, 1]]]]
    cases += [make(rng.randint(5, 15), rng.randint(5, 25), i % 2 == 0) for i in range(2)]
    chain = [[i, i + 1] for i in range(799)]
    cases += [make(800, 3000, True), [800, chain], [800, chain + [[799, 0]]]]
    return cases


def g_semesters(rng, small):
    if small:
        return g_cycle(rng, True)
    cases = [[1, []], [3, []], [2, [[0, 1]]], [2, [[0, 1], [1, 0]]], [4, [[0, 1], [0, 2], [1, 3], [2, 3]]],
             [5, [[0, 4], [1, 4], [2, 4], [3, 4]]], [4, [[0, 1], [1, 2], [2, 3], [0, 3]]], [3, [[1, 1]]]]
    for i in range(3):
        n = rng.randint(5, 15)
        order = list(range(n))
        rng.shuffle(order)
        edges = {(order[a], order[b]) for a, b in (sorted(rng.sample(range(n), 2)) for _ in range(rng.randint(3, 20)))}
        if i == 2:
            edges.add((order[-1], order[0]))
        cases.append([n, [list(e) for e in edges]])
    n = 800
    order = list(range(n))
    rng.shuffle(order)
    edges = {(order[a], order[b]) for a, b in (sorted(rng.sample(range(n), 2)) for _ in range(3000))}
    cases.append([n, [list(e) for e in edges]])
    cases.append([n, [[order[i], order[i + 1]] for i in range(n - 1)]])
    return cases


SOLVED = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2], [6, 7, 2, 1, 9, 5, 3, 4, 8], [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3], [4, 2, 6, 8, 5, 3, 7, 9, 1], [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4], [2, 8, 7, 4, 1, 9, 6, 3, 5], [3, 4, 5, 2, 8, 6, 1, 7, 9]]


def g_sudoku(rng, small):
    def shuffled():
        # Relabel digits and permute rows/columns within bands: still a solved grid.
        perm = list(range(1, 10))
        rng.shuffle(perm)
        rows = [b * 3 + r for b in rng.sample(range(3), 3) for r in rng.sample(range(3), 3)]
        cols = [b * 3 + c for b in rng.sample(range(3), 3) for c in rng.sample(range(3), 3)]
        return [[perm[SOLVED[r][c] - 1] for c in cols] for r in rows]

    def blanked(g, keep):
        return [[v if rng.random() < keep else 0 for v in row] for row in g]

    def broken(g, where):
        g = [row[:] for row in g]
        cells = [(r, c) for r in range(9) for c in range(9)]
        rng.shuffle(cells)
        for r, c in cells:
            if g[r][c]:
                continue
            for r2, c2 in cells:
                v = g[r2][c2]
                if not v:
                    continue
                same_row, same_col, same_box = r == r2, c == c2, (r // 3, c // 3) == (r2 // 3, c2 // 3)
                if (where == "row" and same_row and not same_box) or (where == "col" and same_col and not same_box) or \
                   (where == "box" and same_box and not same_row and not same_col):
                    g[r][c] = v
                    return g
        return g
    if small:
        g = blanked(shuffled(), rng.random())
        return [broken(g, rng.choice(["row", "col", "box"])) if rng.random() < 0.5 else g]
    empty = [[0] * 9 for _ in range(9)]
    cases = [[empty], [shuffled()], [blanked(shuffled(), 0.4)], [blanked(shuffled(), 0.15)]]
    for where in ("row", "col", "box", "box", "row", "col"):
        cases.append([broken(blanked(shuffled(), 0.35), where)])
    full = shuffled()
    full[8][8], full[8][7] = full[8][7], full[8][8]
    cases.append([full])
    return cases


def g_moves(rng, small):
    def make(n):
        a = rng.sample(range(1, 10 * n + 1), n)
        b = a[:]
        rng.shuffle(b)
        return [a, b]
    if small:
        return make(rng.randint(1, 7))
    cases = [[[1], [1]], [[1, 2], [2, 1]], [[1, 2, 3], [1, 2, 3]], [[1, 2, 3], [3, 2, 1]], [[3, 1, 2], [1, 2, 3]],
             [[5, 6, 7, 8], [8, 7, 6, 5]], [[1, 2, 3, 4, 5], [2, 3, 4, 5, 1]]]
    cases += [make(rng.randint(6, 7)) for _ in range(2)] + [make(rng.randint(10, 30)) for _ in range(2)]
    a = rng.sample(range(1, 10**6), 4000)
    b = a[:]
    rng.shuffle(b)
    c = a[:1000] + a[2500:] + a[1000:2500]
    rng.shuffle(c)
    mid = a[1200:2700]
    rest = a[:1200] + a[2700:]
    rng.shuffle(rest)
    cases += [[a, b], [a, rest[:1000] + mid + rest[1000:]]]
    return cases


def g_scoreboard(rng, small):
    def make(n, names):
        ops, args = ["Scoreboard"], [[]]
        for _ in range(n):
            op = rng.choices(["assign", "remove", "maxScore", "getScore"], [5, 2, 3, 2])[0]
            ops.append(op)
            name = rng.choice(names)
            args.append([name, rng.randint(0, 20)] if op == "assign" else [name] if op in ("remove", "getScore") else [])
        return [ops, args]
    if small:
        return make(rng.randint(1, 12), ["a", "b", "c"])
    cases = [
        [["Scoreboard", "maxScore", "getScore", "remove"], [[], [], ["x"], ["x"]]],
        [["Scoreboard", "assign", "maxScore", "assign", "maxScore"], [[], ["z", 3], [], ["z", 1], []]],
        [["Scoreboard", "assign", "assign", "assign", "maxScore"], [[], ["bob", 7], ["al", 7], ["ann", 7], []]],
        [["Scoreboard", "assign", "remove", "maxScore", "assign", "getScore"], [[], ["a", 1], ["a"], [], ["a", 2], ["a"]]],
        [["Scoreboard", "assign", "assign", "assign", "maxScore", "assign", "maxScore"], [[], ["a", 5], ["b", 9], ["c", 1], [], ["b", 0], []]],
    ]
    cases += [make(rng.randint(10, 30), ["al", "bo", "cy", "di", "ed"]) for _ in range(4)]
    names = ["p%d" % i for i in range(300)]
    cases += [make(3000, names), make(3000, names[:20])]
    return cases


def g_klargest(rng, small):
    def make(n, lo=-1000, hi=1000):
        vals = [rng.randint(lo, hi) for _ in range(n)]
        # Build a valid max-heap by sifting down from the middle.
        for start in range(n // 2 - 1, -1, -1):
            i = start
            while True:
                l, r, big = 2 * i + 1, 2 * i + 2, i
                if l < n and vals[l] > vals[big]:
                    big = l
                if r < n and vals[r] > vals[big]:
                    big = r
                if big == i:
                    break
                vals[i], vals[big] = vals[big], vals[i]
                i = big
        return [vals, rng.randint(0, n)]
    if small:
        return make(rng.randint(1, 9), -5, 5)
    cases = [[[5], 1], [[5], 0], [[9, 4, 8], 3], [[9, 4, 8], 2], [[3, 3, 3, 3], 2], [[10, 9, 2, 8, 7, 1, 1], 4], [[0, -1, -2], 2]]
    cases += [make(rng.randint(10, 60)) for _ in range(3)]
    big = make(5000, -10**6, 10**6)
    big[1] = 200
    big2 = make(3000, 0, 50)
    big2[1] = 150
    cases += [big, big2]
    return cases


def g_subarrays(rng, small):
    def make(n, lo, hi):
        nums = [rng.randint(lo, hi) for _ in range(n)]
        k = sum(nums[rng.randrange(n):][:rng.randint(1, n)]) if n and rng.random() < 0.7 else rng.randint(lo, hi)
        return [nums, k]
    if small:
        return make(rng.randint(1, 9), -3, 3)
    cases = [[[5], 5], [[5], 1], [[0, 0, 0], 0], [[1, 1, 1], 2], [[-1, -1, 1], 0], [[3, 4, 7, 2, -3, 1, 4, 2], 7], [[1, -1, 0], 0]]
    cases += [make(rng.randint(10, 40), -5, 5) for _ in range(3)]
    cases += [make(4000, -1000, 1000), [[0] * 1500 + [rng.randint(-1, 1) for _ in range(1500)], 0]]
    return cases


def g_halves(rng, small):
    def make(n, age_hi, skill_hi):
        return [[rng.randint(18, age_hi) for _ in range(n)], [rng.randint(0, skill_hi) for _ in range(n)]]
    if small:
        return make(rng.randint(1, 8), 25, 10)
    cases = [[[30], [7]], [[30, 30], [1, 9]], [[40, 30, 20], [1, 2, 3]], [[20, 30, 40, 50], [5, 5, 5, 5]],
             [[25, 25, 25, 25, 25], [1, 2, 3, 4, 5]], [[50, 40, 30, 20, 10], [0, 10, 0, 10, 0]]]
    cases += [make(rng.randint(10, 40), 30, 50) for _ in range(4)]
    cases += [make(3000, 65, 10**4), make(3000, 22, 10**4)]
    return cases


# ---------------------------------------------------------------- sessions 11-15

# Trees travel as level-order lists with None for a missing child (see harness.py).
_H = {"__name__": "harness"}
exec(compile(open(os.path.join(HERE, "..", "harness.py"), encoding="utf-8").read(), "harness.py", "exec"), _H)
build_tree = _H["_build_tree"]
TREE_ARGS = {"bst-dead-ends": [0], "complete-tree-count": [0]}


class _Node:
    def __init__(self, val):
        self.val, self.left, self.right = val, None, None


def serialize(root):
    out, q, h = [], [root] if root else [], 0
    while h < len(q):
        node = q[h]
        h += 1
        if node is None:
            out.append(None)
            continue
        out.append(node.val)
        q.extend([node.left, node.right])
    while out and out[-1] is None:
        out.pop()
    return out


def bst_insert(root, x):
    if root is None:
        return _Node(x)
    cur = root
    while True:
        if x < cur.val:
            if cur.left is None:
                cur.left = _Node(x)
                return root
            cur = cur.left
        else:
            if cur.right is None:
                cur.right = _Node(x)
                return root
            cur = cur.right


def b_dead_ends(root):
    # A leaf is fine if inserting some missing integer x >= 1 the normal way lands under it.
    vals, leaves, st = set(), [], [root] if root else []
    while st:
        nd = st.pop()
        vals.add(nd.val)
        if not nd.left and not nd.right:
            leaves.append(nd)
        st += [c for c in (nd.left, nd.right) if c]
    top = max(vals) + 2 if vals else 2
    for leaf in leaves:
        ok = False
        for x in range(1, top + 1):
            if x in vals:
                continue
            cur = root
            while True:
                nxt = cur.left if x < cur.val else cur.right
                if nxt is None:
                    break
                cur = nxt
            if cur is leaf:
                ok = True
                break
        if not ok:
            return False
    return True


def b_count(root):
    n, st = 0, [root] if root else []
    while st:
        nd = st.pop()
        n += 1
        st += [c for c in (nd.left, nd.right) if c]
    return n


def b_warmer(t):
    return [next((j - i for j in range(i + 1, len(t)) if t[j] > t[i]), 0) for i in range(len(t))]


def b_candies(r):
    c = [1] * len(r)
    changed = True
    while changed:
        changed = False
        for i in range(len(r)):
            for j in (i - 1, i + 1):
                if 0 <= j < len(r) and r[i] > r[j] and c[i] <= c[j]:
                    c[i] = c[j] + 1
                    changed = True
    return sum(c)


def b_kpal(s, k):
    n, best = len(s), 0
    for mask in range(1 << n):
        t = "".join(s[i] for i in range(n) if mask >> i & 1)
        if t == t[::-1]:
            best = max(best, len(t))
    return n - best <= k


def b_nextperm(nums):
    perms = sorted(set(itertools.permutations(nums)))
    i = perms.index(tuple(nums))
    return list(perms[(i + 1) % len(perms)])


ROOM = 2147483647


def b_exits(grid):
    rows, cols = len(grid), len(grid[0]) if grid else 0
    out = [row[:] for row in grid]
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != ROOM:
                continue
            seen, q = {(r, c)}, deque([(r, c, 0)])
            while q:
                a, b, d = q.popleft()
                if grid[a][b] == 0:
                    out[r][c] = d
                    break
                for x, y in ((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)):
                    if 0 <= x < rows and 0 <= y < cols and grid[x][y] != -1 and (x, y) not in seen:
                        seen.add((x, y))
                        q.append((x, y, d + 1))
    return out


def b_effort(h):
    rows, cols = len(h), len(h[0])
    diffs = sorted({abs(h[r][c] - h[x][y]) for r in range(rows) for c in range(cols) for x, y in ((r + 1, c), (r, c + 1)) if x < rows and y < cols} | {0})
    for lim in diffs:
        seen, st = {(0, 0)}, [(0, 0)]
        while st:
            r, c = st.pop()
            for x, y in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= x < rows and 0 <= y < cols and (x, y) not in seen and abs(h[x][y] - h[r][c]) <= lim:
                    seen.add((x, y))
                    st.append((x, y))
        if (rows - 1, cols - 1) in seen:
            return lim


def b_cooldown(tasks, n):
    left, ready, time = Counter(tasks), {}, 0
    while sum(left.values()):
        avail = [t for t in left if left[t] and ready.get(t, 0) <= time]
        if avail:
            t = max(avail, key=lambda x: left[x])
            left[t] -= 1
            ready[t] = time + n + 1
        time += 1
    return time


def b_heaters(houses, heaters):
    return max(min(abs(h - x) for x in heaters) for h in houses)


def g_dead_ends(rng, small):
    def make(n, hi):
        vals = rng.sample(range(1, hi + 1), n)
        root = None
        for v in vals:
            root = bst_insert(root, v)
        return [serialize(root)]
    if small:
        n = rng.randint(0, 7)
        return make(n, max(n, rng.randint(n, 12)))
    cases = [[[]], [[1]], [[2]], [[2, 1, 3]], [[3, 1, 4, None, 2]], [[10, 5, 20]], [[4, 2, 6, 1, 3, 5, 7]], [[5, 3, None, 2, 4]]]
    cases += [make(rng.randint(5, 30), rng.randint(30, 60)) for _ in range(3)]
    cases += [make(3000, 3300), make(3000, 10**9)]
    return cases


def g_complete(rng, small):
    def make(n):
        return [rng.sample(range(1, 10 * n + 10), n)]
    if small:
        return make(rng.randint(0, 20))
    cases = [[[]], [[7]], [[1, 2]], [[1, 2, 3]], [[1, 2, 3, 4]], [list(range(1, 16))], [list(range(1, 17))]]
    cases += [make(rng.randint(20, 200)) for _ in range(3)] + [make(5000), [{"$complete": 100000}]]
    return cases


def g_warmer(rng, small):
    def make(n, lo=-30, hi=45):
        return [[rng.randint(lo, hi) for _ in range(n)]]
    if small:
        return make(rng.randint(1, 10), 0, 5)
    cases = [[[20]], [[5, 5, 5]], [[1, 2, 3]], [[3, 2, 1]], [[10, 8, 9, 12]], [[-5, -10, -3, -3, 0]]]
    cases += [make(rng.randint(10, 60)) for _ in range(4)] + [make(5000), [sorted(make(3000)[0], reverse=True)]]
    return cases


def g_candies(rng, small):
    def make(n, hi=100):
        return [[rng.randint(0, hi) for _ in range(n)]]
    if small:
        return make(rng.randint(1, 9), 4)
    cases = [[[7]], [[1, 1, 1]], [[1, 2, 3]], [[3, 2, 1]], [[1, 3, 2, 2, 1]], [[2, 4, 4, 4, 1]], [[5, 1, 5, 1, 5]]]
    cases += [make(rng.randint(10, 60)) for _ in range(3)] + [make(5000, 20000), [list(range(3000, 0, -1))]]
    return cases


def g_kpal(rng, small):
    def make(n, alpha="abc", k=None):
        s = "".join(rng.choice(alpha) for _ in range(n))
        return [s, rng.randint(0, max(0, n // 2)) if k is None else k]
    if small:
        return make(rng.randint(0, 11), rng.choice(["ab", "abc", "abcd"]))
    cases = [["", 0], ["a", 0], ["ab", 0], ["ab", 1], ["racecar", 0], ["abca", 1], ["abcd", 2], ["abcd", 3], ["aaabbb", 3]]
    cases += [make(rng.randint(12, 40)) for _ in range(3)]
    half = "".join(rng.choice("abcde") for _ in range(90))
    noisy = list(half + half[::-1])
    for _ in range(12):
        noisy.insert(rng.randrange(len(noisy) + 1), rng.choice("xyz"))
    cases += [["".join(noisy), 12], ["".join(noisy), 11]]
    return cases


def g_nextperm(rng, small):
    def make(n, hi):
        return [[rng.randint(0, hi) for _ in range(n)]]
    if small:
        return make(rng.randint(1, 6), 3)
    cases = [[[1]], [[1, 2]], [[2, 1]], [[1, 1]], [[1, 2, 3]], [[3, 2, 1]], [[1, 3, 2]], [[2, 2, 0, 4, 3, 1]], [[1, 5, 1]]]
    cases += [make(rng.randint(5, 20), 9) for _ in range(3)] + [make(100, 100), [sorted(make(100, 5)[0], reverse=True)]]
    return cases


def g_exits(rng, small):
    def make(rows, cols, pw=0.2, pe=0.08):
        return [[[(-1 if (x := rng.random()) < pw else 0 if x < pw + pe else ROOM) for _ in range(cols)] for _ in range(rows)]]
    if small:
        return make(rng.randint(1, 5), rng.randint(1, 5))
    cases = [[[[0]]], [[[ROOM]]], [[[-1]]], [[[ROOM, 0, ROOM]]], [[[0], [ROOM], [ROOM]]], [[[ROOM, -1, 0], [ROOM, -1, ROOM], [ROOM, ROOM, ROOM]]],
             [[[ROOM, -1], [-1, 0]]]]
    cases += [make(rng.randint(3, 12), rng.randint(3, 12)) for _ in range(3)] + [make(60, 60), make(60, 60, 0.4, 0.01)]
    return cases


def g_effort(rng, small):
    def make(rows, cols, hi):
        return [[[rng.randint(1, hi) for _ in range(cols)] for _ in range(rows)]]
    if small:
        return make(rng.randint(1, 4), rng.randint(1, 4), 9)
    cases = [[[[5]]], [[[1, 10]]], [[[1], [3], [6]]], [[[1, 1, 1], [9, 9, 1], [1, 1, 1]]], [[[3, 8, 2], [4, 9, 1], [5, 6, 7]]]]
    # The only gentle paths here wind left or up, so a right/down-only DP gets them wrong.
    cases += [[[[1, 1, 1, 1, 1], [50, 50, 50, 50, 1], [1, 1, 1, 1, 1], [1, 50, 50, 50, 50], [1, 1, 1, 1, 1]]],
              [[[2, 60, 3, 3, 3], [2, 60, 3, 60, 3], [2, 60, 3, 60, 3], [2, 2, 2, 60, 4]]],
              [[[5, 5, 90, 1, 1, 1], [90, 5, 90, 1, 90, 1], [5, 5, 90, 1, 90, 1], [5, 90, 90, 1, 90, 1], [5, 5, 5, 3, 90, 2]]]]
    cases += [make(rng.randint(3, 10), rng.randint(3, 10), 50) for _ in range(4)] + [make(40, 40, 10**6), make(40, 40, 3)]
    return cases


def g_cooldown(rng, small):
    def make(n, letters, cool):
        return ["".join(rng.choice(letters) for _ in range(n)), cool]
    if small:
        return make(rng.randint(1, 9), "ABC", rng.randint(0, 3))
    cases = [["A", 0], ["A", 5], ["AAA", 0], ["AAA", 2], ["AB", 3], ["AAABBB", 2], ["AAABBBCCDD", 2], ["ABCDE", 1], ["AAAAB", 1]]
    cases += [make(rng.randint(10, 40), "ABCDEF", rng.randint(0, 6)) for _ in range(3)]
    cases += [make(10000, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", 100), make(10000, "AAAAAAB", 50)]
    return cases


def g_heaters(rng, small):
    def make(n, m, hi):
        return [[rng.randint(1, hi) for _ in range(n)], [rng.randint(1, hi) for _ in range(m)]]
    if small:
        return make(rng.randint(1, 6), rng.randint(1, 4), 20)
    cases = [[[5], [5]], [[1, 9], [5]], [[1, 2, 3], [2]], [[1, 5], [10]], [[4, 4, 4], [1, 7]], [[1, 1000000000], [1, 1000000000]]]
    cases += [make(rng.randint(5, 30), rng.randint(1, 10), 100) for _ in range(4)] + [make(5000, 300, 10**9), make(3000, 3000, 10**5)]
    return cases


# id: (python function name, brute force, generator, extra small cases to cross-check)
PROBLEMS = {
    "unpaired-number": ("find_unpaired", b_unpaired, g_unpaired),
    "unpaired-in-sorted": ("find_unpaired_sorted", b_unpaired, g_sorted),
    "backspace-keys": ("typed_text", b_typed, g_typed),
    "fewest-paren-removals": ("min_remove_to_valid", None, g_parens),
    "fence-coats": ("count_coated", b_coated, g_coated),
    "balloon-arrows": ("min_arrows", b_arrows, g_arrows),
    "window-maximum": ("window_max", b_window, g_window),
    "longest-ones-flips": ("longest_ones", b_ones, g_ones),
    "sorted-matrix-search": ("search_matrix", b_matrix, g_matrix),
    "tank-capacity": ("min_capacity", b_tank, g_tank),
    "paint-houses": ("min_paint_cost", b_paint, g_paint),
    "bounded-subsets": ("count_bounded_subsets", b_subsets, g_subsets),
    "graph-cycle": ("has_cycle", b_cycle, g_cycle),
    "course-semesters": ("min_semesters", b_semesters, g_semesters),
    "sudoku-check": ("is_valid_sudoku", b_sudoku, g_sudoku),
    "move-to-ends": ("min_moves", b_moves, g_moves),
    "scoreboard": ("Scoreboard", b_scoreboard, g_scoreboard),
    "heap-k-largest": ("k_largest", b_klargest, g_klargest),
    "subarray-sum-k": ("count_subarrays", b_subarrays, g_subarrays),
    "age-halves": ("skill_gaps", b_halves, g_halves),
    "bst-dead-ends": ("no_dead_ends", b_dead_ends, g_dead_ends),
    "complete-tree-count": ("count_nodes", b_count, g_complete),
    "warmer-days": ("days_until_warmer", b_warmer, g_warmer),
    "fair-candies": ("min_candies", b_candies, g_candies),
    "k-palindrome": ("can_make_palindrome", b_kpal, g_kpal),
    "next-permutation": ("next_permutation", b_nextperm, g_nextperm),
    "nearest-exit": ("fill_distances", b_exits, g_exits),
    "min-effort-path": ("min_effort", b_effort, g_effort),
    "cooldown-schedule": ("least_time", b_cooldown, g_cooldown),
    "heater-radius": ("min_radius", b_heaters, g_heaters),
}
EXTRA_SMALL = 300
# Full-size cases (seeded, generated by judge.js). Sizes are at the constraint limits and
# were timed so the reference solutions take well under a second while the naive approaches
# named in the statements take far longer than the 5-second limit.
FULL = {
    "fence-coats": [{"seed": 11, "n": 100000, "len": 10000000, "k": 2}, {"seed": 12, "n": 100000, "len": 1000, "k": 1}],
    "balloon-arrows": [{"seed": 21, "n": 100000, "len": 1000000}],
    "window-maximum": [{"seed": 31, "n": 200000, "k": 100000}],
    "longest-ones-flips": [{"seed": 41, "n": 200000, "p": 0.5, "k": 50000}],
    "tank-capacity": [{"seed": 51, "n": 30000, "k": 300}],
    "scoreboard": [{"seed": 61, "names": 30000, "ops": 100000}],
    "subarray-sum-k": [{"seed": 71, "n": 200000, "k": 7}],
    "age-halves": [{"seed": 81, "n": 100000}],
    "complete-tree-count": [{"seed": 91, "lo": 1000000000, "hi": 2000000000}],
    "warmer-days": [{"seed": 101, "n": 200000}],
    "fair-candies": [{"seed": 111, "n": 100000}],
    "k-palindrome": [{"seed": 121, "n": 200}],
    "nearest-exit": [{"seed": 131, "rows": 500, "cols": 500}],
    "min-effort-path": [{"seed": 141, "rows": 200, "cols": 200}],
    "heater-radius": [{"seed": 151, "n": 100000, "m": 100000}],
}
JUDGE = os.path.join(HERE, "..", "judge.js")


def full_args(pid, g):
    js = "const J=require(%s);process.stdout.write(JSON.stringify(J.generate(%s,%s)))" % (json.dumps(JUDGE), json.dumps(pid), json.dumps(g))
    return json.loads(subprocess.run(["node", "-e", js], check=True, capture_output=True).stdout)


def sha(value):
    return hashlib.sha256(json.dumps(value, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()
BRUTE_LIMITS = {  # cases bigger than this are checked against the reference only
    "fence-coats": lambda a: sum(b - x for x, b in a[0]) <= 20000,
    "balloon-arrows": lambda a: len(a[0]) <= 7,
    "window-maximum": lambda a: len(a[0]) <= 4000,
    "longest-ones-flips": lambda a: len(a[0]) <= 600,
    "tank-capacity": lambda a: sum(a[0]) - max(a[0]) <= 3000,
    "paint-houses": lambda a: len(a[0]) <= 8,
    "bounded-subsets": lambda a: (a[2] + 1) ** len(a[0]) <= 20000,
    "move-to-ends": lambda a: len(a[0]) <= 7,
    "subarray-sum-k": lambda a: len(a[0]) <= 300,
    "age-halves": lambda a: len(a[0]) <= 300,
    "fewest-paren-removals": lambda a: len(a[0]) <= 12,
    "bst-dead-ends": lambda a: len(a[0]) <= 400,
    "complete-tree-count": lambda a: isinstance(a[0], list) or a[0]["$complete"] <= 200000,
    "warmer-days": lambda a: len(a[0]) <= 5000,
    "fair-candies": lambda a: len(a[0]) <= 400,
    "k-palindrome": lambda a: len(a[0]) <= 12,
    "next-permutation": lambda a: len(a[0]) <= 7,
    "nearest-exit": lambda a: len(a[0]) * len(a[0][0]) <= 400,
    "min-effort-path": lambda a: len(a[0]) * len(a[0][0]) <= 1600,
    "cooldown-schedule": lambda a: len(a[0]) <= 10000,
    "heater-radius": lambda a: len(a[0]) * len(a[1]) <= 2 * 10**6,
}


def run_ops(cls, ops, args):
    obj, out = None, []
    for op, a in zip(ops, args):
        if op == "Scoreboard":
            obj = cls(*a)
            out.append(None)
        else:
            name = {"maxScore": "max_score", "getScore": "get_score"}.get(op, op)
            out.append(getattr(obj, name)(*a))
    return out


def tree_args(pid, args):
    args = json.loads(json.dumps(args))
    for i in TREE_ARGS.get(pid, []):
        args[i] = build_tree(args[i])
    return args


def solve(pid, ref, args):
    if pid == "scoreboard":
        return run_ops(ref, *args)
    return ref(*tree_args(pid, args))


def check(pid, brute, args, got):
    if pid == "fewest-paren-removals":
        s = args[0]
        ok = valid_parens(got) and is_subsequence(got, s)
        if ok and BRUTE_LIMITS[pid](args):
            ok = len(got) == b_paren_len(s)
        return ok
    if brute is None or (pid in BRUTE_LIMITS and not BRUTE_LIMITS[pid](args)):
        return True
    return brute(*tree_args(pid, args)) == got


def main():
    write = "--check" not in sys.argv
    problems = 0
    stale = []
    for pid, (name, brute, gen) in PROBLEMS.items():
        ref = load(pid, name)
        rng = random.Random(zlib.crc32(pid.encode()))
        cases = []
        for args in gen(rng, False):
            got = solve(pid, ref, args)
            if not check(pid, brute, args, got):
                sys.exit("%s: reference and brute force disagree on %s" % (pid, json.dumps(args)[:300]))
            cases.append({"args": args, "expected": got})
        for g in FULL.get(pid, []):
            cases.append({"gen": g, "sha": sha(solve(pid, ref, full_args(pid, g)))})
        for _ in range(EXTRA_SMALL):
            args = gen(rng, True)
            if not check(pid, brute, args, solve(pid, ref, args)):
                sys.exit("%s: reference and brute force disagree on small case %s" % (pid, json.dumps(args)))
        text = json.dumps({"id": pid, "cases": cases}, separators=(",", ":")) + "\n"
        path = os.path.join(OUT, pid + ".json")
        if write:
            with open(path, "w", encoding="utf-8") as f:
                f.write(text)
        else:
            old = open(path, encoding="utf-8").read() if os.path.exists(path) else ""
            if old != text:
                stale.append(pid)
        problems += 1
        print("%-24s %2d hidden tests (%d full-size), %d small cross-checks OK (%d KB)" % (pid, len(cases), len(FULL.get(pid, [])), EXTRA_SMALL, len(text) // 1024))
    if stale:
        sys.exit("Hidden tests out of date (run python3 _practice/tests/generate.py): " + ", ".join(stale))
    print("%s %d problems." % ("Wrote" if write else "Checked", problems))


if __name__ == "__main__":
    main()
