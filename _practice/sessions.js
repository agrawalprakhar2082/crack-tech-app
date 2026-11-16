// Practice sessions shown on /practice/. Each session must add up to 45 minutes.
// kind: "text" (written answer, dictation allowed) or "code" (code editor, no dictation).
// look: what interviewers look for (shown on demand).
// board: true adds the whiteboard (Excalidraw). Check totals with: node _practice/check.js
// problem: an id from problems.js. On a block it shows the problem statement; on a code
// prompt it adds starter code and the Run / Submit tests. The coding practice sets at the
// end are built from problems.js by codingSet().
window.PRACTICE_SESSIONS = [
  /* ---------------- System design: six senior-level rounds, whiteboard on ---------------- */
  {
    id: "design-twitter",
    track: "System design",
    tag: "High-level design", board: true,
    title: "Design Twitter: the celebrity problem",
    blurb: "Posts, follows and a home timeline for hundreds of millions of users, where a few accounts have 100 million followers. Fan-out on write, on read, or both?",
    after: { label: "Read: back-of-the-envelope estimation with the 10⁵ trick", href: "/blog/estimation-10-5-trick/" },
    blocks: [
      { name: "Requirements", min: 5, prompts: [
        { q: "List the functional and non-functional requirements you'd confirm with the interviewer. What's in scope for 45 minutes, and what do you leave out?", look: [
          "Core: post a tweet, follow and unfollow, home timeline, a user's own timeline; likes and replies as secondary",
          "Asks whether the home timeline is reverse-chronological or ranked, and whether media is in scope",
          "Non-functional: availability over strict consistency, timeline reads fast (e.g. p99 under 200 ms), a few seconds of delay for new tweets is acceptable",
          "Calls out the skew early: most users have a few hundred followers, a few have tens of millions"] } ] },
      { name: "Estimates", min: 5, prompts: [
        { q: "Estimate tweets per second, timeline reads per second, timeline writes caused by fan-out, and storage per year. What do the numbers tell you?", look: [
          "Quick maths with a day ≈ 10⁵ s: e.g. 200M daily users, ~50M tweets a day ≈ 500/s (peaks 2–3×), ~1B timeline reads a day ≈ 10k/s",
          "Fan-out: average ~200 followers turns 500 tweets/s into ~100k timeline inserts/s; one tweet from a 100M-follower account is 100M inserts on its own",
          "Storage: ~500 bytes per tweet is on the order of 10 TB a year of text; media stored separately in blob storage",
          "Conclusion: read-heavy, so precompute timelines, but the follower skew breaks naive fan-out"] } ] },
      { name: "APIs", min: 4, prompts: [
        { q: "Write the main APIs: endpoints, key fields and responses.", look: [
          "POST /tweets with an idempotency key; GET /timeline?cursor=&limit= with cursor pagination, not offsets",
          "POST and DELETE /follows/{userId}; GET /users/{id}/tweets",
          "Timeline responses return hydrated tweets (author, text, counts), not only ids",
          "Auth on every call and per-user rate limits on posting"] } ] },
      { name: "Data model", min: 6, prompts: [
        { q: "Design the main tables, keys and sharding. How do you store the follow graph so both 'who do I follow' and 'who follows me' are fast?", look: [
          "Tweets keyed by a time-sortable id (Snowflake-style), with an index or shard layout that makes a user's tweets one range read",
          "Follow edges stored twice, by follower and by followee: double writes and storage in exchange for single-shard reads either way",
          "Home timeline as a capped list of tweet ids per user in a cache (e.g. the latest ~800), rebuilt from storage when missing",
          "Counters (likes, retweets) kept apart from the tweet row, approximate and sharded to avoid hot rows"] } ] },
      { name: "High-level design", min: 11, prompts: [
        { q: "Draw the components on the whiteboard. Then walk through posting a tweet and reading the home timeline, and compare fan-out on write with fan-out on read.", look: [
          "Write path: tweet service stores the tweet, emits an event; fan-out workers read followers and push the tweet id into each timeline cache",
          "Read path: read the cached id list, hydrate tweets from a tweet cache, fall back to storage",
          "Fan-out on write: fast reads, heavy and partly wasted writes (inactive users); fan-out on read: cheap writes, slow merges at read time",
          "Skips fan-out for inactive users and rebuilds their timeline when they return"] } ] },
      { name: "Deep dive: the celebrity problem", min: 7, prompts: [
        { q: "An account with 100 million followers tweets. What happens in your design, and how do you fix it?", look: [
          "Hybrid: fan-out on write for normal accounts; above a follower threshold, skip fan-out and merge those accounts' recent tweets into the timeline at read time",
          "Celebrity tweets are cached hot and replicated, with request coalescing so a burst of readers doesn't stampede storage",
          "Handles users who follow many celebrities (bound the merge, cache per celebrity) and accounts crossing the threshold",
          "Quantifies the trade-off: a few extra reads per timeline instead of 100M writes per tweet"] } ] },
      { name: "Deep dive: deletes and failures", min: 7, prompts: [
        { q: "How do deletes, unfollows and blocks reach timelines that already contain a tweet? What happens if a fan-out worker crashes halfway through?", look: [
          "Timelines hold ids only, and hydration filters deleted, blocked or unfollowed authors, so correctness doesn't depend on cleaning every list",
          "Fan-out is idempotent (dedupe by tweet id) and resumable: at-least-once delivery from the queue with progress checkpoints per batch of followers",
          "Following someone backfills their recent tweets; unfollowing removes them lazily",
          "Monitors fan-out lag as a key metric"] } ] }
    ]
  },
  {
    id: "design-calendar",
    track: "System design",
    tag: "High-level design", board: true,
    title: "Design Google Calendar",
    blurb: "Meetings, invites, reminders and recurring events across time zones, for hundreds of millions of users. Full walkthrough on our blog after you finish.",
    after: { label: "Compare with our walkthrough", href: "/blog/design-calendar-system/" },
    blocks: [
      { name: "Requirements", min: 5, prompts: [
        { q: "List the functional and non-functional requirements you'd confirm with the interviewer.", look: [
          "Create, update, delete meetings; invite people (including people without an account); accept, decline, propose a new time; day/week/month views; reminders",
          "Non-functional: availability, low latency for calendar views, scale, consistency where it matters",
          "Says why each matters, e.g. read-your-writes for the organiser after an edit",
          "Asks whether recurring meetings, time zones and free/busy lookups are in scope"] } ] },
      { name: "Estimates", min: 5, prompts: [
        { q: "Estimate reads and writes per second and storage per year. State your assumptions, then say what the numbers mean for the design.", look: [
          "A day is about 10⁵ seconds; quick maths, not precision (e.g. 100M daily users, ~100M meetings a day ≈ 1k writes/s, ~3 invitees each)",
          "Read-heavy: calendar views far outnumber writes",
          "Uses the numbers: cache views, shape the data for the read path"] } ] },
      { name: "APIs", min: 4, prompts: [
        { q: "Write the main APIs: endpoints, key fields and responses.", look: [
          "Create, read a time range, update, delete, RSVP",
          "The calendar view returns meeting summaries for the range, not only ids",
          "Updates carry a version (optimistic locking); creates carry an idempotency key"] } ] },
      { name: "Data model", min: 6, prompts: [
        { q: "Design the tables and keys. How does 'show my week' stay a single fast query?", look: [
          "Meetings table keyed by meeting id",
          "Participants table keyed by (user, start time, meeting): one range scan per user per week",
          "Explains denormalising the start time into the participants table, and what that costs when a meeting moves"] } ] },
      { name: "High-level design", min: 11, prompts: [
        { q: "Draw the components on the whiteboard, then describe the write path, the read path and the async path.", look: [
          "Stateless services behind a gateway, sharded storage, a read-through cache for views",
          "Change data capture into an event stream instead of dual writes",
          "Fan-out workers for notifications: push to apps, email with an .ics file to people without an account"] } ] },
      { name: "Deep dive: reminders", min: 7, prompts: [
        { q: "Send a reminder 15 minutes before every meeting. What do you use, and what happens if the meeting moves after the reminder is scheduled?", look: [
          "Compares cron scans, key-expiry tricks, database TTLs and a delay queue",
          "Delay queue carrying the meeting's version; stale reminders are dropped on delivery",
          "At-least-once delivery, so sending is idempotent",
          "Plans for spikes at :45 and :15 (many meetings start on the hour)"] } ] },
      { name: "Deep dive: recurring meetings & time zones", min: 7, prompts: [
        { q: "How do you store a weekly meeting with exceptions, and show it correctly to people in different time zones across daylight saving changes?", look: [
          "One series row with a recurrence rule (RRULE) plus exceptions; expand instances for the requested window, or materialise a few months ahead",
          "The series keeps local wall time plus the organiser's IANA zone (e.g. 10:00 Asia/Kolkata); expanded instances are stored in UTC",
          "Explains why storing the series in UTC alone drifts by an hour across daylight saving changes",
          "Editing 'this and following events' splits the series"] } ] }
    ]
  },
  {
    id: "design-job-scheduler",
    track: "System design",
    tag: "High-level design", board: true,
    title: "Design a Job Scheduler",
    blurb: "One-off and recurring jobs at 100 million runs a day, with priorities, retries and a history of every run, without running a job twice by mistake.",
    after: { label: "Read: a 4-step plan for any system design question", href: "/blog/system-design-4-step-plan/" },
    blocks: [
      { name: "Requirements", min: 5, prompts: [
        { q: "What would you clarify? Write the functional and non-functional requirements.", look: [
          "Submit, cancel and pause jobs; one-off (run at time T) and recurring (cron-style) schedules; priorities; retries with a limit; status and history of every run",
          "Asks what a job is (a call to a registered task with parameters), how long jobs run, and how late a run may start",
          "Non-functional: scale (e.g. 100M runs a day), high availability of scheduling, each run executes at least once and duplicates are avoided",
          "Out of scope unless asked: job dependencies (DAGs) and checkpointing inside long jobs"] } ] },
      { name: "Estimates", min: 4, prompts: [
        { q: "Estimate runs per second, peak load and storage for run history.", look: [
          "100M runs a day ≈ 1k runs/s average; peaks are much higher because many jobs are scheduled on the hour",
          "History: ~1 KB per run attempt is ~100 GB a day; keep recent history hot, archive the rest",
          "Worker capacity depends on job duration: concurrency ≈ rate × average runtime"] } ] },
      { name: "APIs", min: 4, prompts: [
        { q: "Write the main APIs.", look: [
          "POST /jobs (task, params, schedule, priority, retry policy, idempotency key) → job id",
          "DELETE or PATCH /jobs/{id} to cancel or pause; GET /jobs/{id} and GET /jobs/{id}/runs for status and history",
          "Internal worker API: claim work, heartbeat, report result"] } ] },
      { name: "Data model", min: 7, prompts: [
        { q: "Design the tables. How does the scheduler find the jobs due in the next second without scanning everything?", look: [
          "Job (definition, schedule, priority, retry policy, state) separate from Run (one per scheduled execution) and Attempt (one per try, with error)",
          "An index of due work keyed by (time bucket, priority, run id), partitioned so many schedulers can read their own slice",
          "Recurring jobs: compute and insert the next run when a run is created, not by scanning cron strings",
          "Run states: scheduled → queued → running → succeeded / failed / retrying / cancelled"] } ] },
      { name: "High-level design", min: 11, prompts: [
        { q: "Draw the components on the whiteboard and walk through a recurring job from submission to its third run.", look: [
          "API service writes jobs; scheduler (partitioned by time bucket) moves due runs into priority queues; a worker fleet claims and executes",
          "Results and attempts written to the run history; failures re-enqueued with backoff until the retry limit",
          "Scheduler instances own partitions via leases, so a failed scheduler's slice is picked up by another",
          "Separate queues or weighted fair queueing so low-priority jobs don't starve"] } ] },
      { name: "Deep dive: running exactly once (almost)", min: 7, prompts: [
        { q: "A worker claims a run and then goes silent. How do you detect that, retry safely, and make sure two workers don't both finish the same run?", look: [
          "Leases with a timeout and heartbeats; an expired lease makes the run claimable again",
          "Fencing token (lease version) checked when a worker reports results, so a zombie worker's late write is rejected",
          "Honest guarantee: at-least-once execution, with idempotent jobs (idempotency keys) for exactly-once effects",
          "Retries with exponential backoff and jitter; a dead-letter state after the limit"] } ] },
      { name: "Deep dive: timing at scale", min: 7, prompts: [
        { q: "A million jobs are scheduled for exactly 09:00. How do you start them on time without overloading anything?", look: [
          "Pre-load upcoming buckets into the queues a little early; workers start them at the scheduled time",
          "Spreads load with allowed jitter where the job permits it; autoscale workers ahead of known peaks",
          "Back-pressure: rate limits per tenant or task type so one customer can't flood the fleet",
          "Measures schedule lag (start time − scheduled time) as the key SLO"] } ] }
    ]
  },
  {
    id: "design-doordash",
    track: "System design",
    tag: "High-level design", board: true,
    title: "Design DoorDash",
    blurb: "Customers order from restaurants and couriers (dashers) deliver. Orders, dispatch with geo matching, live tracking, ETAs and payments.",
    after: { label: "Read: a 4-step plan for any system design question", href: "/blog/system-design-4-step-plan/" },
    blocks: [
      { name: "Requirements", min: 5, prompts: [
        { q: "Who are the actors, and what does each need? Write the functional and non-functional requirements you'd confirm.", look: [
          "Customers browse and order and track; restaurants manage menus and accept, prepare and hand over orders; dashers go online, accept deliveries and share location",
          "System: match a dasher to each order, compute ETAs, take payment, notify everyone of status changes",
          "Non-functional: orders and payments strongly consistent; location and ETAs eventually consistent and near real time; high availability at meal-time peaks",
          "Scopes out reviews, promotions and restaurant onboarding unless asked"] } ] },
      { name: "Estimates", min: 4, prompts: [
        { q: "Estimate orders per second at peak, location updates per second, and what dominates the load.", look: [
          "e.g. 20M orders a day ≈ 200/s average, several times that at lunch and dinner",
          "Location: e.g. 1M active dashers sending every 4 s ≈ 250k updates/s, far more than orders",
          "Conclusion: the location pipeline and geo queries dominate; orders are low volume but must be correct"] } ] },
      { name: "APIs", min: 4, prompts: [
        { q: "Write the main APIs for customers, restaurants and dashers.", look: [
          "POST /orders (cart, address, payment method, idempotency key); GET /orders/{id} with status and ETA",
          "Restaurant: accept or reject, mark ready; dasher: go online, accept or decline an offer, picked up, delivered",
          "Location updates over a persistent connection or batched POSTs; live tracking pushed to customers (WebSocket or server-sent events)"] } ] },
      { name: "Data model", min: 6, prompts: [
        { q: "Design the main entities, including the order state machine.", look: [
          "Order states: created → paid (authorised) → accepted → preparing → ready → picked up → delivered, plus cancelled and rejected, with an append-only status history",
          "Orders sharded by order id or by region; restaurants and menus read-heavy and cached",
          "Dasher location kept in an in-memory geo index (geohash or H3 cells) with a short TTL, not in the order database",
          "Payment records: authorise at order, capture at delivery, refunds as separate entries"] } ] },
      { name: "High-level design", min: 11, prompts: [
        { q: "Draw the components on the whiteboard and walk an order from checkout to delivery.", look: [
          "Order service owns the state machine; transitions are published as events that drive notifications, dispatch and analytics",
          "Payment service with idempotency keys; authorise first, capture on delivery",
          "Location ingestion service updating the geo index; tracking service streaming dasher position to the customer",
          "Clear ownership: each service owns its data, and events (not shared tables) connect them"] } ] },
      { name: "Deep dive: dispatch & matching", min: 8, prompts: [
        { q: "An order will be ready in 12 minutes. How do you choose and offer a dasher, and what if they decline or go offline?", look: [
          "Candidate search in nearby geo cells, ranked by ETA to the restaurant and the food-ready time, not only straight-line distance",
          "Batching: match several orders and dashers per region every few seconds instead of greedy one-by-one",
          "Offers with a timeout; on decline or timeout, offer to the next candidate; one dasher per order enforced with a conditional update",
          "Regional partitioning of the dispatcher so each city scales independently"] } ] },
      { name: "Deep dive: live tracking & ETAs", min: 7, prompts: [
        { q: "How do customers see the dasher move in near real time, and how do you keep the ETA honest?", look: [
          "Location updates go to the geo index and a pub/sub channel per active order; the customer's connection subscribes",
          "Throttle and smooth updates for display; drop stale points",
          "ETA = prep time estimate + travel time from a routing service, recomputed on key events and as the dasher moves",
          "Learns prep times per restaurant and time of day from history"] } ] }
    ]
  },
  {
    id: "design-distributed-queue",
    track: "System design",
    tag: "High-level design", board: true,
    title: "Design a Distributed Queue",
    blurb: "A Kafka-like log: topics and partitions, consumer groups and offsets, replication, ordering, retention, plus delayed messages and a dead-letter queue.",
    after: { label: "Read: delay queues in practice (calendar reminders)", href: "/blog/design-calendar-system/" },
    blocks: [
      { name: "Requirements", min: 5, prompts: [
        { q: "What would you clarify? Write the functional and non-functional requirements.", look: [
          "Producers publish to topics; consumers read; consumer groups share the work so each message is processed by one member of a group",
          "Ordering per key (e.g. per user), not across the whole topic; replay from an earlier point; retention by time or size",
          "Non-functional: high throughput, durability (no loss of acknowledged messages), fault tolerance, horizontal scaling",
          "Asks whether delayed delivery and a dead-letter queue are needed"] } ] },
      { name: "Estimates", min: 4, prompts: [
        { q: "Estimate throughput, storage and the number of partitions you need.", look: [
          "e.g. 1M messages/s × 1 KB = 1 GB/s in; × replication factor 3 on disk and network",
          "Retention: 7 days at 1 GB/s ≈ 600 TB before replication",
          "Partitions sized from per-partition throughput and the number of consumers you want in parallel"] } ] },
      { name: "APIs", min: 4, prompts: [
        { q: "Write the producer, consumer and admin APIs.", look: [
          "produce(topic, key, value, acks) → (partition, offset); key chooses the partition",
          "poll(group, max) → messages; commit(group, partition, offset)",
          "Admin: create topic with partitions, replication factor and retention"] } ] },
      { name: "Storage & data model", min: 7, prompts: [
        { q: "How is a partition stored on disk, and how do consumers keep their place?", look: [
          "Append-only log split into segment files with a sparse offset index; sequential writes and the page cache make it fast",
          "Retention deletes or compacts whole segments (compaction keeps the latest value per key)",
          "Consumer group offsets stored in the system itself (an internal topic) per (group, partition)",
          "Batching and compression on the producer; zero-copy reads to consumers"] } ] },
      { name: "High-level design", min: 10, prompts: [
        { q: "Draw brokers, partitions, leaders and followers, the metadata/controller service, producers and consumer groups on the whiteboard. Walk a message from producer to consumer.", look: [
          "Each partition has one leader broker and followers; producers write to the leader",
          "A controller (consensus-backed metadata, e.g. Raft) tracks brokers, leaders and assignments",
          "Within a group, each partition is read by one consumer; adding consumers beyond the partition count adds no parallelism",
          "Rebalancing when consumers join or leave, and its cost (cooperative rebalancing)"] } ] },
      { name: "Deep dive: replication & durability", min: 8, prompts: [
        { q: "A leader broker dies right after acknowledging a write. Is the message lost? Explain replication, acknowledgements and leader election.", look: [
          "In-sync replicas (ISR): followers that have caught up; acks=all waits for every ISR member",
          "High watermark: consumers only see messages replicated to all ISR members",
          "min.insync.replicas with acks=all trades availability for durability; unclean leader election trades durability for availability",
          "Leader epochs to truncate divergent logs after a failover"] } ] },
      { name: "Deep dive: delivery, delay & DLQ", min: 7, prompts: [
        { q: "What delivery guarantee do consumers get, and how would you add delayed messages and a dead-letter queue?", look: [
          "At-least-once by committing offsets after processing; idempotent consumers or an idempotent producer plus transactions for exactly-once processing",
          "Delayed delivery: delay topics or buckets by due time (or a timing wheel), moved to the main topic when due; ordering caveats",
          "Dead-letter topic after N failed attempts, with the error recorded, so one bad message doesn't block a partition",
          "Monitors consumer lag per group and partition"] } ] }
    ]
  },
  {
    id: "design-amazon",
    track: "System design",
    tag: "High-level design", board: true,
    title: "Design Amazon E-commerce",
    blurb: "Catalog and search, cart, checkout and payments, with inventory that never oversells and orders that expire if they aren't paid within 10 minutes.",
    after: { label: "Read: back-of-the-envelope estimation with the 10⁵ trick", href: "/blog/estimation-10-5-trick/" },
    blocks: [
      { name: "Requirements", min: 5, prompts: [
        { q: "Write the functional and non-functional requirements for buyers, sellers and the system.", look: [
          "Buyers: search and browse, cart, checkout, pay, order history and status; sellers: list products, manage inventory, update order status",
          "System: don't oversell; reserve stock at checkout; cancel orders not paid within 10 minutes and release their stock",
          "Non-functional: orders, payments and inventory strongly consistent; catalog and search eventually consistent; very high read traffic and flash-sale peaks",
          "Scopes out recommendations, reviews and shipping logistics unless asked"] } ] },
      { name: "Estimates", min: 4, prompts: [
        { q: "Estimate searches, product page views and orders per second, and the read/write ratio.", look: [
          "e.g. 10M daily users × 10 searches ≈ 1k searches/s average, much more at peak; 2M orders a day ≈ 20/s average",
          "Reads exceed writes by orders of magnitude: cache product pages, serve search from an index",
          "Flash sales concentrate writes on a few hot products"] } ] },
      { name: "APIs", min: 4, prompts: [
        { q: "Write the main APIs.", look: [
          "GET /search?q=&filters=&cursor=; GET /products/{id}",
          "PUT /cart/items; POST /checkout → order id with status pending_payment and an expiry time",
          "POST /orders/{id}/pay with an idempotency key; GET /orders/{id}; seller APIs to list products and set stock"] } ] },
      { name: "Data model", min: 6, prompts: [
        { q: "Design the main entities and where each lives.", look: [
          "Catalog (product, SKU, seller offers) in a document store, indexed into a search engine; prices and stock not trusted from the index",
          "Inventory per (SKU, warehouse) with available and reserved counts in a strongly consistent store",
          "Order with line items, a status machine (pending_payment → paid → shipped → delivered, or cancelled/expired) and an expires_at",
          "Payments as separate records linked to orders, keyed by idempotency key"] } ] },
      { name: "High-level design", min: 11, prompts: [
        { q: "Draw the services on the whiteboard and walk through search → cart → checkout → payment.", look: [
          "Catalog and search services with caching and a CDN for product media; changes flow to the index asynchronously",
          "Cart service (per-user, durable, tolerant of being slightly stale)",
          "Checkout orchestrates inventory reservation, order creation and payment, as a saga with compensations rather than a distributed transaction",
          "Events notify sellers, email and analytics"] } ] },
      { name: "Deep dive: inventory & the 10-minute expiry", min: 8, prompts: [
        { q: "Two buyers try to buy the last unit at the same moment, and one of them never pays. Walk through how your design handles both.", look: [
          "Reserve with an atomic conditional update (available ≥ qty → available −= qty, reserved += qty), so only one succeeds",
          "The reservation and the pending order carry expires_at = now + 10 min; a delay queue or scheduled sweep cancels unpaid orders and releases stock",
          "Payment arriving after expiry: reject and refund, or re-reserve if stock remains; idempotent release so it never runs twice",
          "Hot products in flash sales: shard the stock counter or pre-allocate tokens, and queue buyers"] } ] },
      { name: "Deep dive: payments & idempotency", min: 7, prompts: [
        { q: "The payment provider times out and the client retries. How do you make sure the buyer is charged exactly once and the order ends in the right state?", look: [
          "Idempotency key per payment attempt stored with the result; retries return the stored outcome",
          "Pending state while the provider's result is unknown; reconcile via provider webhooks and status polling",
          "Outbox pattern: the order update and the 'payment succeeded' event are written atomically, then published",
          "Clear handling of partial failures: payment succeeded but the order expired → automatic refund"] } ] }
    ]
  },

  /* ---------------- Behavioral ---------------- */
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
    id: "behavioral-collaboration",
    track: "Behavioral",
    title: "Collaboration, feedback & growth",
    blurb: "Hard feedback, a difficult teammate or stakeholder, changing your mind with data, and where you want to grow next.",
    blocks: [
      { name: "Hard feedback", min: 11, prompts: [
        { q: "Tell me about the hardest feedback you've received. How did you react, and what did you change?", look: [
          "Real, specific feedback that stung, not a disguised strength",
          "Listened and asked questions before defending",
          "A concrete change in behaviour, and evidence it stuck (what others noticed later)",
          "Shows they now ask for feedback, not only receive it"] } ] },
      { name: "A difficult relationship", min: 12, prompts: [
        { q: "Describe a time you worked with a difficult teammate or stakeholder. What made it hard, and how did you handle it?", look: [
          "Describes the other person fairly: their goals and constraints, not their character",
          "Went to them directly first, and looked for shared goals",
          "Escalated only with a reason, and kept the work moving",
          "Outcome for the project and for the working relationship"] } ] },
      { name: "Changing your mind", min: 11, prompts: [
        { q: "Tell me about a time data or a colleague's argument changed your mind on something you felt strongly about.", look: [
          "Starts with a strong, reasonable position, not a straw man",
          "What evidence changed it, and how they tested their own view",
          "Said so openly and helped move the team to the better option",
          "What they learned about how they make decisions"] } ] },
      { name: "Why this role, and growth", min: 11, prompts: [
        { q: "Why this role and this company? Where do you want to grow in the next two to three years, and how will this role help?", look: [
          "Specific to the company: its product, problems or engineering culture, not generic praise",
          "Links past experience to what the role needs",
          "A growth goal that is honest and concrete (scope, skill, level), with steps already taken",
          "Reasons to join rather than only reasons to leave the current job"] } ] }
    ]
  }
];

// Coding practice sets: two questions in 45 minutes, each clarify & plan, code, test & complexity.
(function () {
  const P = window.PRACTICE_PROBLEMS || {};
  const question = (n, id, codeMin) => {
    const p = P[id] || { title: id, clarify: ["(missing problem)"], look: ["(missing problem)"], testing: ["(missing problem)"] };
    return [
      { name: `Q${n}: clarify & plan`, min: 3, problem: id, prompts: [
        { q: `Question ${n}, ${p.title}: what would you ask the interviewer, and what's your plan? Name the time and space complexity you're aiming for.`, look: p.clarify }] },
      { name: `Q${n}: code`, min: codeMin, prompts: [
        { q: `Write your solution to "${p.title}". The signature is filled in for your language. Press Run to check the sample tests, then Submit to run the hidden tests too.`, kind: "code", problem: id, look: p.look }] },
      { name: `Q${n}: test & complexity`, min: 4, prompts: [
        { q: `Which tests would you walk through out loud, beyond the samples? State the time and space complexity.${p.followup ? " If there's time, the follow-up: " + p.followup : ""}`, look: p.testing }] }
    ];
  };
  const codingSet = (n, tag, blurb, a, b) => ({
    id: `coding-session-${n}`, track: "Coding practice sets", tag, title: `Session ${n}`, blurb, questions: 2,
    blocks: [...question(1, a, 15), ...question(2, b, 16)]
  });
  window.PRACTICE_SESSIONS.push(
    codingSet(1, "Bit tricks · Binary search", "Find the number without a pair, then find it again in a sorted list in O(log n).", "unpaired-number", "unpaired-in-sorted"),
    codingSet(2, "Stacks · Strings", "Replay a keyboard with backspaces, then balance brackets with the fewest removals.", "backspace-keys", "fewest-paren-removals"),
    codingSet(3, "Sweep line · Greedy", "Count fence posts with enough coats of paint, then burst every balloon with the fewest arrows.", "fence-coats", "balloon-arrows"),
    codingSet(4, "Sliding window", "The maximum of every window with a deque, then the longest run of ones with k flips.", "window-maximum", "longest-ones-flips"),
    codingSet(5, "Binary search", "Search a grid sorted by rows and columns, then binary-search the answer: the smallest water tank.", "sorted-matrix-search", "tank-capacity"),
    codingSet(6, "Dynamic programming", "Paint a street at the lowest cost, then count the ways to hit a sum with limited copies.", "paint-houses", "bounded-subsets"),
    codingSet(7, "Graphs", "Find a cycle in a directed graph, then plan courses in the fewest semesters.", "graph-cycle", "course-semesters"),
    codingSet(8, "Hashing · Insight", "Check a sudoku board, then find the fewest moves to put a list in order.", "sudoku-check", "move-to-ends"),
    codingSet(9, "Class design · Heaps", "Design a scoreboard class, then take the k largest values from a heap without touching it.", "scoreboard", "heap-k-largest"),
    codingSet(10, "Prefix sums · Two heaps", "Count subarrays that sum to k, then split employees into age halves day by day.", "subarray-sum-k", "age-halves"),
    codingSet(11, "Trees", "Find dead ends in a binary search tree, then count a complete tree without visiting every node.", "bst-dead-ends", "complete-tree-count"),
    codingSet(12, "Monotonic stack · Greedy", "Days until a warmer day with a stack, then hand out the fewest fair candies.", "warmer-days", "fair-candies"),
    codingSet(13, "Strings · DP", "Can k deletions make a palindrome? Then rearrange a list into its next arrangement in place.", "k-palindrome", "next-permutation"),
    codingSet(14, "Graphs · BFS · Dijkstra", "Distance from every room to the nearest exit, then the gentlest path across a height map.", "nearest-exit", "min-effort-path"),
    codingSet(15, "Heaps · Binary search", "Schedule tasks with a cooldown, then find the smallest heater range that warms every house.", "cooldown-schedule", "heater-radius")
  );
})();

// AI coding rounds: built from AI_ROUNDS in ai-problems.js. Each round: clarify & plan,
// work with the assistant (chat beside the editor, Run / Submit), verify & explain.
// Round 4 (tests first) adds a block to write tests before implementing.
(function () {
  const P = window.PRACTICE_PROBLEMS || {};
  (window.AI_ROUNDS || []).forEach(([id, tag, blurb], i) => {
    const n = i + 1, p = P[id] || { title: id, clarify: ["(missing)"], look: ["(missing)"], testing: ["(missing)"] };
    const plan = { name: "Clarify & plan", min: 5, problem: id, prompts: [
      { q: `Round ${n}, ${p.title}: what would you clarify, and what's your plan? Write the first prompt you'll give the assistant.`, look: p.clarify }] };
    const work = min => ({ name: "Work with the AI", min, prompts: [
      { q: p.testStarters ? "Now implement it. Ask the assistant if you like, check its code with your tests and with Run, then Submit." : "Work with the assistant: ask for code, tests or explanations, insert what you choose into the editor, and check it with Run and Submit. The assistant can be wrong.", kind: "code", problem: id, chat: true, look: p.look }] });
    const verify = { name: "Verify & explain", min: 10, prompts: [
      { q: `Which test exposed the problem, or which tests did you add? Explain the root cause, your fix and the complexity, as you would to the interviewer.${p.followup ? " If there's time, the follow-up: " + p.followup : ""}`, look: p.testing }] };
    const blocks = p.testStarters
      ? [plan, { name: "Write tests first", min: 10, prompts: [
          { q: "Write your tests before asking the assistant anything, then press \"Check my tests\".", kind: "code", testsFor: id, look: [
            "Each rule in the spec has a test: boundary, rejected requests, same-second requests, the exact limit, sliding windows",
            "Expected values worked out by hand, not copied from code",
            "Small tests with names that say what they check"] }] }, work(20), verify]
      : [plan, work(30), verify];
    window.PRACTICE_SESSIONS.push({ id: `ai-round-${n}`, track: "AI coding rounds", ai: true, tag, title: `Round ${n}: ${p.title}`, blurb, blocks });
  });
})();
