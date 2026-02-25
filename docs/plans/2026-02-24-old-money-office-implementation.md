# Old Money Office Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all existing templates with two new ones ("The Study" and "The Discovery") set in an old money private study with an ornate treasure chest radiating golden light.

**Architecture:** Two independent HTML pages sharing a warm mahogany/parchment/gold color palette. The Discovery uses a static hero image (like current Sanctuary). The Study uses a scroll-driven canvas frame sequence (like the Feb 20 scroll-experience plan). Both reuse GSAP + Lenis for animations.

**Tech Stack:** Vite, GSAP 3.14, Lenis 1.3, Fraunces/Outfit fonts, HTML5 Canvas (Study only), ffmpeg (frame extraction, Study only)

---

## Phase 1: Asset Generation & Viability

> **GATE:** No code changes until the user has generated AI images and confirmed they look right. This entire phase is about getting the visual assets nailed down.

### Task 1: Generate AI Images

**Context:** The user generates these images externally using AI tools (ChatGPT GPT Image 1.5, Midjourney, etc.). This task provides the prompts and specs. No code work.

**Step 1: Generate The Study base image**

Use this prompt (adapt for your tool):

> A grand old money private study. Rich dark mahogany wood paneling and bookshelves filled with leather-bound books line the walls. A quilted leather armchair sits nearby. An ornate, ancient treasure chest sits centered on a large mahogany desk in the middle of the room. The chest lid is barely cracked open, with a soft golden glow beginning to emanate from inside. The golden light warmly illuminates the mahogany walls, leather furniture, and book spines, making the room feel warm and luminous despite the rich dark materials. Subtle dust motes float in the golden light. The camera faces the chest straight-on at desk height. Photorealistic, cinematic lighting, shallow depth of field, 16:9 landscape composition.

**Specs:**
- Resolution: at least 1536px wide (we target 1280x720 for canvas frames)
- Format: PNG or high-quality JPG
- Aspect ratio: 16:9 landscape (mobile will crop center via `object-fit: cover`)
- The chest must be **centered** — this is critical for mobile cropping

**Step 2: Generate The Discovery hero image**

> A grand old money private study. Rich dark mahogany wood paneling and bookshelves filled with leather-bound books line the walls. A quilted leather armchair sits nearby. An ornate, ancient treasure chest sits open on a large mahogany desk in the middle of the room, radiating warm golden light that illuminates the entire room — reflecting off the wood, leather, and book spines. A person is seen from behind, kneeling or leaning over the open chest, looking down into it. Warm golden light from the chest illuminates their silhouette and casts long warm shadows across the study. The viewer sees over their shoulder into the golden glow. The atmosphere is warm, luminous, and inviting. Subtle dust motes float in the golden light. Photorealistic, cinematic lighting, warm golden color grade, 16:9 landscape composition.

**Specs:** Same as The Study — at least 1536px wide, 16:9, PNG/JPG, chest centered.

**Step 3: Iterate on prompts as needed**

If the first results don't capture the right mood, adjust:
- "More golden light" / "less dark" if the scene feels too dim
- "More ornate chest" / "ancient, weathered, gilded edges" if the chest isn't impressive enough
- "Richer mahogany" / "more leather-bound books" for the old money feel
- "Warmer lighting" if it feels cold or clinical

---

### Task 2: Quick Viability Test Page

**Files:**
- Create: `test-viability.html` (project root, dev only — not deployed)

**Context:** A minimal page that drops the generated images into a viewport-filling layout to check: (a) they look good full-screen, (b) the center-crop works for mobile, (c) text is readable over them, (d) the warm parchment card section feels like a natural transition below the dark image.

**Step 1: Create the test page**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Asset Viability Test</title>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,500&family=Outfit:wght@300;400&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Outfit', sans-serif; background: #1a0f0a; }

    .test-section {
      position: relative;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
    .test-section img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .test-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%);
    }
    .test-text {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      z-index: 2;
    }
    .test-text h1 {
      font-family: 'Fraunces', serif;
      font-size: clamp(2rem, 6vw, 4rem);
      color: #f8f0e3;
      text-shadow: 0 2px 20px rgba(0,0,0,0.6);
    }
    .test-text .accent { font-style: italic; color: #d4a853; }
    .test-text p {
      font-size: clamp(0.9rem, 2.5vw, 1.15rem);
      color: rgba(248,240,227,0.7);
      margin-top: 0.75rem;
      text-shadow: 0 1px 10px rgba(0,0,0,0.5);
    }
    .card-preview {
      background: #f5e6c8;
      padding: 4rem 2rem;
      text-align: center;
    }
    .card-preview h2 {
      font-family: 'Fraunces', serif;
      color: #2a1810;
      margin-bottom: 1.5rem;
    }
    .card-preview .card {
      max-width: 500px;
      margin: 1rem auto;
      background: #f8f0e3;
      border: 1px solid rgba(212,168,83,0.25);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: left;
    }
    .card-preview .card h3 {
      font-family: 'Fraunces', serif;
      color: #d4a853;
      margin-bottom: 0.5rem;
    }
    .card-preview .card p { color: rgba(42,24,16,0.7); font-weight: 300; }
    .label {
      position: absolute;
      top: 1rem; left: 1rem;
      background: rgba(0,0,0,0.6);
      color: #f8f0e3;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.8rem;
      z-index: 3;
    }
  </style>
</head>
<body>

  <!-- THE STUDY -->
  <div class="test-section">
    <span class="label">The Study — base frame</span>
    <!-- Replace src with your generated image path -->
    <img src="assets/study-hero-test.png" alt="Study test">
    <div class="test-overlay"></div>
    <div class="test-text">
      <h1>Welcome to the <span class="accent">Gift</span> Site</h1>
      <p>Discover the beautiful and precious gift inside of you</p>
    </div>
  </div>

  <!-- THE DISCOVERY -->
  <div class="test-section">
    <span class="label">The Discovery — hero</span>
    <!-- Replace src with your generated image path -->
    <img src="assets/discovery-hero-test.png" alt="Discovery test">
    <div class="test-overlay"></div>
    <div class="test-text">
      <h1>Welcome to the <span class="accent">Gift</span> Site</h1>
      <p>Discover the beautiful and precious gift inside of you</p>
    </div>
  </div>

  <!-- CARD SECTION PREVIEW -->
  <div class="card-preview">
    <h2>Explore Your Gift</h2>
    <div class="card">
      <h3>Why We Exist</h3>
      <p>Helping people discover their unique gift — the thing only they can bring to the world.</p>
    </div>
    <div class="card">
      <h3>Discover</h3>
      <p>Self-reflection questions to identify your gift and begin the journey inward.</p>
    </div>
  </div>

</body>
</html>
```

**Step 2: Add to .gitignore**

Append to `.gitignore`:
```
test-viability.html
```

**Step 3: Test it**

1. Place generated images in `assets/` as `study-hero-test.png` and `discovery-hero-test.png`
2. Run: `npx vite`
3. Navigate to: `http://localhost:5173/test-viability.html`
4. Check:
   - Both images fill viewport on desktop
   - Resize to mobile width — chest stays visible (center crop works)
   - Title text readable over both images
   - Parchment card section below feels like a natural transition
5. Show to user for approval

**Step 4: Commit**

```bash
git add test-viability.html .gitignore
git commit -m "feat: add asset viability test page for old money office redesign"
```

---

> **VIABILITY GATE**
>
> Pause here. The user must:
> 1. Generate AI images using the prompts above
> 2. Drop them into `assets/` and view the test page
> 3. Iterate on prompts if needed (adjust lighting, chest detail, room composition)
> 4. Confirm both images work before proceeding
>
> Do NOT proceed to Phase 2 until the user approves the assets.

---

## Phase 2: The Discovery Template (static hero)

> Build the simpler template first. This is a reskin of the current Sanctuary (`cabin/index.html`) with the new old money palette and the approved hero image.

### Task 3: Create discovery/index.html

**Files:**
- Create: `discovery/index.html`

**Context:** Full HTML page with inline CSS. Same structure as `cabin/index.html` but with the old money office color palette: dark mahogany body, dark vignette overlay, parchment text on dark hero, warm parchment card section, gold accents throughout.

**Step 1: Create the directory**

```bash
mkdir -p discovery
```

**Step 2: Create the page**

Key color mappings from current Sanctuary to Old Money Office:

| Element | Sanctuary | Old Money Office |
|---------|-----------|------------------|
| body bg | `#f5f2ed` | `#1a0f0a` |
| text color | `#1a2a3a` | `#f8f0e3` |
| accent italic | `#3d5a80` | `#d4a853` |
| hero overlay | light radial | dark vignette |
| hero text | dark on light | light on dark |
| text-shadow | white glow | dark shadow |
| backdrop bg | `rgba(245,242,237,0.25)` | `rgba(20,12,8,0.4)` |
| cards section bg | `rgba(245,242,237,0.55)` | `#f5e6c8` |
| card bg | `rgba(255,255,255,0.78)` | `#f8f0e3` |
| card title | `#3d5a80` | `#d4a853` |
| card desc | `rgba(26,42,58,0.6)` | `rgba(42,24,16,0.7)` |
| footer bg | `rgba(245,242,237,0.15)` | `#2a1810` |
| footer text | `rgba(26,42,58,0.3)` | `rgba(248,240,227,0.3)` |
| scroll indicator | dark | light |
| companion stroke | `#1a2a3a` | `#f8f0e3` |
| dust particles | `rgba(255,248,230,...)` | `rgba(255,215,120,...)` |

Full file: see `cabin/index.html` for structure. Apply the color mapping above. Key changes:

- `<title>`: "The Gift Site — The Discovery"
- Hero image `src`: `../assets/discovery-hero.webp`
- Hero image `alt`: "Old money study with golden light from treasure chest"
- Tagline text: "Discover the beautiful and precious gift inside of you"
- Script `src`: `../js/discovery-home.js`
- Remove `<source>` elements from `<picture>` (single image, no mobile variant — `object-fit: cover` handles it)
- Dark vignette overlay: `radial-gradient(ellipse at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)`
- Backdrop: `rgba(20, 12, 8, 0.4)` with `blur(8px)`
- All text colors inverted to light-on-dark
- Cards section: `background: #f5e6c8`
- Cards: `background: #f8f0e3`, gold borders
- Footer: `background: #2a1810`

**Step 3: Verify**

Run: `npx vite` — page should load at `/discovery/` (after vite config is updated in Task 5). For now, verify the file has no syntax errors.

**Step 4: Commit**

```bash
git add discovery/index.html
git commit -m "feat: create The Discovery template with old money office palette"
```

---

### Task 4: Create js/discovery-home.js

**Files:**
- Create: `js/discovery-home.js`

**Context:** Based on `js/cabin-home.js`. Same GSAP/Lenis animation patterns. Only change: dust particle color adjusted to golden (`rgba(255, 215, 120, ...)`) for the dark study scene, and slightly higher base opacity (0.15-0.40 instead of 0.10-0.30) since particles are more visible against dark backgrounds.

Copy `js/cabin-home.js` and make these changes:
1. Update file header comment to reference "The Discovery"
2. In `setupDustParticles()`, change particle fill color from `rgba(255, 248, 230, ${p.opacity * twinkle})` to `rgba(255, 215, 120, ${p.opacity * twinkle})`
3. Change particle opacity range from `0.1 + Math.random() * 0.2` to `0.15 + Math.random() * 0.25`

Everything else (Lenis, SplitText, ScrollTrigger, Ken Burns, card reveals) stays identical.

**Step 2: Verify**

Run: `npx vite` — check no import errors in console at `/discovery/`.

**Step 3: Commit**

```bash
git add js/discovery-home.js
git commit -m "feat: add discovery-home.js with golden dust particles and GSAP animations"
```

---

## Phase 3: The Study Template (scroll-driven scaffold)

> The Study reuses the frame-scroller architecture from the Feb 20 scroll-experience plan. This phase builds the template and the frame-scroller module. Actual frame content is gated on the user generating video + running extraction.

### Task 5: Update vite.config.js

**Files:**
- Modify: `vite.config.js`

**Step 1: Update entry points**

Replace the rollup input config to add study + discovery, remove cloud + book:

```js
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/giftsite/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        study: resolve(__dirname, 'study/index.html'),
        discovery: resolve(__dirname, 'discovery/index.html'),
        cabin: resolve(__dirname, 'cabin/index.html'),
      }
    }
  }
})
```

Note: `cabin` is kept temporarily for reference during development. It will be removed in the final cleanup task.

**Step 2: Verify**

Run: `npx vite` — dev server starts without errors. Navigate to `/study/` and `/discovery/`.

**Step 3: Commit**

```bash
git add vite.config.js
git commit -m "feat: update vite config with study and discovery entry points"
```

---

### Task 6: Create study/index.html

**Files:**
- Create: `study/index.html`

**Context:** Same old money palette as Discovery, but with the scroll-runway + sticky canvas architecture for frame-sequence playback. Key structural differences from Discovery:

- No `<picture>` element — replaced with `<canvas id="frame-canvas">`
- Hero section wrapped in `<div id="scroll-runway" class="scroll-runway">` (600vh tall)
- Hero has `position: sticky; top: 0` instead of `position: relative`
- No `onclick` on text backdrop (scroll is the interaction)
- Dust particles canvas z-index: 3 (above frame canvas)
- Script src: `../js/study-home.js`
- Title: "The Gift Site — The Study"

All colors, card styles, footer, and companion button identical to Discovery.

**Step 2: Commit**

```bash
git add study/index.html
git commit -m "feat: create The Study template with scroll runway and canvas"
```

---

### Task 7: Create js/study-home.js

**Files:**
- Create: `js/study-home.js`

**Context:** Based on `js/cabin-home.js` but integrates the frame-scroller module. Key differences from discovery-home.js:

1. Imports `createFrameScroller` from `./frame-scroller.js`
2. Has `setupFrameScroller()` function that initializes the canvas frame player
3. No Ken Burns animation (canvas handles visuals via frame scrubbing)
4. Title + overlay fade out during first 5% of scroll via ScrollTrigger on `#scroll-runway`
5. Scroll indicator fades at 3% (faster than Discovery's 15%)
6. `init()` calls `setupFrameScroller()` first

Frame scroller config:
```js
createFrameScroller({
  canvas,
  frameCount: 120,
  desktopPath: '../study-frames/desktop',
  mobilePath: '../study-frames/mobile',
  trigger: '#scroll-runway',
  scrub: 0.5,
});
```

Dust particles identical to Discovery (golden, same opacity).

**Step 2: Commit**

```bash
git add js/study-home.js
git commit -m "feat: add study-home.js with frame-scroller integration and golden dust"
```

---

### Task 8: Create js/frame-scroller.js

**Files:**
- Create: `js/frame-scroller.js`

**Context:** Reusable ES module from the Feb 20 scroll-experience plan. Handles progressive frame loading, canvas rendering with object-fit cover behavior, and scroll-to-frame mapping via GSAP ScrollTrigger.

**API:**
```js
export function createFrameScroller({
  canvas,              // HTMLCanvasElement
  frameCount,          // total frames (desktop count, mobile auto-calculated at 83%)
  desktopPath,         // path to desktop frames directory
  mobilePath,          // path to mobile frames directory
  trigger,             // CSS selector for ScrollTrigger trigger element
  scrub,               // ScrollTrigger scrub value (default 0.5)
  onFrameChange,       // optional callback(currentFrame, totalFrames)
})
```

**Returns:** `{ destroy, getCurrentFrame }`

**Key implementation details:**
- Canvas DPR: mobile 1.0, desktop min(devicePixelRatio, 1.5)
- Mobile frame count: `Math.round(frameCount * 0.83)` (~100 for 120)
- Progressive loading: Phase 1 (0-19 on init), Phase 2 (20-59 on idle via `requestIdleCallback`), Phase 3 (chunks of 40 on scroll approach within 20 frames of boundary)
- Object-fit cover: calculates `drawImage` source rect to center-crop the image into the canvas
- Fallback: if user scrolls past loaded frames, draws nearest loaded frame (no spinner)
- Frame naming: `frame-001.webp` through `frame-NNN.webp`
- ScrollTrigger: maps scroll progress (0-1) to frame index, only redraws when frame changes
- Resize handler: recalculates canvas dimensions on viewport change
- `destroy()`: removes resize listener, kills ScrollTrigger instance

**Step 2: Verify**

Run: `npx vite` — check `/study/` loads without import errors. Canvas will be blank (no frames yet) but no JS errors.

**Step 3: Commit**

```bash
git add js/frame-scroller.js
git commit -m "feat: add frame-scroller.js module for scroll-driven canvas playback"
```

---

### Task 9: Create scripts/extract-frames.mjs and directory structure

**Files:**
- Create: `scripts/extract-frames.mjs`
- Create: `public/study-frames/.gitkeep`
- Modify: `.gitignore`

**Context:** Local dev utility. Uses ffmpeg via Node.js `execFileSync` (not `execSync` — avoids shell injection) to extract WebP frames from video. Outputs to `public/study-frames/`.

The script:
- Takes a video file path as first argument
- Optional `--frames N` flag (default: 120)
- Probes video duration with `ffprobe`
- Calculates target fps to produce the desired frame count
- Extracts desktop frames (1280x720 WebP, quality 80) to `public/study-frames/desktop/`
- Extracts mobile frames (640x360 WebP, quality 75) at ~83% frame count to `public/study-frames/mobile/`
- Sequential naming: `frame-001.webp` through `frame-120.webp`
- Uses `execFileSync` for all shell-outs (security best practice)

**Step 2: Create directory structure**

```bash
mkdir -p public/study-frames/desktop public/study-frames/mobile
```

Create `public/study-frames/.gitkeep` so the directory is tracked.

**Step 3: Update .gitignore**

Append:
```
# Viability test page (dev only)
test-viability.html

# Study frames (large binary assets, generated locally)
public/study-frames/desktop/*.webp
public/study-frames/mobile/*.webp
```

**Step 4: Commit**

```bash
git add scripts/extract-frames.mjs public/study-frames/.gitkeep .gitignore
git commit -m "feat: add frame extraction script and study-frames directory"
```

---

## Phase 4: Chooser Update & Cleanup

### Task 10: Update chooser page

**Files:**
- Modify: `index.html`

**Step 1: Update grid to 2 columns**

Change `.templates` grid from `repeat(3, 1fr)` to `repeat(2, 1fr)` and increase `max-width` to `800px`.

**Step 2: Replace template cards**

Replace the three `<a class="template-card">` blocks with two:

```html
<div class="templates">
  <a class="template-card" href="study/">
    <img src="assets/thumb-study.jpg" alt="The Study design preview">
    <div class="card-body">
      <h2>The Study</h2>
      <p>A scroll-driven journey through an old money study — watch the treasure chest reveal its gift</p>
    </div>
  </a>

  <a class="template-card" href="discovery/">
    <img src="assets/thumb-discovery.jpg" alt="The Discovery design preview">
    <div class="card-body">
      <h2>The Discovery</h2>
      <p>A figure discovers the golden gift within an ornate chest in a private study</p>
    </div>
  </a>
</div>
```

Note: Thumbnail images (`thumb-study.jpg`, `thumb-discovery.jpg`) will need to be created from the approved hero images. Until then, the cards will show broken image icons — that's fine for development.

**Step 3: Verify**

Run: `npx vite` — chooser shows 2 cards. Links go to `/study/` and `/discovery/`.

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: update chooser page for Study and Discovery templates"
```

---

### Task 11: Remove shelved templates from vite config

**Files:**
- Modify: `vite.config.js`

**Step 1: Remove cabin entry point**

Final vite config:

```js
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/giftsite/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        study: resolve(__dirname, 'study/index.html'),
        discovery: resolve(__dirname, 'discovery/index.html'),
      }
    }
  }
})
```

**Step 2: Verify**

Run: `npm run build` — builds successfully with only main, study, and discovery.

**Step 3: Commit**

```bash
git add vite.config.js
git commit -m "chore: remove shelved templates from vite build config"
```

---

## Summary of All Files

| # | File | Action | Phase |
|---|------|--------|-------|
| 1 | `test-viability.html` | Create (dev only) | 1 |
| 2 | `discovery/index.html` | Create | 2 |
| 3 | `js/discovery-home.js` | Create | 2 |
| 4 | `vite.config.js` | Modify | 3 |
| 5 | `study/index.html` | Create | 3 |
| 6 | `js/study-home.js` | Create | 3 |
| 7 | `js/frame-scroller.js` | Create | 3 |
| 8 | `scripts/extract-frames.mjs` | Create | 3 |
| 9 | `.gitignore` | Modify | 3 |
| 10 | `index.html` | Modify (chooser) | 4 |
| 11 | `vite.config.js` | Modify (final cleanup) | 4 |

## Asset Checklist (user-generated, not code)

| Asset | Source | When Needed |
|-------|--------|-------------|
| Study base image | AI image gen (prompt in Task 1) | Phase 1 viability |
| Discovery hero image | AI image gen (prompt in Task 1) | Phase 1 viability |
| Study video | AI video gen from base image | Before frame extraction |
| `thumb-study.jpg` | Crop from approved Study image | Phase 4 chooser |
| `thumb-discovery.jpg` | Crop from approved Discovery image | Phase 4 chooser |
