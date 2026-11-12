// generator/workbook/rng.js
// Seeded, replayable randomness for whole documents. A document has one short
// code; every exercise draws from its own stream derived from that code, so the
// same settings + code always rebuild the same document, and changing the
// number of exercises never changes the earlier ones.
(function (root) {
  'use strict';
  const W = root.TargilimWorkbook = root.TargilimWorkbook || {};

  // cyrb128: string → four 32-bit words of seed material.
  function hash128(text) {
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (let i = 0; i < text.length; i++) {
      const k = text.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= h2 ^ h3 ^ h4; h2 ^= h1; h3 ^= h1; h4 ^= h1;
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
  }

  // sfc32: small fast counter generator, uniform in [0, 1).
  function sfc32(a, b, c, d) {
    return function () {
      a |= 0; b |= 0; c |= 0; d |= 0;
      const t = (((a + b) | 0) + d) | 0;
      d = (d + 1) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
  }

  function createRng(seed) {
    const key = String(seed);
    const next = sfc32.apply(null, hash128(key));
    for (let i = 0; i < 15; i++) next();
    return {
      seed: key,
      next: next,
      int: function (min, max) { return min + Math.floor(next() * (max - min + 1)); },
      pick: function (list) { return list[Math.floor(next() * list.length)]; },
      chance: function (p) { return next() < p; },
      shuffle: function (list) {
        const a = list.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(next() * (i + 1));
          const t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
      },
      fork: function (label) { return createRng(key + '/' + label); }
    };
  }

  // Six characters without look-alikes (no 0/O, 1/I/L).
  const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  function newSeedCode(source) {
    const draw = typeof source === 'function' ? source : Math.random;
    let code = '';
    for (let i = 0; i < 6; i++) code += ALPHABET[Math.floor(draw() * ALPHABET.length)];
    return code;
  }
  function isSeedCode(value) { return /^[2-9A-HJKMNP-Z]{6}$/.test(String(value || '')); }

  // Legacy engines call Math.random directly; run them on a seeded stream.
  function withMathRandom(rng, fn) {
    const original = Math.random;
    Math.random = rng.next;
    try { return fn(); } finally { Math.random = original; }
  }

  W.rng = { createRng: createRng, newSeedCode: newSeedCode, isSeedCode: isSeedCode, withMathRandom: withMathRandom };
})(typeof window !== 'undefined' ? window : globalThis);
