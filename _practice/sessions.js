// Practice sessions shown on /practice/. Each session must add up to 45 minutes.
// kind: "text" (written answer, dictation allowed) or "code" (monospace editor, no dictation).
// look: what interviewers look for (shown on demand). given: code shown to the candidate.
// board: true adds the whiteboard (Excalidraw). Check totals with: node _practice/check.js
window.PRACTICE_SESSIONS = [
  {
    id: "behavioral-leadership",
    track: "Behavioral",
    title: "Leadership & influence",
    blurb: "Conflict, influence without authority and leading through ambiguity. The stories senior and staff loops dig into.",
    blocks: [
      { name: "Warm-up", min: 5, prompts: [
        { q: "Tell me about yourself, in under two minutes. End with why this role, now.", look: [
          "Top-down: current role, scope, one or two highlights, then why this role",
          "Picks highlights that match the level they're interviewing for",
          "Under two minutes. No life story"] } ] },
      { name: "Conflict", min: 12, prompts: [
        { q: "Tell me about a time you disagreed with a senior person's decision. What did you do, and what happened?", look: [
          "A real disagreement with real stakes, not a misunderstanding",
          "Used data and framed it in the other person's terms",
          "Disagreed and committed, or changed the outcome, and kept the relationship",
          "Says what they'd do differently"] } ] },
      { name: "Influence", min: 12, prompts: [
        { q: "Describe a time you got another team to change direction or prioritise your work, without having authority over them.", look: [
          "Understood what the other team cared about first",
          "Built a mechanism (shared metric, doc, review) rather than a one-off favour",
          "Scope beyond their own team",
          "Influence without escalation as the first move"] } ] },
      { name: "Ambiguity", min: 11, prompts: [
        { q: "Tell me about a project that started with an unclear goal. How did you decide what to build?", look: [
          "Turned ambiguity into a clear problem statement and success metric",
          "Made a call with incomplete data and said what would change their mind",
          "Brought others along: who they aligned with and how",
          "Measured result"] } ] },
      { name: "Your questions", min: 5, prompts: [
        { q: "Write the three questions you'd ask the interviewer at the end.", look: [
          "About the team's hardest problem, how success is measured, how decisions get made",
          "Shows homework on the company",
          "Not only logistics or perks"] } ] }
    ]
  },
  {
    id: "behavioral-ownership",
    track: "Behavioral",
    title: "Ownership, failure & impact",
    blurb: "Your proudest project, a real mistake, a hard trade-off and how you grow others.",
    blocks: [
      { name: "Proudest project", min: 10, prompts: [
        { q: "Walk me through the project you're most proud of. What was your part, and what changed because of it?", look: [
          "Clear about 'I' versus 'we'",
          "Explains why it was hard: technical or organisational",
          "Impact in numbers: users, latency, revenue, time saved",
          "Fits in about four minutes, with more depth when asked"] } ] },
      { name: "A mistake", min: 12, prompts: [
        { q: "Tell me about a mistake you made that affected others. What happened next?", look: [
          "A real mistake with consequences, owned without blame-shifting",
          "Told people early, before they found out",
          "Fixed the root cause: a test, check or process, not just the bug",
          "What they do differently now"] } ] },
      { name: "Trade-off under pressure", min: 12, prompts: [
        { q: "Tell me about a time you had to cut scope or quality to hit a deadline. How did you decide what to cut?", look: [
          "Explicit options and the criteria used to choose",
          "Involved the right people in the decision",
          "Managed the risk of what was cut (follow-up, monitoring)",
          "Honest about the outcome"] } ] },
      { name: "Growing others", min: 11, prompts: [
        { q: "Give an example of how you made someone else, or your team, better.", look: [
          "Specific person or practice, with an outcome (promotion, new skill, fewer incidents)",
          "Multiplier: templates, reviews, standards others adopted",
          "Guided them to do it, rather than doing it for them"] } ] }
    ]
  },
  {
    id: "design-calendar",
    track: "System design",
    tag: "High-level design", board: true,
    title: "Design a calendar app",
    blurb: "Meetings, invites and reminders for hundreds of millions of users. Full walkthrough on our blog after you finish.",
    after: { label: "Compare with our walkthrough", href: "/blog/design-calendar-system/" },
    blocks: [
      { name: "Requirements", min: 5, prompts: [
        { q: "List the functional and non-functional requirements you'd confirm with the interviewer.", look: [
          "Create, update, delete meetings; invite people (including non-users); day/week/month views; reminders",
          "Non-functional: availability, latency for calendar views, scale, consistency",
          "Says why each matters, e.g. read-your-writes for the organiser",
          "Asks whether recurring meetings and time zones are in scope"] } ] },
      { name: "Estimates", min: 5, prompts: [
        { q: "Estimate reads and writes per second and storage per year. State your assumptions. Then say what the numbers mean for the design.", look: [
          "A day is about 10⁵ seconds; quick maths, not precision",
          "Read-heavy: calendar views far outnumber writes",
          "Uses the numbers: cache, shape data for reads"] } ] },
      { name: "APIs", min: 5, prompts: [
        { q: "Write the main APIs: endpoints, key fields and responses.", look: [
          "Create, read range, update, delete, RSVP",
          "The calendar view returns summaries, not only IDs",
          "Updates carry a version (optimistic locking) and an idempotency key on create"] } ] },
      { name: "Data model", min: 7, prompts: [
        { q: "Design the tables and keys. How does 'show my week' stay a single fast query?", look: [
          "Meetings table keyed by meeting ID",
          "Participants table keyed by (user, start time, meeting): one range scan per user",
          "Explains denormalising the start time and its cost on updates",
          "Recurring meetings: one series row with a recurrence rule (RRULE) plus exceptions; expand into instances per requested window, or materialise a few months ahead",
          "Time zones: the series keeps local wall time plus the organiser's IANA zone (e.g. 10:00 Asia/Kolkata) with its RRULE, and expanded instances are stored in UTC; storing the series in UTC alone drifts by an hour across daylight saving changes"] } ] },
      { name: "High-level design", min: 13, prompts: [
        { q: "Draw the components on the whiteboard, then describe the write path, read path and async path here.", look: [
          "Stateless services behind a gateway, sharded databases, a read-through cache",
          "Change data capture into an event stream instead of dual writes",
          "Fan-out workers for notifications; push to apps, email with .ics to non-users"] } ] },
      { name: "Deep dive: reminders", min: 10, prompts: [
        { q: "Send a reminder 15 minutes before every meeting. What do you use, and what happens if the meeting moves after the reminder is scheduled?", look: [
          "Compares cron, Redis key expiry, database TTL and a delay queue",
          "Delay queue with the meeting's version; drop stale reminders on delivery",
          "At-least-once delivery, so sending is idempotent",
          "Plans for spikes at :45 and :15"] } ] }
    ]
  },
  {
    id: "design-rate-limiter",
    track: "System design",
    tag: "Low-level design", board: true,
    title: "Design a rate limiter library",
    blurb: "Classes, interfaces, an algorithm and real code. A low-level design round in 45 minutes.",
    blocks: [
      { name: "Requirements", min: 5, prompts: [
        { q: "What would you clarify? Write the requirements: limits per what, single process or distributed, behaviour when limited.", look: [
          "Limit per key (user, IP, API key) with configurable rules",
          "In-process first, distributed as a follow-up",
          "Returns allow/deny plus retry-after; thread-safe"] } ] },
      { name: "Classes & interfaces", min: 10, prompts: [
        { q: "List the classes and interfaces with their main methods, and how they relate. Sketch a class diagram on the whiteboard if it helps.", look: [
          "A RateLimiter interface (allow(key)) with strategy implementations",
          "A rule/config object and a clock you can inject for tests",
          "Storage behind an interface so a Redis version can be added later"], kind: "text" } ] },
      { name: "Algorithm", min: 10, prompts: [
        { q: "Compare token bucket, fixed window and sliding window. Which do you pick, and why?", look: [
          "Fixed window allows bursts at window edges",
          "Sliding window log is accurate but memory-heavy; sliding window counter approximates it",
          "Token bucket allows controlled bursts with constant memory per key",
          "Picks one with a reason tied to the requirements"] } ] },
      { name: "Code it", min: 12, prompts: [
        { q: "Write the core class for your chosen algorithm in the language you'll use in the interview.", kind: "code", look: [
          "Correct refill or window maths, using an injected clock",
          "Per-key state created lazily, and idle keys evicted (TTL or LRU) so memory doesn't grow forever",
          "Thread safety (lock per key or atomic operations)",
          "Readable names, no dead code"] } ] },
      { name: "Concurrency & scale", min: 8, prompts: [
        { q: "How do you make it safe under concurrency, and how would you share limits across 50 servers?", look: [
          "Locks or compare-and-set in process",
          "Redis with an atomic script (Lua) for distributed limits",
          "Trade-offs: latency of a central store, approximate local limits, failure mode (fail open or closed)"] } ] }
    ]
  },
  {
    id: "design-ai-agent",
    track: "System design",
    tag: "Agentic AI design", board: true,
    title: "Design an AI customer-support agent",
    blurb: "An LLM agent that answers questions, looks up orders and issues refunds. Tools, guardrails, evaluation and cost.",
    after: { label: "Read: the model isn't the agent", href: "/blog/the-model-isnt-the-agent/" },
    blocks: [
      { name: "Scope", min: 6, prompts: [
        { q: "What should the agent do, and what should it never do? Write the requirements and success metrics.", look: [
          "Answers from docs, looks up orders, issues small refunds, hands off to humans",
          "Never acts outside the customer's own account; limits on money moved",
          "Metrics: resolution rate, escalation rate, customer satisfaction, cost per conversation"] } ] },
      { name: "Agent vs plain code", min: 6, prompts: [
        { q: "Which parts need an LLM, and which should stay deterministic code? Why?", look: [
          "LLM for understanding the request and writing the reply",
          "Deterministic code for refunds, eligibility rules, payments and permissions",
          "Says latency, cost and non-determinism of model calls out loud"] } ] },
      { name: "Tools & permissions", min: 8, prompts: [
        { q: "List the tools the agent can call, their inputs, and how permissions are enforced.", look: [
          "Small, typed tools: search_docs, get_order, refund(order, amount), handoff",
          "Tools run with the customer's scope, never an admin token",
          "Refunds above a threshold need human approval; idempotency keys on writes"] } ] },
      { name: "Loop, memory & context", min: 10, prompts: [
        { q: "Describe the agent loop, what goes into the context window, and how you handle long conversations.", look: [
          "Plan, call a tool, read the result, repeat, with a step limit",
          "Retrieval (RAG) over help docs instead of stuffing everything in",
          "Summarise or trim old turns; store conversation state outside the model"] } ] },
      { name: "Guardrails", min: 8, prompts: [
        { q: "How do you defend against prompt injection, wrong answers and costly mistakes?", look: [
          "Treat customer messages and retrieved text as untrusted data",
          "Least-privilege tools, confirmation for risky actions, output checks",
          "Grounded answers with sources; 'I don't know' plus hand-off when unsure",
          "Audit log of every action"] } ] },
      { name: "Evaluation & cost", min: 7, prompts: [
        { q: "How do you test it before launch and monitor it after? Estimate the model cost per day for 50,000 conversations.", look: [
          "Offline eval set from real tickets; check tool calls and policy compliance, not just text",
          "Online: escalation rate, refunds issued, user ratings, sampled reviews",
          "Cost: e.g. 50,000 conversations × ~4 model calls × ~3,000 tokens ≈ 600M tokens a day; a small model for simple turns"] } ] }
    ]
  },
  {
    id: "coding-intervals",
    track: "Coding",
    tag: "Classic coding",
    title: "Meeting intervals",
    blurb: "Two classic interval problems: merge meetings, then count the rooms you need. Clarify, code, test, explain.",
    blocks: [
      { name: "Problem 1: clarify & plan", min: 5, prompts: [
        { q: "Given a list of meetings as [start, end] pairs, merge the ones that overlap. Example: [[1,3],[8,10],[2,6],[15,18]] → [[1,6],[8,10],[15,18]]. What would you ask, and what's your approach?", look: [
          "Asks: is the input sorted? do touching meetings like [1,4] and [4,5] count as overlapping?",
          "Plan: sort by start, then one pass merging into the last interval"] } ] },
      { name: "Problem 1: code", min: 12, prompts: [
        { q: "Write a function merge(meetings) that returns the merged list. Touching meetings, like [1,4] and [4,5], should merge.", kind: "code", look: [
          "Sorts by start time",
          "Compares with <= so touching intervals merge",
          "Extends the end with max(), handling a meeting inside another",
          "Handles an empty list"] } ] },
      { name: "Problem 1: test & complexity", min: 5, prompts: [
        { q: "Write your test cases and state the time and space complexity.", look: [
          "Empty list, one meeting, touching, nested, unsorted input",
          "O(n log n) time for the sort, O(n) space for the output"] } ] },
      { name: "Problem 2: plan", min: 5, prompts: [
        { q: "Now return the minimum number of rooms needed so no two overlapping meetings share a room. Example: [[0,30],[5,10],[15,20]] → 2. What's your approach? (Unlike Problem 1, where touching meetings merge, here a meeting ending at 10 frees its room for one starting at 10.)", look: [
          "Sort by start and keep a min-heap of end times, or sort starts and ends separately",
          "A room is freed when the earliest end is ≤ the next start"] } ] },
      { name: "Problem 2: code", min: 13, prompts: [
        { q: "Write a function min_rooms(meetings) that returns the number of rooms needed.", kind: "code", look: [
          "Correct heap or two-pointer logic",
          "A meeting ending at 10 frees its room for one starting at 10",
          "Returns the maximum rooms in use, not the final count"] } ] },
      { name: "Problem 2: complexity", min: 5, prompts: [
        { q: "State the time and space complexity, and one follow-up you'd expect from the interviewer.", look: [
          "O(n log n) time, O(n) space",
          "Follow-ups: return which room each meeting gets; meetings arriving as a stream"] } ] }
    ]
  },
  {
    id: "coding-with-ai",
    track: "Coding",
    tag: "Code-with-AI round",
    title: "Top K frequent words, with an AI assistant",
    blurb: "A code-with-AI round: you direct and check the AI's code. Find the bug it wrote, then prove your fix.",
    blocks: [
      { name: "Clarify", min: 5, prompts: [
        { q: "Problem: given a list of words and k, return the k most frequent words, sorted by frequency (highest first). Words with the same frequency are sorted alphabetically. What do you clarify, and which edge cases do you write down?", look: [
          "Case sensitivity ('The' vs 'the') and punctuation",
          "Empty input, k = 0, and k larger than the number of distinct words",
          "Input size: do all distinct words fit in memory?",
          "Writes the edge cases down before prompting"] } ] },
      { name: "Plan & prompt", min: 5, prompts: [
        { q: "In one sentence, what's your approach? Then write the exact prompt you'd give the AI assistant.", look: [
          "Count with a hash map, then sort by (-count, word) or use a heap",
          "The prompt states the tie-breaking rule and the function signature",
          "Asks for one function, not a whole program"] } ] },
      { name: "Review the AI's code", min: 12, prompts: [
        { q: "The AI returned the code below. Does it meet the requirements? Find any bug, explain it, and write the corrected version.", kind: "code",
          given: "from collections import Counter\n\ndef top_k_frequent(words, k):\n    counts = Counter(words)\n    return [word for word, _ in counts.most_common(k)]",
          look: [
            "Spots that most_common() breaks ties by first appearance, not alphabetically",
            "Example that fails: ['b', 'a'] with k = 1 returns ['b'], expected ['a']",
            "Fix: sorted(counts, key=lambda w: (-counts[w], w))[:k], or heapq.nsmallest(k, counts, key=lambda w: (-counts[w], w)), or a size-k min-heap whose eviction puts the alphabetically later word first",
            "Explains the fix out loud, not just pastes it"] } ] },
      { name: "Tests", min: 8, prompts: [
        { q: "Write the tests that would catch the bug and the edge cases you listed.", kind: "code", look: [
          "A tie case that fails the AI's version",
          "k equal to and larger than the number of distinct words",
          "Empty list"] } ] },
      { name: "Complexity & trade-offs", min: 7, prompts: [
        { q: "State time and space complexity for sorting versus a heap of size k. When would you pick each?", look: [
          "With n words and m distinct words: sort is O(n + m log m); a size-k heap is O(n + m log k)",
          "Heap wins when k is much smaller than the number of distinct words",
          "Mentions readability as a fair reason to sort in an interview"] } ] },
      { name: "Follow-up", min: 8, prompts: [
        { q: "Follow-up: words arrive as an endless stream and you must answer 'top k' at any time. How does your design change?", look: [
          "Keep counts in a hash map and update a structure incrementally",
          "Approximate options for huge streams: Count-Min Sketch plus a heap",
          "Discusses memory limits and accuracy trade-offs"] } ] }
    ]
  }
];
