const { chromium } = require('playwright'); const { execFileSync } = require('child_process');
const [file, outdir] = process.argv.slice(2);
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1080, height: 1350 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, async r => { const u = r.request().url(); const body = execFileSync('curl', ['-sS', '-A', 'Mozilla/5.0 Chrome/120', u]); await r.fulfill({ body, contentType: u.includes('googleapis') ? 'text/css' : 'font/woff2', headers: { 'access-control-allow-origin': '*' } }); });
  const p = await ctx.newPage(); await p.goto('file://' + file); await p.evaluate(() => document.fonts.ready);
  const n = await p.locator('.s').count();
  for (let i = 0; i < n; i++) await p.locator('.s').nth(i).screenshot({ path: `${outdir}/slide-${i + 1}.png` });
  await p.pdf({ path: `${outdir}/code-with-ai-carousel.pdf`, width: '1080px', height: '1350px', printBackground: true, preferCSSPageSize: true });
  await b.close(); })();
