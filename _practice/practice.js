// Practice page (/practice/): pick a 45-minute session, answer against the clock
// (type or dictate; code in a real editor; draw designs on a whiteboard),
// save in this browser, then send the answers for review by email.
// Content lives in sessions.js. Built into practice/ by `ruby _blog/build.rb`.
(() => {
  /* ======================= Settings ======================= */
  // Where "Send for review" posts the answers: a Formspree form URL, e.g.
  // "https://formspree.io/f/abcdwxyz" (see CLAUDE.md, "Practice page").
  // While empty, sending downloads the answers and opens an email to REVIEW_EMAIL instead.
  const FORM_ENDPOINT = "";
  const REVIEW_EMAIL = "hello@cracktech.app";
  const MINUTES = 45;
  // Formspree's free plan has no file uploads, so a whiteboard drawing is sent as
  // .excalidraw JSON text in its own field, up to this size; bigger ones are left out
  // and the candidate is asked to attach the downloaded file instead.
  const MAX_DIAGRAM_CHARS = 60000;

  // Editor and whiteboard libraries, loaded only when a session needs them.
  // jsDelivr mirrors npm exactly; versions are pinned.
  const CDN = "https://cdn.jsdelivr.net/npm/";
  const CM = CDN + "codemirror@5.65.16/";
  const EXCALIDRAW = CDN + "@excalidraw/excalidraw@0.17.6/dist/";
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
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const PROFILE_KEY = "ct-practice:me";
  const sKey = id => "ct-practice:" + id;
  const bKey = id => "ct-practice:" + id + ":board";
  const slug = s => (s || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const loaded = {};
  function loadScript(src) {
    if (!loaded[src]) loaded[src] = new Promise((ok, fail) => {
      const el = document.createElement("script");
      el.src = src; el.async = false; el.crossOrigin = "anonymous";
      el.onload = ok; el.onerror = () => { delete loaded[src]; fail(new Error("Couldn't load " + src)); };
      document.head.appendChild(el);
    });
    return loaded[src];
  }
  function loadCss(href) {
    if (loaded[href]) return;
    loaded[href] = true;
    const el = document.createElement("link");
    el.rel = "stylesheet"; el.href = href; el.crossOrigin = "anonymous";
    document.head.appendChild(el);
  }
  const timeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error("timeout")), ms))]);

  // Prompt ids like "3-0" (block 3, prompt 0); flags per session.
  SESSIONS.forEach(s => {
    s.blocks.forEach((b, bi) => b.prompts.forEach((p, pi) => { p.id = bi + "-" + pi; }));
    s.hasCode = s.blocks.some(b => b.prompts.some(p => p.kind === "code"));
    s.total = s.blocks.reduce((n, b) => n + b.prompts.length, 0);
  });

  /* ======================= Session list ======================= */
  const TRACKS = [
    { name: "Behavioral", note: "Stories with structure: situation, what you did, and the result." },
    { name: "System design", note: "Notes for each step, plus a whiteboard to draw your design." },
    { name: "Coding", note: "A code editor in your language, with tests and complexity." }
  ];
  function answeredCount(st) { return st && st.answers ? Object.values(st.answers).filter(v => v && v.trim()).length : 0; }
  function renderList() {
    $("#tracks").innerHTML = TRACKS.map(t => {
      const list = SESSIONS.filter(s => s.track === t.name);
      return `<section class="ptrack" aria-labelledby="t-${slug(t.name)}">
        <div class="ptrack-head"><h2 id="t-${slug(t.name)}">${esc(t.name)}</h2><p>${esc(t.note)}</p></div>
        <div class="session-grid">${list.map(s => {
          const st = store.get(sKey(s.id)), done = answeredCount(st);
          const badge = st && st.sentAt ? `<span class="badge sent">✓ Sent for review</span>`
            : done ? `<span class="badge">${done} of ${s.total} answered</span>` : `<span class="badge muted">${s.total} questions</span>`;
          return `<a class="session-card" href="#${esc(s.id)}">
            <div class="session-meta"><span>${esc(s.tag || s.track)}</span><span>${MINUTES} min</span></div>
            <h3>${esc(s.title)}</h3><p>${esc(s.blurb)}</p>
            <div class="session-foot">${badge}<span class="go">${done ? "Continue" : "Start"} <span class="arr">→</span></span></div></a>`;
        }).join("")}</div></section>`;
    }).join("");
  }

  /* ======================= Workspace ======================= */
  let cur = null, state = null, saveT = null, tickT = null;
  const editors = {};          // prompt id -> CodeMirror instance
  const blank = () => ({ answers: {}, elapsed: 0, runningSince: null, sentAt: null, lang: "python", note: "" });

  function open(id) {
    const s = SESSIONS.find(x => x.id === id);
    if (!s) return close();
    stopDictation(true); destroyBoard();
    Object.keys(editors).forEach(k => delete editors[k]);
    cur = s; state = Object.assign(blank(), store.get(sKey(id)) || {});
    if (!LANGS[state.lang]) state.lang = "python";
    $("#list").hidden = true; $("#work").hidden = false;
    document.documentElement.classList.add("in-session");

    let t = 0;
    const agenda = s.blocks.map((b, i) => { const a = t; t += b.min; return `<li id="ag-${i}" style="--m:${b.min}"><b>${a}–${t} min</b><span>${esc(b.name)}</span></li>`; }).join("");
    $("#work").innerHTML = `
      <div class="work-bar"><div class="wrap work-bar-in">
        <a class="wb-back" href="#">← <span>All sessions</span></a>
        <div class="timer" role="group" aria-label="45-minute timer">
          <span class="clock" id="clock" aria-live="off">45:00</span>
          <button class="btn btn-primary btn-sm" id="timerBtn" type="button">Start timer</button>
          <button class="icon-btn sm" id="timerReset" type="button" aria-label="Reset timer" title="Reset timer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg></button>
        </div>
        <span class="phase" id="phase"></span>
        <span class="mic-live" id="micLive" aria-live="polite"></span>
        <span class="saved" id="saved" aria-live="polite"></span>
      </div></div>
      <div class="wrap work">
        <div class="work-head">
          <div class="kicker">${esc(s.tag || s.track)} · ${MINUTES} minutes</div>
          <h1>${esc(s.title)}</h1>
          <p class="lede">${esc(s.blurb)}</p>
          <ol class="agenda" aria-label="Agenda">${agenda}</ol>
          <p class="hint">${hintFor(s)}</p>
        </div>
        ${s.board ? boardSection() : ""}
        ${s.blocks.map((b, bi) => `<section class="block" id="block-${bi}">
          <div class="block-head"><h2><span class="num">${String(bi + 1).padStart(2, "0")}</span>${esc(b.name)}</h2><span>${b.min} min</span></div>
          ${b.prompts.map(p => promptCard(p)).join("")}
        </section>`).join("")}
        ${submitPanel(s)}
      </div>`;

    s.blocks.forEach(b => b.prompts.forEach(p => {
      const ta = $("#a-" + p.id);
      ta.value = state.answers[p.id] || "";
      count(p.id);
      ta.addEventListener("input", () => { state.answers[p.id] = ta.value; count(p.id); queueSave(); });
      if (p.kind === "code") ta.addEventListener("keydown", tabKey);
      else autoGrow(ta);
    }));
    $$(".lang").forEach(sel => { sel.value = state.lang; sel.addEventListener("change", () => setLang(sel.value)); });
    const prof = store.get(PROFILE_KEY) || {};
    ["name", "email", "target"].forEach(f => { const el = $("#f-" + f); el.value = prof[f] || ""; el.addEventListener("input", saveProfile); });
    $("#f-note").value = state.note || "";
    $("#f-note").addEventListener("input", () => { state.note = $("#f-note").value; queueSave(); });
    $("#timerBtn").onclick = toggleTimer;
    $("#timerReset").onclick = resetTimer;
    $("#saveBtn").onclick = () => { save(); flash("Saved in this browser. Come back any time to continue."); };
    $("#sendBtn").onclick = send;
    $("#dlBtn").onclick = () => { const f = download(markdown(), "md"); const d = boardScene() ? downloadScene() : null; flash(`Downloaded ${f}${d ? " and " + d : ""}.`); };
    $("#resetBtn").onclick = startOver;
    if (s.board) setupBoardButtons();
    setupDictation();
    if (s.hasCode) setupEditors();
    paintSent();
    clearInterval(tickT); tickT = setInterval(tick, 1000); tick();
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
    const langSel = code ? `<label class="lang-pick">Language <select class="lang" aria-label="Programming language">${Object.entries(LANGS).map(([k, l]) => `<option value="${k}">${esc(l.label)}</option>`).join("")}</select></label>` : "";
    return `<article class="prompt${code ? " is-code" : ""}">
      <p class="q">${esc(p.q)}</p>
      ${p.given ? `<div class="given"><div class="given-label">The AI's code (Python)</div><pre><code id="g-${p.id}">${esc(p.given)}</code></pre></div>` : ""}
      ${code ? `<div class="editor-top">${langSel}<span class="editor-note" id="en-${p.id}"></span></div>` : ""}
      <textarea id="a-${p.id}" class="${code ? "ta-code" : "ta-text"}" spellcheck="${code ? "false" : "true"}" rows="${code ? 12 : 5}" placeholder="${code ? "Write your code here" : "Your answer"}" aria-label="Your answer"></textarea>
      <div class="interim" id="i-${p.id}" aria-hidden="true"></div>
      <div class="prompt-tools">
        ${code ? "" : `<button class="btn btn-outline btn-sm mic" type="button" data-p="${p.id}" aria-pressed="false" hidden><span class="dot"></span><span class="mic-label">Dictate</span></button><span class="mic-state" id="ms-${p.id}"></span>`}
        <span class="count" id="c-${p.id}"></span>
      </div>
      <details class="look"><summary>What interviewers look for</summary><ul>${p.look.map(l => `<li>${esc(l)}</li>`).join("")}</ul>
        <p class="pnote">Answer first, then compare.</p></details>
    </article>`;
  }

  function submitPanel(s) {
    const viaEmail = !FORM_ENDPOINT;
    return `<section class="submit" id="submit">
      <div class="block-head"><h2>Send for review</h2><span>When you're ready</span></div>
      <p class="hint">Add your name and email and send your answers to Crack Tech. We'll review them and reply to the email you give here.</p>
      <div class="fields">
        <label>Name<input id="f-name" type="text" autocomplete="name" required></label>
        <label>Email<input id="f-email" type="email" autocomplete="email" inputmode="email" required></label>
        <label class="wide">Target role or company <small>(optional)</small><input id="f-target" type="text" placeholder="e.g. Senior engineer, fintech"></label>
        <label class="wide">Anything you'd like feedback on? <small>(optional)</small><textarea id="f-note" rows="3"></textarea></label>
      </div>
      <label class="consent"><input id="f-consent" type="checkbox"><span>I agree to send these answers${s.board ? ", my drawing" : ""}, my name and email to Crack Tech for review.</span></label>
      <div class="hp" aria-hidden="true"><label>Leave this empty<input id="f-hp" type="text" tabindex="-1" autocomplete="off"></label></div>
      ${viaEmail ? `<p class="via-email"><b>How sending works:</b> your answers download as a file${s.board ? " (plus your drawing)" : ""}, and an email to ${esc(REVIEW_EMAIL)} opens. Attach the file${s.board ? "s" : ""} and press send.</p>` : ""}
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
    el.textContent = !v ? "" : $("#a-" + id).classList.contains("ta-code") ? `${v.split("\n").length} lines` : `${v.split(/\s+/).length} words`;
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
  let resetArmed = null;
  function startOver() {
    const b = $("#resetBtn");
    if (!resetArmed) {
      b.textContent = "Click again to clear this session's answers, timer and drawing";
      resetArmed = setTimeout(() => { resetArmed = null; if (b.isConnected) b.textContent = "Start this session over"; }, 5000);
      return;
    }
    clearTimeout(resetArmed); resetArmed = null;
    const lang = state.lang;
    store.del(sKey(cur.id)); store.del(bKey(cur.id));
    state = Object.assign(blank(), { lang });
    open(cur.id);
    flash("Cleared. Fresh start.");
  }

  /* ======================= Saving ======================= */
  function queueSave() { clearTimeout(saveT); $("#saved").textContent = "Saving…"; saveT = setTimeout(save, 500); }
  function save() {
    if (!cur) return;
    clearTimeout(saveT);
    const ok = store.set(sKey(cur.id), state);
    const el = $("#saved");
    if (el) el.textContent = ok ? "Saved " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Not saved: this browser blocks storage. Download your answers to keep them.";
  }
  function saveProfile() {
    store.set(PROFILE_KEY, { name: $("#f-name").value.trim(), email: $("#f-email").value.trim(), target: $("#f-target").value.trim() });
  }
  function flash(msg, bad) { const el = $("#status"); if (!el) return; el.textContent = msg; el.classList.toggle("bad", !!bad); }
  function paintSent() { if (state.sentAt) $("#saved").textContent = "Sent for review " + new Date(state.sentAt).toLocaleDateString(); }

  /* ======================= Timer ======================= */
  const elapsed = () => state.elapsed + (state.runningSince ? Date.now() - state.runningSince : 0);
  function toggleTimer() {
    if (state.runningSince) { state.elapsed = elapsed(); state.runningSince = null; }
    else state.runningSince = Date.now();
    save(); tick();
  }
  function resetTimer() { state.elapsed = 0; state.runningSince = null; save(); tick(); }
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
  }

  /* ======================= Code editor (CodeMirror 5) ======================= */
  let cmReady = null;
  function loadCodeMirror() {
    if (!cmReady) {
      loadCss(CM + "lib/codemirror.min.css");
      const files = [...new Set(Object.values(LANGS).map(l => l.file))];
      cmReady = timeout(loadScript(CM + "lib/codemirror.min.js"), 12000)
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
      session.blocks.forEach(b => b.prompts.forEach(p => {
        if (p.kind !== "code") return;
        const ta = $("#a-" + p.id);
        ta.placeholder = `Write your ${LANGS[state.lang].label} code here`;
        const cm = CodeMirror.fromTextArea(ta, {
          mode: LANGS[state.lang].mode, theme: "ct", lineNumbers: true, indentUnit: 4, tabSize: 4,
          indentWithTabs: false, matchBrackets: true, autoCloseBrackets: true, lineWrapping: false,
          viewportMargin: Infinity, inputStyle: "contenteditable", screenReaderLabel: "Code answer",
          extraKeys: { Tab: c => c.somethingSelected() ? c.indentSelection("add") : c.replaceSelection("    ", "end"), "Shift-Tab": c => c.indentSelection("subtract"), Esc: c => c.getInputField().blur() }
        });
        cm.on("change", () => { state.answers[p.id] = cm.getValue(); count(p.id); queueSave(); });
        editors[p.id] = cm;
        $("#en-" + p.id).textContent = "Tab indents · Esc leaves the editor";
        if (p.given) {
          const g = $("#g-" + p.id), pre = g.parentElement;
          const view = CodeMirror(el => pre.replaceWith(el), { value: p.given, mode: "python", theme: "ct", readOnly: "nocursor", lineNumbers: true, viewportMargin: Infinity });
          view.getWrapperElement().classList.add("cm-given");
        }
      }));
    }).catch(() => {
      if (cur !== session) return;
      $$(".editor-note").forEach(el => { el.textContent = "Simple editor (the code editor couldn't load). Your code still saves."; });
    });
  }
  function setLang(lang) {
    if (!LANGS[lang]) return;
    state.lang = lang; queueSave();
    $$(".lang").forEach(s => { s.value = lang; });
    Object.values(editors).forEach(cm => { cm.setOption("mode", LANGS[lang].mode); cm.setOption("placeholder", `Write your ${LANGS[lang].label} code here`); });
  }

  /* ======================= Whiteboard (Excalidraw) ======================= */
  let board = null;   // { root, api, theme, saveT, version }
  function boardSection() {
    return `<section class="board" id="board">
      <div class="block-head"><h2><span class="num">✎</span>Whiteboard</h2><span>Use it through the session</span></div>
      <p class="hint">Sketch boxes, arrows and data flow as you would on the interview whiteboard. Your drawing saves in this browser and is included when you send for review.</p>
      <div class="board-tools">
        <button class="btn btn-primary btn-sm" id="boardOpen" type="button">Open whiteboard</button>
        <button class="btn btn-outline btn-sm" id="boardFull" type="button" hidden>Full screen</button>
        <button class="btn btn-outline btn-sm" id="boardPng" type="button">Download PNG</button>
        <button class="btn btn-outline btn-sm" id="boardFile" type="button">Download .excalidraw</button>
        <span class="board-note" id="boardNote"></span>
      </div>
      <div class="board-frame" id="boardFrame" hidden>
        <div class="board-bar"><b>Whiteboard</b><span id="boardSaved"></span><button class="btn btn-primary btn-sm" id="boardExit" type="button">Exit full screen</button></div>
        <div class="board-canvas" id="boardCanvas"></div>
      </div>
    </section>`;
  }
  function boardScene() {
    const sc = store.get(bKey(cur.id));
    return sc && sc.elements && sc.elements.some(e => !e.isDeleted) ? sc : null;
  }
  function paintBoardNote() {
    const sc = boardScene(), n = sc ? sc.elements.filter(e => !e.isDeleted).length : 0;
    const el = $("#boardNote"); if (el) el.textContent = n ? `${n} shape${n === 1 ? "" : "s"} saved` : "Nothing drawn yet";
  }
  function setupBoardButtons() {
    paintBoardNote();
    $("#boardOpen").onclick = () => {
      if ($("#boardFrame").hidden) openBoard(); else closeBoardPanel();
    };
    $("#boardFull").onclick = () => setFull(true);
    $("#boardExit").onclick = () => setFull(false);
    $("#boardPng").onclick = downloadPng;
    $("#boardFile").onclick = () => { const f = downloadScene(); flash(f ? `Downloaded ${f}. Open it at excalidraw.com (menu → Open).` : "Nothing drawn yet.", !f); };
  }
  function setFull(on) {
    $("#boardFrame").classList.toggle("full", on);
    document.documentElement.classList.toggle("board-full", on);
    if (on) $("#boardExit").focus();
    else $("#boardFull").focus();
  }
  function loadExcalidraw() {
    window.EXCALIDRAW_ASSET_PATH = EXCALIDRAW;
    return timeout(Promise.all(REACT.map(loadScript)).then(() => loadScript(EXCALIDRAW + "excalidraw.production.min.js")), 20000)
      .then(() => { if (!window.ExcalidrawLib) throw new Error("Excalidraw missing"); return window.ExcalidrawLib; });
  }
  const pageTheme = () => document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  function openBoard() {
    const session = cur;
    $("#boardFrame").hidden = false; $("#boardFull").hidden = false;
    $("#boardOpen").textContent = "Hide whiteboard";
    if (board) return;
    $("#boardCanvas").innerHTML = `<p class="board-loading">Loading the whiteboard…</p>`;
    loadExcalidraw().then(lib => {
      if (cur !== session || board) return;
      const saved = store.get(bKey(session.id)) || {};
      board = { root: ReactDOM.createRoot($("#boardCanvas")), api: null, theme: pageTheme(), saveT: null, version: -1, lib, session };
      board.initial = {
        elements: saved.elements || [],
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
      UIOptions: { canvasActions: { loadScene: true, saveToActiveFile: false, export: false, saveAsImage: true, toggleTheme: false, changeViewBackgroundColor: true, clearCanvas: true } },
      name: cur ? cur.title : "Practice"
    }));
  }
  function queueBoardSave(elements, appState, files) {
    if (!board || !board.lib) return;
    const v = board.lib.getSceneVersion(elements);
    if (v === board.version) return;
    board.version = v;
    clearTimeout(board.saveT);
    const session = board.session;
    board.saveT = setTimeout(() => {
      const live = elements.filter(e => !e.isDeleted);
      const used = {}; live.forEach(e => { if (e.fileId && files && files[e.fileId]) used[e.fileId] = files[e.fileId]; });
      const ok = store.set(bKey(session.id), { elements: live, appState: { viewBackgroundColor: appState.viewBackgroundColor }, files: used, savedAt: Date.now() });
      if (cur === session) {
        const t = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        const el = $("#boardSaved"); if (el) el.textContent = ok ? "Saved " + t : "Too big to save here: download it";
        paintBoardNote();
      }
    }, 700);
  }
  function closeBoardPanel() {
    $("#boardFrame").hidden = true; $("#boardFull").hidden = true;
    $("#boardOpen").textContent = "Open whiteboard";
    setFull(false);
  }
  function destroyBoard() {
    document.documentElement.classList.remove("board-full");
    if (!board) return;
    clearTimeout(board.saveT);
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
  // remembers which final results it has written, and when the tab is hidden its
  // unfinished words are written once and the run is closed.
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, target = null, lastTarget = null, wanted = false, fails = 0, restartT = null, micState = "stopped";
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
    stopDictation(true);
    target = lastTarget = id; wanted = true; fails = 0;
    if (document.hidden) setMic("paused"); else beginRun();
  }
  function beginRun() {
    clearTimeout(restartT);
    if (!wanted || !target || rec) return;
    const r = new SR(), done = new Set(), id = target;
    r.lang = navigator.language || "en-US";
    r.continuous = true; r.interimResults = true;
    r.pending = ""; r.closed = false;
    r.onresult = e => {
      if (r.closed) return;
      fails = 0;
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) { if (!done.has(i)) { done.add(i); appendText(id, res[0].transcript); } }
        else interim += res[0].transcript;
      }
      r.pending = interim;
      const el = $("#i-" + id); if (el) el.textContent = interim;
    };
    r.onerror = e => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") { wanted = false; setMic("blocked"); }
      else if (e.error !== "no-speech" && e.error !== "aborted") fails++;
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
    r.target = id; rec = r;
    try { r.start(); setMic("listening"); }
    catch (e) { rec = null; fails++; restartT = setTimeout(beginRun, 600); }
  }
  // Write any unfinished words once, then close the run so nothing arrives twice.
  function closeRun(commit) {
    const r = rec; if (!r) return;
    if (commit && r.pending && target) appendText(target, r.pending);
    r.closed = true; rec = null;
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
    if (!wanted || !target) return;
    if (document.hidden) { closeRun(true); setMic("paused"); }
    else { fails = 0; beginRun(); }
  });
  function setMic(s) { micState = s; paintMics(); }
  function paintMics() {
    const labels = { listening: "Listening… speak your answer", paused: "Paused while this tab is hidden. It picks up again when you come back.", stopped: "", blocked: "Microphone blocked. Allow it in your browser's site settings to dictate.", failed: "Dictation stopped (the speech service didn't respond). Press Dictate to try again." };
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
  function markdown(diagramNote) {
    const s = cur, f = id => ($("#f-" + id).value || "").trim(), lang = LANGS[state.lang];
    let md = `# Practice: ${s.title}\n\n${s.tag || s.track} · ${MINUTES}-minute session\n\n`;
    md += `- Name: ${f("name") || "-"}\n- Email: ${f("email") || "-"}\n- Target: ${f("target") || "-"}\n- Time used: ${fmtTime(elapsed())}\n- Answered: ${answeredCount(state)} of ${s.total}\n`;
    if (s.hasCode) md += `- Language: ${lang.label}\n`;
    md += `- Date: ${new Date().toLocaleString()}\n\n`;
    if (f("note")) md += `## Feedback request\n\n${f("note")}\n\n`;
    if (s.board) {
      const sc = boardScene();
      md += `## Whiteboard\n\n${sc ? (diagramNote || `${sc.elements.filter(e => !e.isDeleted).length} shapes. Saved as a separate .excalidraw file; open it at excalidraw.com (menu → Open).`) : "_(nothing drawn)_"}\n\n`;
    }
    s.blocks.forEach((b, bi) => {
      md += `## ${bi + 1}. ${b.name} (${b.min} min)\n\n`;
      b.prompts.forEach(p => {
        const a = (state.answers[p.id] || "").trim();
        md += `**${p.q}**\n\n`;
        if (p.given) md += "Given code:\n\n```python\n" + p.given + "\n```\n\n";
        md += a ? (p.kind === "code" ? "```" + lang.fence + "\n" + a + "\n```\n\n" : a + "\n\n") : "_(no answer)_\n\n";
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
  let sending = false;
  async function send() {
    if (sending) return;
    const name = $("#f-name").value.trim(), email = $("#f-email").value.trim();
    const sc = cur.board ? boardScene() : null;
    if (!answeredCount(state) && !sc) return flash("Answer at least one question before sending.", true);
    if (!name) { $("#f-name").focus(); return flash("Please add your name.", true); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { $("#f-email").focus(); return flash("Please add a valid email address.", true); }
    if (!$("#f-consent").checked) { $("#f-consent").focus(); return flash("Please tick the box to agree to send your answers.", true); }
    if ($("#f-hp").value) return; // bots fill hidden fields
    saveProfile(); save();
    const subject = `Practice for review: ${cur.title} — ${name}`;

    if (!FORM_ENDPOINT) {
      const file = download(markdown(), "md");
      const dia = sc ? downloadScene() : null;
      const body = `Hi Crack Tech,\n\nPlease review my practice answers for "${cur.title}".\n\nAttached: ${file}${dia ? " and " + dia : ""} (they just downloaded to my device).\n\nThanks,\n${name}`;
      location.href = `mailto:${REVIEW_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      return flash(`Downloaded ${file}${dia ? " and " + dia : ""}. Attach ${dia ? "them" : "it"} to the email that just opened and press send. If no email opened, send ${dia ? "them" : "it"} to ${REVIEW_EMAIL}.`);
    }

    let diagram = "", diagramNote = "";
    if (sc) {
      const json = sceneJson(sc);
      if (json.length <= MAX_DIAGRAM_CHARS) { diagram = json; diagramNote = `${sc.elements.length} shapes. The drawing is in the "diagram_excalidraw" field: save that text as a file ending in .excalidraw and open it at excalidraw.com (menu → Open).`; }
      else diagramNote = "The drawing was too large to send here; the candidate was asked to email the .excalidraw file.";
    }
    sending = true; $("#sendBtn").disabled = true; flash("Sending…");
    try {
      const payload = { name, email, target: $("#f-target").value.trim(), session: cur.title, time_used: fmtTime(elapsed()), answers: markdown(diagramNote), _subject: subject };
      if (diagram) payload.diagram_excalidraw = diagram;
      const r = await fetch(FORM_ENDPOINT, { method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error(String(r.status));
      state.sentAt = Date.now(); save(); paintSent();
      flash(`Sent. We'll review your answers and reply to ${email}.` + (sc && !diagram ? ` Your drawing was too large to send here: please email the .excalidraw file to ${REVIEW_EMAIL}.` : ""));
    } catch (e) {
      flash(`Couldn't send right now. Your answers are saved here. Try again, or press "Download my answers" and email the file to ${REVIEW_EMAIL}.`, true);
    } finally { sending = false; $("#sendBtn").disabled = false; }
  }

  /* ======================= Routing ======================= */
  function route() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (id && SESSIONS.some(s => s.id === id)) { if (!cur || cur.id !== id) open(id); }
    else if (cur || $("#list").hidden) close();
  }
  addEventListener("hashchange", route);
  addEventListener("pagehide", () => { if (cur) save(); });
  addEventListener("keydown", e => { if (e.key === "Escape" && document.documentElement.classList.contains("board-full") && !(board && document.activeElement && $("#boardCanvas").contains(document.activeElement))) setFull(false); });
  renderList(); route();
})();
