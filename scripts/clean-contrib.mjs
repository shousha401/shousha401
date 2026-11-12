#!/usr/bin/env node
// Post-processes the generated 3D contribution graphs (profile-3d-contrib/*.svg).
//
// The generator prints star and fork counters under the graph. Almost all of
// the work behind this profile lives in private repos, so those read "0 / 0"
// next to a year of daily commits. This hides each counter while it is zero;
// as soon as one is non-zero the generator's own output is left alone.
//
// Fail-soft by design: it runs inside the scheduled workflow, so on anything
// unexpected it leaves the file untouched, says so, and still exits 0. A
// cosmetic step must never be the reason the graph stops updating.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'profile-3d-contrib');

// icon group + its counter, exactly as github-profile-3d-contrib 0.7.1 emits them
const COUNTER = /<g transform="translate\(\d+, \d+\), scale\(2\)"><path fill-rule="evenodd" d="[^"]+" fill="[^"]+"><\/path><\/g><text [^>]*>(\d+)<title>\d+<\/title><\/text>/g;

export function clean(svg) {
  const found = [...svg.matchAll(COUNTER)];
  if (found.length !== 2) return { svg, status: `expected 2 counters, found ${found.length}: left as generated` };
  let hidden = 0;
  const out = svg.replace(COUNTER, (block, n) => (n === '0' ? (hidden++, '') : block));
  return { svg: out, status: hidden ? `hid ${hidden} zero counter(s)` : 'counters non-zero: left as generated' };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    for (const name of readdirSync(DIR).filter((f) => f.endsWith('.svg')).sort()) {
      const file = join(DIR, name);
      const before = readFileSync(file, 'utf8');
      const { svg, status } = clean(before);
      if (svg !== before) writeFileSync(file, svg);
      console.log(`${name}: ${status}`);
    }
  } catch (err) {
    console.log(`clean-contrib skipped: ${err.message}`);
  }
}
