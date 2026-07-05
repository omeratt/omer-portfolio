/**
 * Regenerate the Open Graph share card → public/og.png (1200×630, rendered @2x).
 *
 * Local-only tool (needs Chrome for pixel-perfect font/gradient rendering):
 *   npm run og
 *
 * Fonts are embedded as base64 so headless Chrome renders the real brand faces
 * with no network. Edit the copy / geometry below, then re-run.
 */
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const b64 = (p) => readFileSync(join(root, p)).toString('base64');
const sora = b64('node_modules/@fontsource-variable/sora/files/sora-latin-wght-normal.woff2');
const mono = b64('node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Sora';src:url(data:font/woff2;base64,${sora}) format('woff2');font-weight:100 900;font-display:block}
@font-face{font-family:'JBMono';src:url(data:font/woff2;base64,${mono}) format('woff2');font-weight:100 800;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden}
.card{position:relative;width:1200px;height:630px;background:#0b0b0d;overflow:hidden}
.glow{position:absolute;top:-260px;right:-180px;width:820px;height:820px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,106,46,0.20),rgba(255,106,46,0.05) 42%,transparent 66%);filter:blur(6px)}
.court{position:absolute;inset:0}
.court *{fill:none;stroke:rgba(241,238,231,0.09);stroke-width:1.6;vector-effect:non-scaling-stroke}
.content{position:absolute;inset:0;padding:86px 90px;display:flex;flex-direction:column;justify-content:center}
.eyebrow{font-family:'JBMono';font-weight:500;font-size:22px;letter-spacing:.26em;text-transform:uppercase;color:#9a958b}
h1{font-family:'Sora';font-weight:800;font-size:104px;line-height:1.02;letter-spacing:-.02em;color:#f1eee7;margin-top:30px}
h1 .accent{color:#ff6a2e}
.rule{width:96px;height:5px;border-radius:3px;background:#ff6a2e;margin-top:38px}
.sub{font-family:'Sora';font-weight:400;font-size:29px;line-height:1.4;color:#9a958b;margin-top:34px;max-width:820px}
.url{position:absolute;left:90px;bottom:64px;display:flex;align-items:center;gap:14px;
  font-family:'JBMono';font-weight:500;font-size:21px;letter-spacing:.02em;color:#c7c2b8}
.dot{width:12px;height:12px;border-radius:50%;background:#ff6a2e;box-shadow:0 0 18px 2px rgba(255,106,46,.55)}
</style></head><body>
<div class="card">
  <div class="glow"></div>
  <svg class="court" viewBox="0 0 1200 630" preserveAspectRatio="none">
    <circle cx="1010" cy="150" r="250"/>
    <circle cx="1010" cy="150" r="82"/>
    <line x1="0" y1="410" x2="1200" y2="410"/>
    <path d="M -60 720 Q 600 380 1260 720"/>
  </svg>
  <div class="content">
    <div class="eyebrow">Omer Attias &middot; React Native &middot; Motion &middot; Native</div>
    <h1>Interfaces with<br><span class="accent">muscle memory</span></h1>
    <div class="rule"></div>
    <div class="sub">React&nbsp;Native engineer specializing in motion, animation&nbsp;and native performance.</div>
  </div>
  <div class="url"><span class="dot"></span>omeratt.github.io/omer-portfolio</div>
</div>
</body></html>`;

const work = mkdtempSync(join(tmpdir(), 'og-'));
const htmlPath = join(work, 'og.html');
const outPath = join(root, 'public', 'og.png');
writeFileSync(htmlPath, html);

const chrome =
  process.env.CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

execFileSync(chrome, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--force-device-scale-factor=2', // render @2x for crisp retina sharing cards
  '--window-size=1200,630',
  `--screenshot=${outPath}`,
  `file://${htmlPath}`,
]);

console.log(`✓ wrote ${outPath}`);
