// Shared runtime for visual explainer videos (inlined into every frame by make.py).
// The page's own script calls RT.init(tl) in window.setup and RT.frame(t) in window.setT.
// Captions: split a caption into chunks with " | ", or leave it to the automatic split. The caption text of each line is split into chunks of up to 3 words (a *highlighted* group
// stays together) and each chunk is shown for a share of the line's time, like word-by-word captions.
const RT = {
  tl: null, lines: [], sfx: [], colors: ['var(--hi)', 'var(--ok)', 'var(--cy)', 'var(--pk)'],
  init(tl) {
    this.tl = tl; this.lines = []; let g = 0;
    tl.scenes.forEach((s, si) => s.lines.forEach((l, li) => this.lines.push({ ...l, scene: s.id, si, li, g: g++, chunks: RT.chunk(l) })));
  },
  // Start/end of a line: RT.L('trace', 1).start
  L(scene, li) { return this.lines.find(l => l.scene === scene && l.li === li); },
  S(id) { return this.tl.scenes.find(s => s.id === id); },
  // The line being spoken at t (or the last one started, so visuals hold between lines).
  at(t) { let cur = this.lines[0]; for (const l of this.lines) if (t >= l.start - 0.05) cur = l; return cur; },
  // 0..1 progress of t through [a, b]
  p(t, a, b) { return Math.max(0, Math.min(1, (t - a) / Math.max(0.001, b - a))); },
  ease(p) { return 1 - Math.pow(1 - p, 3); },
  pop(t, t0, d = 0.25) { const p = RT.p(t, t0, t0 + d); return p >= 1 ? 1 : 0.85 + 0.15 * RT.ease(p) + 0.08 * Math.sin(p * Math.PI); },
  addSfx(t, kind) { this.sfx.push({ t: +t.toFixed(3), kind }); },
  chunk(l) {
    // explicit chunks: "Reach the flag | = *1 path*"
    if (l.text.includes('|')) return RT.timed(l, l.text.split('|').map(x => x.trim().match(/\*[^*]+\*|\S+/g)));
    const toks = []; const re = /\*[^*]+\*|\S+/g; let m;
    while ((m = re.exec(l.text))) toks.push(m[0]);
    const groups = []; let cur = [];
    for (const tk of toks) {
      const words = tk.startsWith('*') ? tk.split(' ').length : 1;
      const n = cur.reduce((a, x) => a + (x.startsWith('*') ? x.split(' ').length : 1), 0);
      if (cur.length && n + words > 3) { groups.push(cur); cur = []; }
      cur.push(tk);
    }
    if (cur.length) groups.push(cur);
    // a lone emoji joins the chunk before it
    for (let i = groups.length - 1; i > 0; i--) if (groups[i].length === 1 && !/[a-z0-9]/i.test(groups[i][0])) { groups[i - 1].push(...groups[i]); groups.splice(i, 1); }
    return RT.timed(l, groups);
  },
  timed(l, groups) {
    const w = groups.map(gr => gr.join(' ').length + 3), tot = w.reduce((a, b) => a + b, 0);
    let s = l.start; return groups.map((gr, i) => { const d = (l.end - l.start) * w[i] / tot; const c = { html: gr.map(x => x.startsWith('*') ? `<b>${x.slice(1, -1)}</b>` : x).join(' '), start: s, end: s + d }; s += d; return c; });
  },
  frame(t) {
    // progress bar: one segment per scene
    const bar = document.getElementById('prog');
    if (bar && !bar.children.length) this.tl.scenes.forEach(() => bar.appendChild(document.createElement('i')));
    if (bar) [...bar.children].forEach((e, i) => { const s = this.tl.scenes[i]; e.style.setProperty('--f', RT.p(t, s.start, s.end)); });
    // caption
    const l = this.at(t), cap = document.getElementById('cap');
    let ch = l.chunks.find(c => t >= c.start - 0.04 && t < c.end - 0.04) || (t >= l.chunks[l.chunks.length - 1].start ? l.chunks[l.chunks.length - 1] : null);
    if (!ch) { cap.style.opacity = 0; return; }
    const col = this.colors[l.g % this.colors.length];
    cap.style.opacity = 1; cap.style.setProperty('--c', col);
    if (cap.dataset.k !== ch.html) { cap.innerHTML = `<span>${ch.html}</span>`; cap.dataset.k = ch.html; }
    cap.firstChild.style.transform = `scale(${RT.pop(t, ch.start - 0.04, 0.18)})`;
  }
};
