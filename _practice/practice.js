// Practice page: pick a 45-minute session, answer by typing or dictating,
// save in this browser, then send the answers for review by email.
(() => {
  // Where "Send for review" posts the answers. A Formspree form URL, e.g.
  // "https://formspree.io/f/abcdwxyz". Empty: download the answers and open an email instead.
  const FORM_ENDPOINT = "";
  const REVIEW_EMAIL = "hello@cracktech.app";
  const MINUTES = 45;

  const SESSIONS = window.PRACTICE_SESSIONS || [];
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  const PROFILE_KEY = "ct-practice:me";
  const sKey = id => "ct-practice:" + id;

  // Give every prompt a stable id like "3-0" (block 3, prompt 0).
  SESSIONS.forEach(s => s.blocks.forEach((b, bi) => b.prompts.forEach((p, pi) => { p.id = bi + "-" + pi; })));

  /* ---------- session list ---------- */
  const TRACKS = ["Behavioral", "System design", "Coding"];
  function renderList() {
    $("#tracks").innerHTML = TRACKS.map(t => {
      const list = SESSIONS.filter(s => s.track === t);
      return `<section class="track"><div class="track-head"><h2>${esc(t)}</h2><span>${list.length} sessions</span></div>
        <div class="session-grid">${list.map(s => {
          const st = store.get(sKey(s.id));
          const done = st && st.answers ? Object.values(st.answers).filter(v => v && v.trim()).length : 0;
          const total = s.blocks.reduce((n, b) => n + b.prompts.length, 0);
          const badge = st && st.sentAt ? `<span class="badge sent">Sent for review</span>` : done ? `<span class="badge">${done} of ${total} answered</span>` : "";
          return `<a class="session-card" href="#${esc(s.id)}">
            <div class="session-meta"><span>${esc(s.tag || s.track)}</span><span>${MINUTES} min</span></div>
            <h3>${esc(s.title)}</h3><p>${esc(s.blurb)}</p>
            <div class="session-foot">${badge}<span class="go">Start →</span></div></a>`;
        }).join("")}</div></section>`;
    }).join("");
  }

  /* ---------- workspace ---------- */
  let cur = null, state = null, saveT = null, tickT = null;
  const blank = () => ({ answers: {}, elapsed: 0, runningSince: null, sentAt: null });

  function open(id) {
    const s = SESSIONS.find(x => x.id === id);
    if (!s) return close();
    cur = s; state = Object.assign(blank(), store.get(sKey(id)) || {});
    $("#list").hidden = true; $("#work").hidden = false;
    let t = 0;
    const agenda = s.blocks.map((b, i) => { const a = t; t += b.min; return `<div id="ag-${i}" style="--m:${b.min}"><b>${a}–${t} min</b>${esc(b.name)}</div>`; }).join("");
    $("#work").innerHTML = `
      <div class="work-bar"><div class="wrap work-bar-in">
        <a class="back" href="#">← All sessions</a>
        <span class="clock" id="clock">45:00</span>
        <button class="btn btn-primary btn-sm" id="timerBtn" type="button">Start 45-min timer</button>
        <button class="btn btn-outline btn-sm" id="timerReset" type="button">Reset timer</button>
        <span class="phase" id="phase"></span>
        <span class="saved" id="saved" aria-live="polite"></span>
      </div></div>
      <div class="wrap">
        <div class="work-head">
          <div class="kicker">${esc(s.tag || s.track)} · ${MINUTES} minutes</div>
          <h1>${esc(s.title)}</h1>
          <p class="lede">${esc(s.blurb)}</p>
          <p class="hint">Start the timer and answer each part as you would out loud in the interview. Type, or use <b>Dictate</b> to speak your answer. Everything saves in this browser as you go. When you're done, send it for review.</p>
          <div class="agenda">${agenda}</div>
        </div>
        ${s.blocks.map((b, bi) => `<section class="block">
          <div class="block-head"><h2>${esc(b.name)}</h2><span>${b.min} min</span></div>
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
    }));
    const prof = store.get(PROFILE_KEY) || {};
    ["name", "email", "target"].forEach(f => { const el = $("#f-" + f); el.value = prof[f] || ""; el.addEventListener("input", saveProfile); });
    $("#f-note").value = state.note || "";
    $("#f-note").addEventListener("input", () => { state.note = $("#f-note").value; queueSave(); });
    $("#timerBtn").onclick = toggleTimer;
    $("#timerReset").onclick = resetTimer;
    $("#saveBtn").onclick = () => { save(); flash("Saved in this browser."); };
    $("#sendBtn").onclick = send;
    $("#dlBtn").onclick = () => download(markdown());
    setupDictation();
    $("#saved").textContent = state.sentAt ? "Sent for review " + new Date(state.sentAt).toLocaleDateString() : "";
    clearInterval(tickT); tickT = setInterval(tick, 1000); tick();
    scrollTo(0, 0);
    document.title = `${s.title} — Practice — Crack Tech`;
  }

  function promptCard(p) {
    const code = p.kind === "code";
    return `<article class="prompt">
      <p class="q">${esc(p.q)}</p>
      ${p.given ? `<pre class="given"><code>${esc(p.given)}</code></pre>` : ""}
      <textarea id="a-${p.id}" class="${code ? "code" : ""}" spellcheck="${code ? "false" : "true"}" placeholder="${code ? "Write your code here" : "Your answer"}" aria-label="Your answer"></textarea>
      <div class="interim" id="i-${p.id}"></div>
      <div class="prompt-tools">
        ${code ? "" : `<button class="btn btn-outline btn-sm mic" type="button" data-p="${p.id}" aria-pressed="false" hidden>🎙 Dictate</button>`}
        <span class="count" id="c-${p.id}"></span>
      </div>
      <details class="look"><summary>What interviewers look for</summary><ul>${p.look.map(l => `<li>${esc(l)}</li>`).join("")}</ul>
        <p class="note">Try answering first, then compare.</p></details>
    </article>`;
  }

  function submitPanel(s) {
    return `<section class="submit" id="submit">
      <div class="block-head"><h2>Send for review</h2><span>Optional</span></div>
      <p class="hint">Add your name and email, then send your answers to Crack Tech. We'll review them and reply to the email you give here.</p>
      <div class="fields">
        <label>Name<input id="f-name" type="text" autocomplete="name" required></label>
        <label>Email<input id="f-email" type="email" autocomplete="email" required></label>
        <label class="wide">Target role or company <small>(optional)</small><input id="f-target" type="text" placeholder="e.g. Senior engineer, Meta"></label>
        <label class="wide">Anything you'd like feedback on? <small>(optional)</small><textarea id="f-note" rows="3"></textarea></label>
      </div>
      <label class="consent"><input id="f-consent" type="checkbox"> I agree to send these answers, my name and email to Crack Tech for review.</label>
      <div class="hp" aria-hidden="true"><label>Leave empty<input id="f-hp" type="text" tabindex="-1" autocomplete="off"></label></div>
      <div class="submit-actions">
        <button class="btn btn-primary" id="sendBtn" type="button">Send for review <span class="arr">→</span></button>
        <button class="btn btn-outline" id="saveBtn" type="button">Save</button>
        <button class="btn btn-outline" id="dlBtn" type="button">Download my answers</button>
      </div>
      <p class="status" id="status" role="status" aria-live="polite"></p>
      ${s.after ? `<p class="after">Finished? <a href="${esc(s.after.href)}">${esc(s.after.label)} →</a></p>` : ""}
      <p class="note">Your answers stay in this browser until you send them. Want live feedback instead? <a href="/#book">Book a mock interview</a>.</p>
    </section>`;
  }

  function close() {
    stopDictation();
    clearInterval(tickT); cur = null;
    $("#work").hidden = true; $("#work").innerHTML = ""; $("#list").hidden = false;
    document.title = "Practice — Crack Tech";
    renderList();
  }

  function count(id) {
    const v = ($("#a-" + id).value || "").trim();
    $("#c-" + id).textContent = v ? `${v.split(/\s+/).length} words` : "";
  }
  function tabKey(e) {
    if (e.key !== "Tab" || e.shiftKey) return;
    e.preventDefault();
    const ta = e.target, a = ta.selectionStart, b = ta.selectionEnd;
    ta.value = ta.value.slice(0, a) + "    " + ta.value.slice(b);
    ta.selectionStart = ta.selectionEnd = a + 4;
    ta.dispatchEvent(new Event("input"));
  }

  /* ---------- saving ---------- */
  function queueSave() { clearTimeout(saveT); $("#saved").textContent = "Saving…"; saveT = setTimeout(save, 600); }
  function save() {
    if (!cur) return;
    const ok = store.set(sKey(cur.id), state);
    $("#saved").textContent = ok ? "Saved " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Couldn't save in this browser. Download your answers to keep them.";
  }
  function saveProfile() {
    store.set(PROFILE_KEY, { name: $("#f-name").value.trim(), email: $("#f-email").value.trim(), target: $("#f-target").value.trim() });
  }
  function flash(msg, bad) { const el = $("#status"); el.textContent = msg; el.classList.toggle("bad", !!bad); }

  /* ---------- timer ---------- */
  const elapsed = () => state.elapsed + (state.runningSince ? Date.now() - state.runningSince : 0);
  function toggleTimer() {
    if (state.runningSince) { state.elapsed = elapsed(); state.runningSince = null; }
    else state.runningSince = Date.now();
    save(); tick();
  }
  function resetTimer() { state.elapsed = 0; state.runningSince = null; save(); tick(); }
  function tick() {
    if (!cur) return;
    const ms = elapsed(), left = MINUTES * 60 - Math.floor(ms / 1000), a = Math.abs(left);
    const clock = $("#clock");
    clock.textContent = (left < 0 ? "+" : "") + String(Math.floor(a / 60)).padStart(2, "0") + ":" + String(a % 60).padStart(2, "0");
    clock.classList.toggle("over", left < 0);
    $("#timerBtn").textContent = state.runningSince ? "Pause" : ms ? "Resume" : "Start 45-min timer";
    const mins = ms / 60000; let t = 0, at = -1;
    cur.blocks.forEach((b, i) => { if (at < 0 && mins < t + b.min) at = i; t += b.min; });
    cur.blocks.forEach((_, i) => $("#ag-" + i).classList.toggle("now", ms > 0 && i === at));
    $("#phase").textContent = !ms ? "" : at < 0 ? "Time's up" : `Now: ${cur.blocks[at].name}`;
  }

  /* ---------- dictation (Web Speech API, where the browser supports it) ---------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null, target = null, wanted = false;
  function setupDictation() {
    if (!SR) return;
    document.querySelectorAll(".mic").forEach(b => { b.hidden = false; b.onclick = () => toggleMic(b.dataset.p); });
  }
  function toggleMic(id) {
    if (target === id) return stopDictation();
    stopDictation();
    target = id; wanted = true;
    rec = new SR(); rec.lang = navigator.language || "en-US"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = e => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) {
          const ta = $("#a-" + target), text = r[0].transcript.trim();
          if (!ta || !text) continue;
          ta.value = ta.value + (ta.value && !/\s$/.test(ta.value) ? " " : "") + text;
          ta.dispatchEvent(new Event("input"));
        } else interim += r[0].transcript;
      }
      const el = $("#i-" + target); if (el) el.textContent = interim;
    };
    rec.onerror = e => { if (e.error === "not-allowed" || e.error === "service-not-allowed") { wanted = false; flash("Microphone access was blocked. Allow it in your browser to dictate.", true); } };
    rec.onend = () => { if (wanted && target) { try { rec.start(); return; } catch (e) {} } paintMics(); };
    try { rec.start(); } catch (e) { wanted = false; }
    paintMics();
  }
  function stopDictation() {
    wanted = false;
    const t = target; target = null;
    if (rec) { try { rec.stop(); } catch (e) {} rec = null; }
    if (t && $("#i-" + t)) $("#i-" + t).textContent = "";
    paintMics();
  }
  function paintMics() {
    document.querySelectorAll(".mic").forEach(b => {
      const on = b.dataset.p === target;
      b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "■ Stop" : "🎙 Dictate";
    });
  }

  /* ---------- export and send ---------- */
  function fmtTime(ms) { const m = Math.round(ms / 60000); return m ? `${m} min` : "timer not used"; }
  function markdown() {
    const s = cur, f = id => ($("#f-" + id).value || "").trim();
    let md = `# Practice: ${s.title}\n\n${s.tag || s.track} · ${MINUTES} min session\n\n`;
    md += `- Name: ${f("name") || "-"}\n- Email: ${f("email") || "-"}\n- Target: ${f("target") || "-"}\n- Time used: ${fmtTime(elapsed())}\n- Date: ${new Date().toLocaleString()}\n\n`;
    if (f("note")) md += `## Feedback request\n\n${f("note")}\n\n`;
    s.blocks.forEach(b => {
      md += `## ${b.name} (${b.min} min)\n\n`;
      b.prompts.forEach(p => {
        const a = (state.answers[p.id] || "").trim();
        md += `**${p.q}**\n\n`;
        if (p.given) md += "Given code:\n\n```\n" + p.given + "\n```\n\n";
        md += a ? (p.kind === "code" ? "```\n" + a + "\n```\n\n" : a + "\n\n") : "_(no answer)_\n\n";
      });
    });
    return md;
  }
  function download(md) {
    const name = (($("#f-name").value || "practice").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "practice") + "-" + cur.id + ".md";
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return name;
  }
  let sending = false;
  async function send() {
    if (sending) return;
    const name = $("#f-name").value.trim(), email = $("#f-email").value.trim();
    const answered = Object.values(state.answers).filter(v => v && v.trim()).length;
    if (!answered) return flash("Answer at least one question before sending.", true);
    if (!name) { $("#f-name").focus(); return flash("Please add your name.", true); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $("#f-email").focus(); return flash("Please add a valid email address.", true); }
    if (!$("#f-consent").checked) return flash("Please tick the box to agree to send your answers.", true);
    if ($("#f-hp").value) return; // bots fill hidden fields
    saveProfile(); save();
    const md = markdown();
    const subject = `Practice for review: ${cur.title} — ${name}`;
    if (!FORM_ENDPOINT) {
      const file = download(md);
      location.href = `mailto:${REVIEW_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Hi Crack Tech,\n\nPlease review my practice answers for "${cur.title}". The file ${file} has just downloaded; I've attached it to this email.\n\nThanks,\n${name}`)}`;
      return flash(`Your answers downloaded as ${file}. Attach it to the email that just opened and send it to ${REVIEW_EMAIL}.`);
    }
    sending = true; $("#sendBtn").disabled = true; flash("Sending…");
    try {
      const r = await fetch(FORM_ENDPOINT, {
        method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, target: $("#f-target").value.trim(), session: cur.title, time_used: fmtTime(elapsed()), answers: md, _subject: subject })
      });
      if (!r.ok) throw new Error(String(r.status));
      state.sentAt = Date.now(); save();
      $("#saved").textContent = "Sent for review " + new Date(state.sentAt).toLocaleDateString();
      flash(`Sent. We'll review your answers and reply to ${email}.`);
    } catch (e) {
      flash(`Couldn't send right now. Your answers are saved here. Try again, or use "Download my answers" and email the file to ${REVIEW_EMAIL}.`, true);
    } finally { sending = false; $("#sendBtn").disabled = false; }
  }

  /* ---------- routing ---------- */
  function route() { const id = decodeURIComponent(location.hash.slice(1)); if (id && SESSIONS.some(s => s.id === id)) open(id); else if (cur || $("#list").hidden) close(); }
  addEventListener("hashchange", route);
  addEventListener("pagehide", () => { if (cur) save(); });
  renderList(); route();
})();
