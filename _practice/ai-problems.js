// Runnable problems for the "AI coding rounds" on /practice/ (sessions.js builds the rounds
// from AI_ROUNDS below). Same format as problems.js, plus:
//   starters: the given code in Python and JavaScript (shown read-only in the problem and
//             pre-filled in the editor); otherLangs: "note" means other languages get a short
//             note instead of a starter (the given code and the assistant are Python/JavaScript).
//   given: true shows the given code in the problem card.
//   testStarters / mutantHints: the tests-first round (round 4).
//   env: the resilience round's fake service/clock/rand (see harness.py, runner-js.js).
// The scripted assistant's replies live in assistant.js. Check with: node _practice/tests/verify.js
(function () {
  const P = window.PRACTICE_PROBLEMS = window.PRACTICE_PROBLEMS || {};

  /* ---------------- Round 1: catch the AI's bug ---------------- */
  P["ai-ranks"] = {
    title: "Leaderboard ranks",
    fn: "rankScores", params: [["scores", "int[]"]], returns: "int[]", otherLangs: "note",
    starters: {
      python: "def rank_scores(scores: list[int]) -> list[int]:\n    # Your code here (or ask the assistant)\n    pass\n",
      javascript: "/**\n * @param {number[]} scores\n * @return {number[]}\n */\nfunction rankScores(scores) {\n    // Your code here (or ask the assistant)\n}\n"
    },
    statement: [
      "A game shows a leaderboard. `scores[i]` is player i's score; a higher score is better. Return each player's rank, in the same order as the input.",
      "Players with the same score share a rank, and the ranks after a tie skip ahead: a player's rank is 1 + the number of players with a strictly higher score. So scores 90, 80, 80, 70 get ranks 1, 2, 2, 4.",
      "Ask the assistant for a first version, then check it against the tests. Its first answer has a classic mistake."],
    input: ["`scores`: one score per player, in any order."],
    output: "A list of ranks, one per player, in input order.",
    constraints: ["0 ≤ scores.length ≤ 10⁵", "0 ≤ scores[i] ≤ 10⁹"],
    samples: [
      { args: [[50, 80, 70]], expected: [3, 1, 2] },
      { args: [[90, 90, 70]], expected: [1, 1, 3], why: "Two players tie for first, so the next player is third, not second." },
      { args: [[10]], expected: [1] }],
    clarify: [
      "Asks how ties are ranked, and confirms 1, 2, 2, 4 rather than 1, 2, 2, 3",
      "Asks whether the output keeps the input order",
      "Writes a tie example down before prompting, to check the AI's answer against"],
    look: [
      "Gives the assistant the tie rule and an example in the prompt",
      "Runs the samples, spots that the AI's version ranks ties 1, 2, 2, 3 (dense ranking), and explains why",
      "Fix: rank = 1 + number of strictly higher scores, via the first position of each score in a descending sort",
      "Doesn't accept code they can't explain"],
    testing: [
      "Empty list, one player, everyone tied, ties at the bottom, a tie followed by more players",
      "O(n log n) for the sort, O(n) space"],
    followup: "Return the leaderboard as (rank, player) pairs sorted by rank, then by player index."
  };

  /* ---------------- Round 2: extend existing code ---------------- */
  const INV_PY = `class Inventory:
    def __init__(self):
        self.stock = {}          # sku -> units on hand
        self.reservations = {}   # reservation id -> (sku, qty)
        self.next_id = 1

    def add(self, sku, qty):
        self.stock[sku] = self.stock.get(sku, 0) + qty

    def reserve(self, sku, qty):
        if self.available(sku) < qty:
            return -1
        rid = self.next_id
        self.next_id += 1
        self.reservations[rid] = (sku, qty)
        return rid

    def release(self, rid):
        self.reservations.pop(rid, None)

    def commit(self, rid):
        if rid not in self.reservations:
            return False
        sku, qty = self.reservations.pop(rid)
        self.stock[sku] -= qty
        return True

    def available(self, sku):
        held = sum(q for s, q in self.reservations.values() if s == sku)
        return self.stock.get(sku, 0) - held
`;
  const INV_JS = `class Inventory {
    constructor() {
        this.stock = new Map();          // sku -> units on hand
        this.reservations = new Map();   // reservation id -> [sku, qty]
        this.nextId = 1;
    }

    add(sku, qty) {
        this.stock.set(sku, (this.stock.get(sku) || 0) + qty);
    }

    reserve(sku, qty) {
        if (this.available(sku) < qty) return -1;
        const rid = this.nextId++;
        this.reservations.set(rid, [sku, qty]);
        return rid;
    }

    release(rid) {
        this.reservations.delete(rid);
    }

    commit(rid) {
        if (!this.reservations.has(rid)) return false;
        const [sku, qty] = this.reservations.get(rid);
        this.reservations.delete(rid);
        this.stock.set(sku, this.stock.get(sku) - qty);
        return true;
    }

    available(sku) {
        let held = 0;
        for (const [s, q] of this.reservations.values()) if (s === sku) held += q;
        return (this.stock.get(sku) || 0) - held;
    }
}
`;
  P["ai-inventory"] = {
    title: "Reservations that expire",
    cls: "Inventory", given: true, otherLangs: "note",
    methods: [
      { name: "add", params: [["sku", "string"], ["qty", "int"]], returns: "void" },
      { name: "reserve", params: [["sku", "string"], ["qty", "int"]], returns: "int" },
      { name: "release", params: [["rid", "int"]], returns: "void" },
      { name: "commit", params: [["rid", "int"]], returns: "bool" },
      { name: "available", params: [["sku", "string"]], returns: "int" }],
    starters: { python: INV_PY, javascript: INV_JS },
    statement: [
      "The given `Inventory` class holds stock per product (sku). `reserve(sku, qty)` holds units and returns a reservation id (1, 2, 3, … across all products), or −1 if not enough units are available. `release(rid)` drops a reservation, `commit(rid)` turns it into a sale (stock goes down; returns true, or false if the reservation doesn't exist) and `available(sku)` is stock minus active reservations (0 for an unknown sku).",
      "New feature: reservations expire. The constructor becomes `Inventory(clock=None, ttl=None)` (`clock` and `ttl` in JavaScript too), where `clock()` returns the current time in seconds. A reservation made at time t expires at t + ttl: from that moment it no longer holds stock, `commit` returns false for it, and `release` does nothing. With no clock or no ttl, nothing expires, exactly as today.",
      "Keep every existing behaviour working. In the tests, `{\"$clock\": t}` stands for a fake clock that starts at time t, and the step `$advance` moves it forward by the given seconds. Samples 1–6 are the existing tests; 7 and 8 show the new feature."],
    input: ["`ops` and `args`: the operations to run in order on one new Inventory."],
    output: "What each operation returns, in order (null for the constructor, add, release and $advance).",
    constraints: ["Up to 2000 operations per test", "1 ≤ qty ≤ 1000", "1 ≤ ttl ≤ 10⁶; the clock never goes backwards"],
    samples: [
      { args: [["Inventory", "add", "reserve", "available"], [[], ["apple", 5], ["apple", 3], ["apple"]]], expected: [null, null, 1, 2] },
      { args: [["Inventory", "add", "reserve", "reserve", "available"], [[], ["pen", 4], ["pen", 3], ["pen", 2], ["pen"]]], expected: [null, null, 1, -1, 1] },
      { args: [["Inventory", "add", "reserve", "release", "available"], [[], ["cup", 2], ["cup", 2], [1], ["cup"]]], expected: [null, null, 1, null, 2] },
      { args: [["Inventory", "add", "reserve", "commit", "available", "commit"], [[], ["hat", 3], ["hat", 2], [1], ["hat"], [1]]], expected: [null, null, 1, true, 1, false] },
      { args: [["Inventory", "available", "reserve"], [[], ["kite"], ["kite", 1]]], expected: [null, 0, -1] },
      { args: [["Inventory", "add", "add", "reserve", "reserve"], [[], ["a", 1], ["b", 1], ["a", 1], ["b", 1]]], expected: [null, null, null, 1, 2] },
      { args: [["Inventory", "add", "reserve", "$advance", "available", "$advance", "available"], [[{ "$clock": 0 }, 30], ["tea", 5], ["tea", 4], [29], ["tea"], [1], ["tea"]]], expected: [null, null, 1, null, 1, null, 5], why: "The reservation made at 0 expires at 30: at 29 it still holds 4 units; at 30 they're free again." },
      { args: [["Inventory", "add", "reserve", "$advance", "commit", "available"], [[{ "$clock": 100 }, 10], ["mug", 1], ["mug", 1], [10], [1], ["mug"]]], expected: [null, null, 1, null, false, 1], why: "An expired reservation can't be committed, and the stock is untouched." }],
    clarify: [
      "Reads the given code first and states what each method does today",
      "Asks whether expiry is checked lazily (on each call) or by a timer, and picks lazily",
      "Confirms the boundary: at exactly t + ttl the reservation has expired",
      "Plans to keep the no-clock behaviour identical"],
    look: [
      "Injects the clock instead of calling the system time, so tests are deterministic",
      "Stores each reservation's expiry time and treats expired ones as gone in every method (available, reserve, commit, release)",
      "Catches the AI's version, which only hides expired reservations in available() but still lets commit succeed",
      "Runs the existing tests after the change: no regressions"],
    testing: [
      "Expiry at exactly t + ttl, commit and release after expiry, several reservations with different times, no clock",
      "Each call is O(r) for r reservations with a lazy sweep; a heap of expiry times makes the sweep cheap"],
    followup: "Thousands of reservations: how do you avoid scanning them all on every call? (A min-heap keyed by expiry, popped lazily.)"
  };

  /* ---------------- Round 3: debug with AI ---------------- */
  const LOG_PY = `def summarize_log(lines):
    latencies = []
    errors = 0
    slowest = None
    slowest_ms = -1
    for line in lines:
        parts = line.strip().split(" ")
        if len(parts) != 5:
            continue
        stamp, method, path, status, latency = parts
        if len(status) != 3 or not status.isdigit():
            continue
        if not latency.endswith("ms") or not latency[:-2].isdigit():
            continue
        ms = int(latency[:-2])
        if int(status) > 500:
            errors += 1
        latencies.append(ms)
        if ms > slowest_ms:
            slowest_ms = ms
            slowest = path.split("?")[0]
    latencies.sort()
    median = latencies[len(latencies) // 2] if latencies else None
    return {"requests": len(latencies), "errors": errors, "median_ms": median, "slowest": slowest}
`;
  const LOG_JS = `function summarizeLog(lines) {
    const latencies = [];
    let errors = 0, slowest = null, slowestMs = -1;
    for (const line of lines) {
        const parts = line.trim().split(" ");
        if (parts.length !== 5) continue;
        const [stamp, method, path, status, latency] = parts;
        if (!/^\\d{3}$/.test(status)) continue;
        if (!/^\\d+ms$/.test(latency)) continue;
        const ms = parseInt(latency, 10);
        if (Number(status) > 500) errors++;
        latencies.push(ms);
        if (ms > slowestMs) {
            slowestMs = ms;
            slowest = path.split("?")[0];
        }
    }
    latencies.sort((a, b) => a - b);
    const median = latencies.length ? latencies[Math.floor(latencies.length / 2)] : null;
    return { requests: latencies.length, errors, median_ms: median, slowest };
}
`;
  P["ai-log-summary"] = {
    title: "Fix the log summary",
    fn: "summarizeLog", params: [["lines", "string[]"]], returns: "dict", given: true, otherLangs: "note",
    starters: { python: LOG_PY, javascript: LOG_JS },
    statement: [
      "The given `summarize_log` (`summarizeLog` in JavaScript) reads web server log lines and returns a summary. It has a few bugs. Find each root cause, fix it, and keep the rest working.",
      "Each line is `<timestamp> <method> <path> <status> <latency>`, with fields separated by one or more spaces or tabs, and extra whitespace at the ends ignored. The status is three digits and the latency looks like `120ms`. Skip blank lines and lines that don't fit this shape.",
      "Return `requests` (valid lines), `errors` (valid lines with status 500 or above), `median_ms` (the lower median of the latencies: sort them and take index (n − 1) / 2, rounded down; null when there are none) and `slowest` (the path of the slowest request, without any query string after `?`, the earliest one on ties; null when there are none).",
      "Some sample tests fail with the given code; the hidden tests check the rest."],
    input: ["`lines`: log lines (strings)."],
    output: "An object with requests, errors, median_ms and slowest (same key names in both languages).",
    constraints: ["0 ≤ lines.length ≤ 10⁴", "Latencies fit in a 32-bit integer"],
    samples: [
      { args: [["2026-11-15T10:00:00Z GET /home 200 120ms", "2026-11-15T10:00:01Z POST /login 500 340ms", "2026-11-15T10:00:02Z GET /home?ref=ad 200 95ms"]], expected: { requests: 3, errors: 1, median_ms: 120, slowest: "/login" } },
      { args: [["", "not a log line", "2026-11-15T10:05:00Z GET /about 404 10ms"]], expected: { requests: 1, errors: 0, median_ms: 10, slowest: "/about" } },
      { args: [["t1 GET /cart 200 30ms", "t2 GET /shop 200 10ms", "t3 GET /pay 503 50ms", "t4 GET /cart 200 20ms"]], expected: { requests: 4, errors: 1, median_ms: 20, slowest: "/pay" }, why: "Sorted latencies 10, 20, 30, 50: the lower median is 20." }],
    clarify: [
      "Runs the samples first and writes down which fail and how",
      "Reads the spec line by line against the code before asking the AI",
      "Asks about the median definition for an even count and about whitespace"],
    look: [
      "Root causes, not symptoms: status 500 isn't counted (> instead of >=); splitting on a single space breaks on tabs and double spaces; the median takes the upper middle for an even count",
      "Gives the assistant the failing input and the expected output, not just 'fix it'",
      "Fixes each bug minimally and re-runs the tests after each",
      "Can say which test exposed which bug"],
    testing: [
      "Status exactly 500, tabs and repeated spaces, an even number of requests, ties for slowest, no valid lines",
      "O(n log n) for the sort; a selection algorithm would make the median O(n)"],
    followup: "The log is 50 GB. How do you compute the median without holding every latency? (A histogram of latency buckets, or an approximate quantile sketch.)"
  };

  /* ---------------- Round 4: tests first ---------------- */
  P["ai-rate-limiter"] = {
    title: "Tests first: a rate limiter",
    fn: "allowRequests", params: [["times", "int[]"], ["limit", "int"], ["window", "int"]], returns: "bool[]", otherLangs: "note",
    starters: {
      python: "def allow_requests(times: list[int], limit: int, window: int) -> list[bool]:\n    # Implement after writing your tests (or ask the assistant)\n    pass\n",
      javascript: "/**\n * @param {number[]} times\n * @param {number} limit\n * @param {number} window\n * @return {boolean[]}\n */\nfunction allowRequests(times, limit, window) {\n    // Implement after writing your tests (or ask the assistant)\n}\n"
    },
    testStarters: {
      python: "# Write tests for allow_requests(times, limit, window) BEFORE asking the assistant.\n# Each test is a function whose name starts with test_ and uses assert.\n# \"Check my tests\" runs them against a correct version and several buggy ones.\n\ndef test_simple_limit():\n    assert allow_requests([1, 2, 3], 2, 10) == [True, True, False]\n",
      javascript: "// Write tests for allowRequests(times, limit, window) BEFORE asking the assistant.\n// Each test is a function whose name starts with \"test\" and uses\n// assertEqual(actual, expected) or assert(condition).\n// \"Check my tests\" runs them against a correct version and several buggy ones.\n\nfunction testSimpleLimit() {\n    assertEqual(allowRequests([1, 2, 3], 2, 10), [true, true, false]);\n}\n"
    },
    mutantHints: [
      "counts a request made exactly `window` seconds ago as still inside the window",
      "counts rejected requests too",
      "lets limit + 1 requests through",
      "uses fixed windows (0–9, 10–19, …) instead of a sliding window",
      "treats several requests at the same second as one"],
    statement: [
      "Requests arrive at the times in `times` (whole seconds, never decreasing; several can share a second). Decide for each one whether it's allowed: a request at time t is allowed if fewer than `limit` already-allowed requests happened in the last `window` seconds, meaning at times greater than t − window. Rejected requests don't count against later ones.",
      "First write tests for this spec, before asking the assistant anything. \"Check my tests\" runs your tests against a correct implementation (they must all pass) and against several buggy ones (a good test suite fails on each). Then implement the function, with the assistant's help if you like, and check it with Run and Submit."],
    input: ["`times`: request times, non-decreasing.", "`limit`: allowed requests per window.", "`window`: the window length in seconds."],
    output: "A list of true/false, one per request.",
    constraints: ["0 ≤ times.length ≤ 10⁵", "0 ≤ times[i] ≤ 10⁹", "1 ≤ limit ≤ 1000", "1 ≤ window ≤ 10⁶"],
    samples: [
      { args: [[1, 2, 3, 4], 2, 3], expected: [true, true, false, true], why: "At 3, the requests at 1 and 2 are inside (0, 3]; at 4, only the one at 2 is still inside (1, 4]." },
      { args: [[5, 5, 5], 2, 10], expected: [true, true, false] },
      { args: [[1, 11, 21], 1, 10], expected: [true, true, true], why: "A request exactly window seconds later is allowed." }],
    clarify: [
      "Pins down the window boundary (t − window is outside) with an example",
      "Asks whether rejected requests count, and what happens with equal timestamps",
      "Lists the tests to write before prompting the AI"],
    look: [
      "Tests written before the code: the boundary, same-second requests, rejected requests not counting, the exact limit, sliding (not fixed) windows",
      "Tests are small, named for the rule they check, with expected values worked out by hand",
      "Uses their tests to catch the AI's implementation, which counts rejected requests",
      "Implementation: a queue of allowed times, dropping those ≤ t − window"],
    testing: [
      "Their tests catch every buggy version; the implementation passes Run and Submit",
      "O(n) amortised time, O(limit) space for the queue"],
    followup: "Now the limiter is shared by 50 servers. What changes? (A central store with atomic updates, or approximate local limits.)"
  };

  /* ---------------- Round 5: refactor under constraints ---------------- */
  const SES_PY = `def count_sessions(events, gap):
    result = []
    users = []
    for e in events:
        if e[0] not in users:
            users.append(e[0])
    users.sort()
    for u in users:
        times = []
        for e in events:
            if e[0] == u:
                times.append(e[1])
        for i in range(len(times)):
            for j in range(len(times) - 1 - i):
                if times[j] > times[j + 1]:
                    tmp = times[j]
                    times[j] = times[j + 1]
                    times[j + 1] = tmp
        count = 0
        last = None
        for t in times:
            if last is None or t - last > gap:
                count = count + 1
            last = t
        result.append([u, count])
    return result
`;
  const SES_JS = `function countSessions(events, gap) {
    var result = [];
    var users = [];
    for (var i = 0; i < events.length; i++) {
        if (users.indexOf(events[i][0]) === -1) users.push(events[i][0]);
    }
    users.sort(function (a, b) { return a - b; });
    for (var k = 0; k < users.length; k++) {
        var u = users[k];
        var times = [];
        for (var i = 0; i < events.length; i++) {
            if (events[i][0] === u) times.push(events[i][1]);
        }
        for (var a = 0; a < times.length; a++) {
            for (var b = 0; b < times.length - 1 - a; b++) {
                if (times[b] > times[b + 1]) {
                    var tmp = times[b]; times[b] = times[b + 1]; times[b + 1] = tmp;
                }
            }
        }
        var count = 0;
        var last = null;
        for (var j = 0; j < times.length; j++) {
            if (last === null || times[j] - last > gap) count = count + 1;
            last = times[j];
        }
        result.push([u, count]);
    }
    return result;
}
`;
  P["ai-sessions"] = {
    speed: true,
    title: "Refactor: count visit sessions",
    fn: "countSessions", params: [["events", "int[][]"], ["gap", "int"]], returns: "int[][]", given: true, otherLangs: "note",
    starters: { python: SES_PY, javascript: SES_JS },
    statement: [
      "The given `count_sessions` (`countSessions` in JavaScript) is correct but slow and hard to read. `events` holds [user, time] pairs in any order. Sort each user's times; a new session starts at the first event and whenever the gap from the previous event is more than `gap` seconds. It returns [user, number of sessions] for each user, sorted by user.",
      "Refactor it so it's fast and readable, without changing what it returns. The hidden tests include full-size inputs where the current version runs out of time."],
    input: ["`events`: [user, time] pairs, in any order (pairs may repeat).", "`gap`: the longest pause, in seconds, that keeps a session going."],
    output: "[user, sessions] pairs sorted by user id.",
    constraints: ["0 ≤ events.length ≤ 2·10⁵", "0 ≤ user ≤ 10⁶", "0 ≤ time ≤ 10⁹", "0 ≤ gap ≤ 10⁹"],
    samples: [
      { args: [[[1, 10], [2, 5], [1, 40], [1, 100], [2, 6]], 30], expected: [[1, 2], [2, 1]], why: "User 1: 10 and 40 are exactly 30 apart (same session), 100 starts a new one." },
      { args: [[[7, 0]], 5], expected: [[7, 1]] },
      { args: [[], 10], expected: [] }],
    clarify: [
      "Runs the existing tests first so they protect the refactor",
      "Names the slow parts: list membership, a scan of all events per user, bubble sort",
      "Confirms the boundary (a gap of exactly `gap` keeps the session) stays the same"],
    look: [
      "Groups events by user in one pass with a dictionary, sorts each user's times once",
      "Counts sessions in one pass over sorted times; clear names, no dead code",
      "Checks the AI's refactor, which changes > to >= and splits sessions at exactly `gap`",
      "States the new complexity: O(n log n)"],
    testing: [
      "A gap of exactly `gap`, repeated events, one user, many users, empty input",
      "O(n log n) time, O(n) space"],
    followup: "Events arrive as a stream, roughly in time order. How do you count sessions without storing them all? (Keep each user's last time; a session ends when the gap passes.)"
  };

  /* ---------------- Round 6: make it resilient ---------------- */
  P["ai-retry"] = {
    title: "Make it resilient: retries",
    fn: "callWithRetry", params: [["service", "service"], ["clock", "clock"], ["rand", "rand"], ["policy", "dict"]], returns: "dict",
    env: true, compare: "approx", given: true, otherLangs: "note",
    starters: {
      python: "# service.call() makes one attempt: it returns the result, or raises ServiceError\n#   with .kind (\"timeout\", \"unavailable\", \"bad_request\", ...) and .retryable (True/False).\n# clock.now() is the current time in seconds; clock.sleep(seconds) waits.\n# rand() returns a random number in [0, 1).\n# policy: {\"attempts\": ..., \"base\": ..., \"cap\": ..., \"timeout\": ...}\n\ndef call_with_retry(service, clock, rand, policy):\n    # Today: one attempt, no retries.\n    return service.call()\n",
      javascript: "// service.call() makes one attempt: it returns the result, or throws a ServiceError\n//   with .kind (\"timeout\", \"unavailable\", \"bad_request\", ...) and .retryable (true/false).\n// clock.now() is the current time in seconds; clock.sleep(seconds) waits.\n// rand() returns a random number in [0, 1).\n// policy: { attempts, base, cap, timeout }\n\nfunction callWithRetry(service, clock, rand, policy) {\n    // Today: one attempt, no retries.\n    return service.call();\n}\n"
    },
    statement: [
      "The given function calls a flaky service once. Make it resilient. Call `service.call()`; return its result on success. When it fails with a `ServiceError`:",
      "1. If the error isn't retryable (`retryable` is false), raise or throw it at once. 2. If you've used `policy.attempts` attempts, raise or throw the last error. 3. Otherwise the delay before attempt k + 1 (k = attempts so far) is `rand() × min(cap, base × 2^(k − 1))`: exponential backoff with full jitter, capped. Call `rand()` exactly once per retry, here. 4. If `clock.now()` + delay would reach the overall deadline (the time of the first call + `policy.timeout`), give up and raise or throw the last error without sleeping. 5. Otherwise `clock.sleep(delay)` and try again.",
      "The tests use a fake service, clock and rand, so they're deterministic: each test lists the service's outcomes as [kind, seconds the attempt takes, value] (the last one repeats) and the values rand returns. They check the result or error, the number of attempts and every delay you slept."],
    input: ["`service`, `clock`, `rand`: provided by the test (see the given code's comments).", "`policy`: attempts (≥ 1), base and cap (seconds), timeout (seconds)."],
    output: "Your function's result (or the error kind you raised), the number of attempts and the list of delays slept.",
    constraints: ["1 ≤ attempts ≤ 10", "0 < base ≤ cap ≤ 60", "0 < timeout ≤ 1000", "Retryable kinds: timeout, unavailable"],
    samples: [
      { args: [{ outcomes: [["timeout", 1], ["ok", 0.2, "data"]], rand: [0.5] }, { attempts: 3, base: 1, cap: 8, timeout: 30 }], expected: { result: "data", error: null, attempts: 2, sleeps: [0.5] }, why: "One timeout, then a delay of 0.5 × min(8, 1) = 0.5 s, then success." },
      { args: [{ outcomes: [["bad_request", 0.1]], rand: [0.5] }, { attempts: 3, base: 1, cap: 8, timeout: 30 }], expected: { result: null, error: "bad_request", attempts: 1, sleeps: [] }, why: "Not retryable: give up at once." },
      { args: [{ outcomes: [["unavailable", 0.5]], rand: [1, 1] }, { attempts: 3, base: 1, cap: 1.5, timeout: 60 }], expected: { result: null, error: "unavailable", attempts: 3, sleeps: [1, 1.5] }, why: "Delays 1 × min(1.5, 1) = 1 and 1 × min(1.5, 2) = 1.5 (capped); the third failure uses the last attempt." }],
    clarify: [
      "Asks which errors are retryable and what happens at the attempt limit",
      "Pins down the backoff formula, the cap and when rand() is called",
      "Asks how the overall timeout is measured (from the first call)"],
    look: [
      "Injected clock and randomness, so behaviour is testable and deterministic",
      "No retries on non-retryable errors; re-raises the original error, not a new one",
      "Capped exponential backoff with full jitter; respects the overall deadline before sleeping",
      "Catches the AI's version, which retries every error and ignores the deadline"],
    testing: [
      "Non-retryable first, success on the last attempt, the cap reached, the deadline hit before the attempts run out",
      "Says why jitter matters (avoids synchronized retry storms)"],
    followup: "Many clients retry at once after an outage. What else protects the service? (A retry budget or circuit breaker, and honouring Retry-After.)"
  };

  // The rounds, in order: [problem id, tag, blurb, block plan]. sessions.js turns them into sessions.
  window.AI_ROUNDS = [
    ["ai-ranks", "Catch the AI's bug", "Leaderboard ranks with ties. The assistant's first answer looks right and isn't: find out why with the tests."],
    ["ai-inventory", "Extend existing code", "Add expiring reservations to a small inventory class, with an injected clock, without breaking its existing tests."],
    ["ai-log-summary", "Debug with AI", "A log summary function with a few subtle bugs. Find the root causes, not just the symptoms."],
    ["ai-rate-limiter", "Tests first", "Write tests for a rate limiter before asking the AI, see how many buggy versions they catch, then implement it."],
    ["ai-sessions", "Refactor under constraints", "Make slow, messy but correct code fast and readable, without changing what it returns."],
    ["ai-retry", "Make it resilient", "Wrap a flaky service with retries: backoff with jitter and a cap, attempt limit, overall deadline."]
  ];
})();
