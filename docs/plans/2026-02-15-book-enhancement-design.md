# Book Template Enhancement Design — "Refined Craft"

**Date:** 2026-02-15
**Status:** Design approved
**Branch:** TBD (will branch from main)

## Overview

Enhance the Golden Book template to address three issues: jerky/mechanical scroll feel, flat/placeholder visual quality, and lack of environmental atmosphere. The approach focuses on maximum visual improvement within the existing HTML/CSS/GSAP architecture, using real image textures where CSS falls short and adding a desk environment with a reading lamp.

**Design principle:** This architecture is forward-compatible. All enhancements layer on the existing structure, and the scroll/rendering separation allows future upgrades (canvas page curl, Three.js scene) without redesign.

## 1. Scroll System Overhaul

### Problem
The current system hijacks every wheel, touch, and keyboard event with `e.preventDefault()`, then drives GSAP animations to snap points. This fights the browser's native scroll physics — trackpad momentum gets swallowed, there's perceptible input delay, and the 2s `slow` ease is the same duration regardless of scroll velocity.

### Solution
Replace all JS scroll hijacking with native CSS scroll snapping:

```css
html {
  scroll-snap-type: y mandatory;
}

.scroll-spacer[data-section="cover"],
.scroll-spacer[data-section="welcome"],
.scroll-spacer[data-section="toc"] {
  scroll-snap-align: start;
}
```

The browser handles momentum, deceleration, and snapping natively. ScrollTrigger still drives page flips — flip spacers sit between snap points, and ScrollTrigger scrubs `rotateY` as the browser scrolls through them.

### What gets deleted
- All wheel/touch/keyboard event handlers
- `navigateToPage()`, `setupPaginatedScroll()`
- `isAnimating`, `currentPage`, `snapPoints` state

### What stays unchanged
- ScrollTrigger-driven page flips
- Cover entrance animation
- Welcome text and TOC chapter reveals

## 2. Image Textures

Three real textures replace CSS-gradient-only surfaces. Total budget: ~150-200KB.

### Desk surface (~80-120KB)
- Warm oak/walnut desk photo, large enough to cover viewport without tiling
- Slightly desaturated, warm-shifted to match existing `#b8956a` palette
- Applied as `position: fixed` background, replacing the CSS grain gradients
- CSS vignette overlay still applies on top

### Book cover (~30-50KB)
- Dark blue leather or bookcloth grain, tileable (256x256 or 512x512)
- Tinted to match sapphire `#1e3a5f` palette
- Applied as semi-transparent overlay on the existing base gradient (color stays controlled)
- Replaces the invisible CSS damask patterns (opacity 0.008-0.012)

### Interior pages (~20-40KB)
- Cream parchment with visible paper fibers, tileable
- Applied at low opacity (~0.3-0.5) over the cream base color
- Existing aged-edge gradients stay and compound with the texture
- Must not compete with text readability

## 3. Cover Design Enhancement

### Title — embossed gold foil
- Multi-layered text-shadow: inset dark shadow (debossed channel), gold highlight offset 1px up (raised foil), warm outer glow (ambient reflection)
- Slow shimmer animation (8-10s CSS cycle) shifting highlight angle — simulates light moving across foil under the reading lamp. Subtle, not flashy.

### Corner ornaments — SVG filigree
- Replace the current 3-arc quarter-circles with intricate scrollwork filigree — curling leaves/vines typical of gilt book decoration
- Monochrome gold strokes, sized ~36px as today
- Should feel like a leather-bound edition, not geometric shapes

### Frame enhancement
- Outer rule: 2px (up from 1.5px), higher gold opacity
- Corner junction diamonds: slightly larger, more ornate
- Inner rule: dotted or dashed pattern instead of solid (bookbinding detail)

### Emblem — compass rose
- Replace the generic compass (circles + lines) with a detailed compass rose SVG
- Ties to the "journey of discovery" theme
- Same position and size (~32px) above the title

### Tagline
- Text-transform: uppercase, smaller font, letter-spacing widened to 0.2em
- Color shifts from light blue to soft gold (matches the metallic palette)
- Creates an engraved, small-caps feel

## 4. Interior Page Polish

### Stitching
- Two parallel stitch lines (double-stitched signatures)
- Diagonal marks instead of straight dashes (thread crosses at angle)
- Slightly varied opacity to break mechanical repetition
- Waxed linen thread tone (warmer, more golden than current brown)

### Binding shadow / gutter
- Wider gradient (30px → 50px) with non-linear falloff
- Curved shadow suggesting page concavity into the binding
- Faint vertical highlight at ~15px from spine (where page flattens)

### Corner ornaments
- Replace with small fleurons or leaf sprays (different from cover's bold filigree)
- Lighter, more delicate — appropriate for interior pages

### Ribbon bookmark
- Satin sheen: vertical highlight gradient simulating fabric catching light
- More organic drape at bottom via refined clip-path
- Color stays deep burgundy/crimson

### Aged edges
- 3-5 foxing spots (tiny semi-transparent brown dots near edges)
- Edge darkening along right side and bottom
- Compounds with parchment texture from Section 2

### Page numbers
- Thin horizontal rules flanking the number (`— ii —`)
- Slightly increased opacity for readability

### Drop cap
- Larger, Fraunces italic at heavier weight
- Gold color instead of brown (ties to accent system)
- Faint decorative outline/box behind the letter

## 5. Desk Environment

### Reading lamp (upper-right, fixed position)
- CSS/SVG brass/bronze arm extending from above viewport edge
- Only shade and lower arm visible (as if clamped above frame)
- Warm conical light gradient: `radial-gradient` or `conic-gradient`, warm amber (`rgba(255, 220, 160, 0.08-0.15)`)
- Fixed position, stays in place during page flips
- Subtle ambient glow, not a spotlight

### Desk props
- **Fountain pen** — angled in lower-right, dark barrel with gold clip/nib, simple SVG (~30-40px wide), tiny desk shadow
- Start with pen only; add reading glasses or bookmark later if scene feels sparse

### Book shadow
- Larger, softer spread than current 40px ellipse
- Directional bias: shadow extends further on the side opposite the lamp (left side)
- Contact shadow: tighter, darker at book base, fading into softer ambient shadow

### Vignette adjustment
- Stronger in corners opposite the lamp (natural light falloff)
- Creates sense that the lamp is actually illuminating the scene

### Mobile behavior
- Lamp SVG and fountain pen: hidden below ~768px
- Light cone gradient stays as ambient warmth
- Wood texture and vignette stay at all sizes
- Book gets full visual quality (textures, cover, interior, flips)

## 6. Flip Animation Quality

All effects are CSS gradients driven by ScrollTrigger progress. No canvas/WebGL. These are evaluatable — dial back anything excessive after implementation.

### Shadow dynamics
Three shadow layers replacing the current single sine-wave overlay:
1. **Cast shadow on page below** — moves across the lower page tracking the turning page's position. Absent at 0%, thin dark line near spine at 50%, swept to right edge by 90%.
2. **Self-shadow on turning page** — gradient along front face's right edge, darkening as page rotates, peaking at 60-90 degrees.
3. **Light catch on page back** — bright highlight on back face's left edge when it becomes visible past 90 degrees, fading as page settles.

### Page lift anticipation
- At progress 0-5%: subtle `translateZ(10px)` and `rotateY(-3deg)`
- Book shadow on desk expands slightly during lift
- Mimics real page lifting at edge before turning

### Settling bounce
- At progress 95-100%: page overshoots -180deg by 1-2 degrees then settles back
- Suggests page landing with weight

### Spine flex
- During flip: spine `::before` width pulses by 1-2px
- Suggests binding flexing as page turns

## 7. Asset Summary

| Asset | Type | Est. Size | Source |
|-------|------|-----------|--------|
| Wood desk texture | JPEG | 80-120KB | Free texture resource or procedural |
| Leather cover texture | JPEG/WebP tile | 30-50KB | Free texture resource or procedural |
| Parchment page texture | JPEG/WebP tile | 20-40KB | Free texture resource or procedural |
| Compass rose SVG | Inline SVG | <1KB | Hand-drawn |
| Filigree corner SVGs | Inline SVG | <1KB each | Hand-drawn |
| Fleuron corner SVGs | Inline SVG | <1KB each | Hand-drawn |
| Fountain pen SVG | Inline SVG | <1KB | Hand-drawn |
| Reading lamp SVG | Inline SVG | <1KB | Hand-drawn |

**Total new asset weight:** ~150-220KB (images) + ~5KB (SVGs)

## Files Modified

| File | Changes |
|------|---------|
| `book/index.html` | New SVGs (filigree, compass rose, fleurons, lamp, pen), updated CSS (scroll-snap, textures, cover styles, interior styles, desk environment, flip shadows, mobile breakpoints) |
| `js/book-home.js` | Remove paginated scroll system, enhance flip shadow logic, add page lift/settle/spine flex animations |
| `assets/` | 3 new texture images |
