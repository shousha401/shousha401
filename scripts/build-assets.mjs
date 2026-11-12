#!/usr/bin/env node
// Generates the hand-built README pieces that replace third-party badges:
//   assets/stat-*.svg    headline number tiles
//   assets/stack-*.svg   tech-stack panels
//   assets/cta-*.svg     contact buttons
//   assets/shot-*.svg    client-site screenshots in a browser frame
//
// Run after editing the data below or the README's stack tags:
//   node scripts/build-assets.mjs
//
// No dependencies. Output is deterministic, so a re-run with unchanged inputs
// produces no diff. GitHub READMEs allow no JS or CSS, so everything animates
// with SMIL inside the <img>. Every animated element is visible by default and
// only animates *from* hidden, so a viewer without SMIL still sees the content.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ICONS = JSON.parse(readFileSync(join(ROOT, 'scripts', 'icons.json'), 'utf8'));
const README = readFileSync(join(ROOT, 'README.md'), 'utf8');

// ───────────────────────── data ─────────────────────────

// Headline numbers. The first three also appear, hand-written, in
// assets/boot-header.svg and assets/fleet-console.svg: change them together.
const STATS = [
  { file: 'stat-apps',     value: '~20',    label: 'apps in production', accent: '#58a6ff' },
  { file: 'stat-tests',    value: '2,500+', label: 'automated tests',    accent: '#6cb6ff' },
  { file: 'stat-sites',    value: '5',      label: 'live client sites',  accent: '#79c0ff' },
  { file: 'stat-saas',     value: '2',      label: 'paid SaaS replaced', accent: '#56d364' },
  { file: 'stat-accounts', value: '~10K',   label: 'sales accounts',     accent: '#3fb950' },
];

// Stack panels. A chip's "×N" is counted from the README's own project cards
// (see countTags), so it can't drift from what the page actually shows.
const STACK = [
  { file: 'stack-backend', title: 'backend & data', accent: '#58a6ff',
    chips: ['Node.js', 'Express', 'SQLite', 'PostgreSQL', 'Supabase', 'MSSQL', 'Python', 'FastAPI'] },
  { file: 'stack-frontend', title: 'frontend & mobile', accent: '#79c0ff',
    chips: ['React', 'TypeScript', 'Vite', 'Tailwind', 'React Native', 'Three.js', 'Next.js', 'Astro'] },
  { file: 'stack-ai', title: 'ai, where it earns its place', accent: '#d2a8ff',
    chips: ['OpenAI', 'Anthropic', 'Ollama'],
    notes: ['EN→ES PDF translator, in daily use', 'Ask JD: on-prem RAG over ERP data, read-only'] },
  { file: 'stack-infra', title: 'infra & ops', accent: '#3fb950',
    chips: ['Azure', 'Vercel', 'Railway', 'PM2', 'Git', 'GitHub', 'Linux', 'Windows'] },
];

// Client-site screenshots. Source: assets/shots/<name>.jpg, 800×500, captured
// from the live homepage at a 1440×900 viewport. To refresh one, replace the
// jpg and re-run this script.
const SHOTS = [
  { name: 'localfix',  url: 'localfix.now' },
  { name: 'kcwd',      url: 'kingscwd.org' },
  { name: 'pirata',    url: 'piratagoods.com' },
  { name: 'stitchery', url: 'refinedstitchery.co.uk' },
  { name: 'bullard',   url: 'bullardsoftball.com' },
];

const CTAS = [
  { file: 'cta-linkedin', title: 'LinkedIn', sub: "let's connect", accent: '#58a6ff', glyph: 'linkedin' },
  { file: 'cta-email', title: 'Email', sub: 'Shousha401@hotmail.com', accent: '#3fb950', glyph: 'mail' },
];

// ───────────────────────── helpers ─────────────────────────

const MONO = "ui-monospace, 'Cascadia Code', 'SF Mono', Menlo, Consolas, monospace";
const SANS = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";
const BG = '#0d1117', PANEL = '#161b22', BORDER = '#30363d', TEXT = '#c9d1d9', DIM = '#8b949e';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r2 = (n) => Math.round(n * 100) / 100;
// Width of monospace text. 0.62em is slightly wider than any font in MONO, so
// boxes sized with it never clip.
const monoW = (s, px) => [...s].length * px * 0.62;

// Fade in after `delay` seconds. Base state is visible (see header comment).
function fadeIn(delay, dur = 0.45) {
  const total = delay + dur;
  const k = r2(delay / total);
  return `<animate attributeName="opacity" values="0;0;1" keyTimes="0;${k};1" dur="${r2(total)}s" fill="freeze"/>`;
}

// One "card" per line of consecutive `tags` in the README. Versions and
// parentheticals are dropped so `React 19` and `PostgreSQL (Neon)` count as
// React and PostgreSQL.
function countTags() {
  const counts = new Map();
  for (const line of README.split('\n')) {
    if (!/^(`[^`]+`\s*)+$/.test(line.trim())) continue;
    const seen = new Set();
    for (const [, raw] of line.matchAll(/`([^`]+)`/g)) {
      const name = raw.replace(/\s*\(.*\)$/, '').replace(/\s+SSR$/, '').replace(/\s+\d+$/, '').trim();
      seen.add(name);
    }
    for (const name of seen) counts.set(name, (counts.get(name) || 0) + 1);
  }
  return counts;
}

function write(file, svg) {
  writeFileSync(join(ROOT, 'assets', `${file}.svg`), svg.trim() + '\n');
  console.log(`assets/${file}.svg`);
}

// ───────────────────────── stat tiles ─────────────────────────

function statTile({ value, label, accent }, i) {
  const W = 160, H = 92, delay = 0.15 + i * 0.14;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(value)} ${esc(label)}">
  <!-- generated by scripts/build-assets.mjs: edit the data there, not this file -->
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#58a6ff"/><stop offset="55%" stop-color="#79c0ff"/><stop offset="100%" stop-color="#3fb950"/>
    </linearGradient>
    <clipPath id="c"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10"/></clipPath>
  </defs>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10" fill="${BG}" stroke="${BORDER}" stroke-width="1.5"/>
  <g>
    ${fadeIn(delay)}
    <animateTransform attributeName="transform" type="translate" values="0 7;0 7;0 0" keyTimes="0;${r2(delay / (delay + 0.45))};1" dur="${r2(delay + 0.45)}s" fill="freeze"/>
    <text x="${W / 2}" y="46" text-anchor="middle" font-family="${SANS}" font-size="31" font-weight="800" letter-spacing="0.5" fill="url(#g)">${esc(value)}</text>
    <text x="${W / 2}" y="68" text-anchor="middle" font-family="${MONO}" font-size="10.5" letter-spacing="0.6" fill="${DIM}">${esc(label)}</text>
  </g>
  <g clip-path="url(#c)">
    <rect x="1" y="${H - 4}" width="${W - 2}" height="3" fill="${accent}">
      <animate attributeName="width" values="0;0;${W - 2}" keyTimes="0;${r2(delay / (delay + 0.7))};1" dur="${r2(delay + 0.7)}s" calcMode="spline" keySplines="0 0 1 1;0.3 0 0.2 1" fill="freeze"/>
    </rect>
  </g>
</svg>`;
}

// ───────────────────────── stack panels ─────────────────────────

const PANEL_W = 414, PAD = 16, CHIP_H = 30, GAP = 8, HEAD = 46, FONT = 12.5;

function layoutChips(chips, counts) {
  const rows = [[]];
  let x = PAD;
  for (const name of chips) {
    const n = counts.get(name) || 0;
    const count = n >= 2 ? `×${n}` : '';
    const w = Math.ceil(10 + 15 + 7 + monoW(name, FONT) + (count ? 8 + monoW(count, 11) : 0) + 11);
    if (x + w > PANEL_W - PAD && rows.at(-1).length) { rows.push([]); x = PAD; }
    rows.at(-1).push({ name, count, x, w });
    x += w + GAP;
  }
  return rows;
}

function stackPanel({ title, accent, chips, notes = [] }, counts, height) {
  const rows = layoutChips(chips, counts);
  let i = 0;
  const body = rows.map((row, r) => row.map((c) => {
    const y = HEAD + r * (CHIP_H + GAP);
    const icon = ICONS[c.name];
    if (!icon) throw new Error(`no icon for ${c.name} in scripts/icons.json`);
    const tx = c.x + 10 + 15 + 7;
    return `
  <g>
    ${fadeIn(0.1 + i++ * 0.06, 0.35)}
    <rect x="${c.x}" y="${y}" width="${c.w}" height="${CHIP_H}" rx="6" fill="${PANEL}" stroke="${BORDER}"/>
    <path transform="translate(${c.x + 10} ${y + 7.5}) scale(0.625)" fill="${icon.color}" d="${icon.path}"/>
    <text x="${tx}" y="${y + 19.5}" font-family="${MONO}" font-size="${FONT}" fill="${TEXT}">${esc(c.name)}</text>${c.count ? `
    <text x="${c.x + c.w - 11}" y="${y + 19.5}" text-anchor="end" font-family="${MONO}" font-size="11" font-weight="bold" fill="${accent}">${c.count}</text>` : ''}
  </g>`;
  }).join('')).join('');

  const notesY = HEAD + rows.length * (CHIP_H + GAP) + 14;
  const noteSvg = notes.map((n, k) => `
  <g>
    ${fadeIn(0.4 + k * 0.12, 0.35)}
    <text x="${PAD}" y="${notesY + k * 20}" font-family="${MONO}" font-size="11" fill="${DIM}"><tspan fill="${accent}">›</tspan> ${esc(n)}</text>
  </g>`).join('');

  const label = `${title}: ${chips.join(', ')}`;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${PANEL_W}" height="${height}" viewBox="0 0 ${PANEL_W} ${height}" role="img" aria-label="${esc(label)}">
  <!-- generated by scripts/build-assets.mjs: edit the data there, not this file -->
  <rect x="1" y="1" width="${PANEL_W - 2}" height="${height - 2}" rx="10" fill="${BG}" stroke="${BORDER}" stroke-width="1.5"/>
  <rect x="${PAD}" y="17" width="8" height="8" rx="2" fill="${accent}"/>
  <text x="${PAD + 16}" y="25" font-family="${MONO}" font-size="12" letter-spacing="1" fill="${DIM}">${esc(title)}</text>${body}${noteSvg}
</svg>`;
}

function panelHeight(p, counts) {
  const rows = layoutChips(p.chips, counts).length;
  const notes = p.notes?.length ? 6 + p.notes.length * 20 : 0;
  return HEAD + rows * (CHIP_H + GAP) - GAP + notes + PAD;
}

// ───────────────────────── contact buttons ─────────────────────────

// Plain glyphs drawn here, in a 24×24 box (not brand logos).
const GLYPHS = {
  linkedin: (c) => `<rect x="2" y="2" width="20" height="20" rx="4" fill="none" stroke="${c}" stroke-width="1.8"/><circle cx="8" cy="7.8" r="1.3" fill="${c}"/><path d="M8 10.8V17M12 17v-6.2M12 13.6c0-1.6 1.1-2.6 2.4-2.6s2.1.9 2.1 2.5V17" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`,
  mail: (c) => `<rect x="2.5" y="5" width="19" height="14" rx="2.5" fill="none" stroke="${c}" stroke-width="1.8"/><path d="M3.5 7l8.5 6 8.5-6" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`,
};

function cta({ title, sub, accent, glyph }) {
  const H = 46;
  const titleW = [...title].length * 15 * 0.53;
  const W = Math.ceil(16 + 22 + 12 + titleW + 10 + monoW(sub, 12) + 12 + 14 + 16);
  const tx = 16 + 22 + 12;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}: ${esc(sub)}">
  <!-- generated by scripts/build-assets.mjs: edit the data there, not this file -->
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="9" fill="${BG}" stroke="${accent}" stroke-width="1.5">
    <animate attributeName="stroke-opacity" values="0.55;1;0.55" dur="3.2s" repeatCount="indefinite"/>
  </rect>
  <g transform="translate(16 12) scale(0.92)">${GLYPHS[glyph](accent)}</g>
  <text x="${tx}" y="28.5" font-family="${SANS}" font-size="15" font-weight="700" fill="${TEXT}">${esc(title)}</text>
  <text x="${r2(tx + titleW + 10)}" y="28" font-family="${MONO}" font-size="12" fill="${DIM}">${esc(sub)}</text>
  <path d="M${W - 26} 18l5 5-5 5" fill="none" stroke="${accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

// ───────────────────────── screenshot frames ─────────────────────────

// Sized to be shown at about half width, so the chrome is drawn large. The
// JPEG is inlined: an SVG used as an <img> may not load external files.
function shotFrame({ name, url }) {
  const W = 800, BAR = 56, IMG_H = 500, H = BAR + IMG_H;
  const jpg = readFileSync(join(ROOT, 'assets', 'shots', `${name}.jpg`)).toString('base64');
  const pillW = Math.ceil(monoW(url, 21) + 76), pillX = (W - pillW) / 2;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Screenshot of ${esc(url)}">
  <!-- generated by scripts/build-assets.mjs from assets/shots/${name}.jpg -->
  <defs><clipPath id="f"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14"/></clipPath></defs>
  <g clip-path="url(#f)">
    <rect width="${W}" height="${H}" fill="${BG}"/>
    <image x="0" y="${BAR}" width="${W}" height="${IMG_H}" preserveAspectRatio="xMidYMid slice" href="data:image/jpeg;base64,${jpg}"/>
    <rect width="${W}" height="${BAR}" fill="${PANEL}"/>
    <line x1="0" y1="${BAR}" x2="${W}" y2="${BAR}" stroke="${BORDER}" stroke-width="1.5"/>
  </g>
  <circle cx="34" cy="${BAR / 2}" r="9" fill="#ff5f56"/><circle cx="64" cy="${BAR / 2}" r="9" fill="#ffbd2e"/><circle cx="94" cy="${BAR / 2}" r="9" fill="#27c93f"/>
  <rect x="${pillX}" y="11" width="${pillW}" height="34" rx="17" fill="${BG}" stroke="${BORDER}"/>
  <path transform="translate(${pillX + 18} 17)" fill="none" stroke="${DIM}" stroke-width="2.2" stroke-linecap="round" d="M5 10V6.5a5 5 0 0 1 10 0V10M3 10h14v10H3z"/>
  <text x="${pillX + 48}" y="35" font-family="${MONO}" font-size="21" fill="${TEXT}">${esc(url)}</text>
  <circle cx="${W - 92}" cy="${BAR / 2}" r="6" fill="#3fb950"><animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite"/></circle>
  <text x="${W - 78}" y="35" font-family="${MONO}" font-size="20" fill="#3fb950">live</text>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" fill="none" stroke="${BORDER}" stroke-width="2"/>
</svg>`;
}

// ───────────────────────── build ─────────────────────────

const counts = countTags();
STATS.forEach((s, i) => write(s.file, statTile(s, i)));
// Panels sit two per row, so each pair shares the taller one's height.
for (let i = 0; i < STACK.length; i += 2) {
  const pair = STACK.slice(i, i + 2);
  const h = Math.max(...pair.map((p) => panelHeight(p, counts)));
  for (const p of pair) write(p.file, stackPanel(p, counts, h));
}
CTAS.forEach((c) => write(c.file, cta(c)));
SHOTS.forEach((sh) => write(`shot-${sh.name}`, shotFrame(sh)));

const shown = STACK.flatMap((p) => p.chips).filter((n) => (counts.get(n) || 0) >= 2).map((n) => `${n} ×${counts.get(n)}`);
console.log(`\nproject counts from README cards: ${shown.join(', ')}`);
