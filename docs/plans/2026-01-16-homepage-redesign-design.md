# Homepage Redesign Design Document

**Date:** 2026-01-16
**Status:** Approved for implementation
**Scope:** Homepage (index.html) — flagship page for site-wide redesign

---

## Overview

A complete visual overhaul of the Gift Site homepage, transforming it into an immersive, cinematic scroll experience while preserving all existing content. The redesign prioritizes differentiation and modernization with a sophisticated blue color palette and bold interactive elements.

### Design Goals

- **Differentiation** — Stand out from competitors in the therapy-adjacent space
- **Modernization** — Cutting-edge feel inspired by sites like thisismagma.com and lusion.co
- **Balance** — Bold, modern presentation paired with warm, therapeutic undertones
- **Maintainability** — Client-friendly handoff on GitHub Pages

---

## Technical Stack

| Technology | Purpose |
|------------|---------|
| **GSAP 3.x** | Core animations, scroll-triggered reveals, text splits |
| **ScrollTrigger** | Scroll-driven animation timing and scrubbing |
| **Lenis** | Smooth scroll behavior |
| **Three.js** | Ambient WebGL background elements |
| **GitHub Pages** | Hosting (unchanged) |

### Architecture

- Pure HTML/CSS/JavaScript (no build process)
- Three.js canvas runs as persistent background layer
- GSAP handles all content animations
- Existing content preserved — visual redesign only

---

## Color Palette

**Option C: Dark Royal Blue + Soft Warmth**

| Name | Hex | Usage |
|------|-----|-------|
| Royal Blue | `#1a2a4a` | Primary background, cards |
| Deep Navy | `#0d1929` | Darker sections, depth |
| Midnight | `#060d18` | Deepest backgrounds |
| Blush | `#e8c4b8` | Primary accent, CTAs, highlights |
| Cream | `#f0ebe3` | Secondary accent, softer elements |
| Off-white | `#faf8f5` | Primary text |
| Soft Gray | `#b8c4d4` | Secondary text, muted elements |

### Rationale

Dark royal blue provides the bold, modern foundation the client wants. Blush and cream accents add human warmth appropriate for therapy-adjacent content without softening the overall impact.

---

## Typography

Unchanged from current site:

- **Display:** Fraunces (serif) — headings, large statements, quotes
- **Body:** Outfit (sans-serif) — body text, UI elements, navigation

---

## Ambient WebGL Layer

A persistent Three.js canvas behind all content creates atmosphere throughout the experience.

### Elements

1. **Gradient Mesh**
   - Slowly morphing color blobs
   - Royal blue base with blush "glow" regions
   - Colors shift subtly based on scroll position
   - Intensity varies by section (brighter in hero, dimmer in content-heavy sections)

2. **Particle Field**
   - Sparse white/blush dots floating upward
   - Varying sizes for depth perception
   - Responds to scroll (faster movement when scrolling)
   - Sparser during "quiet" sections (quote)

### Interaction

- Subtle parallax response to mouse movement
- Scroll position influences color warmth and particle behavior
- Performance-optimized: reduced complexity on mobile/low-power devices

---

## Homepage Structure

Six full-viewport sections with snap-scroll behavior:

1. Hero
2. The Problem / Why
3. The Process Preview
4. Quote / Emotional Pause
5. Who It's For
6. CTA (Closing)

---

## Section Designs

### 1. Hero

**Layout:** Full viewport, content centered vertically and horizontally

**Elements (animation order):**
1. Section tag — `— WELCOME —` in blush, fades in first
2. Main headline — Fraunces serif, character-split animation (rotateX + stagger)
   - Key word ("gift") in blush accent, italicized
3. Subtitle — Outfit sans-serif, fades up after headline
4. Primary CTA button — pill-shaped, magnetic hover effect
5. Scroll indicator — bottom center, animated line, fades on scroll

**Background:**
- Gradient mesh most visible here
- Deep royal blue center bleeding to near-black edges
- Soft blush glow regions drifting slowly
- Particles: sparse, soft white/blush, floating upward

**Interactions:**
- Mouse parallax: headline shifts opposite to cursor
- Scroll: content fades up/out, mesh colors shift toward next section

---

### 2. The Problem / Why

**Layout:** Full viewport, two scroll-driven phases

**Phase 1: The Problem**
- Dark, muted background (mesh dims)
- Text reveals word-by-word or line-by-line on scroll
- Content from existing why.html — the tension/problem statements
- Particles slow, feel heavier

**Phase 2: The Shift**
- Background warms (mesh introduces blush tones)
- Previous text fades, hopeful resolution text emerges
- Particles lift, movement feels lighter
- Subtle glow builds behind final statement

**Animation:**
- Scrub-based (user controls pacing via scroll)
- Each line triggers at specific scroll points
- Smooth gradient transition between phases

---

### 3. The Process Preview

**Layout:** Full viewport, horizontal three-column grid (stacked on mobile)

**Structure:**
- Section tag: `— THE PROCESS —`
- Headline from existing content
- Three cards: Discover / Reflect / Give

**Card Design:**
- Semi-transparent royal blue with blur backdrop
- Thin blush border
- Large Fraunces number (watermark style, low opacity)
- Title + 1-2 line description

**Animation:**
1. Header fades in with Y-translate
2. Vertical progress line draws top-to-bottom
3. Cards enter staggered (0.2s delay):
   - Number scales from 0
   - Title fades in
   - Description fades in last
4. Hover: lift + border glow

**CTA:** "Explore the full process →" links to process.html

---

### 4. Quote / Emotional Pause

**Layout:** Full viewport, centered, maximum whitespace

**Elements:**
- Decorative quotation mark (oversized, very low opacity, blush tint)
- Quote text: large Fraunces italic
- Attribution below (if applicable)
- Content from existing site

**Animation:**
- Background mesh shifts warmer (more blush)
- Quote scales 0.9 → 1.0 + fade
- Key word underline draws itself after text appears
- Particles become sparser (visual quiet)

**Visual:**
- Slightly lighter background than other sections
- One emphasized word in blush accent
- Text floats in generous negative space

---

### 5. Who It's For

**Layout:** Full viewport, header + card grid

**Structure:**
- Section tag: `— WHO IT'S FOR —`
- Headline from existing audiences.html
- Grid of audience segment cards

**Card Design:**
- Semi-transparent with blur backdrop
- Optional abstract icon/shape
- Audience label + 1-2 line description
- Hover: lift + blush border glow + subtle scale (1.02)

**Animation:**
1. Header enters (fade + Y-translate)
2. Cards enter staggered with organic feel:
   - Start slightly scattered (random rotation + offset)
   - Settle into grid alignment on scroll
3. Parallax: 2-3 soft circular shapes drift behind cards

**CTA:** "Learn more about who this is for →" links to audiences.html

---

### 6. CTA (Closing)

**Layout:** Full viewport, centered, destination feel

**Structure:**
- Headline: direct, action-oriented (from existing copy)
- Subtitle: one supporting line
- Primary CTA button (prominent)
- Optional secondary link

**Visual:**
- Background gradient deepens
- Blush glow concentrates behind CTA button
- Mesh movement slows (arrival feel)
- Particles drift inward toward center

**Animation:**
1. Headline: character-split animation (simpler than hero)
2. Subtitle fades up
3. Button scales in with elastic bounce
4. Background glow pulses subtly

**Button:**
- Larger than other page buttons
- Blush/cream background, royal blue text
- Magnetic hover effect
- Hover: color inversion + glow intensifies

---

## Navigation

- Fixed top position
- Minimal: logo + 4-5 links
- Glassmorphic background (blur + transparency)
- Fades to near-transparent during immersive sections
- Becomes more visible on scroll-up or when needed
- Blush accent on hover states

---

## Responsive Considerations

- Full-screen sections maintained on tablet
- Mobile: sections become scrollable (no snap), animations simplified
- Three.js complexity reduced on mobile/low-power devices
- Card grids stack to single column
- Navigation collapses to hamburger menu
- Touch-friendly: magnetic effects disabled, tap targets enlarged

---

## Performance Targets

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Three.js lazy-loaded after critical content
- Particle count reduced based on device capability
- Intersection Observer for animation triggers (not continuous)
- RequestAnimationFrame throttling on scroll

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `index.html` | Complete redesign |
| `css/main.css` | New shared styles (extract from inline) |
| `js/ambient.js` | Three.js gradient mesh + particles |
| `js/animations.js` | GSAP animation sequences |
| Other pages | Apply consistent nav/footer styling (later phase) |

---

## Implementation Phases

### Phase 1: Foundation
- Set up new color palette as CSS variables
- Implement Three.js ambient background (hero only)
- Build hero section with animations

### Phase 2: Core Sections
- Problem/Why section with scroll-driven text
- Process preview with card animations
- Quote section

### Phase 3: Completion
- Who It's For section
- CTA section
- Navigation refinements
- Responsive adjustments

### Phase 4: Polish
- Performance optimization
- Cross-browser testing
- Mobile experience refinement
- Accessibility review

---

## Open Questions

1. **Exact content mapping** — Need to pull specific text from current pages for each section
2. **Quote selection** — Which quote from existing content for the pause section?
3. **Audience segments** — How many cards needed based on current audiences.html?
4. **Secondary pages** — Apply same visual treatment after homepage approval?

---

## Reference Sites

- [thisismagma.com](https://thisismagma.com) — WebGL immersion, scroll-driven narrative
- [lusion.co](https://lusion.co) — Ambient particles, sophisticated interactions

---

## Approval

- [x] Overall structure
- [x] Hero section
- [x] Problem/Why section
- [x] Process preview section
- [x] Quote section
- [x] Who It's For section
- [x] CTA section

**Ready for implementation.**
