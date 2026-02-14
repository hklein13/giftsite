# Golden Book Template Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a scroll-driven 3D page-flip book template as the third template option alongside Cabin and Cloud.

**Architecture:** A new `book/index.html` entry point with all styles inline (matching cabin/cloud pattern). A new `js/book-home.js` module handles GSAP ScrollTrigger-driven page flips and Lenis smooth scroll. The chooser page gets a third card. Vite config gets a fourth entry point.

**Tech Stack:** CSS 3D Transforms, GSAP (ScrollTrigger + SplitText), Lenis — all already in the project. No new dependencies.

---

## Task 1: Scaffold book/index.html with static structure

**Files:**
- Create: `book/index.html`

**Step 1: Create the book directory**

```bash
mkdir book
```

**Step 2: Create `book/index.html` with full HTML + CSS**

This is the largest single file. It contains all styles inline (same pattern as `cabin/index.html`). No JS yet — just the static structure so we can see the book visually.

The HTML structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- meta, fonts, all styles in <style> tag -->
</head>
<body>
  <!-- Scroll spacer sections drive the pinned book -->
  <div class="book-scene">
    <div class="book">

      <!-- PAGE 1: Front Cover (visible initially) -->
      <div class="page page-cover">
        <div class="page-front">
          <!-- Gold cover with title, tagline, scroll indicator -->
        </div>
        <div class="page-back">
          <!-- Blank parchment (back of cover) -->
        </div>
      </div>

      <!-- PAGE 2: Welcome Page (revealed after cover flip) -->
      <div class="page page-welcome">
        <div class="page-front">
          <!-- Welcome text on parchment -->
        </div>
        <div class="page-back">
          <!-- Blank parchment -->
        </div>
      </div>

      <!-- PAGE 3: Table of Contents (revealed after welcome flip) -->
      <div class="page-static page-toc">
        <!-- 5 chapter entries, each a clickable link -->
      </div>

    </div>
  </div>

  <!-- Scroll spacers (hidden, just provide scroll height) -->
  <div class="scroll-spacer" data-section="cover"></div>
  <div class="scroll-spacer" data-section="flip-1"></div>
  <div class="scroll-spacer" data-section="welcome"></div>
  <div class="scroll-spacer" data-section="flip-2"></div>
  <div class="scroll-spacer" data-section="toc"></div>

  <!-- Companion button (same as cabin) -->
  <button class="companion-btn" aria-label="Gift Companion" title="Gift Companion">
    <svg viewBox="0 0 24 24">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 ..."/>
    </svg>
  </button>

  <script type="module" src="../js/book-home.js"></script>
</body>
</html>
```

Key CSS concepts for the book:

```css
/* Background: bright warm cream */
body { background: #faf6f0; }

/* Book scene: centered, provides perspective */
.book-scene {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1800px;
}

/* Book container: 3D context */
.book {
  position: relative;
  width: min(85vw, 600px);
  height: min(75vh, 800px);
  transform-style: preserve-3d;
}

/* Each flippable page */
.page {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  transform-style: preserve-3d;
  transform-origin: left center;  /* hinge on spine */
}

/* Front and back faces */
.page-front, .page-back {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  backface-visibility: hidden;
  border-radius: 0 8px 8px 0;  /* rounded right edges, flat spine */
}

.page-back {
  transform: rotateY(180deg);  /* pre-flipped */
}

/* Cover: gold gradient */
.page-cover .page-front {
  background: linear-gradient(135deg, #d4a853 0%, #c49a3a 100%);
}

/* Interior pages: warm parchment */
.page-welcome .page-front,
.page-cover .page-back,
.page-welcome .page-back,
.page-toc {
  background: #fffcf7;
}

/* Scroll spacers provide scroll height but are invisible */
.scroll-spacer { height: 100vh; }
```

**Step 3: Verify the static page renders**

```bash
npm run dev
```

Open `http://localhost:5173/giftsite/book/` — should see the gold book cover centered on a cream background. No animations yet, just the visual layout.

**Step 4: Commit**

```bash
git add book/index.html
git commit -m "feat(book): scaffold HTML structure and static styles"
```

---

## Task 2: Add Vite entry point for book template

**Files:**
- Modify: `vite.config.js`

**Step 1: Add book entry to Vite config**

In `vite.config.js`, add the book entry to `rollupOptions.input`:

```js
input: {
  main: resolve(__dirname, 'index.html'),
  cabin: resolve(__dirname, 'cabin/index.html'),
  cloud: resolve(__dirname, 'cloud/index.html'),
  book: resolve(__dirname, 'book/index.html')     // ← add this
}
```

**Step 2: Verify dev server serves the book page**

```bash
npm run dev
```

Navigate to `http://localhost:5173/giftsite/book/` — should load without errors.

**Step 3: Verify production build**

```bash
npm run build && npm run preview
```

Navigate to `http://localhost:4173/giftsite/book/` — should load the book page.

**Step 4: Commit**

```bash
git add vite.config.js
git commit -m "build: add book template entry point to Vite config"
```

---

## Task 3: Implement book-home.js — Lenis + GSAP setup and cover entrance animation

**Files:**
- Create: `js/book-home.js`

**Step 1: Create `js/book-home.js` with Lenis + GSAP initialization**

Follow the exact same pattern as `js/cabin-home.js`:

```js
// js/book-home.js — Golden Book scroll-driven page-flip homepage
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

// --- Lenis smooth scroll (same config as cabin) ---
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  touchMultiplier: 1.5,
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

**Step 2: Add cover entrance animation**

Same SplitText technique as cabin hero — title characters stagger in, tagline fades, scroll indicator appears:

```js
function animateCover() {
  const title = document.querySelector('.cover-title');
  const tagline = document.querySelector('.cover-tagline');
  const scrollHint = document.querySelector('.scroll-indicator');

  if (!title) return;

  gsap.set([title, tagline, scrollHint].filter(Boolean), { visibility: 'visible' });

  const split = new SplitText(title, { type: 'chars' });
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from(split.chars, { y: 40, autoAlpha: 0, duration: 0.8, stagger: 0.04 });

  if (tagline) {
    tl.from(tagline, { autoAlpha: 0, y: 20, duration: 0.7 }, '-=0.3');
  }
  if (scrollHint) {
    tl.from(scrollHint, { autoAlpha: 0, duration: 0.6 }, '-=0.2');
  }
}
```

**Step 3: Add init function and DOMContentLoaded listener**

```js
function init() {
  animateCover();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

**Step 4: Test in browser**

```bash
npm run dev
```

Open book page — title should animate in with character stagger, tagline fades in, scroll indicator appears.

**Step 5: Commit**

```bash
git add js/book-home.js
git commit -m "feat(book): add Lenis/GSAP setup and cover entrance animation"
```

---

## Task 4: Implement scroll-driven page flip animations

**Files:**
- Modify: `js/book-home.js`

This is the core mechanic. Two page flips, each pinned and scrubbed by ScrollTrigger.

**Step 1: Add page flip function**

```js
function setupPageFlips() {
  const pages = document.querySelectorAll('.page');
  const flipSections = document.querySelectorAll('.scroll-spacer[data-section^="flip"]');

  flipSections.forEach((section, i) => {
    const page = pages[i];
    if (!page || !section) return;

    // Flip shadow element inside the page
    const shadow = page.querySelector('.flip-shadow');

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      pin: document.querySelector('.book-scene'),
      scrub: 0.5,
      onUpdate: (self) => {
        const angle = self.progress * -180;
        gsap.set(page, { rotateY: angle });

        // Shadow intensity peaks at 90deg (edge-on)
        if (shadow) {
          const shadowOpacity = Math.sin(self.progress * Math.PI) * 0.15;
          gsap.set(shadow, { opacity: shadowOpacity });
        }
      }
    });
  });
}
```

**Step 2: Add scroll indicator fade-out**

```js
function setupScrollIndicator() {
  const scrollHint = document.querySelector('.scroll-indicator');
  if (!scrollHint) return;

  gsap.to(scrollHint, {
    autoAlpha: 0,
    scrollTrigger: {
      trigger: document.querySelectorAll('.scroll-spacer')[0],
      start: 'top top',
      end: '30% top',
      scrub: true,
    },
  });
}
```

**Step 3: Wire into init()**

```js
function init() {
  animateCover();
  setupScrollIndicator();
  setupPageFlips();
}
```

**Step 4: Test the flip mechanic**

```bash
npm run dev
```

Scroll down on book page:
- Cover should remain visible for first 100vh
- Scroll through flip-1 spacer: cover should rotate on left edge from 0° to -180°
- Welcome page should be visible behind/beneath the flipping cover
- Second flip should work the same for welcome → TOC

**Step 5: Commit**

```bash
git add js/book-home.js
git commit -m "feat(book): implement scroll-driven 3D page flip with shadow"
```

---

## Task 5: Implement welcome page and TOC content reveal animations

**Files:**
- Modify: `js/book-home.js`

**Step 1: Add welcome page text fade-in**

```js
function setupWelcomeReveal() {
  const welcomeText = document.querySelector('.welcome-text');
  if (!welcomeText) return;

  const welcomeSection = document.querySelector('.scroll-spacer[data-section="welcome"]');

  gsap.from(welcomeText, {
    autoAlpha: 0,
    y: 30,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: welcomeSection,
      start: 'top 60%',
      once: true,
    }
  });
}
```

**Step 2: Add TOC chapter stagger reveal**

```js
function setupTocReveals() {
  const chapters = document.querySelectorAll('.toc-chapter');
  if (!chapters.length) return;

  const tocSection = document.querySelector('.scroll-spacer[data-section="toc"]');

  gsap.from(chapters, {
    autoAlpha: 0,
    y: 40,
    duration: 0.6,
    stagger: 0.12,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: tocSection,
      start: 'top 70%',
      once: true,
    }
  });
}
```

**Step 3: Wire into init()**

```js
function init() {
  animateCover();
  setupScrollIndicator();
  setupPageFlips();
  setupWelcomeReveal();
  setupTocReveals();
}
```

**Step 4: Test content reveals**

After the first page flip completes, scroll into the welcome section — text should fade up. After second flip, TOC chapters should stagger in one by one.

**Step 5: Commit**

```bash
git add js/book-home.js
git commit -m "feat(book): add welcome text and TOC chapter reveal animations"
```

---

## Task 6: Polish — page stacking, z-index, mobile responsiveness

**Files:**
- Modify: `book/index.html` (CSS adjustments)

**Step 1: Fix page stacking order**

Pages need correct z-index so the cover is on top initially and flipped pages go behind:

```css
.page-cover { z-index: 3; }
.page-welcome { z-index: 2; }
.page-toc { z-index: 1; }
```

**Step 2: Add mobile responsive styles**

```css
@media (max-width: 640px) {
  .book {
    width: 95vw;
    height: 85vh;
  }

  .cover-title {
    font-size: clamp(1.6rem, 6vw, 2.2rem);
  }

  .spine {
    width: 12px;  /* narrower on mobile */
  }

  .toc-chapter {
    padding: 1rem 1.25rem;
    min-height: 44px;  /* touch target */
  }
}
```

**Step 3: Add spine visual detail**

A thin vertical strip on the left edge of the book:

```css
.book::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 16px;
  height: 100%;
  background: #c49a3a;
  border-radius: 4px 0 0 4px;
  z-index: 10;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
}
```

**Step 4: Add book shadow**

```css
.book-scene::after {
  content: '';
  position: fixed;
  /* Elliptical shadow beneath the book */
  bottom: 8%;
  left: 50%;
  transform: translateX(-50%);
  width: min(75vw, 550px);
  height: 20px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.12) 0%, transparent 70%);
  z-index: 0;
}
```

**Step 5: Test on mobile viewport**

Use browser dev tools, set to iPhone 14 Pro viewport (393×852). Verify:
- Book fills most of the screen
- Cover title is readable
- Page flips work with scroll/touch
- TOC chapters are tappable (44px+ height)
- Companion button doesn't overlap content

**Step 6: Commit**

```bash
git add book/index.html
git commit -m "feat(book): polish z-index stacking, mobile styles, spine and shadow"
```

---

## Task 7: Update chooser page with third card

**Files:**
- Modify: `index.html`

**Step 1: Update grid to support 3 cards**

Change `.templates` grid from 2-column to 3-column on desktop, keeping 1-column on mobile:

```css
.templates {
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  max-width: 1100px;
}

@media (max-width: 840px) {
  .templates {
    grid-template-columns: 1fr;
  }
}
```

**Step 2: Add the book card**

Add a third `<a>` card after the cloud card:

```html
<a class="template-card" href="book/">
  <img src="assets/thumb-book.jpg" alt="Book design preview">
  <div class="card-body">
    <h2>The Golden Book</h2>
    <p>An interactive book that opens to reveal your journey — scroll to turn pages</p>
  </div>
</a>
```

**Step 3: Create a placeholder thumbnail**

For now, use a solid gold rectangle as a placeholder (we'll screenshot the real thing later):

```bash
node -e "
const sharp = require('sharp');
sharp({ create: { width: 960, height: 600, channels: 3, background: { r: 212, g: 168, b: 83 } } })
  .jpeg({ quality: 80 })
  .toFile('assets/thumb-book.jpg')
  .then(() => console.log('Thumbnail created'));
"
```

**Step 4: Verify chooser page**

```bash
npm run dev
```

Open `http://localhost:5173/giftsite/` — should show 3 cards in a row. Book card links to `/giftsite/book/`.

**Step 5: Commit**

```bash
git add index.html assets/thumb-book.jpg
git commit -m "feat: add Golden Book card to template chooser"
```

---

## Task 8: Cross-browser test and final QA

**Files:** None new — testing only.

**Step 1: Test desktop (Chrome)**

- Load chooser, click Golden Book card
- Cover title animates in
- Scroll: cover flips with 3D perspective, shadow sweeps
- Welcome page fades in
- Scroll: welcome flips, TOC chapters stagger in
- TOC chapter links are clickable (point to `#` placeholders for now)
- Companion button visible and clickable

**Step 2: Test mobile (Chrome DevTools → iPhone 14 Pro)**

- Same flow as desktop
- Book fills viewport width
- Touch scroll drives flips smoothly
- TOC chapters have adequate touch targets
- No horizontal overflow

**Step 3: Test production build**

```bash
npm run build && npm run preview
```

Verify book page loads and all animations work at `http://localhost:4173/giftsite/book/`.

**Step 4: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix(book): QA fixes"
```

---

## Task 9: Push branch and notify user

**Step 1: Create feature branch and push**

```bash
git checkout -b feature/book-template
git push -u origin feature/book-template
```

Note: All commits were made on main during development. We need to branch from the current state. If work was done on main, create the branch from HEAD and push.

**Step 2: Notify user**

Tell the user the branch is ready for PR review. Provide:
- Branch name
- Summary of what was built
- Any open questions or follow-ups
