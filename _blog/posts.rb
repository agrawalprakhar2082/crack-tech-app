# encoding: UTF-8
# The blog's content. To add an article, copy one entry to the top of this list,
# edit it, then run:  ruby _blog/build.rb
POSTS = [
  {
    slug: "ai-agent-jargon",
    title: "AI Agent Jargon for Software Engineers: 20 Terms Mapped to Things You Already Know",
    category: "Agentic AI",
    date: "2026-11-01",
    minutes: 8,
    image: "https://cdn-images-1.medium.com/max/1024/1*etrIcHpHT8oYZ5zIQQVq6Q.png",
    medium: "https://medium.com/@cracktech.app/ai-agent-jargon-for-software-engineers-20-terms-mapped-to-things-you-already-know-3878bf36002f",
    teaser: "Model, harness, tool, skill, plugin, MCP, RAG: explained with code, not buzzwords.",
    summary: [
      "Most engineers nod along when agents, skills and context windows come up in meetings, but few can explain how the pieces fit together. None of it is magic. Almost every term maps to something you already know: a function, a buffer, a loop, a package, a protocol or a test suite.",
      "The article walks through 20 terms in five parts, from the basics of how a model works to keeping an agent honest. Each one gets a plain definition, a software analogy and the reason it matters."
    ],
    takeaways: [
      "The model is stateless. Context windows, token cost, memory and RAG all follow from that one fact.",
      "An agent is a model in a loop with tools, and its context grows on every step. That's why long tasks get slow and expensive.",
      "A tool call is only a request. Your code decides whether to run it, where, and with what permissions.",
      "A skill is like a lazily loaded module, a plugin is like a package, and MCP does for AI tools what LSP did for code editors.",
      "Evals are the test suite for AI. Without them, every prompt change is a guess."
    ]
  },
  {
    slug: "the-model-isnt-the-agent",
    title: "The Model Isn’t the Agent. The Harness Is.",
    category: "Agentic AI",
    date: "2026-10-28",
    minutes: 4,
    image: "https://cdn-images-1.medium.com/max/1024/1*mFRIOjPHFOwAHDnkNHCY4Q.png",
    medium: "https://medium.com/@cracktech.app/the-model-isnt-the-agent-the-harness-is-c0c3659efda2",
    teaser: "Why the same LLM can book your flight or loop forever, and what interviewers are actually testing.",
    summary: [
      "Give two teams the same model and you'll get two completely different agents. The difference is the harness: the code around the model that builds the prompt, chooses the tools, runs the loop, holds memory, decides when to stop and checks the work.",
      "Agentic AI interviews test this distinction, and most candidates blur it. The article explains what each part does, shows a real harness design, and gives you a better answer than “use a bigger model”."
    ],
    takeaways: [
      "When an agent fails, the harness is usually what broke, not the model.",
      "Before touching the model, answer three questions: where does the loop stop, what context does the model see, and how do you know it worked?",
      "A stronger model earns its cost only when the harness is solid and the agent still can't plan or call tools reliably.",
      "In an interview, name the harness pieces first, then talk about the model briefly."
    ]
  },
  {
    slug: "system-design-4-step-plan",
    title: "How I Attempt Any System Design Question: A Simple 4-Step Plan",
    category: "System Design",
    date: "2026-10-23",
    minutes: 5,
    image: "https://cdn-images-1.medium.com/max/1024/1*PxYLfXueqqhG5uzwQjII0A.png",
    medium: "https://medium.com/@cracktech.app/how-i-attempt-any-system-design-question-a-simple-4-step-plan-069465e1531f",
    teaser: "The same four steps work for Twitter, a calendar, a payment system or a messenger design.",
    summary: [
      "The most common system design mistake happens in the first minute: the candidate picks up the marker and starts drawing boxes before agreeing on what is being built. The fix isn't learning more technologies. It's following the same plan every time.",
      "The four steps are requirements, estimations, detailed design, and monitoring and alerting. The article applies them to a small Twitter-like app and shows how to split a 45-minute interview across them."
    ],
    takeaways: [
      "Agree on features first, then use CLASS for non-functional requirements: consistency, latency, availability, scalability and security.",
      "Use your estimates. Finding that a system is read-heavy should drive the rest of the design.",
      "Say why you chose a shard key, and point out the problem with your own choice.",
      "Start from a basic three-tier architecture, then grow it for the problem in front of you.",
      "Save time for monitoring. Most candidates run out of time before they reach it."
    ]
  },
  {
    slug: "design-calendar-system",
    title: "“Design Calendar System” Looks Easy. Here’s Where Candidates Fail.",
    category: "System Design",
    date: "2026-10-17",
    minutes: 7,
    image: "https://cdn-images-1.medium.com/max/1024/1*O3WDJHrAwfYXzEuSXz0Ifg.png",
    medium: "https://medium.com/@cracktech.app/designing-google-calendar-a-system-design-walkthrough-6d662403e5ed",
    teaser: "A read-heavy workload, fan-out on every write, and reminders that must fire on the exact minute.",
    summary: [
      "Create a meeting, invite people, show a grid of boxes. It sounds simple, but underneath are some of the most interesting problems in system design: fan-out on every write, notifications for every invitee, reminders for hundreds of millions of people, and recurring events that never really end.",
      "This walkthrough follows the structure used for a 45–60 minute interview: requirements, estimates, APIs, data model and high-level design, then the deep dives and the AI follow-up more interviewers now ask."
    ],
    takeaways: [
      "Calendar views should return summaries, not just IDs, to avoid an extra round trip on the hottest path.",
      "Use two tables with different shard keys, because “show my week” and “change this meeting” need different partitioning.",
      "Version every update. The organizer can edit from two devices at once.",
      "Capture changes with CDC, so an event can't be lost if a service crashes between writing the database and publishing.",
      "Reminders need a delay queue that survives retries and reschedules. AI belongs at the edges, not inside the core."
    ]
  }
]
