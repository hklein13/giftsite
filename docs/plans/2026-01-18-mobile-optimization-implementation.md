# Mobile Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Optimize Gift Site for snappy, responsive mobile experience on modern iPhones.

**Architecture:** Reduce scroll thresholds and transition delays for immediate feedback. Add sequential page navigation. Ensure all touch targets meet 44px minimum.

**Tech Stack:** CSS, JavaScript (Three.js solar system), HTML

---

## Task 1: Snappy Touch Scrolling

**Files:**
- Modify: `js/solar-system.js:692` (scrollThreshold)
- Modify: `js/solar-system.js:734` (touch multiplier)
- Modify: `js/solar-system.js:769-772` (transition timing)

**Step 1: Reduce scroll threshold from 150px to 80px**

In `setupScrollListener()`, change line 692:

```javascript
// Before
this.scrollThreshold = 150;

// After
this.scrollThreshold = 80;
```

**Step 2: Increase touch sensitivity multiplier**

Change line 734 from `0.5` to `1.0`:

```javascript
// Before
this.scrollAccumulator += deltaY * 0.5;

// After
this.scrollAccumulator += deltaY * 1.0;
```

**Step 3: Reduce transition delay from 1200ms to 800ms**

Change lines 769-772:

```javascript
// Before
setTimeout(() => {
  this.isTransitioning = false;
  this.showClickPrompt();
}, 1200);

// After
setTimeout(() => {
  this.isTransitioning = false;
  this.showClickPrompt();
}, 800);
```

**Step 4: Test locally**

Run: `npm run dev`
- Open on phone or use Chrome DevTools mobile emulation
- Swipe to navigate - should feel responsive, not sluggish
- Verify planets snap quickly

**Step 5: Commit**

```bash
git add js/solar-system.js
git commit -m "perf: snappier touch scrolling for mobile"
```

---

## Task 2: Larger Visit Button Touch Target

**Files:**
- Modify: `css/main.css:828-839` (.click-text styles)

**Step 1: Increase button padding for 44px+ touch target**

Find `.click-text` (around line 828) and update padding:

```css
/* Before */
.click-text {
  display: block;
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--off-white);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: 0.8rem 2rem;
  /* ... */
}

/* After */
.click-text {
  display: block;
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--off-white);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  padding: 1rem 2.5rem;
  min-height: 44px;
  min-width: 44px;
  /* ... */
}
```

**Step 2: Test locally**

- Verify button is easy to tap on mobile
- Use DevTools to measure touch target size

**Step 3: Commit**

```bash
git add css/main.css
git commit -m "a11y: larger Visit button touch target"
```

---

## Task 3: Page Navigation Styles

**Files:**
- Modify: `css/main.css` (add new styles at end, before final media query)

**Step 1: Add page navigation CSS**

Add before the `@media (max-width: 768px)` block:

```css
/* Page Navigation - Next/Prev links */
.page-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem 2rem;
  gap: 1rem;
}

.page-nav a {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-body, 'Outfit', sans-serif);
  font-size: 1rem;
  color: var(--midnight, #1e1e2e);
  text-decoration: none;
  padding: 0.75rem 1.25rem;
  min-height: 44px;
  border-radius: 8px;
  transition: background 0.2s ease, color 0.2s ease;
}

.page-nav a:hover {
  background: rgba(0, 0, 0, 0.05);
}

.page-nav .prev::before {
  content: '←';
}

.page-nav .next::after {
  content: '→';
}

.page-nav .spacer {
  flex: 1;
}
```

**Step 2: Add mobile adjustments in 768px media query**

```css
@media (max-width: 768px) {
  /* ... existing rules ... */

  .page-nav {
    flex-direction: column;
    gap: 0.75rem;
    padding: 2rem 1.5rem;
  }

  .page-nav a {
    width: 100%;
    justify-content: center;
  }
}
```

**Step 3: Commit**

```bash
git add css/main.css
git commit -m "style: add page navigation component styles"
```

---

## Task 4: Add Navigation to why.html

**Files:**
- Modify: `why.html` (add page-nav section before footer)

**Step 1: Add page navigation HTML**

Insert before `<!-- Footer -->` (around line 458):

```html
  <!-- Page Navigation -->
  <nav class="page-nav">
    <span class="spacer"></span>
    <a href="discover.html" class="next">Next: Discover</a>
  </nav>

  <!-- Footer -->
```

Note: why.html has no "previous" - it's the first content page.

**Step 2: Add the page-nav CSS to why.html's inline styles**

Find the `</style>` tag and add before it:

```css
    /* Page Navigation */
    .page-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 800px;
      margin: 0 auto;
      padding: 3rem 2rem;
      gap: 1rem;
    }

    .page-nav a {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: var(--font-body);
      font-size: 1rem;
      color: var(--midnight);
      text-decoration: none;
      padding: 0.75rem 1.25rem;
      min-height: 44px;
      border-radius: 8px;
      transition: background 0.2s ease;
    }

    .page-nav a:hover {
      background: rgba(0, 0, 0, 0.05);
    }

    .page-nav .next::after {
      content: ' →';
    }

    .page-nav .prev::before {
      content: '← ';
    }

    .page-nav .spacer {
      flex: 1;
    }

    @media (max-width: 768px) {
      .page-nav {
        flex-direction: column;
        gap: 0.75rem;
        padding: 2rem 1.5rem;
      }

      .page-nav a {
        width: 100%;
        justify-content: center;
      }
    }
```

**Step 3: Test locally**

- Navigate to why.html
- Verify "Next: Discover →" link appears
- Tap/click to verify navigation works

**Step 4: Commit**

```bash
git add why.html
git commit -m "feat: add page navigation to why.html"
```

---

## Task 5: Add Navigation to discover.html

**Files:**
- Modify: `discover.html`

**Step 1: Add same page-nav CSS to inline styles** (copy from Task 4)

**Step 2: Add page navigation HTML before footer**

```html
  <!-- Page Navigation -->
  <nav class="page-nav">
    <a href="why.html" class="prev">Why We Exist</a>
    <a href="process.html" class="next">Next: The Process</a>
  </nav>
```

**Step 3: Test and commit**

```bash
git add discover.html
git commit -m "feat: add page navigation to discover.html"
```

---

## Task 6: Add Navigation to process.html

**Files:**
- Modify: `process.html`

**Step 1: Add same page-nav CSS to inline styles**

**Step 2: Add page navigation HTML before footer**

```html
  <!-- Page Navigation -->
  <nav class="page-nav">
    <a href="discover.html" class="prev">Discover</a>
    <a href="facilitate.html" class="next">Next: Facilitate</a>
  </nav>
```

**Step 3: Test and commit**

```bash
git add process.html
git commit -m "feat: add page navigation to process.html"
```

---

## Task 7: Add Navigation to facilitate.html

**Files:**
- Modify: `facilitate.html`

**Step 1: Add same page-nav CSS to inline styles**

**Step 2: Add page navigation HTML before footer**

```html
  <!-- Page Navigation -->
  <nav class="page-nav">
    <a href="process.html" class="prev">The Process</a>
    <span class="spacer"></span>
  </nav>
```

Note: facilitate.html has no "next" - it's the last content page.

**Step 3: Test and commit**

```bash
git add facilitate.html
git commit -m "feat: add page navigation to facilitate.html"
```

---

## Task 8: Mobile Nav Header Cleanup

**Files:**
- Modify: `css/main.css` (verify nav links hidden on mobile)

**Step 1: Verify existing mobile nav behavior**

Check that at 900px breakpoint, `.nav-links` is hidden:

```css
@media (max-width: 900px) {
  .nav-links {
    display: none;
  }
}
```

This already exists - just verify it's working correctly.

**Step 2: Ensure logo is properly tappable**

If logo touch target is too small, add in the 900px media query:

```css
@media (max-width: 900px) {
  /* ... existing ... */

  .logo {
    padding: 0.5rem;
    margin: -0.5rem;
  }
}
```

**Step 3: Test and commit if changes made**

```bash
git add css/main.css
git commit -m "style: ensure logo touch target on mobile"
```

---

## Task 9: Final Mobile Testing & Polish

**Files:**
- All modified files

**Step 1: Test complete flow on mobile**

Run: `npm run dev`

Test on phone or Chrome DevTools mobile (iPhone 12/13/14 preset):

1. Homepage solar system:
   - [ ] Swipe feels snappy (not sluggish)
   - [ ] Visit button easy to tap
   - [ ] Caption bar readable

2. Content pages:
   - [ ] Logo taps return to homepage
   - [ ] Next/prev links work correctly
   - [ ] Text is readable size
   - [ ] No horizontal scroll

3. Full journey:
   - [ ] Home → Why → Discover → Process → Facilitate
   - [ ] Navigate back via logo
   - [ ] Navigate forward via next links

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add .
git commit -m "test: verify mobile optimization complete"
```

---

## Verification Checklist

- [ ] Touch scroll threshold reduced (80px)
- [ ] Touch multiplier increased (1.0)
- [ ] Transition delay reduced (800ms)
- [ ] Visit button min 44px touch target
- [ ] Page nav added to why.html
- [ ] Page nav added to discover.html
- [ ] Page nav added to process.html
- [ ] Page nav added to facilitate.html
- [ ] Mobile nav shows logo only
- [ ] Full flow tested on mobile device/emulator
