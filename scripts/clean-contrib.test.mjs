// node --test scripts/clean-contrib.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { clean } from './clean-contrib.mjs';

const counter = (x, n) =>
  `<g transform="translate(${x}, 802), scale(2)"><path fill-rule="evenodd" d="M8 .25z" fill="#eeeeff"></path></g>` +
  `<text style="font-size: 32px; font-weight: bold;" x="${x + 42}" y="830" text-anchor="start" fill="#eeeeff">${n}<title>${n}</title></text>`;
const doc = (stars, forks) => `<svg><text>3838</text><text>contributions</text>${counter(608, stars)}${counter(736, forks)}<text>2025 / 2026</text></svg>`;

test('hides both counters while they are zero, keeps everything else', () => {
  const { svg } = clean(doc(0, 0));
  assert.equal(svg, '<svg><text>3838</text><text>contributions</text><text>2025 / 2026</text></svg>');
});

test('keeps a counter once it is non-zero', () => {
  const { svg } = clean(doc(12, 0));
  assert.ok(svg.includes('>12<title>12</title>'));
  assert.ok(!svg.includes('>0<title>0</title>'));
});

test('leaves the file untouched when both are non-zero', () => {
  assert.equal(clean(doc(3, 1)).svg, doc(3, 1));
});

test('leaves unexpected markup exactly as generated', () => {
  const odd = '<svg><text>3838</text></svg>';
  assert.equal(clean(odd).svg, odd);
  assert.equal(clean(doc(0, 0) + counter(900, 0)).svg, doc(0, 0) + counter(900, 0));
});

test('is idempotent', () => {
  const once = clean(doc(0, 0)).svg;
  assert.equal(clean(once).svg, once);
});
