# Sanctuary Scroll Experience — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Sanctuary template from a static photo layout into a cinematic scroll-driven experience where a treasure chest opens as the user scrolls, culminating in a gold-filled screen that reveals subpage navigation cards.

**Architecture:** Canvas frame sequence driven by GSAP ScrollTrigger scrub. ~150 WebP frames extracted from an AI-generated video, progressively loaded in three phases, drawn to a sticky canvas as the user scrolls through a tall spacer div. Gold climax blends seamlessly into a card reveal section below.

**Tech Stack:** GSAP ScrollTrigger (scrub), Lenis (smooth scroll), HTML5 Canvas, ffmpeg (frame extraction), WebP frames, Vite (public/ directory for unprocessed frame assets)

---

## Phase 1: Asset Pipeline & Viability

> **GATE:** Phase 2 only begins after the user has generated video assets and confirmed viability via the test page. Do NOT proceed to Phase 2 without explicit user go-ahead.

### Task 1: Frame Extraction Script

**Files:**
- Create: `scripts/extract-frames.mjs`

**Context:** This script takes an AI-generated video file and extracts sequentially numbered WebP frames at two resolutions. Requires ffmpeg installed on the system. This is a local development utility — not web-facing code.

**Step 1: Create the extraction script**

Uses Node.js `child_process.execSync` to shell out to ffmpeg (local dev tool, not web-facing).

The script:
- Takes a video file path as first argument
- Optional `--frames N` flag (default: 150)
- Probes video duration with ffprobe
- Calculates target fps to produce the desired frame count
- Extracts desktop frames (1920x1080 WebP) to `public/sanctuary-frames/desktop/`
- Extracts mobile frames (960x540 WebP) to `public/sanctuary-frames/mobile/`
- Sequential naming: `frame-001.webp` through `frame-150.webp`

**Step 2: Verify it runs (once user provides a test video)**

Run: `node scripts/extract-frames.mjs path/to/test-video.mp4 --frames 150`
Expected: `public/sanctuary-frames/desktop/frame-001.webp` through `frame-150.webp` created, same for mobile.

**Step 3: Add public/sanctuary-frames/ to .gitignore (for now)**

The frames are large binary assets. During development, keep them out of git:
```
public/sanctuary-frames/desktop/*.webp
public/sanctuary-frames/mobile/*.webp
```

**Step 4: Commit**

```bash
git add scripts/extract-frames.mjs .gitignore
git commit -m "feat: add ffmpeg frame extraction script for sanctuary scroll"
```

---

### Task 2: Standalone Viability Test Page

**Files:**
- Create: `test-scroll.html` (project root, not deployed — just for local testing)

**Context:** A minimal standalone page that loads extracted frames and lets the user scrub through them with scroll. No dependencies on the existing Sanctuary code. This proves the concept works before we modify anything.

**Step 1: Create the test page**

The test page includes:
- A sticky canvas (100vh) inside a scroll runway (500vh)
- GSAP ScrollTrigger mapping scroll progress to frame index
- Progressive frame loading (Phase 1: 0-19, Phase 2: 20-59, Phase 3: on-demand)
- Object-fit: cover canvas rendering
- Debug overlay showing current frame number and loaded count
- A placeholder gold section at the bottom
- Fallback: shows last loaded frame if user scrolls past loaded boundary

**Step 2: Add to .gitignore**

```
test-scroll.html
```

**Step 3: Test it**

Run: `npx vite` (dev server)
Navigate to: `http://localhost:5173/test-scroll.html`
Expected: Canvas shows frame 0, scrolling scrubs through frames, debug overlay shows frame number and loaded count.

**Step 4: Commit**

```bash
git add test-scroll.html .gitignore
git commit -m "feat: add standalone scroll viability test page"
```

---

> **VIABILITY GATE**
>
> At this point, pause and wait for the user to:
> 1. Generate the AI video (base image + video tool)
> 2. Run `node scripts/extract-frames.mjs <video>` to extract frames
> 3. Test the scroll experience on the viability page
> 4. Confirm go/no-go
>
> Do NOT proceed to Phase 2 until the user says the assets work.

---

## Phase 2: Sanctuary Integration

### Task 3: Build frame-scroller.js Module

**Files:**
- Create: `js/frame-scroller.js`

**Context:** Reusable module that handles progressive frame loading, canvas rendering, and scroll-to-frame mapping. Extracted from the test page logic but structured as an importable ES module.

**Step 1: Create the module**

`createFrameScroller()` accepts a config object:

```js
createFrameScroller({
  canvas,              // HTMLCanvasElement
  frameCount: 150,     // total frame count
  desktopPath: '...',  // path to desktop frames directory
  mobilePath: '...',   // path to mobile frames directory
  trigger: '...',      // CSS selector for ScrollTrigger trigger element
  scrub: 0.5,          // ScrollTrigger scrub value
  onFrameChange: null, // optional callback(currentFrame, totalFrames)
})
```

Module responsibilities:
- Canvas sizing with DPR awareness (capped: mobile 1.5, desktop 2.0)
- Progressive loading: Phase 1 (0-19 on init), Phase 2 (20-59 on idle), Phase 3 (chunks of 40 on scroll approach)
- Object-fit: cover canvas drawing
- ScrollTrigger creation with scrub
- Fallback to nearest loaded frame when user outruns loading
- `requestIdleCallback` with `setTimeout` fallback for Phase 2
- `destroy()` method for cleanup
- Resize handler for viewport changes

Returns: `{ destroy, getCurrentFrame }`

**Step 2: Verify it imports**

Run: `npx vite` — check no import errors in dev console.

**Step 3: Commit**

```bash
git add js/frame-scroller.js
git commit -m "feat: add frame-scroller.js module for scroll-driven canvas playback"
```

---

### Task 4: Update cabin/index.html Markup & CSS

**Files:**
- Modify: `cabin/index.html`

**Context:** Replace the `<picture>` hero background with a `<canvas>`. Add the scroll runway wrapper. Update the card section background to gold gradient. Keep dust particles, companion button, and footer.

**Step 1: Update CSS**

Replace `.hero-bg-picture` and `.hero-bg` styles with:

```css
/* ===== SCROLL RUNWAY ===== */
.scroll-runway {
  height: 600vh; /* tunable — controls scrub speed */
  position: relative;
}

/* ===== STICKY HERO CANVAS ===== */
.frame-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
}
```

Update `.hero` to be sticky:
```css
.hero {
  position: sticky;
  top: 0;
  width: 100%;
  height: 100vh;
  z-index: 1;
}
```

Update `.cards-section` background to gold gradient:
```css
.cards-section {
  position: relative;
  z-index: 2;
  padding: 4rem 1.5rem 3rem;
  background: radial-gradient(ellipse at center top, #f5d680 0%, #c9982e 80%, #b8862d 100%);
}
```

Update `.nav-card` box-shadow for better contrast on gold:
```css
box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
```

Update `.site-footer` background for gold context:
```css
background: rgba(180, 140, 50, 0.3);
```

**Step 2: Update HTML body**

Replace lines 279-305 (hero `<section>`) — wrap in scroll runway, replace `<picture>` with `<canvas>`, remove `onclick` from backdrop:

```html
<!-- ===== SCROLL RUNWAY ===== -->
<div id="scroll-runway" class="scroll-runway">
  <section class="hero">
    <canvas id="frame-canvas" class="frame-canvas"></canvas>
    <div class="hero-overlay"></div>
    <div class="hero-content">
      <div class="hero-text-backdrop">
        <h1 class="hero-title">Welcome to the <span class="accent-italic">Gift</span> Site</h1>
        <p class="hero-tagline">A journey of discovery awaits</p>
      </div>
    </div>
    <div class="scroll-indicator">
      <span>Scroll</span>
      <svg class="chevron" viewBox="0 0 20 20">
        <polyline points="4 8 10 14 16 8"></polyline>
      </svg>
    </div>
  </section>
</div>
```

**Step 3: Verify page loads**

Run: `npx vite`, navigate to `/cabin/`
Expected: Page loads without errors. Canvas blank (no frames yet). Title and scroll indicator visible.

**Step 4: Commit**

```bash
git add cabin/index.html
git commit -m "feat: update sanctuary markup for scroll-driven canvas layout"
```

---

### Task 5: Integrate Frame Scroller into cabin-home.js

**Files:**
- Modify: `js/cabin-home.js`

**Context:** Replace the fixed background image logic with the frame scroller. Add ScrollTrigger for title fade-out during scroll. Keep SplitText animation, card reveals, dust particles, and Lenis.

**Step 1: Update imports**

Add `createFrameScroller` import:
```js
import { createFrameScroller } from './frame-scroller.js';
```

**Step 2: Add setupFrameScroller() function**

```js
function setupFrameScroller() {
  const canvas = document.getElementById('frame-canvas');
  if (!canvas) return;

  createFrameScroller({
    canvas,
    frameCount: 150,
    desktopPath: '../sanctuary-frames/desktop',
    mobilePath: '../sanctuary-frames/mobile',
    trigger: '#scroll-runway',
    scrub: 0.5,
  });
}
```

**Step 3: Update animateHero()**

- Remove the Ken Burns `gsap.to(heroBg, ...)` block entirely
- Add ScrollTrigger to fade out `.hero-content` during first 5% of scroll:

```js
gsap.to(heroContent, {
  autoAlpha: 0,
  scrollTrigger: {
    trigger: '#scroll-runway',
    start: 'top top',
    end: '5% top',
    scrub: true,
  },
});
```

**Step 4: Update setupScrollIndicator()**

Change trigger from `.hero` to `#scroll-runway`, change end from `15%` to `3%`.

**Step 5: Update init() order**

```js
function init() {
  setupFrameScroller();
  animateHero();
  setupScrollIndicator();
  setupCardReveals();
  setupDustParticles();
}
```

**Step 6: Verify full experience**

Run: `npx vite`, navigate to `/cabin/`
Expected: Frame 0 loads in canvas. Scrolling scrubs through frames. Title fades out early. Cards appear on gold background. Scroll up reverses.

**Step 7: Commit**

```bash
git add js/cabin-home.js
git commit -m "feat: integrate frame scroller into sanctuary homepage"
```

---

### Task 6: Public Directory & Frame Path Setup

**Files:**
- Create: `public/sanctuary-frames/.gitkeep`

**Context:** Vite serves files from `public/` as-is (no hashing, no processing). Frames go here so they're accessible by sequential path at runtime. On build, they're copied to `dist/sanctuary-frames/`.

**Step 1: Create directory structure**

```bash
mkdir -p public/sanctuary-frames/desktop public/sanctuary-frames/mobile
```

Create `.gitkeep` in `public/sanctuary-frames/` so the directory is tracked.

**Step 2: Verify Vite serves correctly**

Place a test image at `public/sanctuary-frames/desktop/frame-001.webp`
Navigate to: `http://localhost:5173/sanctuary-frames/desktop/frame-001.webp`
Expected: Image loads.

**Step 3: Commit**

```bash
git add public/sanctuary-frames/.gitkeep .gitignore
git commit -m "feat: add public directory structure for sanctuary frames"
```

---

### Task 7: Visual Polish & Tuning

**Files:**
- Modify: `cabin/index.html` (CSS tweaks)
- Modify: `js/cabin-home.js` (timing tweaks)

**Context:** Tune the experience with real frames. These are specific values to adjust.

**Tuning knobs:**

| Knob | Location | Default | Effect |
|------|----------|---------|--------|
| Scroll runway height | `cabin/index.html` `.scroll-runway` | `600vh` | Longer = slower scrub |
| Scrub smoothing | `js/cabin-home.js` `createFrameScroller()` call | `0.5` | Higher = smoother, more lag |
| Title fade end | `js/cabin-home.js` `animateHero()` ScrollTrigger | `5% top` | Higher = title stays longer |
| Card reveal start | `js/cabin-home.js` `setupCardReveals()` | `top 85%` | Lower = cards appear later |
| Gold gradient colors | `cabin/index.html` `.cards-section` | `#f5d680` → `#c9982e` | Match to last video frame |
| Dust particle z-index | `cabin/index.html` dust canvas | `z-index: 1` | May need to be above frame canvas |

**Step 1: Tune based on real frames**

Adjust values while viewing live dev server. Get user feedback.

**Step 2: Commit**

```bash
git add cabin/index.html js/cabin-home.js
git commit -m "feat: tune sanctuary scroll experience timing and visuals"
```

---

## Deployment Notes

When ready to deploy, the frames need to exist in `public/sanctuary-frames/` at build time. Options:
1. **Commit frames to repo** — adds ~5-10MB, simplest approach
2. **Git LFS** — keeps repo lean, frames stored separately
3. **CI extraction** — store video in repo, extract frames during build (requires ffmpeg in CI)

Decide at deployment time based on final frame sizes.

## Summary of All Files

| # | File | Action |
|---|------|--------|
| 1 | `scripts/extract-frames.mjs` | Create |
| 2 | `test-scroll.html` | Create (dev only) |
| 3 | `js/frame-scroller.js` | Create |
| 4 | `cabin/index.html` | Modify (markup + CSS) |
| 5 | `js/cabin-home.js` | Modify (frame scroller integration) |
| 6 | `public/sanctuary-frames/` | Create (directory for frame assets) |
| 7 | `.gitignore` | Modify (ignore frames + test page) |
