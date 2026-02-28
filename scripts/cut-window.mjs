// Script to cut out the window area from the cabin image, making it transparent.
// Run: node scripts/cut-window.mjs
// Outputs: textures/cabin-frame.png (cabin with transparent window)
//          textures/cabin-frame-preview.png (red overlay showing cutout area for verification)

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';

const INPUT = 'cabin-image.jpg';
const OUTPUT = 'textures/cabin-frame.png';
const PREVIEW = 'textures/cabin-frame-preview.png';

// Main window boundaries (pixels) — the area to make transparent
// Image is 1024 x 572
const WINDOW = {
  left: 288,
  top: 88,
  right: 732,
  bottom: 370,
};

// Side window on right edge — paint over with wall color to hide it
const SIDE_WINDOW = {
  left: 910,
  top: 50,
  right: 1024,
  bottom: 400,
};
const WALL_COLOR = { r: 160, g: 120, b: 70 }; // approximate warm wood tone

const width = WINDOW.right - WINDOW.left;
const height = WINDOW.bottom - WINDOW.top;

async function main() {
  mkdirSync('textures', { recursive: true });

  // First: create a preview with red overlay showing the cutout area
  const redRect = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    redRect[i * 4 + 0] = 255;  // R
    redRect[i * 4 + 1] = 0;    // G
    redRect[i * 4 + 2] = 0;    // B
    redRect[i * 4 + 3] = 128;  // A (semi-transparent)
  }

  await sharp(INPUT)
    .ensureAlpha()
    .composite([{
      input: await sharp(redRect, { raw: { width, height, channels: 4 } }).png().toBuffer(),
      left: WINDOW.left,
      top: WINDOW.top,
    }])
    .png()
    .toFile(PREVIEW);

  console.log(`Preview saved to ${PREVIEW} — check the red overlay alignment`);

  // Second: create the actual cutout (transparent window + side window paint-over)
  // Strategy: get raw pixels, modify as needed
  const { data, info } = await sharp(INPUT)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const imgW = info.width;

  // Paint over side window by sampling wall color from left neighbor column
  // For each row, grab the pixel color at x=SIDE_WINDOW.left-5 and use that
  for (let y = SIDE_WINDOW.top; y < SIDE_WINDOW.bottom; y++) {
    // Sample wall color from a column just left of the side window
    const sampleX = Math.max(0, SIDE_WINDOW.left - 8);
    const sampleIdx = (y * imgW + sampleX) * 4;
    const wallR = data[sampleIdx + 0];
    const wallG = data[sampleIdx + 1];
    const wallB = data[sampleIdx + 2];

    for (let x = SIDE_WINDOW.left; x < SIDE_WINDOW.right; x++) {
      const idx = (y * imgW + x) * 4;
      // Feather: blend from original to wall color over 20px from left edge
      const distFromEdge = x - SIDE_WINDOW.left;
      const blend = Math.min(1.0, distFromEdge / 20);
      data[idx + 0] = Math.round(data[idx + 0] * (1 - blend) + wallR * blend);
      data[idx + 1] = Math.round(data[idx + 1] * (1 - blend) + wallG * blend);
      data[idx + 2] = Math.round(data[idx + 2] * (1 - blend) + wallB * blend);
    }
  }

  // Make main window transparent
  for (let y = WINDOW.top; y < WINDOW.bottom; y++) {
    for (let x = WINDOW.left; x < WINDOW.right; x++) {
      const idx = (y * imgW + x) * 4;
      data[idx + 3] = 0; // set alpha to 0
    }
  }

  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(OUTPUT);

  console.log(`Cutout saved to ${OUTPUT}`);
  console.log(`Window region: ${width}x${height} at (${WINDOW.left}, ${WINDOW.top})`);
}

main().catch(console.error);
