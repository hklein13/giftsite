#!/usr/bin/env node
// Generate procedural textures for the Golden Book template
// Uses sharp (already in devDeps) to create JPEG images from raw pixel buffers

import sharp from 'sharp';
import { writeFileSync } from 'fs';

// --- Utility: seeded pseudo-random for reproducibility ---
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// --- 1. Wood Desk Texture (1920x1080) ---
async function generateWoodDesk() {
  const W = 1920, H = 1080;
  const buf = Buffer.alloc(W * H * 3);
  const rand = mulberry32(42);

  for (let y = 0; y < H; y++) {
    // Base color with vertical banding (wood grain runs horizontally)
    const bandPhase = Math.sin(y * 0.008) * 12 + Math.sin(y * 0.023) * 6 + Math.sin(y * 0.067) * 3;

    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 3;

      // Base warm oak: ~#b8956a = rgb(184, 149, 106)
      let r = 184 + bandPhase;
      let g = 149 + bandPhase * 0.8;
      let b = 106 + bandPhase * 0.5;

      // Fine grain lines (tight, nearly horizontal)
      const grainLine = Math.sin(y * 0.7 + x * 0.005 + Math.sin(x * 0.01) * 2);
      if (grainLine > 0.85) {
        const darkening = (grainLine - 0.85) * 60;
        r -= darkening;
        g -= darkening * 0.9;
        b -= darkening * 0.7;
      }

      // Medium grain bands
      const medGrain = Math.sin(y * 0.15 + Math.sin(x * 0.003) * 5);
      if (medGrain > 0.7) {
        const shift = (medGrain - 0.7) * 25;
        r -= shift;
        g -= shift * 0.85;
        b -= shift * 0.6;
      }

      // Wide color variation
      const wideVar = Math.sin(y * 0.003 + 0.5) * 8;
      r += wideVar;
      g += wideVar * 0.7;
      b += wideVar * 0.4;

      // Subtle noise
      const noise = (rand() - 0.5) * 6;
      r += noise;
      g += noise;
      b += noise;

      // Slight knot/swirl hint
      const knotX = 600, knotY = 400, knotR = 120;
      const dx = x - knotX, dy = y - knotY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < knotR) {
        const knotStrength = (1 - dist / knotR) * 15;
        const knotAngle = Math.atan2(dy, dx) + dist * 0.02;
        const knotGrain = Math.sin(knotAngle * 8) * knotStrength;
        r -= knotGrain;
        g -= knotGrain * 0.8;
        b -= knotGrain * 0.6;
      }

      buf[idx]     = Math.max(0, Math.min(255, Math.round(r)));
      buf[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      buf[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }
  }

  await sharp(buf, { raw: { width: W, height: H, channels: 3 } })
    .jpeg({ quality: 75 })
    .toFile('assets/textures/wood-desk.jpg');

  console.log('Generated wood-desk.jpg');
}

// --- 2. Leather Cover Texture (512x512, tileable) ---
async function generateLeatherCover() {
  const S = 512;
  const buf = Buffer.alloc(S * S * 3);
  const rand = mulberry32(123);

  // Pre-generate noise field for leather grain
  const noiseField = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) noiseField[i] = rand();

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const idx = (y * S + x) * 3;

      // Base sapphire: #1e3a5f = rgb(30, 58, 95)
      let r = 30, g = 58, b = 95;

      // Leather pebble grain — use noise at multiple scales
      const n1 = noiseField[((y % S) * S + (x % S))];
      const n2 = noiseField[(((y*2) % S) * S + ((x*2) % S))];
      const n3 = noiseField[(((y*4) % S) * S + ((x*4) % S))];

      const grain = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2 - 0.5) * 30;

      r += grain * 0.4;
      g += grain * 0.6;
      b += grain;

      // Subtle highlight variation (simulates leather surface undulation)
      const undulation = Math.sin(x * 0.05 + n1 * 3) * Math.sin(y * 0.05 + n2 * 3) * 8;
      r += undulation * 0.3;
      g += undulation * 0.5;
      b += undulation;

      // Creases — occasional darker lines
      const crease1 = Math.sin(x * 0.12 + y * 0.08 + n1 * 6);
      const crease2 = Math.sin(x * 0.07 - y * 0.11 + n2 * 4);
      if (crease1 > 0.92) {
        const c = (crease1 - 0.92) * 80;
        r -= c * 0.4; g -= c * 0.5; b -= c;
      }
      if (crease2 > 0.94) {
        const c = (crease2 - 0.94) * 60;
        r -= c * 0.3; g -= c * 0.4; b -= c * 0.8;
      }

      buf[idx]     = Math.max(0, Math.min(255, Math.round(r)));
      buf[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      buf[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }
  }

  await sharp(buf, { raw: { width: S, height: S, channels: 3 } })
    .jpeg({ quality: 80 })
    .toFile('assets/textures/leather-cover.jpg');

  console.log('Generated leather-cover.jpg');
}

// --- 3. Parchment Page Texture (512x512, tileable) ---
async function generateParchmentPage() {
  const S = 512;
  const buf = Buffer.alloc(S * S * 3);
  const rand = mulberry32(789);

  // Pre-generate multi-octave noise for paper fiber
  const noise1 = new Float32Array(S * S);
  const noise2 = new Float32Array(S * S);
  const noise3 = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) {
    noise1[i] = rand();
    noise2[i] = rand();
    noise3[i] = rand();
  }

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const idx = (y * S + x) * 3;

      // Base cream: #fffcf7 = rgb(255, 252, 247)
      let r = 255, g = 252, b = 247;

      // Paper fiber texture — mostly horizontal streaks
      const n1 = noise1[y * S + x];
      const n2 = noise2[((y * 2) % S) * S + ((x * 3) % S)];
      const n3 = noise3[((y * 5) % S) * S + ((x * 2) % S)];

      // Horizontal fiber direction bias
      const fiber = (n1 * 0.4 + n2 * 0.35 + n3 * 0.25 - 0.5) * 12;
      r += fiber * 0.3;
      g += fiber * 0.5;
      b += fiber * 0.8;

      // Watermark-like subtle mottling
      const mottle = Math.sin(x * 0.02 + n1 * 2) * Math.sin(y * 0.02 + n2 * 2) * 4;
      r -= mottle * 0.2;
      g -= mottle * 0.4;
      b -= mottle * 0.6;

      // Very subtle warm spots
      const warm = Math.sin(x * 0.008 + y * 0.006) * 3;
      r += warm * 0.2;
      g -= warm * 0.1;
      b -= warm * 0.4;

      // Ensure staying in cream/warm range
      buf[idx]     = Math.max(240, Math.min(255, Math.round(r)));
      buf[idx + 1] = Math.max(237, Math.min(255, Math.round(g)));
      buf[idx + 2] = Math.max(230, Math.min(252, Math.round(b)));
    }
  }

  await sharp(buf, { raw: { width: S, height: S, channels: 3 } })
    .jpeg({ quality: 80 })
    .toFile('assets/textures/parchment-page.jpg');

  console.log('Generated parchment-page.jpg');
}

// --- Run all ---
console.log('Generating textures...');
await generateWoodDesk();
await generateLeatherCover();
await generateParchmentPage();
console.log('Done!');
