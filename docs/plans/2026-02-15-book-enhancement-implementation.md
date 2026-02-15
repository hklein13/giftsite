# Book Enhancement ("Refined Craft") Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the Golden Book template with smooth native scroll, real image textures, enriched cover/interior design, desk environment with reading lamp, and improved flip animations.

**Architecture:** All changes stay within existing HTML/CSS/GSAP architecture. CSS scroll-snap replaces JS scroll hijacking. Real texture images layer over existing CSS color foundations. Desk environment elements are fixed-position SVG/CSS. Flip enhancements are ScrollTrigger-driven CSS transforms.

**Tech Stack:** Vite, GSAP 3.14 (ScrollTrigger, SplitText), CSS 3D transforms, inline SVG

**Design doc:** `docs/plans/2026-02-15-book-enhancement-design.md`

---

### Task 1: Scroll System Overhaul

**Files:**
- Modify: `book/index.html` (CSS, lines 13-869)
- Modify: `js/book-home.js` (lines 1-225)

**Goal:** Replace JS-hijacked pagination with native CSS scroll-snap. This fixes both jerkiness and pacing.

**Step 1: Add CSS scroll-snap rules**

In `book/index.html`, add to the `<style>` block:

```css
html {
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}

.scroll-spacer[data-section="cover"],
.scroll-spacer[data-section="welcome"],
.scroll-spacer[data-section="toc"] {
  scroll-snap-align: start;
}
```

Note: The flip spacers (`flip-1`, `flip-2`) intentionally have NO snap alignment — the browser scrolls through them during snap transitions, and ScrollTrigger scrubs the page flip as it passes.

**Step 2: Remove JS scroll hijacking from book-home.js**

Delete the following:
- Lines 10-13: `currentPage`, `isAnimating`, `snapPoints` state variables
- Lines 126-209: Entire `navigateToPage()` and `setupPaginatedScroll()` functions (wheel, touch, keyboard handlers)
- Line 218: `setupPaginatedScroll()` call in `init()`

The file should retain only: imports, `animateCover()`, `setupScrollIndicator()`, `setupPageFlips()`, `setupWelcomeReveal()`, `setupTocReveals()`, and `init()`.

**Step 3: Verify in browser**

Run: `npm run dev`

Test:
- Trackpad/mouse scroll should snap smoothly between cover → welcome → TOC
- Page flips should still animate during transitions
- Cover entrance animation should still play on load
- Scroll indicator should still fade out
- Welcome text and TOC chapters should still reveal

**Step 4: Commit**

```bash
git add book/index.html js/book-home.js
git commit -m "refactor: replace JS scroll hijacking with CSS scroll-snap"
```

---

### Task 2: Source and Place Texture Images

**Files:**
- Create: `assets/textures/wood-desk.jpg` (~80-120KB)
- Create: `assets/textures/leather-cover.jpg` (~30-50KB)
- Create: `assets/textures/parchment-page.jpg` (~20-40KB)

**Goal:** Obtain three texture images for the desk, cover, and interior pages.

**Step 1: Create assets/textures/ directory**

```bash
mkdir -p assets/textures
```

**Step 2: Source textures**

Three textures are needed. Options for sourcing:
- **Recommended:** Download CC0 textures from ambientCG.com, Poly Haven, or textures.com (free tier)
- **Alternative:** Use sharp (already in devDeps) to process/generate from stock images
- **Alternative:** Use a procedural generation script

Requirements for each:

1. **wood-desk.jpg** — Warm oak or walnut surface, shot from above. Should be large enough to cover a viewport (~1920x1080) without obvious tiling. Desaturate slightly and warm-shift to harmonize with `#b8956a`. Compress to JPEG quality 75-80.

2. **leather-cover.jpg** — Dark blue leather or bookcloth grain, tileable. 512x512 is sufficient. Tint toward sapphire `#1e3a5f`. Compress to JPEG quality 80.

3. **parchment-page.jpg** — Cream/off-white parchment with visible paper fibers and subtle irregularity. Tileable, 512x512. Must be light/high-key enough not to compete with dark text. Compress to JPEG quality 80.

**Step 3: Verify image sizes**

```bash
ls -la assets/textures/
```

Total should be under 250KB. If any texture exceeds budget, recompress with sharp:

```bash
npx sharp -i assets/textures/wood-desk.jpg -o assets/textures/wood-desk.jpg --quality 70
```

**Step 4: Commit**

```bash
git add assets/textures/
git commit -m "assets: add wood desk, leather cover, and parchment textures"
```

---

### Task 3: Apply Texture Images to Surfaces

**Files:**
- Modify: `book/index.html` (CSS)

**Goal:** Replace CSS-gradient-only surfaces with real texture images layered over color foundations.

**Step 1: Replace desk surface (body::before)**

Replace the current `body::before` background (lines 39-74) with:

```css
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  background:
    /* Vignette — biased toward upper-left (opposite lamp in upper-right) */
    radial-gradient(ellipse at 75% 25%, transparent 40%, rgba(40, 20, 5, 0.15) 100%),
    radial-gradient(ellipse at center, transparent 30%, rgba(40, 20, 5, 0.12) 100%),
    /* Wood texture */
    url('../assets/textures/wood-desk.jpg') center/cover no-repeat;
}
```

The vignette is now biased: lighter toward upper-right (where the lamp will be) and darker in the opposite corner.

**Step 2: Apply leather texture to cover**

Replace the `.page-cover .page-front` background (lines 188-211) with:

```css
.page-cover .page-front {
  background:
    /* Leather/cloth grain texture */
    url('../assets/textures/leather-cover.jpg'),
    /* Base gradient for color control */
    linear-gradient(160deg, #1e3a5f 0%, #182e4e 40%, #213a5c 70%, #1a3355 100%);
  background-size: 256px 256px, 100% 100%;
  background-blend-mode: overlay;
  /* ... keep existing flex/padding/position rules ... */
}
```

The texture tiles at 256px intervals. `background-blend-mode: overlay` merges the leather grain with the base color.

**Step 3: Apply parchment texture to interior pages**

Replace the interior page shared background (lines 398-411) with:

```css
.page-welcome .page-front,
.page-welcome .page-back,
.page-cover .page-back,
.page-toc {
  background:
    /* Parchment fiber texture — low opacity to preserve readability */
    url('../assets/textures/parchment-page.jpg'),
    /* Subtle line pattern */
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 28px,
      rgba(180, 160, 130, 0.03) 28px,
      rgba(180, 160, 130, 0.03) 29px
    ),
    linear-gradient(135deg, #fffcf7 0%, #faf5ec 50%, #fffcf7 100%);
  background-size: 256px 256px, 100% 100%, 100% 100%;
  background-blend-mode: soft-light, normal, normal;
}
```

`soft-light` blend mode keeps the parchment texture subtle.

**Step 4: Verify in browser**

Run: `npm run dev`

Check:
- Desk should look like real wood, not CSS gradients
- Book cover should have visible leather/cloth grain texture
- Interior pages should have subtle parchment fibers without hurting text readability
- All three textures should load without visible delay

**Step 5: Commit**

```bash
git add book/index.html
git commit -m "style: apply real wood, leather, and parchment textures"
```

---

### Task 4: Cover Design Enhancement

**Files:**
- Modify: `book/index.html` (HTML + CSS)

**Goal:** Enrich the cover with embossed gold foil title, compass rose emblem, filigree corners, enhanced frame, and refined tagline.

**Step 1: Embossed gold foil title**

Replace `.cover-title` CSS (lines 314-326) with multi-layered embossed effect:

```css
.cover-title {
  font-family: 'Fraunces', serif;
  font-size: clamp(2rem, 7vw, 3.5rem);
  font-weight: 400;
  color: #d4a853;
  text-align: center;
  line-height: 1.2;
  letter-spacing: -0.02em;
  text-shadow:
    /* Debossed channel — dark inset */
    0 -1px 1px rgba(0, 0, 0, 0.4),
    /* Raised foil highlight */
    0 1px 1px rgba(232, 200, 120, 0.6),
    /* Ambient gold reflection */
    0 0 20px rgba(212, 168, 83, 0.2),
    /* Outer glow */
    0 0 40px rgba(212, 168, 83, 0.08);
  visibility: hidden;
  position: relative;
  z-index: 1;
  animation: foil-shimmer 10s ease-in-out infinite;
}

@keyframes foil-shimmer {
  0%, 100% { text-shadow: 0 -1px 1px rgba(0,0,0,0.4), 0 1px 1px rgba(232,200,120,0.6), 0 0 20px rgba(212,168,83,0.2), 0 0 40px rgba(212,168,83,0.08); }
  50% { text-shadow: 0 -1px 1px rgba(0,0,0,0.35), 1px 2px 2px rgba(232,200,120,0.7), 0 0 25px rgba(212,168,83,0.25), 0 0 50px rgba(212,168,83,0.12); }
}
```

**Step 2: Compass rose emblem SVG**

Replace the compass emblem SVG in HTML (line 893) with a detailed compass rose:

```html
<div class="cover-emblem"><svg viewBox="0 0 32 32">
  <!-- Outer ring -->
  <circle cx="16" cy="16" r="14" stroke-width="0.5"/>
  <circle cx="16" cy="16" r="12.5" stroke-width="0.3"/>
  <!-- Cardinal points (elongated diamonds) -->
  <polygon points="16,1 17.5,13 16,15 14.5,13" fill="#d4a853" stroke="none" opacity="0.6"/>
  <polygon points="16,31 14.5,19 16,17 17.5,19" fill="#d4a853" stroke="none" opacity="0.4"/>
  <polygon points="1,16 13,14.5 15,16 13,17.5" fill="#d4a853" stroke="none" opacity="0.4"/>
  <polygon points="31,16 19,17.5 17,16 19,14.5" fill="#d4a853" stroke="none" opacity="0.4"/>
  <!-- Intercardinal points (shorter) -->
  <polygon points="4.5,4.5 12.5,14 14,12.5" fill="#d4a853" stroke="none" opacity="0.3"/>
  <polygon points="27.5,4.5 19.5,12.5 18,14" fill="#d4a853" stroke="none" opacity="0.3"/>
  <polygon points="4.5,27.5 12.5,19.5 14,18" fill="#d4a853" stroke="none" opacity="0.3"/>
  <polygon points="27.5,27.5 18,19.5 19.5,18" fill="#d4a853" stroke="none" opacity="0.3"/>
  <!-- Center circle -->
  <circle cx="16" cy="16" r="3" stroke-width="0.5"/>
  <circle cx="16" cy="16" r="1.5" fill="#d4a853" stroke="none" opacity="0.5"/>
</svg></div>
```

**Step 3: Filigree corner ornaments**

Replace all four cover corner SVGs (lines 888-891) with scrollwork filigree:

```html
<div class="cover-corner cover-corner-tl"><svg viewBox="0 0 40 40">
  <path d="M2,38 C2,20 8,10 18,4 C14,12 12,18 12,24 C12,18 16,12 24,10 C18,14 16,18 16,24" stroke-width="0.8" fill="none"/>
  <path d="M6,34 C6,22 10,14 18,10 C16,16 15,20 15,26" stroke-width="0.6" fill="none"/>
  <circle cx="4" cy="36" r="1.5" fill="rgba(212,168,83,0.45)" stroke="none"/>
  <circle cx="18" cy="4" r="1" fill="rgba(212,168,83,0.35)" stroke="none"/>
  <path d="M8,32 Q4,28 4,22" stroke-width="0.5" fill="none"/>
  <path d="M10,30 C8,26 8,22 10,18" stroke-width="0.4" fill="none"/>
</svg></div>
```

Apply the same SVG to all four `.cover-corner-*` elements. The CSS transforms (scaleX, scaleY, scale) already handle mirroring for each corner.

**Step 4: Frame enhancement**

Update `.cover-frame-outer` (line 240): change `border: 1.5px` to `border: 2px`, increase opacity:

```css
border: 2px solid rgba(212, 168, 83, 0.45);
```

Update `.cover-frame-outer::before` and `::after` diamond accents: increase font-size from 8px to 10px.

Update `.cover-frame-inner` (line 279): change to dotted border:

```css
border: 1px dotted rgba(212, 168, 83, 0.22);
```

**Step 5: Tagline refinement**

Update `.cover-tagline` CSS (lines 382-393):

```css
.cover-tagline {
  font-family: 'Outfit', sans-serif;
  font-size: clamp(0.65rem, 1.8vw, 0.85rem);
  font-weight: 400;
  color: rgba(212, 168, 83, 0.7);
  margin-top: 0.4rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  text-align: center;
  visibility: hidden;
  position: relative;
  z-index: 1;
}
```

Key changes: color shifts from light blue to soft gold, uppercase, wider letter-spacing, slightly smaller font.

**Step 6: Verify in browser**

Check:
- Title should look embossed with a subtle slow shimmer
- Compass rose should be visible and detailed above the title
- Corners should have scrollwork filigree, not simple arcs
- Outer frame should be bolder, inner frame should be dotted
- Tagline should read as uppercase gold engraved text

**Step 7: Commit**

```bash
git add book/index.html
git commit -m "style: enrich cover with embossed title, compass rose, filigree corners"
```

---

### Task 5: Interior Page Polish

**Files:**
- Modify: `book/index.html` (HTML + CSS)

**Goal:** Upgrade stitching, binding gutter, corner ornaments, ribbon, aged edges, page numbers, and drop cap.

**Step 1: Double stitching with diagonal marks**

Replace `.page-welcome .page-front .stitching, .page-toc .stitching` CSS (lines 427-445):

```css
.page-welcome .page-front .stitching,
.page-toc .stitching {
  position: absolute;
  top: 5%;
  left: 8px;
  width: 6px;
  height: 90%;
  pointer-events: none;
  z-index: 2;
  /* Two parallel stitch lines with diagonal marks */
  background:
    /* Left stitch line */
    repeating-linear-gradient(
      170deg,
      transparent 0px,
      transparent 6px,
      rgba(180, 150, 90, 0.25) 6px,
      rgba(180, 150, 90, 0.25) 10px,
      transparent 10px,
      transparent 18px
    ),
    /* Right stitch line (offset) */
    repeating-linear-gradient(
      190deg,
      transparent 0px,
      transparent 9px,
      rgba(170, 140, 80, 0.18) 9px,
      rgba(170, 140, 80, 0.18) 13px,
      transparent 13px,
      transparent 21px
    );
  background-size: 3px 100%, 3px 100%;
  background-position: 0 0, 3px 4px;
}
```

**Step 2: Deeper binding gutter**

Replace `.page-welcome .page-front .binding-shadow, .page-toc .binding-shadow` CSS (lines 414-424):

```css
.page-welcome .page-front .binding-shadow,
.page-toc .binding-shadow {
  position: absolute;
  top: 0;
  left: 0;
  width: 50px;
  height: 100%;
  background:
    /* Highlight where page flattens */
    linear-gradient(to right,
      transparent 12px,
      rgba(255, 250, 240, 0.06) 15px,
      transparent 20px
    ),
    /* Curved shadow suggesting page concavity */
    radial-gradient(ellipse at 0% 50%, rgba(100, 80, 50, 0.12) 0%, transparent 70%),
    /* Base gradient shadow */
    linear-gradient(to right, rgba(100, 80, 50, 0.1) 0%, rgba(100, 80, 50, 0.04) 30%, transparent 100%);
  pointer-events: none;
  z-index: 1;
}
```

**Step 3: Fleuron corner ornaments**

Replace all interior corner ornament SVGs (on welcome page lines 911-914, and TOC lines 937-940) with leaf spray fleurons:

```html
<div class="corner-ornament corner-tl"><svg viewBox="0 0 20 20">
  <path d="M2,18 C2,10 6,4 14,2" stroke-width="0.8" fill="none"/>
  <path d="M4,14 C5,10 8,7 12,6" stroke-width="0.6" fill="none"/>
  <path d="M14,2 C12,6 12,8 14,10" stroke-width="0.5" fill="none"/>
  <circle cx="3" cy="17" r="1" fill="#b8862d" stroke="none" opacity="0.3"/>
</svg></div>
```

Apply the same SVG to all eight interior corner ornaments (4 on welcome, 4 on TOC). The CSS transforms handle mirroring.

**Step 4: Satin ribbon bookmark**

Replace `.ribbon-bookmark` CSS (lines 470-482):

```css
.ribbon-bookmark {
  position: absolute;
  top: 0;
  right: 30px;
  width: 14px;
  height: 65px;
  background:
    /* Satin sheen highlight */
    linear-gradient(to right,
      rgba(139, 34, 50, 0.9) 0%,
      rgba(180, 50, 70, 1) 35%,
      rgba(200, 80, 95, 0.9) 45%,
      rgba(163, 42, 62, 1) 55%,
      rgba(139, 34, 50, 0.95) 100%
    );
  z-index: 3;
  pointer-events: none;
  box-shadow: 1px 2px 4px rgba(0, 0, 0, 0.18);
  /* Organic drape with slight curve at bottom */
  clip-path: polygon(0 0, 100% 0, 100% 88%, 85% 95%, 50% 100%, 15% 95%, 0 88%);
}
```

**Step 5: Aged edges with foxing spots**

Replace `.page-aged-edge` CSS (lines 508-521). Add foxing spots via radial-gradient dots:

```css
.page-aged-edge {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    /* Foxing spots — scattered brown dots */
    radial-gradient(circle at 85% 12%, rgba(160, 120, 70, 0.1) 0%, rgba(160, 120, 70, 0.1) 2px, transparent 2px),
    radial-gradient(circle at 92% 45%, rgba(150, 110, 60, 0.08) 0%, rgba(150, 110, 60, 0.08) 1.5px, transparent 1.5px),
    radial-gradient(circle at 78% 78%, rgba(170, 130, 80, 0.09) 0%, rgba(170, 130, 80, 0.09) 2px, transparent 2px),
    radial-gradient(circle at 88% 88%, rgba(155, 115, 65, 0.07) 0%, rgba(155, 115, 65, 0.07) 1.5px, transparent 1.5px),
    radial-gradient(circle at 60% 92%, rgba(165, 125, 75, 0.06) 0%, rgba(165, 125, 75, 0.06) 1px, transparent 1px),
    /* Edge darkening along right and bottom */
    linear-gradient(to left, rgba(160, 130, 80, 0.08) 0%, transparent 15%),
    linear-gradient(to top, rgba(160, 130, 80, 0.06) 0%, transparent 10%),
    /* Original corner aging */
    radial-gradient(ellipse at top right, rgba(180, 150, 100, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(180, 150, 100, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at bottom left, rgba(180, 150, 100, 0.05) 0%, transparent 40%);
  pointer-events: none;
  z-index: 1;
  border-radius: 0 8px 8px 0;
}
```

**Step 6: Page numbers with flanking rules**

Update the HTML for page numbers. In the welcome page (line 917), change:
```html
<span class="page-number">— ii —</span>
```

In the TOC page (line 936), change:
```html
<span class="page-number">— iii —</span>
```

Update `.page-number` CSS (lines 524-534):

```css
.page-number {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Fraunces', serif;
  font-size: 0.75rem;
  color: rgba(58, 42, 26, 0.4);
  z-index: 2;
  pointer-events: none;
  letter-spacing: 0.15em;
}
```

Key change: opacity increased from 0.25 to 0.4.

**Step 7: Gold drop cap**

Update `.welcome-text p .drop-cap` CSS (lines 584-593):

```css
.welcome-text p .drop-cap {
  float: left;
  font-family: 'Fraunces', serif;
  font-style: italic;
  font-size: 3.6rem;
  font-weight: 600;
  color: #d4a853;
  line-height: 0.75;
  padding-right: 0.2rem;
  padding-top: 0.08rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
```

Key changes: gold color (#d4a853 vs #b8862d), italic, heavier weight, larger, subtle shadow.

**Step 8: Verify in browser**

Check each element:
- Double diagonal stitching along spine
- Deeper gutter shadow with visible highlight
- Leaf spray corner ornaments (different from cover's filigree)
- Ribbon with satin sheen and organic drape
- Foxing spots near page edges
- Page numbers with em dashes and increased visibility
- Gold italic drop cap

**Step 9: Commit**

```bash
git add book/index.html
git commit -m "style: polish interior pages — stitching, gutter, fleurons, ribbon, aging, drop cap"
```

---

### Task 6: Desk Environment

**Files:**
- Modify: `book/index.html` (HTML + CSS)

**Goal:** Add reading lamp (upper-right), fountain pen (lower-right), improved book shadow, and lamp-biased vignette.

**Step 1: Add lamp and pen HTML**

Insert after `<div class="book-scene">` opening tag (after line 874), before `.book`:

```html
<!-- Desk environment -->
<div class="desk-lamp" aria-hidden="true">
  <svg viewBox="0 0 120 200" class="lamp-svg">
    <!-- Arm extending from above -->
    <line x1="60" y1="0" x2="60" y2="80" stroke="#8B7355" stroke-width="4" stroke-linecap="round"/>
    <!-- Joint -->
    <circle cx="60" cy="80" r="4" fill="#8B7355"/>
    <!-- Angled lower arm -->
    <line x1="60" y1="80" x2="40" y2="140" stroke="#8B7355" stroke-width="3.5" stroke-linecap="round"/>
    <!-- Shade -->
    <path d="M15,140 L65,140 L58,165 L22,165 Z" fill="#6B5B3D" stroke="#8B7355" stroke-width="1"/>
    <!-- Inner shade glow -->
    <path d="M22,165 L58,165 L55,160 L25,160 Z" fill="rgba(255,220,160,0.3)" stroke="none"/>
    <!-- Bulb glow -->
    <circle cx="40" cy="158" r="6" fill="rgba(255,220,160,0.15)" stroke="none"/>
  </svg>
  <!-- Light cone -->
  <div class="lamp-light-cone"></div>
</div>

<div class="desk-pen" aria-hidden="true">
  <svg viewBox="0 0 120 20" class="pen-svg">
    <!-- Barrel -->
    <rect x="20" y="6" width="80" height="8" rx="2" fill="#2a1f14"/>
    <!-- Gold band -->
    <rect x="90" y="5" width="4" height="10" rx="1" fill="#d4a853" opacity="0.7"/>
    <!-- Gold clip -->
    <rect x="22" y="3" width="30" height="2" rx="1" fill="#d4a853" opacity="0.6"/>
    <!-- Nib -->
    <polygon points="100,8 100,12 115,10" fill="#c4a040"/>
    <!-- Nib slit -->
    <line x1="102" y1="10" x2="113" y2="10" stroke="#2a1f14" stroke-width="0.5"/>
    <!-- Cap -->
    <rect x="0" y="5.5" width="22" height="9" rx="2" fill="#1a120a"/>
    <!-- Cap band -->
    <rect x="18" y="5" width="3" height="10" rx="0.5" fill="#d4a853" opacity="0.5"/>
  </svg>
</div>
```

**Step 2: Lamp and pen CSS**

Add to `<style>`:

```css
/* ===== DESK ENVIRONMENT ===== */

.desk-lamp {
  position: fixed;
  top: -20px;
  right: 8vw;
  z-index: 1;
  pointer-events: none;
}

.lamp-svg {
  width: 100px;
  height: 170px;
}

.lamp-light-cone {
  position: absolute;
  top: 140px;
  left: 50%;
  transform: translateX(-60%);
  width: 350px;
  height: 500px;
  background: radial-gradient(
    ellipse at 50% 0%,
    rgba(255, 220, 160, 0.1) 0%,
    rgba(255, 220, 160, 0.06) 30%,
    rgba(255, 210, 140, 0.03) 50%,
    transparent 70%
  );
  pointer-events: none;
}

.desk-pen {
  position: fixed;
  bottom: 12vh;
  right: 6vw;
  z-index: 1;
  pointer-events: none;
  transform: rotate(-25deg);
}

.pen-svg {
  width: 110px;
  height: 18px;
  filter: drop-shadow(1px 2px 3px rgba(0, 0, 0, 0.15));
}
```

**Step 3: Improved book shadow**

Replace `.book-shadow` CSS (lines 92-103):

```css
.book-shadow {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-55%);
  width: 105%;
  height: 50px;
  background:
    /* Contact shadow — tight and dark */
    radial-gradient(ellipse at 55% 20%, rgba(30, 18, 5, 0.2) 0%, transparent 60%),
    /* Ambient shadow — wide and soft, biased left (away from lamp) */
    radial-gradient(ellipse at 45% 40%, rgba(40, 25, 10, 0.12) 0%, rgba(40, 25, 10, 0.04) 50%, transparent 80%);
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}
```

Key changes: larger, softer, biased left (shadow extends away from lamp on upper-right), contact shadow layer.

**Step 4: Mobile — hide desk props**

Add to the `@media (max-width: 640px)` block (or create a new `@media (max-width: 768px)` block):

```css
@media (max-width: 768px) {
  .desk-lamp,
  .desk-pen {
    display: none;
  }
}
```

**Step 5: Verify in browser**

Check:
- Lamp visible in upper-right with warm light cone spreading onto desk/book
- Pen visible in lower-right, angled, with shadow
- Book shadow is larger and biased away from lamp
- Vignette is lighter near lamp (upper-right), darker in opposite corners
- Mobile: lamp and pen hidden, everything else stays

**Step 6: Commit**

```bash
git add book/index.html
git commit -m "feat: add desk environment — reading lamp, fountain pen, directional shadow"
```

---

### Task 7: Flip Animation Enhancement

**Files:**
- Modify: `js/book-home.js`
- Modify: `book/index.html` (CSS for new shadow elements)

**Goal:** Multi-layer flip shadows, page lift anticipation, settling bounce, spine flex.

**Step 1: Add cast-shadow elements to HTML**

In `book/index.html`, add a cast shadow element inside each flippable page. After the existing `.flip-shadow` div in the cover page (line 901), add:

```html
<div class="flip-cast-shadow"></div>
```

Do the same for the welcome page (after line 926).

**Step 2: Add CSS for new shadow elements**

```css
/* Cast shadow — projected onto page below during flip */
.flip-cast-shadow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  z-index: 4;
  border-radius: 0 8px 8px 0;
}

/* Self-shadow on turning page front face */
.page-front .flip-self-shadow {
  position: absolute;
  top: 0;
  right: 0;
  width: 30%;
  height: 100%;
  background: linear-gradient(to left, rgba(0,0,0,0.15), transparent);
  opacity: 0;
  pointer-events: none;
  z-index: 6;
}

/* Light catch on page back face */
.page-back .flip-light-catch {
  position: absolute;
  top: 0;
  left: 0;
  width: 25%;
  height: 100%;
  background: linear-gradient(to right, rgba(255,250,240,0.2), transparent);
  opacity: 0;
  pointer-events: none;
  z-index: 6;
}
```

Also add the self-shadow and light-catch divs to the HTML inside each page's `.page-front` and `.page-back`.

**Step 3: Rewrite setupPageFlips() in book-home.js**

Replace the existing `setupPageFlips()` function (lines 68-94) with enhanced version:

```js
function setupPageFlips() {
  const pages = document.querySelectorAll('.page');
  const flipSections = document.querySelectorAll('.scroll-spacer[data-section^="flip"]');
  const spine = document.querySelector('.book');

  flipSections.forEach((section, i) => {
    const page = pages[i];
    if (!page || !section) return;

    const flipShadow = page.querySelector('.flip-shadow');
    const castShadow = page.querySelector('.flip-cast-shadow');
    const selfShadow = page.querySelector('.page-front .flip-self-shadow');
    const lightCatch = page.querySelector('.page-back .flip-light-catch');

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      scrub: 0.1,
      onUpdate: (self) => {
        const p = self.progress;

        // --- Page lift anticipation (0-5%) ---
        let angle, liftZ;
        if (p < 0.05) {
          const liftProgress = p / 0.05;
          angle = liftProgress * -3;
          liftZ = liftProgress * 10;
        }
        // --- Main rotation (5-95%) ---
        else if (p < 0.95) {
          const flipProgress = (p - 0.05) / 0.9;
          angle = -3 + (flipProgress * -177);
          liftZ = 10 * (1 - flipProgress);
        }
        // --- Settling bounce (95-100%) ---
        else {
          const settleProgress = (p - 0.95) / 0.05;
          // Overshoot to -182 then settle to -180
          angle = -180 - (Math.sin(settleProgress * Math.PI) * 2);
          liftZ = 0;
        }

        gsap.set(page, { rotateY: angle, translateZ: liftZ });

        // --- Flip shadow (original — overall darkening) ---
        if (flipShadow) {
          const shadowOpacity = Math.sin(p * Math.PI) * 0.15;
          gsap.set(flipShadow, { opacity: shadowOpacity });
        }

        // --- Cast shadow on page below ---
        if (castShadow) {
          const castProgress = Math.sin(p * Math.PI);
          const castX = p * 100;
          gsap.set(castShadow, {
            opacity: castProgress * 0.2,
            background: `linear-gradient(to right, transparent ${castX - 10}%, rgba(0,0,0,0.15) ${castX}%, transparent ${castX + 15}%)`
          });
        }

        // --- Self-shadow on front face (darkens right edge as page rotates) ---
        if (selfShadow) {
          const selfOpacity = p < 0.5 ? p * 1.6 : (1 - p) * 0.5;
          gsap.set(selfShadow, { opacity: Math.max(0, selfOpacity) });
        }

        // --- Light catch on back face (visible after 90deg) ---
        if (lightCatch) {
          const catchOpacity = p > 0.5 ? (p - 0.5) * 2 * 0.4 : 0;
          gsap.set(lightCatch, { opacity: Math.min(0.4, catchOpacity) * (1 - ((p - 0.5) * 2 * 0.5)) });
        }

        // --- Spine flex ---
        if (spine) {
          const spineWidth = 18 + Math.sin(p * Math.PI) * 2;
          const spineEl = spine.querySelector('::before');
          // Can't directly query pseudo-elements, use CSS custom property instead
          spine.style.setProperty('--spine-width', spineWidth + 'px');
        }
      },
    });
  });
}
```

**Step 4: Update spine CSS to use custom property**

Update `.book::before` (lines 114-125):

```css
.book::before {
  content: '';
  position: absolute;
  top: 0;
  left: calc(-1 * var(--spine-width, 18px));
  width: var(--spine-width, 18px);
  height: 100%;
  background: linear-gradient(to right, #152d4a, #1a3355);
  border-radius: 4px 0 0 4px;
  z-index: 10;
  box-shadow: -3px 0 10px rgba(0, 0, 0, 0.2), inset 1px 0 2px rgba(255, 255, 255, 0.05);
  transition: width 0.05s linear, left 0.05s linear;
}
```

Similarly update `.book::after` gold accent line to use `calc(-1 * var(--spine-width, 18px) + 7px)` for left position.

**Step 5: Verify in browser**

Check during a page flip:
- Page should lift slightly before rotating
- Cast shadow should sweep across the page below
- Front face should darken at right edge as it turns
- Back face should catch light on left edge as it becomes visible
- Page should overshoot slightly at the end and settle
- Spine should pulse slightly wider during mid-flip
- All effects should be subtle and not distracting

**Step 6: Evaluate and dial back if needed**

Each effect can be independently tuned by adjusting opacity multipliers, or disabled by removing the relevant `gsap.set()` call. If any effect feels excessive:
- Reduce the multiplier (e.g., change `* 0.2` to `* 0.1`)
- Or remove the effect entirely

**Step 7: Commit**

```bash
git add book/index.html js/book-home.js
git commit -m "feat: enhanced flip animation — multi-layer shadows, lift, settle, spine flex"
```

---

### Task 8: Final Polish and Mobile Verification

**Files:**
- Modify: `book/index.html` (CSS mobile breakpoints)

**Goal:** Ensure mobile responsive behavior is correct and all pieces work together.

**Step 1: Update mobile breakpoint**

Expand the `@media (max-width: 640px)` block to ensure all new elements respond correctly. Also verify the `@media (max-width: 768px)` block from Task 6 covers desk props.

Check that:
- Book sizing stays at `95vw / 85vh` on mobile
- Spine narrows to 14px on mobile (already exists)
- Desk lamp and pen are hidden
- Light cone gradient can optionally stay (it's just ambient warmth)
- Cover filigree corners are still visible (they're 36px, should be fine)
- Interior fleurons are still visible at 20px
- Ribbon bookmark is still visible
- TOC chapters still have min 44px touch targets

**Step 2: Test at multiple viewports**

Run: `npm run dev`

Test at:
- Desktop (1920x1080) — full scene with lamp, pen, vignette
- Tablet (768x1024) — lamp/pen hidden, book fills more of screen
- Mobile (375x812, iPhone) — book nearly full width, all decorations visible
- Mobile landscape (812x375) — book should still be usable

**Step 3: Performance check**

Open DevTools Performance tab. Scroll through all pages. Check:
- No layout thrashing (transforms only, no width/height changes except spine)
- Textures are loaded and cached
- Flip animation stays at 60fps
- No excessive paint areas

**Step 4: Commit**

```bash
git add book/index.html
git commit -m "style: mobile responsive polish and viewport testing"
```

---

## Summary

| Task | Description | Files | Estimated effort |
|------|-------------|-------|-----------------|
| 1 | Scroll system overhaul | book/index.html, js/book-home.js | Small |
| 2 | Source texture images | assets/textures/ | Medium |
| 3 | Apply textures to surfaces | book/index.html | Small |
| 4 | Cover design enhancement | book/index.html | Medium |
| 5 | Interior page polish | book/index.html | Medium |
| 6 | Desk environment | book/index.html | Medium |
| 7 | Flip animation enhancement | book/index.html, js/book-home.js | Medium |
| 8 | Mobile polish & verification | book/index.html | Small |

**Dependencies:** Task 1 should be done first (foundation). Task 2 must complete before Task 3. Tasks 4-7 are independent of each other and can be done in any order. Task 8 should be last.
