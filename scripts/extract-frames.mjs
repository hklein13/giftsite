#!/usr/bin/env node
// scripts/extract-frames.mjs — Extract WebP frames from video for scroll-driven canvas playback
// Usage: node scripts/extract-frames.mjs <video-path> [--frames N]

import { execFileSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
import { resolve, basename } from 'path';

const args = process.argv.slice(2);
const videoPath = args.find(a => !a.startsWith('--'));
const framesFlag = args.indexOf('--frames');
const targetFrames = framesFlag !== -1 ? parseInt(args[framesFlag + 1], 10) : 120;

if (!videoPath) {
  console.error('Usage: node scripts/extract-frames.mjs <video-path> [--frames N]');
  process.exit(1);
}

const absVideo = resolve(videoPath);
if (!existsSync(absVideo)) {
  console.error(`Video not found: ${absVideo}`);
  process.exit(1);
}

// Probe video duration
const probeOut = execFileSync('ffprobe', [
  '-v', 'error',
  '-show_entries', 'format=duration',
  '-of', 'csv=p=0',
  absVideo,
], { encoding: 'utf-8' }).trim();

const duration = parseFloat(probeOut);
console.log(`Video: ${basename(absVideo)}`);
console.log(`Duration: ${duration.toFixed(2)}s`);

const desktopDir = resolve('public/study-frames/desktop');
const mobileDir = resolve('public/study-frames/mobile');
mkdirSync(desktopDir, { recursive: true });
mkdirSync(mobileDir, { recursive: true });

// Desktop: 1280x720 WebP, quality 80
const desktopFps = (targetFrames / duration).toFixed(4);
const mobileFrames = Math.round(targetFrames * 0.83);
const mobileFps = (mobileFrames / duration).toFixed(4);

console.log(`\nExtracting ${targetFrames} desktop frames (1280x720) at ${desktopFps} fps...`);
execFileSync('ffmpeg', [
  '-y', '-i', absVideo,
  '-vf', `fps=${desktopFps},scale=1280:720`,
  '-c:v', 'libwebp', '-quality', '80',
  `${desktopDir}/frame-%03d.webp`,
], { stdio: 'inherit' });

console.log(`\nExtracting ${mobileFrames} mobile frames (640x360) at ${mobileFps} fps...`);
execFileSync('ffmpeg', [
  '-y', '-i', absVideo,
  '-vf', `fps=${mobileFps},scale=640:360`,
  '-c:v', 'libwebp', '-quality', '75',
  `${mobileDir}/frame-%03d.webp`,
], { stdio: 'inherit' });

console.log(`\nDone!`);
console.log(`  Desktop: ${desktopDir} (${targetFrames} frames)`);
console.log(`  Mobile:  ${mobileDir} (${mobileFrames} frames)`);
