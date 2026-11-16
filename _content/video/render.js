const { chromium } = require('playwright'); const { execFileSync } = require('child_process'); const fs = require('fs');
const d = process.argv[2], fps = +(process.argv[3] || 30), only = process.argv[4];
const tl = JSON.parse(fs.readFileSync(`${d}/timeline.json`)); fs.mkdirSync(`${d}/frames`, { recursive: true });
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1080, height: 1920 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, async r => { const body = execFileSync('curl', ['-sS', '-A', 'Mozilla/5.0 Chrome/120', r.request().url()]); await r.fulfill({ body, contentType: r.request().url().includes('googleapis') ? 'text/css' : 'font/woff2', headers: { 'access-control-allow-origin': '*' } }); });
  const p = await ctx.newPage(); await p.goto('file://' + d + '/frame.html'); await p.evaluate(() => document.fonts.ready);
  await p.evaluate(tl => window.setup(tl), tl);
  const times = only ? only.split(',').map(Number) : [...Array(Math.ceil(tl.duration * fps)).keys()].map(i => i / fps);
  let i = 0; for (const t of times) { await p.evaluate(t => window.setT(t), t);
    if (only) await p.locator('#v').screenshot({ path: `${d}/preview-${t}.png` });
    else await p.locator('#v').screenshot({ path: `${d}/frames/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
    i++; }
  console.log('frames', i); await b.close(); })();
