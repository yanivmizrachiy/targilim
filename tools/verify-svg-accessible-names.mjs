// Accessibility gate for active math diagrams (Issue #54 / #55).
// Runs against real curriculum engines; read-only and deterministic in scope.
import assert from 'node:assert/strict';
import { loadEngines } from './engine-load.mjs';

function hasAccessibleName(svg) {
  const open = svg.match(/^<svg\b[^>]*>/i)?.[0] || '';
  const label = open.match(/\baria-label\s*=\s*(["'])([\s\S]*?)\1/i)?.[2];
  if (label && label.trim()) return true;
  const title = svg.match(/<title\b[^>]*>([^<]*)<\/title>/i)?.[1];
  if (title && title.trim()) return true;
  const ref = open.match(/\baria-labelledby\s*=\s*(["'])([\s\S]*?)\1/i)?.[2]?.trim();
  if (!ref) return false;
  // aria-labelledby counts only when its referenced element exists in this SVG.
  const ids = ref.split(/\s+/);
  return ids.every(id => {
    const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('<(?:title|desc|text)\\b[^>]*\\bid=["\\x27]' + escaped + '["\\x27][^>]*>[^<]+<\\/', 'i').test(svg);
  });
}

// Negative examples are essential: the gate must fail for an unnamed role=img.
// A merely present but empty aria-label does not count as an accessible name.
assert.equal(hasAccessibleName('<svg role="img"><path/></svg>'), false);
assert.equal(hasAccessibleName('<svg role="img" aria-label=" "><path/></svg>'), false);
assert.equal(hasAccessibleName('<svg role="img" aria-label="משולש"><path/></svg>'), true);
assert.equal(hasAccessibleName('<svg role="img"><title>מעגל</title><path/></svg>'), true);
assert.equal(hasAccessibleName('<svg role="img" aria-labelledby="a"><title id="a">מלבן</title></svg>'), true);
assert.equal(hasAccessibleName('<svg role="img" aria-labelledby="missing"><path/></svg>'), false);

const { pilotIds, sourceFitIds, callEngine } = loadEngines();
const ids = pilotIds.concat(sourceFitIds);
assert.equal(ids.length, 50, 'the real inventory must include all 50 engines');
assert.equal(new Set(ids).size, 50, 'engine IDs must be unique');

const qtypes = ['open', 'mcq', 'tf', 'mistake'];
const levels = ['basic', 'standard', 'challenge'];
let generated = 0, totalSvg = 0, namedRoleImg = 0, roleImg = 0;
const failures = [];
for (const id of ids) {
  for (const level of levels) for (const type of qtypes) for (let sample = 0; sample < 4; sample++) {
    const output = callEngine(id, level, type);
    if (!output) continue;
    generated++;
    for (const svg of String(output.questionHTML || '').match(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi) || []) {
      totalSvg++;
      const openingTag = svg.match(/^<svg\b[^>]*>/i)?.[0] || '';
      if (!/\brole\s*=\s*(["'])img\1/i.test(openingTag)) continue;
      roleImg++;
      if (hasAccessibleName(svg)) namedRoleImg++;
      else if (failures.length < 12) failures.push(id + '/' + level + '/' + type);
    }
  }
}
assert.ok(generated >= 2000, 'unexpectedly few real questions sampled: ' + generated);
assert.ok(roleImg >= 100, 'expected a substantial role=img diagram sample: ' + roleImg);
assert.equal(namedRoleImg, roleImg,
  'unnamed role=img SVGs in real student questions; first samples: ' + failures.join(', '));
console.log('SVG_ACCESSIBLE_NAME_PASS — ' + namedRoleImg + '/' + roleImg +
  ' named role=img diagrams, ' + totalSvg + ' total SVGs, ' + generated + ' generated questions, 50 engines');
