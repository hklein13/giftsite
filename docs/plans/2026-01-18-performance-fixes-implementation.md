# Phase 1: Performance Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix performance issues to achieve solid 60fps scrolling and reduce CPU/GPU load.

**Architecture:** Remove duplicate Lenis RAF loop, throttle expensive star animations, debounce resize handler, and optimize bloom post-processing settings.

**Tech Stack:** JavaScript, GSAP, Lenis, Three.js

---

## Task 1: Fix Lenis Double RAF Bug

**Files:**
- Modify: `process.html:981-985`

**Problem:** Lenis is being called from TWO sources every frame:
1. Standalone RAF loop (lines 981-985)
2. GSAP ticker (lines 990-992)

This causes Lenis to process scroll twice per frame, wasting CPU.

**Step 1: Remove the standalone RAF loop**

Find and DELETE lines 981-985:

```javascript
// DELETE THIS ENTIRE BLOCK:
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
```

The GSAP ticker integration (lines 990-992) will handle Lenis updates.

**Step 2: Verify the fix**

Run: `npm run dev`
- Open process.html
- Scroll the page - should be smooth
- Open DevTools → Performance tab → Record while scrolling
- Verify only ONE `lenis.raf` call per frame

**Step 3: Commit**

```bash
git add process.html
git commit -m "perf: remove duplicate Lenis RAF loop in process.html"
```

---

## Task 2: Throttle Star Animation

**Files:**
- Modify: `js/solar-system.js` (constructor around line 28, animate around line 1014)

**Problem:** `animateStars()` runs every frame (60fps), updating 980 star positions/sizes. This is expensive and unnecessary - drift/twinkle at 20fps is visually identical.

**Step 1: Add frame counter property to constructor**

Find the constructor (around line 6-67) and add after `this.time = 0;`:

```javascript
    this.time = 0;
    this.starFrameCounter = 0; // Add this line
```

**Step 2: Throttle animateStars call**

Find line 1014 where `this.animateStars();` is called and replace with:

```javascript
    // Animate stars (drift and twinkle) - throttled to every 3rd frame
    this.starFrameCounter++;
    if (this.starFrameCounter % 3 === 0) {
      this.animateStars();
    }
```

**Step 3: Verify the fix**

Run: `npm run dev`
- Open homepage
- Stars should still drift and twinkle smoothly
- Open DevTools → Performance tab → Record
- CPU usage during idle should be noticeably lower

**Step 4: Commit**

```bash
git add js/solar-system.js
git commit -m "perf: throttle star animation to every 3rd frame"
```

---

## Task 3: Debounce Resize Handler

**Files:**
- Modify: `js/solar-system.js:90`

**Problem:** Resize handler fires rapidly during window resize, causing multiple expensive recalculations (camera projection matrix, renderer size, composer size).

**Step 1: Create debounce utility**

Add at the top of the file, after the class declaration opens but before the constructor:

Find line 4 (`export class SolarSystemScene {`) and add after line 5:

```javascript
  // Debounce utility
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
```

**Step 2: Replace resize listener with debounced version**

Find line 90:
```javascript
    window.addEventListener('resize', () => this.onResize());
```

Replace with:
```javascript
    window.addEventListener('resize', this.debounce(() => this.onResize(), 200));
```

**Step 3: Verify the fix**

Run: `npm run dev`
- Resize the browser window rapidly
- Console should not show multiple resize calculations
- Page should still respond to resize (after 200ms delay)

**Step 4: Commit**

```bash
git add js/solar-system.js
git commit -m "perf: debounce resize handler with 200ms delay"
```

---

## Task 4: Optimize Bloom Settings

**Files:**
- Modify: `js/solar-system.js:601-606`

**Problem:** Bloom post-processing is set to high quality. Slight reductions won't be visually noticeable but will reduce GPU load.

**Step 1: Adjust bloom parameters**

Find lines 601-606:
```javascript
    this.bloomPass = new window.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.0,   // strength
      0.8,   // radius
      0.6    // threshold
    );
```

Replace with:
```javascript
    this.bloomPass = new window.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2), // Half resolution
      0.8,   // strength (reduced from 1.0)
      0.8,   // radius (unchanged)
      0.65   // threshold (increased from 0.6 - less bloom on mid-tones)
    );
```

**Step 2: Verify the fix**

Run: `npm run dev`
- Open homepage
- Planets should still have visible glow
- Glow should be slightly more subtle (not dramatically different)
- DevTools → Performance should show lower GPU time

**Step 3: Commit**

```bash
git add js/solar-system.js
git commit -m "perf: optimize bloom - half resolution, reduced strength"
```

---

## Task 5: Final Verification

**Step 1: Run production build**

```bash
npm run build
npm run preview
```

**Step 2: Performance test checklist**

Open DevTools → Performance tab, record while:

- [ ] Scrolling homepage (solar system) - should be 60fps
- [ ] Scrolling process.html - should be 60fps, no double RAF
- [ ] Resizing window - should debounce, no jank
- [ ] Idle on homepage - CPU should be low (~5-10%)

**Step 3: Final commit with all changes verified**

```bash
git add .
git commit -m "perf: Phase 1 performance optimizations complete"
```

---

## Verification Checklist

- [ ] Lenis double RAF removed from process.html
- [ ] Star animation throttled to every 3rd frame
- [ ] Resize handler debounced with 200ms delay
- [ ] Bloom reduced to half resolution, strength 0.8, threshold 0.65
- [ ] All pages scroll smoothly at 60fps
- [ ] Production build works correctly
