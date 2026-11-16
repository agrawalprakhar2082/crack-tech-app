// The offline (scripted) assistant for the AI coding rounds on /practice/. It's used when
// the live assistant (a small model behind AI_ENDPOINT in practice.js) is off, unreachable
// or busy. Replies are deterministic: they depend only on the round, the language and the
// candidate's prompts so far. Like a real assistant, its first code answer for a round has
// the round's intended flaw; it corrects a flaw only when the candidate names it (the
// "fixes" keywords below), so being specific pays off.
// reply(roundId, prompt, history, lang) -> text, with code in ```python / ```javascript blocks.
// history: the earlier messages, oldest first, as { role: "user" | "assistant", text }. A fix
// counts only when it's named after the assistant has given code in this chat.
// verify.js checks that each round's first code answer fails the hidden tests and the fully
// corrected one passes.
(function (root) {
  const fence = (lang, code) => "```" + lang + "\n" + code.replace(/\n+$/, "") + "\n```";
  const has = (text, words) => words.some(w => text.includes(w));
  // Fix keywords match whole words or phrases only, so "tie" doesn't match "properties".
  const esc = w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hasWord = (text, words) => words.some(w => new RegExp("(?<![a-z0-9_])" + esc(w) + "(?![a-z0-9_])").test(text));

  /* ---------------- code variants per round ---------------- */
  const CODE = {
    "ai-round-1": {
      fixes: { tie: ["tie", "ties", "tied", "same score", "equal scores", "skip", "skips", "competition", "1, 2, 2, 4", "1,2,2,4", "dense"] },
      code(lang, f) {
        if (lang === "python") return f.tie
          ? "def rank_scores(scores):\n    # rank = 1 + number of strictly higher scores: the first position of each\n    # score in a descending sort, so ties share a rank and the next rank skips.\n    first = {}\n    for i, s in enumerate(sorted(scores, reverse=True)):\n        first.setdefault(s, i + 1)\n    return [first[s] for s in scores]\n"
          : "def rank_scores(scores):\n    distinct = sorted(set(scores), reverse=True)\n    rank = {s: i + 1 for i, s in enumerate(distinct)}\n    return [rank[s] for s in scores]\n";
        return f.tie
          ? "function rankScores(scores) {\n    // rank = 1 + number of strictly higher scores: the first position of each\n    // score in a descending sort, so ties share a rank and the next rank skips.\n    const first = new Map();\n    [...scores].sort((a, b) => b - a).forEach((s, i) => { if (!first.has(s)) first.set(s, i + 1); });\n    return scores.map(s => first.get(s));\n}\n"
          : "function rankScores(scores) {\n    const distinct = [...new Set(scores)].sort((a, b) => b - a);\n    const rank = new Map(distinct.map((s, i) => [s, i + 1]));\n    return scores.map(s => rank.get(s));\n}\n";
      },
      intro: f => f.tie
        ? "You're right: my version gave dense ranks (1, 2, 2, 3). With competition ranking, the rank after a tie skips ahead. Here's the corrected version:"
        : "Here's a version that sorts the distinct scores and maps each score to its position:",
      explain: "Sort the scores from high to low. Each player's rank depends only on how many players scored strictly higher, so equal scores share a rank. Build a map from score to rank once, then look up each player in input order: O(n log n) for the sort.",
      tests: { python: "assert rank_scores([50, 80, 70]) == [3, 1, 2]\nassert rank_scores([10]) == [1]\nassert rank_scores([]) == []\n", javascript: "console.log(JSON.stringify(rankScores([50, 80, 70]))); // [3,1,2]\nconsole.log(JSON.stringify(rankScores([10])));         // [1]\n" },
      review: "Check how ties are ranked: with scores 90, 80, 80, 70, should the last player be 3rd or 4th? Run a tie case and compare with the spec.",
      complexity: "Sorting is O(n log n); building the map and the lookups are O(n). Extra space is O(n)."
    },
    "ai-round-2": {
      fixes: { commit: ["expired reservation", "expired reservations", "still commit", "still succeed", "every method", "all methods", "everywhere", "sweep", "purge"] },
      code(lang, f) {
        if (lang === "python") return "class Inventory:\n    def __init__(self, clock=None, ttl=None):\n        self.stock = {}\n        self.reservations = {}   # id -> (sku, qty, expires_at or None)\n        self.next_id = 1\n        self.clock, self.ttl = clock, ttl\n\n    def _expires_at(self):\n        if self.clock is None or self.ttl is None:\n            return None\n        return self.clock() + self.ttl\n\n    def _active(self, rid):\n        exp = self.reservations[rid][2]\n        return exp is None or self.clock() < exp\n" +
          (f.commit ? "\n    def _sweep(self):\n        for rid in [r for r in self.reservations if not self._active(r)]:\n            del self.reservations[rid]\n" : "") +
          "\n    def add(self, sku, qty):\n        self.stock[sku] = self.stock.get(sku, 0) + qty\n\n    def reserve(self, sku, qty):\n        if self.available(sku) < qty:\n            return -1\n        rid = self.next_id\n        self.next_id += 1\n        self.reservations[rid] = (sku, qty, self._expires_at())\n        return rid\n\n    def release(self, rid):\n" +
          (f.commit ? "        self._sweep()\n" : "") + "        self.reservations.pop(rid, None)\n\n    def commit(self, rid):\n" + (f.commit ? "        self._sweep()\n" : "") +
          "        if rid not in self.reservations:\n            return False\n        sku, qty, _ = self.reservations.pop(rid)\n        self.stock[sku] -= qty\n        return True\n\n    def available(self, sku):\n" +
          (f.commit ? "        self._sweep()\n        held = sum(q for s, q, _ in self.reservations.values() if s == sku)\n" : "        held = sum(q for r, (s, q, _) in self.reservations.items() if s == sku and self._active(r))\n") +
          "        return self.stock.get(sku, 0) - held\n";
        return "class Inventory {\n    constructor(clock = null, ttl = null) {\n        this.stock = new Map();\n        this.reservations = new Map();   // id -> [sku, qty, expiresAt]\n        this.nextId = 1;\n        this.clock = clock; this.ttl = ttl;\n    }\n\n    expiresAt() {\n        return this.clock == null || this.ttl == null ? null : this.clock() + this.ttl;\n    }\n\n    active(rid) {\n        const exp = this.reservations.get(rid)[2];\n        return exp === null || this.clock() < exp;\n    }\n" +
          (f.commit ? "\n    sweep() {\n        for (const rid of [...this.reservations.keys()]) if (!this.active(rid)) this.reservations.delete(rid);\n    }\n" : "") +
          "\n    add(sku, qty) {\n        this.stock.set(sku, (this.stock.get(sku) || 0) + qty);\n    }\n\n    reserve(sku, qty) {\n        if (this.available(sku) < qty) return -1;\n        const rid = this.nextId++;\n        this.reservations.set(rid, [sku, qty, this.expiresAt()]);\n        return rid;\n    }\n\n    release(rid) {\n" +
          (f.commit ? "        this.sweep();\n" : "") + "        this.reservations.delete(rid);\n    }\n\n    commit(rid) {\n" + (f.commit ? "        this.sweep();\n" : "") +
          "        if (!this.reservations.has(rid)) return false;\n        const [sku, qty] = this.reservations.get(rid);\n        this.reservations.delete(rid);\n        this.stock.set(sku, this.stock.get(sku) - qty);\n        return true;\n    }\n\n    available(sku) {\n" +
          (f.commit ? "        this.sweep();\n        let held = 0;\n        for (const [s, q] of this.reservations.values()) if (s === sku) held += q;\n" : "        let held = 0;\n        for (const [rid, [s, q]] of this.reservations) if (s === sku && this.active(rid)) held += q;\n") +
          "        return (this.stock.get(sku) || 0) - held;\n    }\n}\n";
      },
      intro: f => f.commit
        ? "Good catch: I only ignored expired reservations when counting stock, so commit and release still treated them as live. This version drops expired reservations at the start of every method:"
        : "Here's the class with an injected clock and a ttl. Each reservation stores when it expires, and expired ones no longer count towards held stock:",
      explain: "Store an expiry time with each reservation (clock() + ttl, or none when there's no clock or ttl). Treat a reservation as gone once clock() reaches its expiry. Doing that lazily, at the start of each call, avoids timers and keeps the tests deterministic.",
      tests: { python: "# Existing behaviour still works without a clock:\ninv = Inventory()\ninv.add(\"tea\", 2)\nassert inv.reserve(\"tea\", 2) == 1\nassert inv.available(\"tea\") == 0\n", javascript: "// Existing behaviour still works without a clock:\nconst inv = new Inventory();\ninv.add(\"tea\", 2);\nconsole.log(inv.reserve(\"tea\", 2), inv.available(\"tea\")); // 1 0\n" },
      review: "Check every method, not just available(): what should commit and release do with a reservation that has expired? And is a reservation expired at exactly t + ttl?",
      complexity: "Each call sweeps the reservations: O(r). A min-heap of expiry times would make the sweep O(log r) per expired reservation."
    },
    "ai-round-3": {
      fixes: { ws: ["whitespace", "white space", "double space", "double spaces", "two spaces", "multiple spaces", "repeated spaces", "extra spaces", "single space"], median: ["lower median", "upper middle", "even count", "even number", "even length", "wrong median", "median is wrong"] },
      code(lang, f) {
        let c = root.PRACTICE_PROBLEMS && root.PRACTICE_PROBLEMS["ai-log-summary"] ? root.PRACTICE_PROBLEMS["ai-log-summary"].starters[lang] : "";
        if (lang === "python") {
          c = c.replace("if int(status) > 500:", "if int(status) >= 500:");
          if (f.ws) c = c.replace('parts = line.strip().split(" ")', "parts = line.split()  # any run of spaces or tabs");
          if (f.median) c = c.replace("latencies[len(latencies) // 2]", "latencies[(len(latencies) - 1) // 2]");
        } else {
          c = c.replace("if (Number(status) > 500) errors++;", "if (Number(status) >= 500) errors++;");
          if (f.ws) c = c.replace('const parts = line.trim().split(" ");', "const parts = line.trim().split(/\\s+/); // any run of spaces or tabs");
          if (f.median) c = c.replace("latencies[Math.floor(latencies.length / 2)]", "latencies[Math.floor((latencies.length - 1) / 2)] /* lower median */");
        }
        return c;
      },
      intro: (f, named) => named.length
        ? `Agreed, ${named.map(n => ({ ws: "splitting on a single space breaks on tabs and repeated spaces", median: "for an even count the code took the upper middle, not the lower median" }[n])).join("; and ")}. Updated version (with the status ≥ 500 fix too):`
        : "I see one bug: status 500 itself wasn't counted as an error (> instead of >=). Here's the fix. If other tests still fail, tell me the input and the output you expected.",
      explain: "The function splits each line into five fields, skips lines that don't fit, counts errors (status ≥ 500), collects latencies, tracks the slowest path without its query string, then sorts the latencies to take the median.",
      tests: { python: "print(summarize_log([\"t GET /a 500 10ms\"]))  # errors should be 1\n", javascript: "console.log(summarizeLog([\"t GET /a 500 10ms\"])); // errors should be 1\n" },
      review: "Compare each line of the code with the spec: how fields are separated, which statuses count as errors, and which element is the lower median for an even count.",
      complexity: "One pass over the lines plus a sort of the latencies: O(n log n)."
    },
    "ai-round-4": {
      fixes: { rejected: ["rejected requests", "rejected request", "rejections", "only allowed", "count allowed", "should not count", "shouldn't count", "don't count", "doesn't count"] },
      code(lang, f) {
        if (lang === "python") return "from collections import deque\n\n\ndef allow_requests(times, limit, window):\n    recent, out = deque(), []\n    for t in times:\n        while recent and recent[0] <= t - window:\n            recent.popleft()\n" +
          (f.rejected ? "        if len(recent) < limit:\n            recent.append(t)   # only allowed requests count\n            out.append(True)\n        else:\n            out.append(False)\n" : "        out.append(len(recent) < limit)\n        recent.append(t)\n") + "    return out\n";
        return "function allowRequests(times, limit, window) {\n    const recent = [], out = [];\n    let head = 0;\n    for (const t of times) {\n        while (head < recent.length && recent[head] <= t - window) head++;\n" +
          (f.rejected ? "        if (recent.length - head < limit) { recent.push(t); out.push(true); } // only allowed requests count\n        else out.push(false);\n" : "        out.push(recent.length - head < limit);\n        recent.push(t);\n") + "    }\n    return out;\n}\n";
      },
      intro: f => f.rejected
        ? "You're right: rejected requests shouldn't take up room in the window. Corrected:"
        : "Here's a sliding-window version with a queue of recent request times:",
      explain: "Keep a queue of the times inside the window. For each request, drop times at or before t − window, then allow the request if the queue holds fewer than limit entries.",
      tests: { python: "def test_two_allowed():\n    assert allow_requests([1, 2], 2, 10) == [True, True]\n\ndef test_third_rejected():\n    assert allow_requests([1, 2, 3], 2, 10) == [True, True, False]\n", javascript: "function testTwoAllowed() { assertEqual(allowRequests([1, 2], 2, 10), [true, true]); }\nfunction testThirdRejected() { assertEqual(allowRequests([1, 2, 3], 2, 10), [true, true, false]); }\n" },
      review: "Walk through 1, 2, 3, 4 with limit 2 and window 3 by hand: is the request at 4 allowed? Check what your queue holds after a rejection.",
      complexity: "Each time enters and leaves the queue at most once: O(n) time, O(limit + rejected) space in my version."
    },
    "ai-round-5": {
      fixes: { gap: ["boundary", "exactly", "off by one", "off-by-one", ">=", "equal to"] },
      code(lang, f) {
        if (lang === "python") return "from collections import defaultdict\n\n\ndef count_sessions(events, gap):\n    by_user = defaultdict(list)\n    for user, t in events:\n        by_user[user].append(t)\n    result = []\n    for user in sorted(by_user):\n        times = sorted(by_user[user])\n        sessions = 1 + sum(1 for a, b in zip(times, times[1:]) if b - a " + (f.gap ? ">" : ">=") + " gap)\n        result.append([user, sessions])\n    return result\n";
        return "function countSessions(events, gap) {\n    const byUser = new Map();\n    for (const [user, t] of events) {\n        if (!byUser.has(user)) byUser.set(user, []);\n        byUser.get(user).push(t);\n    }\n    return [...byUser.keys()].sort((a, b) => a - b).map(user => {\n        const times = byUser.get(user).sort((a, b) => a - b);\n        let sessions = 1;\n        for (let i = 1; i < times.length; i++) if (times[i] - times[i - 1] " + (f.gap ? ">" : ">=") + " gap) sessions++;\n        return [user, sessions];\n    });\n}\n";
      },
      intro: f => f.gap
        ? "Right, I changed the boundary: a pause of exactly gap seconds keeps the session going in the original. Fixed (> instead of >=):"
        : "Here's a cleaner version: group by user with a dictionary, sort each user's times once, and count the gaps:",
      explain: "Group events by user in one pass, sort each user's times, then a new session starts wherever the pause between consecutive times is too long. That replaces the list scans and the bubble sort.",
      tests: { python: "print(count_sessions([[1, 0], [1, 5]], 10))  # [[1, 1]]\n", javascript: "console.log(JSON.stringify(countSessions([[1, 0], [1, 5]], 10))); // [[1,1]]\n" },
      review: "Run the existing tests against the refactor first. Then check the boundary: in the original, does a pause of exactly gap seconds start a new session?",
      complexity: "Grouping is O(n), sorting all users' times is O(n log n) in total, counting is O(n)."
    },
    "ai-round-6": {
      fixes: { retryable: ["non-retryable", "not retryable", "permanent", "4xx", "don't retry", "shouldn't retry", "should not retry", "never retry"], deadline: ["deadline", "overall", "budget", "time limit", "past the timeout"] },
      code(lang, f) {
        if (lang === "python") return "def call_with_retry(service, clock, rand, policy):\n" + (f.deadline ? "    start = clock.now()\n" : "") +
          "    for attempt in range(1, policy[\"attempts\"] + 1):\n        try:\n            return service.call()\n        except ServiceError as e:\n" +
          (f.retryable ? "            if not e.retryable or attempt == policy[\"attempts\"]:\n                raise\n" : "            if attempt == policy[\"attempts\"]:\n                raise\n") +
          "            delay = rand() * min(policy[\"cap\"], policy[\"base\"] * 2 ** (attempt - 1))\n" +
          (f.deadline ? "            if clock.now() + delay >= start + policy[\"timeout\"]:\n                raise\n" : "") + "            clock.sleep(delay)\n";
        return "function callWithRetry(service, clock, rand, policy) {\n" + (f.deadline ? "    const start = clock.now();\n" : "") +
          "    for (let attempt = 1; attempt <= policy.attempts; attempt++) {\n        try {\n            return service.call();\n        } catch (e) {\n" +
          (f.retryable ? "            if (!e.retryable || attempt === policy.attempts) throw e;\n" : "            if (attempt === policy.attempts) throw e;\n") +
          "            const delay = rand() * Math.min(policy.cap, policy.base * 2 ** (attempt - 1));\n" +
          (f.deadline ? "            if (clock.now() + delay >= start + policy.timeout) throw e;\n" : "") + "            clock.sleep(delay);\n        }\n    }\n}\n";
      },
      intro: (f, named) => named.length
        ? `Good point: ${named.map(n => ({ retryable: "errors that aren't retryable should be raised at once, not retried", deadline: "the overall timeout must stop retries before sleeping past the deadline" }[n])).join("; and ")}. Updated:`
        : "Here's a retry loop with exponential backoff and full jitter, capped:",
      explain: "Try the call; on failure wait rand() × min(cap, base × 2^(attempt − 1)) and try again, up to the attempt limit. Full jitter spreads retries out so many clients don't retry at the same moment.",
      tests: { python: "# A quick manual check with the fake objects isn't possible here; run the samples.\n", javascript: "// Run the samples to see the result, attempts and delays.\n" },
      review: "Check which errors you retry (is a bad request ever going to succeed on retry?) and what happens when the next delay would pass the overall timeout.",
      complexity: "At most `attempts` calls and sleeps; constant extra space."
    }
  };

  const HELP = "I can help with this round's code. Ask me for code for a specific function, for test cases, to explain an approach, or to review what's in your editor. Tell me the input that fails and the output you expected, and I'll take another look.";
  const OFF_TOPIC = "I'm here to help with this round's code only. Ask about the function, its tests or its complexity.";

  function reply(roundId, prompt, history, lang) {
    const R = CODE[roundId];
    const note = lang === "python" || lang === "javascript" ? "" : "(I write Python and JavaScript in these rounds; here it is in Python.)\n\n";
    const L = lang === "javascript" ? "javascript" : "python";
    if (!R) return HELP;
    const text = String(prompt || "").toLowerCase().trim();
    if (!text) return HELP;
    // Fixes the candidate has named since the assistant first gave code (this prompt or earlier ones).
    let codeSeen = false;
    const after = [];
    for (const m of history || []) {
      if (!m || typeof m !== "object") continue;
      if (m.role === "assistant") { if (/```/.test(String(m.text))) codeSeen = true; }
      else if (codeSeen) after.push(String(m.text).toLowerCase());
    }
    const f = {}, named = [];
    if (codeSeen) {
      after.push(text);
      for (const [k, words] of Object.entries(R.fixes)) {
        if (after.some(t => hasWord(t, words))) f[k] = true;
        if (hasWord(text, words)) named.push(k);
      }
    }
    const codeReply = intro => note + intro + "\n\n" + fence(L, R.code(L, f));
    if (named.length) return codeReply(R.intro(f, named));
    if (has(text, ["weather", "joke", "poem", "recipe", "news", "who are you", "your name", "password", "hidden test", "hidden tests", "answer key"])) return OFF_TOPIC;
    if (has(text, ["complexity", "big o", "big-o", "how fast", "runtime", "time and space"])) return R.complexity;
    if (has(text, ["test", "assert", "edge case", "check it"])) return note + "Some tests to start with:\n\n" + fence(L, R.tests[L]) + "\n\nThey don't cover everything: add the edge cases from the spec.";
    if (has(text, ["review", "look at my", "what's wrong", "whats wrong", "what is wrong", "why does", "why is", "fails", "failing", "bug", "wrong"])) return R.review;
    if (has(text, ["explain", "how does", "how do", "approach", "idea", "walk me", "why"])) return R.explain;
    if (roundId !== "ai-round-3" && has(text, ["fix", "correct it", "still fail", "doesn't work", "does not work", "not working"])) return "Which input fails, and what output did you expect? Paste the failing test or describe the case, and I'll correct the code. " + R.review;
    if (has(text, ["code", "write", "implement", "function", "solution", "solve", "class", "give", "show", "refactor", "fix", "add", "extend", "retry", "version", "rewrite"])) return codeReply(R.intro(f, []));
    return HELP;
  }

  const api = { reply, rounds: Object.keys(CODE), fixes: id => (CODE[id] ? Object.keys(CODE[id].fixes) : []), fixWords: id => (CODE[id] ? CODE[id].fixes : {}) };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PRACTICE_ASSISTANT = api;
})(typeof window !== "undefined" ? window : globalThis);
