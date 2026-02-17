# Sanctuary Template Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the dark cabin video template with a bright, photography-based "Sanctuary" template that works on all devices.

**Architecture:** Same page structure (hero + cards + footer), entirely new color scheme (dark → light), hero image replaces video. Two files modified: `cabin/index.html` (CSS + HTML) and `js/cabin-home.js` (remove video logic).

**Tech Stack:** Vite, GSAP 3.14, Lenis 1.3, Fraunces/Outfit fonts — all existing, no new dependencies.

**Prerequisite:** User must provide a hero image at `assets/sanctuary.jpg` before starting. The image should be a bright interior scene (sunlit room, conservatory, courtyard) with blue sky visible. At least 1920px wide, portrait-friendly composition.

---

### Task 1: Simplify hero HTML

**Files:**
- Modify: `cabin/index.html:305-338`

**Step 1: Replace hero section HTML**

Remove: `<video>`, `<div class="hero-image-frame">`, second `<img>` inside hero-content.
Keep: single `<img class="hero-bg">`, overlay, hero-content with title + tagline, scroll indicator.

Replace lines 305-338 with:

```html
  <!-- ===== HERO ===== -->
  <section class="hero">
    <img
      class="hero-bg"
      src="../assets/sanctuary.jpg"
      alt="Sunlit interior with natural light"
    >
    <div class="hero-overlay"></div>

    <div class="hero-content">
      <h1 class="hero-title">Welcome to The <span class="accent-italic">Gift</span> Site</h1>
      <p class="hero-tagline">A journey of discovery awaits</p>
    </div>

    <div class="scroll-indicator">
      <span>Scroll</span>
      <svg class="chevron" viewBox="0 0 20 20">
        <polyline points="4 8 10 14 16 8"></polyline>
      </svg>
    </div>
  </section>
```

**Step 2: Update page title**

Change line 6:
```html
  <title>The Gift Site — The Sanctuary</title>
```

**Step 3: Verify**

Run: `npm run dev` — confirm page loads at `http://localhost:5173/giftsite/cabin/` with the sanctuary image visible (or a broken image icon if asset not yet provided). No console errors.

---

### Task 2: Rewrite CSS — light theme

**Files:**
- Modify: `cabin/index.html:13-300` (entire `<style>` block)

**Step 1: Replace body styles**

Change `body` (lines 16-21) from dark to light:

```css
    body {
      background: #f5f2ed;
      font-family: 'Outfit', sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #1a2a3a;
    }
```

**Step 2: Replace hero backdrop CSS**

Remove everything from lines 23-48 (hero-bg, hero-video, .playing, hero-image-frame).
Replace with just the hero background image:

```css
    /* ===== FIXED IMAGE BACKDROP ===== */
    .hero-bg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
    }
```

**Step 3: Update hero overlay**

Change the overlay (lines 58-66) from dark vignette to light softener:

```css
    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, rgba(0,0,0,0.2) 100%);
      pointer-events: none;
    }
```

**Step 4: Update hero text colors**

Change `.hero-title` (lines 82-93) — dark text with light text-shadow for readability on bright image:

```css
    .hero-title {
      font-family: 'Fraunces', serif;
      font-size: clamp(2.2rem, 7vw, 4.5rem);
      font-weight: 400;
      color: #1a2a3a;
      text-shadow: 0 1px 20px rgba(255, 255, 255, 0.5);
      letter-spacing: -0.02em;
      text-align: center;
      line-height: 1.2;
      padding: 0 1.5rem;
      visibility: hidden;
    }
```

Keep `.accent-italic` gold unchanged.

Change `.hero-tagline` (lines 101-112):

```css
    .hero-tagline {
      font-family: 'Outfit', sans-serif;
      font-size: clamp(0.85rem, 2.5vw, 1.15rem);
      font-weight: 300;
      color: rgba(26, 42, 58, 0.7);
      margin-top: 1rem;
      text-shadow: 0 1px 10px rgba(255, 255, 255, 0.4);
      letter-spacing: 0.04em;
      text-align: center;
      padding: 0 1.5rem;
      visibility: hidden;
    }
```

**Step 5: Update scroll indicator colors**

Change `.scroll-indicator span` color and `.chevron` stroke from cream to dark:

```css
    .scroll-indicator span {
      font-size: 0.7rem;
      font-weight: 400;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: rgba(26, 42, 58, 0.5);
    }

    .scroll-indicator .chevron {
      width: 20px;
      height: 20px;
      stroke: rgba(26, 42, 58, 0.5);
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      animation: bounce 2s infinite;
    }
```

**Step 6: Update cards section**

Change `.cards-section` background from dark to light:

```css
    .cards-section {
      position: relative;
      z-index: 2;
      padding: 4rem 1.5rem 3rem;
      background: #f5f2ed;
    }
```

Change `.section-heading` color:

```css
    .cards-section .section-heading {
      font-family: 'Fraunces', serif;
      font-size: clamp(1.4rem, 4vw, 2rem);
      font-weight: 400;
      text-align: center;
      color: #1a2a3a;
      margin-bottom: 2.5rem;
      letter-spacing: -0.01em;
    }
```

Change `.nav-card` to white cards with shadow:

```css
    .nav-card {
      background: #ffffff;
      border: 1px solid rgba(212, 168, 83, 0.15);
      border-radius: 12px;
      padding: 1.5rem 1.75rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
      visibility: hidden;
    }

    .nav-card:hover {
      border-color: rgba(212, 168, 83, 0.5);
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(212, 168, 83, 0.12);
    }
```

Keep `.nav-card-title` gold. Change `.nav-card-desc` to dark:

```css
    .nav-card-desc {
      font-size: clamp(0.85rem, 2.2vw, 0.95rem);
      font-weight: 300;
      color: rgba(26, 42, 58, 0.6);
      line-height: 1.5;
    }
```

**Step 7: Update footer**

```css
    .site-footer {
      position: relative;
      z-index: 2;
      background: #f5f2ed;
      padding: 3rem 1.5rem 4rem;
      text-align: center;
    }

    .site-footer p {
      font-size: 0.8rem;
      font-weight: 300;
      color: rgba(26, 42, 58, 0.3);
      letter-spacing: 0.04em;
    }
```

**Step 8: Update companion button**

Change SVG stroke to match light theme:

```css
    .companion-btn svg {
      width: 28px;
      height: 28px;
      fill: none;
      stroke: #1a2a3a;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
```

**Step 9: Remove mobile media query**

Delete the entire `@media (max-width: 768px)` block (lines 261-300). No mobile-specific overrides needed — the layout is the same on all screen sizes. Only keep responsive font sizes via the existing `clamp()` values.

**Step 10: Verify**

Run: `npm run dev` — check cabin page. All text should be dark, cards white, background light. Image fills the hero. No console errors.

---

### Task 3: Remove video logic from JS

**Files:**
- Modify: `js/cabin-home.js:1-2, 99-124`

**Step 1: Update file header comment**

Change lines 1-2:
```js
// js/cabin-home.js — Sanctuary scroll-driven homepage
// GSAP + Lenis smooth scroll, SplitText hero animation, ScrollTrigger card reveals
```

**Step 2: Delete setupVideo() function**

Remove lines 99-116 (the entire `setupVideo` function).

**Step 3: Remove setupVideo() call from init()**

Change init from:
```js
function init() {
  setupVideo();
  animateHero();
  setupScrollIndicator();
  setupCardReveals();
}
```

To:
```js
function init() {
  animateHero();
  setupScrollIndicator();
  setupCardReveals();
}
```

**Step 4: Verify**

Run: `npm run dev` — cabin page loads, hero animation plays, scroll indicator fades, cards reveal on scroll. No console errors about missing video element.

---

### Task 4: Build and verify

**Step 1: Production build**

Run: `npm run build`

Expected: Build succeeds. `cabin-fire.mp4` no longer referenced in output (not bundled). `sanctuary.jpg` appears in `dist/assets/`.

**Step 2: Preview**

Run: `npm run preview`

Verify at `http://localhost:4173/giftsite/cabin/`:
- Hero image fills viewport on desktop
- Text readable (dark on bright)
- Scroll to cards — white cards on light background
- Resize to mobile width — same layout, no broken elements

**Step 3: Commit**

```bash
git checkout -b feature/sanctuary-template
git add cabin/index.html js/cabin-home.js assets/sanctuary.jpg
git commit -m "feat: replace cabin with Sanctuary template — bright photo-based, mobile-friendly"
git push -u origin feature/sanctuary-template
```
