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

      // Dark walnut: ~#5c3a20 = rgb(92, 58, 32)
      let r = 92 + bandPhase * 0.5;
      let g = 58 + bandPhase * 0.4;
      let b = 32 + bandPhase * 0.25;

      // Fine grain lines (tight, nearly horizontal) — higher contrast for dark wood
      const grainLine = Math.sin(y * 0.7 + x * 0.005 + Math.sin(x * 0.01) * 2);
      if (grainLine > 0.8) {
        const darkening = (grainLine - 0.8) * 40;
        r -= darkening;
        g -= darkening * 0.9;
        b -= darkening * 0.7;
      }
      // Lighter grain highlights
      if (grainLine < -0.85) {
        const lightening = (-0.85 - grainLine) * 20;
        r += lightening;
        g += lightening * 0.7;
        b += lightening * 0.4;
      }

      // Medium grain bands
      const medGrain = Math.sin(y * 0.15 + Math.sin(x * 0.003) * 5);
      if (medGrain > 0.6) {
        const shift = (medGrain - 0.6) * 18;
        r -= shift;
        g -= shift * 0.85;
        b -= shift * 0.6;
      }

      // Wide color variation
      const wideVar = Math.sin(y * 0.003 + 0.5) * 6;
      r += wideVar;
      g += wideVar * 0.7;
      b += wideVar * 0.4;

      // Noise
      const noise = (rand() - 0.5) * 5;
      r += noise;
      g += noise;
      b += noise;

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

// --- 3. Parchment Page Texture (1024x1024, tileable) ---
async function generateParchmentPage() {
  const S = 1024;
  const buf = Buffer.alloc(S * S * 3);
  const rand = mulberry32(789);

  // Pre-generate multiple noise octaves for rich paper detail
  const noise = [];
  for (let o = 0; o < 5; o++) {
    const field = new Float32Array(S * S);
    for (let i = 0; i < S * S; i++) field[i] = rand();
    noise.push(field);
  }

  // Helper: sample noise with wrapping (tileable)
  function sampleNoise(layer, x, y) {
    return noise[layer][((y & (S - 1)) * S + (x & (S - 1)))];
  }

  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const idx = (y * S + x) * 3;

      // Base warm cream: rgb(248, 242, 230)
      let r = 248, g = 242, b = 230;

      // --- Paper fiber grain (horizontal bias, multi-scale) ---
      const n0 = sampleNoise(0, x, y);
      const n1 = sampleNoise(1, x * 2, y * 2);
      const n2 = sampleNoise(2, x * 4, y * 4);
      const n3 = sampleNoise(3, x * 8, y * 8);
      const n4 = sampleNoise(4, x * 3, y);

      // Coarse fiber (large-scale paper texture)
      const coarseFiber = (n0 * 0.5 + n1 * 0.3 + n2 * 0.2 - 0.5) * 18;
      r += coarseFiber * 0.6;
      g += coarseFiber * 0.8;
      b += coarseFiber * 1.2;

      // Fine horizontal fiber streaks (paper grain direction)
      const fiberStreak = Math.sin(y * 0.8 + x * 0.02 + n0 * 4) * n1;
      r -= fiberStreak * 4;
      g -= fiberStreak * 5;
      b -= fiberStreak * 7;

      // Micro fiber detail (tiny visible strands)
      const microFiber = (n3 - 0.5) * 10;
      r += microFiber * 0.4;
      g += microFiber * 0.5;
      b += microFiber * 0.3;

      // --- Mottled warm/cool patches (aged paper unevenness) ---
      const mottleWarm = Math.sin(x * 0.012 + n0 * 3) * Math.sin(y * 0.015 + n1 * 3);
      const mottleCool = Math.sin(x * 0.009 - y * 0.011 + n2 * 2);
      r += mottleWarm * 6;
      g -= mottleWarm * 2 + mottleCool * 3;
      b -= mottleWarm * 5 + mottleCool * 2;

      // --- Paper pulp specks (tiny darker inclusions) ---
      if (n3 > 0.94) {
        const speckStr = (n3 - 0.94) * 120;
        r -= speckStr * 0.7;
        g -= speckStr * 0.8;
        b -= speckStr * 0.5;
      }

      // Lighter pulp inclusions
      if (n2 > 0.96) {
        const lightSpeck = (n2 - 0.96) * 80;
        r += lightSpeck * 0.3;
        g += lightSpeck * 0.2;
        b -= lightSpeck * 0.1;
      }

      // --- Subtle foxing (age spots — scattered warm brown dots) ---
      const foxDist1 = Math.sqrt((x - 180) ** 2 + (y - 320) ** 2);
      const foxDist2 = Math.sqrt((x - 720) ** 2 + (y - 150) ** 2);
      const foxDist3 = Math.sqrt((x - 500) ** 2 + (y - 800) ** 2);
      const foxDist4 = Math.sqrt((x - 900) ** 2 + (y - 600) ** 2);

      for (const fd of [foxDist1, foxDist2, foxDist3, foxDist4]) {
        if (fd < 12) {
          const foxStr = (1 - fd / 12) * 8;
          r -= foxStr * 0.5;
          g -= foxStr * 1.2;
          b -= foxStr * 1.8;
        }
      }

      // --- Wide tonal variation (simulates uneven aging) ---
      const toneShift = Math.sin(x * 0.004 + y * 0.003) * 4 +
                        Math.sin(x * 0.007 - y * 0.005) * 3;
      r += toneShift * 0.5;
      g += toneShift * 0.3;
      b -= toneShift * 0.4;

      // --- Fine noise (paper surface roughness) ---
      const surfaceNoise = (rand() - 0.5) * 4;
      r += surfaceNoise;
      g += surfaceNoise;
      b += surfaceNoise;

      // Clamp to aged cream range (wider than before for visible texture)
      buf[idx]     = Math.max(225, Math.min(255, Math.round(r)));
      buf[idx + 1] = Math.max(218, Math.min(250, Math.round(g)));
      buf[idx + 2] = Math.max(205, Math.min(240, Math.round(b)));
    }
  }

  await sharp(buf, { raw: { width: S, height: S, channels: 3 } })
    .jpeg({ quality: 85 })
    .toFile('assets/textures/parchment-page.jpg');

  console.log('Generated parchment-page.jpg');
}

// --- Run all ---
console.log('Generating textures...');
await generateWoodDesk();
await generateLeatherCover();
await generateParchmentPage();
console.log('Done!');
