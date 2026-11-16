const { chromium } = require('playwright'); const { execFileSync } = require('child_process');
const [file, out, w, h] = process.argv.slice(2);
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, async r => { const u = r.request().url(); const body = execFileSync('curl', ['-sS', '-A', 'Mozilla/5.0 Chrome/120', u]); await r.fulfill({ body, contentType: u.includes('googleapis') ? 'text/css' : 'font/woff2', headers: { 'access-control-allow-origin': '*' } }); });
  const p = await ctx.newPage(); await p.goto('file://' + file); await p.evaluate(() => document.fonts.ready);
  await p.locator('#v').screenshot({ path: out }); await b.close(); })();
