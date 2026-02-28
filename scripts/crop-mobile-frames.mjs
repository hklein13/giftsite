#!/usr/bin/env node
// scripts/crop-mobile-frames.mjs — Crop landscape frames to portrait for mobile
// Usage: node scripts/crop-mobile-frames.mjs
//
// Reads 1920x1080 frames from public/study-frames/
// Crops to 540x1080 centered on the treasure chest (focalPoint 0.475)
// Writes to public/study-frames-mobile/

import sharp from 'sharp';
import { mkdirSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

const srcDir = resolve('public/study-frames');
const outDir = resolve('public/study-frames-mobile');

// Crop parameters (derived from focalPoint [0.475, 0.5] on 1920x1080)
const CROP_LEFT = 642;
const CROP_TOP = 0;
const CROP_WIDTH = 540;
const CROP_HEIGHT = 1080;

mkdirSync(outDir, { recursive: true });

const files = readdirSync(srcDir)
  .filter(f => f.match(/^frame-\d{3}\.webp$/))
  .sort();

console.log(`Cropping ${files.length} frames: ${CROP_WIDTH}x${CROP_HEIGHT} from (${CROP_LEFT}, ${CROP_TOP})`);
console.log(`Source: ${srcDir}`);
console.log(`Output: ${outDir}\n`);

let totalSrcSize = 0;
let totalOutSize = 0;

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const srcPath = join(srcDir, file);
  const outPath = join(outDir, file);

  const srcSize = statSync(srcPath).size;
  totalSrcSize += srcSize;

  await sharp(srcPath)
    .extract({ left: CROP_LEFT, top: CROP_TOP, width: CROP_WIDTH, height: CROP_HEIGHT })
    .webp({ quality: 92 })
    .toFile(outPath);

  const outSize = statSync(outPath).size;
  totalOutSize += outSize;

  if ((i + 1) % 20 === 0 || i === files.length - 1) {
    console.log(`  ${i + 1}/${files.length} — ${file} (${(srcSize / 1024).toFixed(0)}KB → ${(outSize / 1024).toFixed(0)}KB)`);
  }
}

console.log(`\nDone!`);
console.log(`  Source total: ${(totalSrcSize / 1024 / 1024).toFixed(1)}MB`);
console.log(`  Output total: ${(totalOutSize / 1024 / 1024).toFixed(1)}MB`);
console.log(`  Reduction: ${((1 - totalOutSize / totalSrcSize) * 100).toFixed(0)}%`);
