// Practice page (/practice/): pick a 45-minute session, answer against the clock
// (type or dictate; code in a real editor; draw designs on a whiteboard),
// save in this browser, then send the answers for review by email.
// Content lives in sessions.js. Built into practice/ by `ruby _blog/build.rb`.
(() => {
  /* ======================= Settings ======================= */
  // Where "Send for review" posts the answers: a Formspree form URL, e.g.
  // "https://formspree.io/f/abcdwxyz" (see CLAUDE.md, "Practice page").
  // While empty, sending opens an email to REVIEW_EMAIL instead (see sendByEmail).
  // Before launch, do one long test submission (a full session with a drawing) to
  // check Formspree accepts and emails everything.
  const FORM_ENDPOINT = "";
  const REVIEW_EMAIL = "hello@cracktech.app";
  const MINUTES = 45;
  // Formspree's free plan has no file uploads, so a whiteboard drawing is sent as
  // .excalidraw JSON text in its own field, up to this size; bigger ones are left out
  // and the candidate is asked to email the downloaded file instead.
  const MAX_DIAGRAM_CHARS = 60000;
  // Answers longer than this are trimmed in the submission (with a note), to stay
  // well inside what a form service accepts. A full 45-minute session is far below it.
  const MAX_ANSWER_CHARS = 100000;
  // A timer left running longer than this without the page open is paused at the
  // moment the page was last seen, so it doesn't count the hours you were away.
  const AWAY_PAUSE_MS = 15 * 60000;

  // Editor and whiteboard libraries, loaded only when a session needs them.
  // jsDelivr mirrors npm exactly; versions are pinned. unpkg is the fallback.
  const CDN = "https://cdn.jsdelivr.net/npm/";
  const ALT_CDN = "https://unpkg.com/";
  const CM = CDN + "codemirror@5.65.16/";
  const EXCALIDRAW_PATH = "@excalidraw/excalidraw@0.17.6/dist/";
  const REACT = [CDN + "react@18.3.1/umd/react.production.min.js", CDN + "react-dom@18.3.1/umd/react-dom.production.min.js"];

  const LANGS = {
    python:     { label: "Python",     mode: "python",          fence: "python",     file: "python/python" },
    java:       { label: "Java",       mode: "text/x-java",     fence: "java",       file: "clike/clike" },
    cpp:        { label: "C++",        mode: "text/x-c++src",   fence: "cpp",        file: "clike/clike" },
    javascript: { label: "JavaScript", mode: "text/javascript", fence: "javascript", file: "javascript/javascript" },
    typescript: { label: "TypeScript", mode: "text/typescript", fence: "typescript", file: "javascript/javascript" },
    go:         { label: "Go",         mode: "text/x-go",       fence: "go",         file: "go/go" },
    csharp:     { label: "C#",         mode: "text/x-csharp",   fence: "csharp",     file: "clike/clike" }
  };

  /* ======================= Helpers ======================= */
  const SESSIONS = window.PRACTICE_SESSIONS || [];
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const isQuota = e => e && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22 || e.code === 1014);
  // set() returns true, "quota" (storage full) or false (storage blocked).
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return isQuota(e) ? "quota" : false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const saveProblem = r => r === "quota" ? "Browser storage is full" : "This browser blocks storage";
  const PROFILE_KEY = "ct-practice:me";
  const sKey = id => "ct-practice:" + id;
  const bKey = id => "ct-practice:" + id + ":board";
  const slug = s => (s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const narrow = () => matchMedia("(max-width: 760px)").matches;
  const coarse = () => matchMedia("(pointer: coarse)").matches;
  const timeNow = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  // Load a script from jsDelivr, falling back to the same file on unpkg.
  // (jsDelivr minifies any file on request; unpkg serves files as published.)
  const altUrl = u => u.replace(CDN, ALT_CDN).replace(/(codemirror@[^/]+\/.*)\.min\.(js|css)$/, "$1.$2");
  const loaded = {};
  function loadOne(src) {
    return new Promise((ok, fail) => {
      const el = document.createElement("script");
      el.src = src; el.async = false; el.crossOrigin = "anonymous";
      el.onload = () => ok(src); el.onerror = () => { el.remove(); fail(new Error("Couldn't load " + src)); };
      document.head.appendChild(el);
    });
  }
  function loadScript(src) {
    if (!loaded[src]) loaded[src] = loadOne(src).catch(() => loadOne(altUrl(src))).catch(e => { delete loaded[src]; throw e; });
    return loaded[src];
  }
  function loadCss(href) {
    if (loaded[href]) return;
    loaded[href] = true;
    const el = document.createElement("link");
    el.rel = "stylesheet"; el.href = href; el.crossOrigin = "anonymous";
    el.onerror = () => { if (el.href !== altUrl(href)) el.href = altUrl(href); };
    document.head.appendChild(el);
  }
  const timeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error("timeout")), ms))]);

  // Prompt ids like "3-0" (block 3, prompt 0); flags per session.
  SESSIONS.forEach(s => {
    s.prompts = [];
    s.blocks.forEach((b, bi) => b.prompts.forEach((p, pi) => { p.id = bi + "-" + pi; p.block = bi; s.prompts.push(p); }));
    s.hasCode = s.prompts.some(p => p.kind === "code");
    s.total = s.prompts.length;
  });
  // An answer counts only when it has text, and isn't just the code we pre-filled.
  const answerOf = (p, st) => {
    const a = ((st && st.answers && st.answers[p.id]) || "").trim();
    return p.given && a === p.given.trim() ? "" : a;
  };
  const answeredCount = (s, st) => s.prompts.filter(p => answerOf(p, st)).length;

  /* ======================= Session list ======================= */
  const TRACKS = [
    { name: "Behavioral", note: "Stories with structure: situation, what you did, and the result." },
    { name: "System design", note: "Notes for each step, plus a whiteboard to draw your design." },
    { name: "Coding", note: "A code editor in your language, with tests and complexity." }
  ];
  function renderList() {
    $("#tracks").innerHTML = TRACKS.map(t => {
      const list = SESSIONS.filter(s => s.track === t.name);
      return `<section class="ptrack" aria-labelledby="t-${slug(t.name)}">
        <div class="ptrack-head"><h2 id="t-${slug(t.name)}">${esc(t.name)}</h2><p>${esc(t.note)}</p></div>
        <div class="session-grid">${list.map(s => {
          const st = store.get(sKey(s.id)), done = answeredCount(s, st);
          const badge = st && st.sentAt ? `<span class="badge sent">✓ Sent for review</span>`
            : done ? `<span class="badge">${done} of ${s.total} answered</span>` : `<span class="badge muted">${plural(s.total, "question")}</span>`;
          return `<a class="session-card" href="#${esc(s.id)}">
            <div class="session-meta"><span>${esc(s.tag || s.track)}</span><span>${MINUTES} min</span></div>
            <h3>${esc(s.title)}</h3><p>${esc(s.blurb)}</p>
            <div class="session-foot">${badge}<span class="go">${done ? "Continue" : "Start"} <span class="arr">→</span></span></div></a>`;
        }).join("")}</div></section>`;
    }).join("");
  }

  /* ======================= Workspace ======================= */
  let cur = null, state = null, saveT = null, tickT = null;
  let dirty = false, stale = false, applying = false; // unsaved local edits; another tab changed this session; applying another tab's data
  const editors = {};          // prompt id -> CodeMirror instance
  const blank = () => ({ answers: {}, elapsed: 0, runningSince: null, seenAt: null, sentAt: null, lang: "python", note: "" });

  function open(id) {
    const s = SESSIONS.find(x => x.id === id);
    if (!s) return close();
    leaveSession();
    stopDictation(true); destroyBoard();
    Object.keys(editors).forEach(k => delete editors[k]);
    cur = s; state = Object.assign(blank(), store.get(sKey(id)) || {}); dirty = false; stale = false;
    try { sessionStorage.setItem("ct-practice:open", id); } catch (e) {}
    if (!LANGS[state.lang]) state.lang = "python";
    let awayNote = "";
    if (state.runningSince && state.seenAt && Date.now() - state.seenAt > AWAY_PAUSE_MS) {
      state.elapsed += Math.max(0, state.seenAt - state.runningSince); state.runningSince = null;
      awayNote = "The timer was paused while you were away. Press Resume to continue.";
    }
    $("#list").hidden = true; $("#work").hidden = false;
    document.documentElement.classList.add("in-session");

    let t = 0;
    const agenda = s.blocks.map((b, i) => { const a = t; t += b.min; return `<li id="ag-${i}" style="--m:${b.min}"><button type="button" data-block="${i}"><b>${a}–${t} min</b><span>${esc(b.name)}</span></button></li>`; }).join("");
    $("#work").innerHTML = `
      <div class="work-bar"><div class="wrap work-bar-in">
        <a class="wb-back" href="#" aria-label="All sessions">← <span>All sessions</span></a>
        <div class="timer" role="group" aria-label="45-minute timer">
          <span class="clock" id="clock">45:00</span>
          <button class="btn btn-primary btn-sm" id="timerBtn" type="button">Start timer</button>
          <button class="icon-btn sm" id="timerReset" type="button" aria-label="Reset timer" title="Reset timer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg></button>
        </div>
        <span class="saved" id="saved"></span>
        <span class="phase" id="phase"></span>
        <span class="mic-live" id="micLive" aria-live="polite"></span>
      </div></div>
      <div class="wrap work">
        <div class="work-head">
          <div class="kicker">${esc(s.tag || s.track)} · ${MINUTES} minutes</div>
          <h1>${esc(s.title)}</h1>
          <p class="lede">${esc(s.blurb)}</p>
          <ol class="agenda" aria-label="Agenda: jump to a part">${agenda}</ol>
          <p class="hint">${hintFor(s)}</p>
          <p class="tab-warn" id="tabWarn" role="alert" hidden>This session is also open in another tab or window. Keep working in one of them, or your answers may overwrite each other.</p>
        </div>
        ${s.board ? boardSection() : ""}
        ${s.blocks.map((b, bi) => `<section class="block" id="block-${bi}" aria-labelledby="bh-${bi}">
          <div class="block-head"><h2 id="bh-${bi}"><span class="num">${String(bi + 1).padStart(2, "0")}</span>${esc(b.name)}</h2><span>${b.min} min</span></div>
          ${b.prompts.map(p => promptCard(p)).join("")}
        </section>`).join("")}
        ${submitPanel(s)}
      </div>`;

    s.prompts.forEach(p => {
      const ta = $("#a-" + p.id);
      // The "review the AI's code" answer starts as a copy of the AI's code to edit.
      ta.value = state.answers[p.id] || (p.given || "");
      count(p.id);
      ta.addEventListener("input", () => { if (!applying) { state.answers[p.id] = ta.value; queueSave(); } count(p.id); });
      if (p.kind === "code") ta.addEventListener("keydown", tabKey);
      else autoGrow(ta);
    });
    $$(".lang").forEach(sel => { sel.value = state.lang; sel.addEventListener("change", () => setLang(sel.value)); });
    $$(".agenda button").forEach(b => b.addEventListener("click", () => {
      const el = $("#block-" + b.dataset.block); el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      const p = cur.blocks[+b.dataset.block].prompts[0];
      setTimeout(() => { if (editors[p.id]) editors[p.id].focus(); else { const ta = $("#a-" + p.id); if (ta) ta.focus({ preventScroll: true }); } }, 400);
    }));
    const prof = store.get(PROFILE_KEY) || {};
    ["name", "email", "target"].forEach(f => { const el = $("#f-" + f); el.value = prof[f] || ""; el.addEventListener("input", saveProfile); });
    $("#f-note").value = state.note || "";
    $("#f-note").addEventListener("input", () => { state.note = $("#f-note").value; queueSave(); });
    $("#timerBtn").onclick = toggleTimer;
    $("#timerReset").onclick = resetTimer;
    $("#saveBtn").onclick = () => { const r = save(); flash(r === true ? "Saved in this browser. Come back any time to continue." : `${saveProblem(r)}. Download your answers to keep them.`, r !== true); };
    $("#sendBtn").onclick = send;
    $("#dlBtn").onclick = () => { const f = download(markdown({ withDiagram: true }), "md"); flash(`Downloaded ${f}.`); };
    $("#resetBtn").onclick = startOver;
    if (s.board) setupBoardButtons();
    setupDictation();
    if (s.hasCode) setupEditors();
    paintSaved();
    if (awayNote) { flash(awayNote); save(); }
    clearInterval(tickT); ticks = 0; tickT = setInterval(tick, 1000); tick();
    scrollTo(0, 0);
    document.title = `${s.title} — Practice — Crack Tech`;
    $("#work h1").setAttribute("tabindex", "-1"); $("#work h1").focus({ preventScroll: true });
  }

  function hintFor(s) {
    const parts = ["Start the timer and answer each part as you would out loud."];
    if (s.track !== "Coding") parts.push(SR ? "Type, or press <b>Dictate</b> and speak." : "Type your answers. (Dictation works in Chrome, Edge and Safari.)");
    if (s.board) parts.push("Draw your design on the whiteboard.");
    if (s.hasCode) parts.push("Pick your language for the code editor.");
    parts.push("Everything saves in this browser as you go.");
    return parts.join(" ");
  }

  function promptCard(p) {
    const code = p.kind === "code";
    const langSel = code ? `<label class="lang-pick">Language <select class="lang">${Object.entries(LANGS).map(([k, l]) => `<option value="${k}">${esc(l.label)}</option>`).join("")}</select></label>` : "";
    return `<article class="prompt${code ? " is-code" : ""}">
      <p class="q" id="q-${p.id}">${esc(p.q)}</p>
      ${p.given ? `<div class="given"><div class="given-label">The AI's code (Python)</div><pre><code id="g-${p.id}">${esc(p.given)}</code></pre></div>` : ""}
      ${code ? `<div class="editor-top">${langSel}<span class="editor-note" id="en-${p.id}"></span></div>` : ""}
      <textarea id="a-${p.id}" class="${code ? "ta-code" : "ta-text"}" spellcheck="${code ? "false" : "true"}" rows="${code ? 12 : 5}" placeholder="${code ? "Write your code here" : "Your answer"}" aria-labelledby="q-${p.id}"></textarea>
      <div class="interim" id="i-${p.id}" aria-hidden="true"></div>
      <div class="prompt-tools">
        ${code ? "" : `<button class="btn btn-outline btn-sm mic" type="button" data-p="${p.id}" aria-pressed="false" aria-describedby="q-${p.id}" hidden><span class="dot"></span><span class="mic-label">Dictate</span></button><span class="mic-state" id="ms-${p.id}" aria-live="polite"></span>`}
        <span class="count" id="c-${p.id}"></span>
      </div>
      <details class="look"><summary>What interviewers look for</summary><ul>${p.look.map(l => `<li>${esc(l)}</li>`).join("")}</ul>
        <p class="pnote">Answer first, then compare.</p></details>
    </article>`;
  }

  function submitPanel(s) {
    const viaEmail = !FORM_ENDPOINT;
    return `<section class="submit" id="submit" aria-labelledby="send-h">
      <div class="block-head"><h2 id="send-h">Send for review</h2><span>When you're ready</span></div>
      <p class="hint">Add your name and email and send your answers to Crack Tech. We'll review them and reply to the email you give here.</p>
      <div class="fields">
        <label>Name<input id="f-name" type="text" autocomplete="name" required></label>
        <label>Email<input id="f-email" type="email" autocomplete="email" inputmode="email" required></label>
        <label class="wide">Target role or company <small>(optional)</small><input id="f-target" type="text" placeholder="e.g. Senior engineer, fintech"></label>
        <label class="wide">Anything you'd like feedback on? <small>(optional)</small><textarea id="f-note" rows="3"></textarea></label>
      </div>
      <label class="consent"><input id="f-consent" type="checkbox"><span>I agree to send these answers${s.board ? ", my drawing" : ""}, my name and email to Crack Tech for review.</span></label>
      <div class="hp" aria-hidden="true"><label>Leave this empty<input id="f-hp" type="text" tabindex="-1" autocomplete="off"></label></div>
      ${viaEmail ? `<p class="via-email"><b>How sending works:</b> an email to ${esc(REVIEW_EMAIL)} opens with your answers in it${coarse() ? " (or your phone's share menu opens so you can pick your email app)" : ""}. Long answers are saved as one file to attach instead. Then press send.</p>` : ""}
      <div class="submit-actions">
        <button class="btn btn-primary" id="sendBtn" type="button">Send for review <span class="arr">→</span></button>
        <button class="btn btn-outline" id="saveBtn" type="button">Save</button>
        <button class="btn btn-outline" id="dlBtn" type="button">Download my answers</button>
      </div>
      <p class="status" id="status" role="status" aria-live="polite"></p>
      ${s.after ? `<p class="after">Finished? <a href="${esc(s.after.href)}">${esc(s.after.label)} →</a></p>` : ""}
      <div class="submit-foot">
        <p class="pnote">Your answers stay in this browser until you send them. Prefer live feedback? <a href="/#book">Book a mock interview</a>.</p>
        <button class="link-btn" id="resetBtn" type="button">Start this session over</button>
      </div>
    </section>`;
  }

  function close() {
    leaveSession();
    try { sessionStorage.removeItem("ct-practice:open"); } catch (e) {}
    stopDictation(true); destroyBoard();
    clearInterval(tickT); cur = null;
    $("#work").hidden = true; $("#work").innerHTML = ""; $("#list").hidden = false;
    document.documentElement.classList.remove("in-session");
    document.title = "Practice interviews — Crack Tech";
    renderList();
  }

  function count(id) {
    const v = (state.answers[id] || "").trim();
    const el = $("#c-" + id); if (!el) return;
    const p = cur.prompts.find(x => x.id === id);
    el.textContent = !v || (p.given && v === p.given.trim()) ? "" : p.kind === "code" ? plural(v.split("\n").length, "line") : plural(v.split(/\s+/).length, "word");
  }
  function autoGrow(ta) {
    const fit = () => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight + 2, 640) + "px"; };
    ta.addEventListener("input", fit); requestAnimationFrame(fit);
  }
  function tabKey(e) {
    if (e.key !== "Tab" || e.shiftKey) return;
    e.preventDefault();
    const ta = e.target, a = ta.selectionStart, b = ta.selectionEnd;
    ta.value = ta.value.slice(0, a) + "    " + ta.value.slice(b);
    ta.selectionStart = ta.selectionEnd = a + 4;
    ta.dispatchEvent(new Event("input"));
  }
  // Two-step confirm for destructive buttons: the first click arms the button, a second click within 4 s acts.
  const armed = {};
  function confirmTwice(btn, armedText, act) {
    const k = btn.id, iconOnly = !btn.textContent.trim();
    const restore = () => {
      btn.classList.remove("armed");
      btn.innerHTML = btn.dataset.html;
      if (iconOnly) { btn.setAttribute("aria-label", btn.dataset.aria); btn.title = btn.dataset.aria; }
    };
    if (!armed[k]) {
      btn.dataset.html = btn.innerHTML; btn.dataset.aria = btn.getAttribute("aria-label") || "";
      if (iconOnly) { btn.textContent = "Reset?"; btn.setAttribute("aria-label", armedText); btn.title = armedText; } else btn.textContent = armedText;
      btn.classList.add("armed");
      armed[k] = setTimeout(() => { delete armed[k]; if (btn.isConnected) restore(); }, 4000);
      return;
    }
    clearTimeout(armed[k]); delete armed[k]; restore();
    act();
  }
  function startOver() {
    confirmTwice($("#resetBtn"), "Click again to clear this session's answers, timer and drawing", () => {
      const lang = state.lang;
      store.del(sKey(cur.id)); store.del(bKey(cur.id)); delete memScene[cur.id];
      state = Object.assign(blank(), { lang });
      store.set(sKey(cur.id), state);
      const id = cur.id; cur = null; open(id);
      flash("Cleared. Fresh start.");
    });
  }

  /* ======================= Saving ======================= */
  let lastSave = true;
  function queueSave() { dirty = true; clearTimeout(saveT); saveT = setTimeout(save, 500); }
  // Writes this tab's whole session. Never runs while another tab's newer changes are unresolved.
  function save() {
    if (!cur) return true;
    clearTimeout(saveT);
    if (stale) { paintSaved(); return "stale"; }
    state.seenAt = Date.now();
    const r = store.set(sKey(cur.id), state);
    if (r !== true && lastSave === true) flash(`${saveProblem(r)}, so your answers aren't being saved here. Download them to keep them.`, true);
    lastSave = r; if (r === true) dirty = false;
    paintSaved();
    return r;
  }
  // Change only some fields of the stored copy (read, modify, write), so a tab
  // with old data in memory never overwrites another tab's newer answers.
  function patchStored(fn) {
    if (!cur) return;
    const st = store.get(sKey(cur.id)); if (!st) return;
    fn(st); store.set(sKey(cur.id), st);
  }
  function touchSeen() { const now = Date.now(); state.seenAt = now; patchStored(st => { st.seenAt = now; }); }
  // Write everything pending right now: before switching or leaving a session, and when the page hides.
  function flush() {
    if (!cur || !state) return;
    clearTimeout(saveT);
    if (dirty) save(); else touchSeen();
    flushBoard();
  }
  // Leaving a session (back to the list, or to another session): write pending work and pause its timer.
  function leaveSession() {
    if (!cur || !state) return;
    flush();
    if (state.runningSince) {
      const now = Date.now();
      state.elapsed = elapsed(); state.runningSince = null;
      patchStored(st => { if (st.runningSince) { st.elapsed += now - st.runningSince; st.runningSince = null; } });
    }
  }
  function paintSaved() {
    const el = $("#saved"); if (!el || !state) return;
    el.classList.toggle("bad", lastSave !== true || stale);
    el.textContent = stale ? "Not saving (see note)" : lastSave !== true ? "Not saved" : state.sentAt ? "Sent " + new Date(state.sentAt).toLocaleDateString() : state.seenAt ? "Saved " + new Date(state.seenAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "";
  }
  function saveProfile() {
    store.set(PROFILE_KEY, { name: $("#f-name").value.trim(), email: $("#f-email").value.trim(), target: $("#f-target").value.trim() });
  }
  function flash(msg, bad) { const el = $("#status"); if (!el) return; el.textContent = msg; el.classList.toggle("bad", !!bad); }

  // The same session open in another tab: never overwrite its newer data silently.
  // With no unsaved edits here, this tab takes the other tab's data; otherwise it stops
  // saving and asks which version to keep.
  const contentKey = st => JSON.stringify([st.answers || {}, st.note || "", st.lang, st.elapsed || 0, st.runningSince || null, st.sentAt || null]);
  addEventListener("storage", e => {
    if (!cur) return;
    if (e.key === sKey(cur.id)) {
      const theirs = store.get(e.key); if (!theirs) return;
      if (contentKey(theirs) === contentKey(state)) { state.seenAt = theirs.seenAt; return; }
      if (dirty || stale) return markStale();
      adopt(theirs); tabNote("updated");
    } else if (e.key === bKey(cur.id)) {
      const theirs = store.get(e.key); if (!theirs) return;
      if (board && board.pending) return markStale();
      adoptBoard(theirs); tabNote("updated");
    }
  });
  function markStale() { stale = true; clearTimeout(saveT); paintSaved(); tabNote("stale"); }
  function tabNote(kind) {
    const w = $("#tabWarn"); if (!w) return;
    w.hidden = false; w.classList.toggle("stale", kind === "stale");
    w.innerHTML = kind === "stale"
      ? `<b>This session changed in another tab while you were editing here.</b> This tab has stopped saving so nothing gets overwritten. Which answers do you want to keep?<span class="tab-actions"><button class="btn btn-primary btn-sm" type="button" data-keep="theirs">Load the other tab's answers</button><button class="btn btn-outline btn-sm" type="button" data-keep="mine">Keep this tab's answers</button></span>`
      : "This session is also open in another tab. This tab now shows its latest answers.";
    w.querySelectorAll("[data-keep]").forEach(b => b.onclick = () => {
      stale = false;
      if (b.dataset.keep === "theirs") { adopt(store.get(sKey(cur.id)) || blank()); const sb = store.get(bKey(cur.id)); if (sb) adoptBoard(sb); }
      else { save(); if (board && board.pending) writeBoard(board.pending); }
      tabNote("updated"); w.textContent = b.dataset.keep === "theirs" ? "Loaded the answers from the other tab." : "Kept this tab's answers. Close the other tab to avoid mixing them up.";
    });
  }
  // Show another tab's saved data here without marking it as a local edit.
  function adopt(theirs) {
    state = Object.assign(blank(), theirs); dirty = false;
    applying = true;
    cur.prompts.forEach(p => {
      const v = state.answers[p.id] || (p.given || "");
      if (editors[p.id]) { if (editors[p.id].getValue() !== v) editors[p.id].setValue(v); }
      else { const ta = $("#a-" + p.id); if (ta && ta.value !== v) { ta.value = v; ta.dispatchEvent(new Event("input")); } }
      count(p.id);
    });
    applying = false;
    if (LANGS[state.lang]) applyLang(state.lang);
    const note = $("#f-note"); if (note) note.value = state.note || "";
    paintSaved(); tick();
  }
  function adoptBoard(theirs) {
    const sc = liveOnly(theirs); memScene[cur.id] = sc;
    if (board && board.api && board.lib) { board.version = board.lib.getSceneVersion(sc.elements); board.api.updateScene({ elements: sc.elements }); board.pending = null; }
    paintBoardNote();
  }

  /* ======================= Timer ======================= */
  const elapsed = () => state.elapsed + (state.runningSince ? Date.now() - state.runningSince : 0);
  function toggleTimer() {
    if (state.runningSince) { state.elapsed = elapsed(); state.runningSince = null; }
    else state.runningSince = Date.now();
    save(); tick();
  }
  function resetTimer() {
    if (!elapsed()) return;
    confirmTwice($("#timerReset"), "Click again to reset the timer", () => { state.elapsed = 0; state.runningSince = null; save(); tick(); });
  }
  function tick() {
    if (!cur || !$("#clock")) return;
    const ms = elapsed(), left = MINUTES * 60 - Math.floor(ms / 1000), a = Math.abs(left);
    const clock = $("#clock");
    clock.textContent = (left < 0 ? "+" : "") + String(Math.floor(a / 60)).padStart(2, "0") + ":" + String(a % 60).padStart(2, "0");
    clock.classList.toggle("over", left < 0);
    clock.classList.toggle("low", left >= 0 && left < 300 && ms > 0);
    $("#timerBtn").textContent = state.runningSince ? "Pause" : ms ? "Resume" : "Start timer";
    const mins = ms / 60000; let t = 0, at = -1;
    cur.blocks.forEach((b, i) => { if (at < 0 && mins < t + b.min) at = i; t += b.min; });
    cur.blocks.forEach((_, i) => { const el = $("#ag-" + i); if (el) { el.classList.toggle("now", ms > 0 && i === at); el.classList.toggle("past", ms > 0 && (at < 0 || i < at)); } });
    $("#phase").textContent = !ms ? "" : at < 0 ? "Time's up: wrap up and send" : `Now: ${cur.blocks[at].name}`;
    // Remember when the page was last open, so a timer left running can be paused at that point.
    // (By time, not by tick count: background tabs tick less often.)
    if (state.runningSince && Date.now() - (state.seenAt || 0) > 15000) touchSeen();
  }

  /* ======================= Code editor (CodeMirror 5) ======================= */
  let cmReady = null;
  function loadCodeMirror() {
    if (!cmReady) {
      loadCss(CM + "lib/codemirror.min.css");
      const files = [...new Set(Object.values(LANGS).map(l => l.file))];
      cmReady = timeout(loadScript(CM + "lib/codemirror.min.js"), 15000)
        .then(() => Promise.all([
          ...files.map(f => loadScript(CM + "mode/" + f + ".min.js")),
          loadScript(CM + "addon/edit/matchbrackets.min.js"),
          loadScript(CM + "addon/edit/closebrackets.min.js"),
          loadScript(CM + "addon/display/placeholder.min.js")
        ]))
        .catch(e => { cmReady = null; throw e; });
    }
    return cmReady;
  }
  function setupEditors() {
    const session = cur;
    $$(".editor-note").forEach(el => { el.textContent = "Loading editor…"; });
    loadCodeMirror().then(() => {
      if (cur !== session || !window.CodeMirror) return;
      session.prompts.forEach(p => {
        if (p.kind !== "code") return;
        const ta = $("#a-" + p.id);
        ta.placeholder = `Write your ${LANGS[state.lang].label} code here`;
        const cm = CodeMirror.fromTextArea(ta, {
          mode: LANGS[state.lang].mode, theme: "ct", lineNumbers: true, indentUnit: 4, tabSize: 4,
          indentWithTabs: false, matchBrackets: true, autoCloseBrackets: true, lineWrapping: narrow(),
          viewportMargin: Infinity, inputStyle: "contenteditable", screenReaderLabel: p.q.slice(0, 160),
          extraKeys: { Tab: c => c.somethingSelected() ? c.indentSelection("add") : c.replaceSelection("    ", "end"), "Shift-Tab": c => c.indentSelection("subtract"), Esc: c => c.getInputField().blur() }
        });
        cm.on("change", () => { if (!applying) { state.answers[p.id] = cm.getValue(); queueSave(); } count(p.id); });
        editors[p.id] = cm;
        $("#en-" + p.id).textContent = p.given ? "Starts as the AI's code: edit it · Esc leaves the editor" : "Tab indents · Esc leaves the editor";
        if (p.given) {
          const g = $("#g-" + p.id), pre = g.parentElement;
          const view = CodeMirror(el => pre.replaceWith(el), { value: p.given, mode: "python", theme: "ct", readOnly: "nocursor", lineNumbers: true, lineWrapping: true, viewportMargin: Infinity });
          view.getWrapperElement().classList.add("cm-given");
        }
      });
    }).catch(() => {
      if (cur !== session) return;
      $$(".editor-note").forEach(el => { el.textContent = "Simple editor (the code editor couldn't load). Your code still saves."; });
    });
  }
  function setLang(lang) {
    if (!LANGS[lang]) return;
    state.lang = lang; queueSave(); applyLang(lang);
  }
  function applyLang(lang) {
    $$(".lang").forEach(s => { s.value = lang; });
    Object.values(editors).forEach(cm => { cm.setOption("mode", LANGS[lang].mode); cm.setOption("placeholder", `Write your ${LANGS[lang].label} code here`); });
  }

  /* ======================= Whiteboard (Excalidraw) ======================= */
  let board = null;           // { root, api, theme, saveT, version, lib, session, pending }
  const memScene = {};        // session id -> latest scene from the canvas, even if storage is full
  function boardSection() {
    return `<section class="board" id="board" aria-labelledby="board-h">
      <div class="block-head"><h2 id="board-h"><span class="num">✎</span>Whiteboard</h2><span>Use it through the session</span></div>
      <p class="hint">Sketch boxes, arrows and data flow as you would on the interview whiteboard. Your drawing saves in this browser and is included when you send for review.</p>
      <div class="board-tools">
        <button class="btn btn-primary btn-sm" id="boardOpen" type="button" aria-expanded="false" aria-controls="boardFrame">Open whiteboard</button>
        <button class="btn btn-outline btn-sm" id="boardFull" type="button" hidden>Full screen</button>
        <button class="btn btn-outline btn-sm" id="boardPng" type="button">Download PNG</button>
        <button class="btn btn-outline btn-sm" id="boardFile" type="button">Download .excalidraw</button>
        <span class="board-note" id="boardNote"></span>
      </div>
      <div class="board-frame" id="boardFrame" hidden role="region" aria-label="Whiteboard">
        <div class="board-bar"><b>Whiteboard</b><span id="boardSaved"></span><button class="btn btn-primary btn-sm" id="boardExit" type="button">Exit full screen</button></div>
        <div class="board-canvas" id="boardCanvas"></div>
      </div>
    </section>`;
  }
  const liveOnly = sc => sc && sc.elements ? Object.assign({}, sc, { elements: sc.elements.filter(e => !e.isDeleted) }) : null;
  // The latest drawing: what's on the canvas now, or what was saved.
  function boardScene() {
    const sc = liveOnly(memScene[cur.id] || store.get(bKey(cur.id)));
    return sc && sc.elements.length ? sc : null;
  }
  function paintBoardNote() {
    const sc = boardScene(), n = sc ? sc.elements.length : 0;
    const el = $("#boardNote"); if (el) el.textContent = n ? `${plural(n, "shape")} drawn` : "Nothing drawn yet";
  }
  function setupBoardButtons() {
    paintBoardNote();
    $("#boardOpen").onclick = () => { if ($("#boardFrame").hidden) openBoard(); else closeBoardPanel(); };
    $("#boardFull").onclick = () => setFull(true);
    $("#boardExit").onclick = () => setFull(false);
    $("#boardPng").onclick = downloadPng;
    $("#boardFile").onclick = () => { const f = downloadScene(); flash(f ? `Downloaded ${f}. Open it at excalidraw.com (menu → Open).` : "Nothing drawn yet.", !f); };
  }
  // Full screen: the rest of the page is made inert so keyboard focus stays on the board.
  let inerted = [];
  function setFull(on) {
    const frame = $("#boardFrame"); if (!frame) return;
    frame.classList.toggle("full", on);
    document.documentElement.classList.toggle("board-full", on);
    inerted.forEach(el => { el.inert = false; }); inerted = [];
    if (on) {
      let node = frame;
      while (node && node !== document.body) {
        [...node.parentElement.children].forEach(sib => { if (sib !== node && !sib.inert && sib.tagName !== "SCRIPT") { sib.inert = true; inerted.push(sib); } });
        node = node.parentElement;
      }
      // Focus the canvas so drawing shortcuts (R, O, A…) work straight away; Exit is one Shift+Tab away.
      const canvasBox = $("#boardCanvas .excalidraw"); (canvasBox && canvasBox.tabIndex >= 0 ? canvasBox : $("#boardExit")).focus();
    } else if ($("#boardFull") && !$("#boardFull").hidden) $("#boardFull").focus();
  }
  function loadExcalidraw() {
    const tryFrom = base => {
      window.EXCALIDRAW_ASSET_PATH = base + EXCALIDRAW_PATH; // fonts load from the same host as the script
      const react = REACT.map(u => u.replace(CDN, base));
      return loadOne(react[0]).then(() => loadOne(react[1])).then(() => loadOne(base + EXCALIDRAW_PATH + "excalidraw.production.min.js"));
    };
    if (!loaded.excalidraw) loaded.excalidraw = timeout(
      (window.ExcalidrawLib ? Promise.resolve() : tryFrom(CDN).catch(() => tryFrom(ALT_CDN))), 30000)
      .then(() => { if (!window.ExcalidrawLib) throw new Error("Excalidraw missing"); return window.ExcalidrawLib; })
      .catch(e => { delete loaded.excalidraw; throw e; });
    return loaded.excalidraw;
  }
  const pageTheme = () => document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  function openBoard() {
    const session = cur;
    $("#boardFrame").hidden = false; $("#boardFull").hidden = false;
    $("#boardOpen").textContent = "Hide whiteboard"; $("#boardOpen").setAttribute("aria-expanded", "true");
    // Phones and tablets get the board full screen; elsewhere, scroll it into view below the bar.
    if (coarse()) setFull(true); else requestAnimationFrame(() => $("#board").scrollIntoView({ block: "start" }));
    if (board) return;
    $("#boardCanvas").innerHTML = `<p class="board-loading">Loading the whiteboard…</p>`;
    loadExcalidraw().then(lib => {
      if (cur !== session || board) return;
      const saved = memScene[session.id] || store.get(bKey(session.id)) || {};
      board = { root: ReactDOM.createRoot($("#boardCanvas")), api: null, theme: pageTheme(), saveT: null, version: -1, lib, session, pending: null };
      board.initial = {
        elements: (saved.elements || []).filter(e => !e.isDeleted),
        appState: { viewBackgroundColor: (saved.appState && saved.appState.viewBackgroundColor) || "#ffffff", currentItemFontFamily: 1 },
        files: saved.files || {},
        scrollToContent: true
      };
      renderBoard();
      board.observer = new MutationObserver(() => { if (board && board.theme !== pageTheme()) { board.theme = pageTheme(); renderBoard(); } });
      board.observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }).catch(() => {
      if (cur !== session) return;
      $("#boardCanvas").innerHTML = `<p class="board-loading">The whiteboard couldn't load (check your connection or ad blocker). You can draw on paper and describe the design in your notes, or <a href="https://excalidraw.com" target="_blank" rel="noopener">use excalidraw.com</a> and attach the file when you send.</p>`;
    });
  }
  function renderBoard() {
    const { lib } = board;
    board.root.render(React.createElement(lib.Excalidraw, {
      initialData: board.initial,
      theme: board.theme,
      excalidrawAPI: api => { if (board) board.api = api; },
      onChange: (elements, appState, files) => queueBoardSave(elements, appState, files),
      // Images are turned off: they would quickly fill browser storage and the review email.
      UIOptions: { tools: { image: false }, canvasActions: { loadScene: true, saveToActiveFile: false, export: false, saveAsImage: true, toggleTheme: false, changeViewBackgroundColor: true, clearCanvas: true } },
      name: cur ? cur.title : "Practice"
    }, mainMenu(lib)));
  }
  // The canvas menu with only the drawing actions (no links to Excalidraw's socials).
  function mainMenu(lib) {
    const M = lib.MainMenu, D = M && M.DefaultItems, h = React.createElement;
    if (!D) return null;
    return h(M, null, h(D.LoadScene), h(D.SaveAsImage), h(D.ClearCanvas), h(D.Help), h(D.ChangeCanvasBackground));
  }
  function queueBoardSave(elements, appState, files) {
    if (!board || !board.lib) return;
    const v = board.lib.getSceneVersion(elements);
    if (v === board.version) return;
    board.version = v;
    const session = board.session;
    const live = elements.filter(e => !e.isDeleted);
    const used = {}; live.forEach(e => { if (e.fileId && files && files[e.fileId]) used[e.fileId] = files[e.fileId]; });
    memScene[session.id] = { elements: live, appState: { viewBackgroundColor: appState.viewBackgroundColor }, files: used };
    board.pending = session.id;
    if (cur === session) paintBoardNote();
    clearTimeout(board.saveT);
    board.saveT = setTimeout(() => writeBoard(session.id), 700);
  }
  function writeBoard(id) {
    if (board) clearTimeout(board.saveT);
    const sc = memScene[id]; if (!sc) return;
    if (stale) { if (board) board.pending = id; return; }
    const r = store.set(bKey(id), Object.assign({ savedAt: Date.now() }, sc));
    if (board) board.pending = r === true ? null : id; // keep trying (on the next change, leave or hide) if storage was full
    if (cur && cur.id === id) {
      const el = $("#boardSaved"); if (el) el.textContent = r === true ? "Saved " + timeNow() : `${saveProblem(r)}: download your drawing to keep it`;
      const note = $("#boardNote"); if (note && r !== true) note.textContent = `${saveProblem(r)}: download your drawing`;
    }
  }
  function flushBoard() { if (board && board.pending) writeBoard(board.pending); }
  function closeBoardPanel() {
    setFull(false);
    $("#boardFrame").hidden = true; $("#boardFull").hidden = true;
    $("#boardOpen").textContent = "Open whiteboard"; $("#boardOpen").setAttribute("aria-expanded", "false");
  }
  function destroyBoard() {
    if (inerted.length) { inerted.forEach(el => { el.inert = false; }); inerted = []; }
    document.documentElement.classList.remove("board-full");
    if (!board) return;
    flushBoard();
    if (board.observer) board.observer.disconnect();
    try { board.root.unmount(); } catch (e) {}
    board = null;
  }
  // The .excalidraw file format: plain JSON that excalidraw.com opens (menu → Open).
  function sceneJson(sc) {
    return JSON.stringify({ type: "excalidraw", version: 2, source: "https://cracktech.app/practice/", elements: sc.elements, appState: { viewBackgroundColor: (sc.appState && sc.appState.viewBackgroundColor) || "#ffffff", gridSize: null }, files: sc.files || {} });
  }
  function downloadScene() {
    const sc = boardScene(); if (!sc) return null;
    return saveFile(sceneJson(sc), fileBase() + ".excalidraw", "application/json");
  }
  function downloadPng() {
    const sc = boardScene();
    if (!sc) return flash("Nothing drawn yet.", true);
    flash("Preparing your image…");
    loadExcalidraw().then(lib => lib.exportToBlob({
      elements: sc.elements, files: sc.files || {}, mimeType: "image/png",
      appState: { exportBackground: true, viewBackgroundColor: (sc.appState && sc.appState.viewBackgroundColor) || "#ffffff", exportWithDarkMode: false, exportScale: 2 }
    })).then(blob => { const f = saveFile(blob, fileBase() + ".png"); flash(`Downloaded ${f}.`); })
      .catch(() => flash("Couldn't make the image. Download the .excalidraw file instead.", true));
  }

  /* ======================= Dictation (Web Speech API) ======================= */
  // Chrome ends recognition after silence, after a while, and whenever the tab is
  // hidden. We keep the user's intent (wanted) and restart until they press Stop.
  // Text already transcribed is never lost or added twice: each recognition run
  // remembers which final results it has written (and skips cumulative repeats that
  // Android sends), and whenever a run is cut short (tab hidden, another question
  // picked) its unfinished words are written once and the run is closed.
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, target = null, lastTarget = null, wanted = false, fails = 0, restartT = null, micState = "stopped", heard = false;
  function setupDictation() {
    if (!SR) return;
    $$(".mic").forEach(b => { b.hidden = false; b.onclick = () => (target === b.dataset.p && wanted) ? stopDictation() : startDictation(b.dataset.p); });
    paintMics();
  }
  function appendText(id, text) {
    text = text.trim(); if (!text) return;
    const ta = $("#a-" + id); if (!ta) return;
    const v = ta.value;
    ta.value = v + (v && !/\s$/.test(v) ? " " : "") + text;
    ta.dispatchEvent(new Event("input"));
  }
  function startDictation(id) {
    if (rec && target && target !== id) closeRun(true); // keep the previous question's unfinished words
    stopDictation(true);
    target = lastTarget = id; wanted = true; fails = 0; heard = false;
    if (document.hidden) setMic("paused"); else beginRun();
  }
  function beginRun() {
    clearTimeout(restartT);
    if (!wanted || !target || rec) return;
    const r = new SR(), done = new Set(), id = target;
    r.lang = navigator.language || "en-US";
    r.continuous = true; r.interimResults = true;
    r.pending = ""; r.closed = false; r.target = id; r.lastFinal = "";
    r.onstart = () => { heard = true; };
    r.onresult = e => {
      if (r.closed) return;
      fails = 0; heard = true;
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) {
          if (done.has(i)) continue;
          done.add(i);
          let text = res[0].transcript.trim();
          // Some phones repeat everything said so far in each new final result. Treat a final as
          // a repeat only when it extends the previous one at a word boundary and that one had
          // at least two words (or repeats were already seen in this run), so normal separate
          // phrases like "I" then "I led the migration" are kept.
          const prev = r.lastFinal, low = text.toLowerCase(), plow = prev.toLowerCase();
          if (prev && (r.cumulative || prev.split(/\s+/).length >= 2) && low.startsWith(plow + " ")) { r.cumulative = true; r.lastFinal = text; text = text.slice(prev.length); }
          else if (prev && r.cumulative && low === plow) text = "";
          else r.lastFinal = text;
          appendText(id, text);
        } else interim += res[0].transcript;
      }
      r.pending = interim;
      const el = $("#i-" + id); if (el) el.textContent = interim;
    };
    r.onerror = e => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wanted = false;
        // After it has worked once, this usually means the browser paused the mic (e.g. the phone locked), not a block.
        setMic(heard ? "tap" : "blocked");
      } else if (e.error !== "no-speech" && e.error !== "aborted") fails++;
    };
    r.onend = () => {
      if (rec === r) rec = null;
      const el = $("#i-" + id); if (el) el.textContent = "";
      if (r.userStopped) { finishRun(r, id); return; }
      if (r.closed || !wanted || target !== id) return;
      if (document.hidden) return setMic("paused");
      if (fails >= 3) { wanted = false; return setMic("failed"); }
      restartT = setTimeout(beginRun, fails ? 800 * fails : 150);
    };
    rec = r;
    try { r.start(); setMic("listening"); }
    catch (e) { rec = null; fails++; restartT = setTimeout(beginRun, 600); }
  }
  // Write any unfinished words once, then close the run so nothing arrives twice.
  function closeRun(commit) {
    const r = rec; if (!r) return;
    if (commit && r.pending && r.target) appendText(r.target, r.pending);
    r.pending = ""; r.closed = true; rec = null;
    const el = $("#i-" + r.target); if (el) el.textContent = "";
    try { r.abort(); } catch (e) {}
  }
  // After Stop, the browser delivers the last words as final results, then ends.
  // Words still unfinished at that point are written once, then the run is closed.
  function finishRun(r, id) {
    if (r.closed) return;
    r.closed = true;
    if (r.pending && r.pending.trim()) appendText(id, r.pending);
  }
  function stopDictation(silent) {
    clearTimeout(restartT);
    wanted = false;
    if (rec) {
      const r = rec, id = r.target; rec = null;
      if (silent) { r.closed = true; try { r.abort(); } catch (e) {} }
      else {
        r.userStopped = true;
        try { r.stop(); } catch (e) {}
        setTimeout(() => { finishRun(r, id); try { r.abort(); } catch (e) {} }, 2000);
      }
    }
    target = null;
    setMic("stopped");
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) flush();
    if (!wanted || !target) return;
    if (document.hidden) { closeRun(true); setMic("paused"); }
    else { fails = 0; beginRun(); }
  });
  function setMic(s) { micState = s; paintMics(); }
  function paintMics() {
    const labels = { listening: "Listening… speak your answer", paused: "Paused while this tab is hidden. It picks up again when you come back.", stopped: "", blocked: "Microphone blocked. Allow it in your browser's site settings to dictate.", tap: "Dictation paused. Tap Dictate to continue.", failed: "Dictation stopped (the speech service didn't respond). Press Dictate to try again." };
    $$(".mic").forEach(b => {
      const on = b.dataset.p === target && wanted;
      b.setAttribute("aria-pressed", String(on));
      b.classList.toggle("on", on); b.classList.toggle("paused", on && micState === "paused");
      b.querySelector(".mic-label").textContent = on ? "Stop" : "Dictate";
      const st = $("#ms-" + b.dataset.p);
      if (st) st.textContent = b.dataset.p === (target || lastTarget) ? labels[micState] || "" : "";
    });
    const live = $("#micLive");
    if (live) {
      const blockName = target && cur ? cur.blocks[+target.split("-")[0]].name : "";
      live.textContent = wanted && micState === "listening" ? `● Dictating: ${blockName}` : wanted && micState === "paused" ? "Dictation paused" : "";
      live.classList.toggle("on", wanted && micState === "listening");
    }
  }

  /* ======================= Export and send ======================= */
  const fileBase = () => (slug($("#f-name") ? $("#f-name").value : "") || "practice") + "-" + cur.id;
  function fmtTime(ms) { const m = Math.round(ms / 60000); return m ? `${m} min` : "timer not used"; }
  // A code fence longer than any run of backticks inside the text, so answers can't break out of it.
  function fence(text, lang) {
    const longest = Math.max(2, ...(String(text).match(/`+/g) || []).map(s => s.length));
    const f = "`".repeat(longest + 1);
    return `${f}${lang || ""}\n${text}\n${f}\n\n`;
  }
  // withDiagram: put the drawing's .excalidraw JSON in the file, so one file carries everything.
  function markdown(opts) {
    opts = opts || {};
    const s = cur, f = id => ($("#f-" + id).value || "").trim(), lang = LANGS[state.lang];
    let md = `# Practice: ${s.title}\n\n${s.tag || s.track} · ${MINUTES}-minute session\n\n`;
    md += `- Name: ${f("name") || "-"}\n- Email: ${f("email") || "-"}\n- Target: ${f("target") || "-"}\n- Time used: ${fmtTime(elapsed())}\n- Answered: ${answeredCount(s, state)} of ${s.total}\n`;
    if (s.hasCode) md += `- Language: ${lang.label}\n`;
    md += `- Date: ${new Date().toLocaleString()}\n\n`;
    if (f("note")) md += `## Feedback request\n\n${f("note")}\n\n`;
    if (s.board) {
      const sc = boardScene();
      md += `## Whiteboard\n\n`;
      if (!sc) md += "_(nothing drawn)_\n\n";
      else if (opts.diagramNote) md += opts.diagramNote + "\n\n";
      else if (opts.withDiagram) md += `${plural(sc.elements.length, "shape")}. To see the drawing, copy the JSON below into a file ending in .excalidraw and open it at excalidraw.com (menu → Open).\n\n` + fence(sceneJson(sc), "json");
      else md += `${plural(sc.elements.length, "shape")}.\n\n`;
    }
    s.blocks.forEach((b, bi) => {
      md += `## ${bi + 1}. ${b.name} (${b.min} min)\n\n`;
      b.prompts.forEach(p => {
        const a = answerOf(p, state);
        md += `**${p.q}**\n\n`;
        if (p.given) md += "Given code:\n\n" + fence(p.given, "python");
        md += a ? (p.kind === "code" ? fence(a, lang.fence) : a + "\n\n") : "_(no answer)_\n\n";
      });
    });
    return md;
  }
  function saveFile(data, name, type) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: type || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return name;
  }
  const download = (md, ext) => saveFile(md, fileBase() + "." + ext, "text/markdown");

  // Without a form endpoint: short answers go straight into an email; on phones the share
  // menu sends one file; otherwise one file (answers plus drawing) downloads to attach.
  async function sendByEmail(name, subject) {
    const md = markdown({ withDiagram: true });
    const intro = `Hi Crack Tech,\n\nPlease review my practice answers for "${cur.title}".\n\n`;
    const direct = `mailto:${REVIEW_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(intro + md + `\nThanks,\n${name}`)}`;
    if (direct.length < 1800) {
      location.href = direct;
      return flash(`An email with your answers just opened. Press send. If nothing opened, use "Download my answers" and email the file to ${REVIEW_EMAIL}.`);
    }
    const file = fileBase() + ".md";
    if (coarse() && navigator.canShare && window.File) {
      try {
        const f = new File([md], file, { type: "text/markdown" });
        if (navigator.canShare({ files: [f] })) {
          await navigator.share({ files: [f], title: subject, text: `${intro}My answers are attached.\n\nPlease reply to ${$("#f-email").value.trim()}.\nThanks,\n${name}` });
          return flash(`Shared. Make sure it goes to ${REVIEW_EMAIL}.`);
        }
      } catch (e) { if (e && e.name === "AbortError") return flash("Sharing cancelled. Press Send for review to try again."); }
    }
    download(md, "md");
    location.href = `mailto:${REVIEW_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(intro + `Attached: ${file} (it just downloaded to my device).\n\nThanks,\n${name}`)}`;
    flash(`Downloaded ${file}. Attach it to the email that just opened and press send. If no email opened, send it to ${REVIEW_EMAIL}.`);
  }

  let sending = false;
  async function send() {
    if (sending) return;
    flush();
    const name = $("#f-name").value.trim(), email = $("#f-email").value.trim();
    const sc = cur.board ? boardScene() : null;
    if (!answeredCount(cur, state) && !sc) return flash("Answer at least one question before sending.", true);
    if (!name) { $("#f-name").focus(); return flash("Please add your name.", true); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { $("#f-email").focus(); return flash("Please add a valid email address.", true); }
    if (!$("#f-consent").checked) { $("#f-consent").focus(); return flash("Please tick the box to agree to send your answers.", true); }
    saveProfile();
    const subject = `Practice for review: ${cur.title} — ${name}`;
    const trap = $("#f-hp").value;

    if (!FORM_ENDPOINT) { if (trap) return flash("Thanks."); return sendByEmail(name, subject); }

    let diagram = "", diagramNote = "";
    if (sc) {
      const json = sceneJson(sc);
      if (json.length <= MAX_DIAGRAM_CHARS) { diagram = json; diagramNote = `${plural(sc.elements.length, "shape")}. The drawing is in the "diagram_excalidraw" field: save that text as a file ending in .excalidraw and open it at excalidraw.com (menu → Open).`; }
      else diagramNote = "The drawing was too large to send here; the candidate was asked to email the .excalidraw file.";
    }
    let answers = markdown({ diagramNote }), trimmed = false;
    if (answers.length > MAX_ANSWER_CHARS) { answers = answers.slice(0, MAX_ANSWER_CHARS) + "\n\n[Trimmed: the answers were too long to send in full. The candidate was asked to email the full file.]"; trimmed = true; }
    sending = true; $("#sendBtn").disabled = true; flash("Sending…");
    try {
      // _gotcha is Formspree's spam trap: real people leave it empty.
      const payload = { name, email, target: $("#f-target").value.trim(), session: cur.title, time_used: fmtTime(elapsed()), answers, _subject: subject, _gotcha: trap };
      if (diagram) payload.diagram_excalidraw = diagram;
      const r = await fetch(FORM_ENDPOINT, { method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error(String(r.status));
      state.sentAt = Date.now(); save();
      const extra = [];
      if (sc && !diagram) extra.push("your drawing (press Download .excalidraw)");
      if (trimmed) extra.push("your full answers (press Download my answers)");
      flash(`Sent. We'll review your answers and reply to ${email}.` + (extra.length ? ` Some of it was too large to send here: please email ${extra.join(" and ")} to ${REVIEW_EMAIL}.` : ""));
    } catch (e) {
      flash(`Couldn't send right now. Your answers are saved here. Try again, or press "Download my answers" and email the file to ${REVIEW_EMAIL}.`, true);
    } finally { sending = false; $("#sendBtn").disabled = false; }
  }

  /* ======================= Routing ======================= */
  // Session links are #<session-id>; an empty hash is the list. Any other hash
  // (like the skip link's #main) leaves the page as it is.
  function route(first) {
    let id = decodeURIComponent(location.hash.slice(1));
    // After a reload on a non-session hash (e.g. #main), reopen the session that was open.
    if (first === true && id && !SESSIONS.some(s => s.id === id)) { try { id = sessionStorage.getItem("ct-practice:open") || id; } catch (e) {} }
    if (id && SESSIONS.some(s => s.id === id)) { if (!cur || cur.id !== id) open(id); }
    else if (!id && (cur || $("#list").hidden)) close();
  }
  addEventListener("hashchange", route);
  addEventListener("pagehide", flush);
  addEventListener("keydown", e => { if (e.key === "Escape" && document.documentElement.classList.contains("board-full") && !(board && document.activeElement && $("#boardCanvas").contains(document.activeElement))) setFull(false); });
  renderList(); route(true);
})();
