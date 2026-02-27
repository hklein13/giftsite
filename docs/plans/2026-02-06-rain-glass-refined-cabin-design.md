# Rain Glass — Refined Cabin Window Redesign

**Date:** 2026-02-06
**Branch:** `feature/homepage-concepts`
**Files affected:** `concepts/rain-glass.html` (CSS + markup), plus one texture asset

## Goal

Elevate the Rain Glass concept from "rudimentary rectangles" to a polished, refined lodge window. The cabin framing should feel warm, sophisticated, and hopeful — not dark or dim. The window is something you peer *through*, not *at*.

## Design Decisions

| Decision | Current | New |
|----------|---------|-----|
| Window width | 65vw (max 900px) | **40vw** (max ~700px) |
| Aspect ratio | 16/10 (3/2 on mobile) | **16/9 at all sizes** |
| Muntins | None | **Simple cross (4 panes)** |
| Wood tones | Honey/tan #D4B484 | **Warm cedar #A07850–#8B6540** |
| Wall treatment | Flat beige CSS gradient | **Wood plank texture image** |
| Cabin style | Flat, minimal | **Refined Scandinavian lodge** |

## 1. Window & Composition

### Size & Ratio
- **40vw** width, **16/9** aspect ratio (distinctly landscape, panoramic feel)
- Max-width: 700px
- Responsive breakpoints:
  - Default: 40vw
  - ≤900px: 55vw
  - ≤600px: 75vw
  - Always 16/9 (no portrait flip)

### Muntins (4-Pane Cross)
- One horizontal + one vertical CSS bar crossing at center
- Same wood material/gradient as outer beams, ~20px wide (desktop)
- Sits above canvas (z-index 5), below the depth overlay
- Subtle shadow on each side (implies sitting on the glass surface)
- Scale down at breakpoints: 16px at 900px, 12px at 600px

### Outer Beams (Frame)
- **Thicker:** 60px desktop (was 50px) — real frame presence at smaller window
- **Bottom beam (sill):** 80px — implies a real window sill ledge
  - Top-face highlight gradient (lighter strip along top edge)
- Cedar tones: linear-gradient #A07850 → #966E48 → #8B6540
- Grain lines: keep 4px spacing, bump opacity to 0.07
- Keep top/left highlight edges (light from upper-left, matches background sun)

### Corner Joinery (FIX)
Current problem: beams are just overlapping rectangles — corners look sloppy.

**Solution:** Horizontal beams are the "through" pieces (extend the full width including corners). Vertical beams are "stopped" (fit between top and bottom beams, don't extend into corner zones). This creates clean butt joints:
- `.beam-h` (top/bottom): `left: -30px; right: -30px` (extends past vertical beam width)
- `.beam-v` (left/right): `top: 30px; bottom: 40px` (starts below top beam, ends above bottom beam, accounting for sill being taller)
- Top beam sits at z-index 6 (above verticals)
- Bottom beam (sill) sits at z-index 6 (above verticals)
- Verticals at z-index 5

This gives clean, flush L-shaped corners where horizontal beams clearly wrap around.

### Window Depth
- Stronger inset shadow: `inset 0 0 40px rgba(0,0,0,0.30), inset 0 0 12px rgba(0,0,0,0.20)`
- Sells the recessed-into-the-wall illusion at the smaller window size

## 2. Wall Treatment

### Texture Image (not CSS gradients)
- Source: CC0 wood plank texture from Polyhaven or similar
  - Fallback: procedurally generate on canvas at runtime (pattern already established in codebase)
- Requirements: warm cedar/walnut tone, horizontal planks, seamlessly tileable
- Applied as `background-image` on `.cabin` element, with `background-size` tuned to show ~6-8 planks visible vertically
- Color-adjusted via CSS if needed: `background-blend-mode` with a warm overlay color

### Ambient Window Glow
- Faint cream/gold radial gradient centered on the window position
- `rgba(255, 245, 220, 0.06)` — barely there, just implies light spilling onto wall
- Applied as a layered background or pseudo-element on `.cabin`

## 3. Polish Details

### Wall-to-Beam Shadow
- Beams cast soft shadow onto the wall surface
- Achieved via `box-shadow` on beams: `0 3px 10px rgba(0,0,0,0.25)`
- Creates depth between frame and wall (frame sits proud of wall)

### Typography Contrast
- Title color may need to lighten slightly if wall darkens significantly
- Test #5A4A38 against new wall — if contrast drops below 4.5:1, adjust
- Subtitle may need opacity bump from 0.6 → 0.7

### What Does NOT Change
- All JS/Three.js/shader code (rain-glass.js untouched)
- Rain drop behavior, background scene, chromatic aberration
- Touch interaction, entrance animation
- Post-processing (bloom + noise)
- Font choices, overall layout structure (title → window → subtitle)

## 4. Responsive Behavior

| Breakpoint | Window Width | Beam Size | Sill Size | Muntin Size |
|-----------|-------------|-----------|-----------|-------------|
| Default   | 40vw        | 60px      | 80px      | 20px        |
| ≤900px    | 55vw        | 48px      | 64px      | 16px        |
| ≤600px    | 75vw        | 34px      | 46px      | 12px        |

Aspect ratio: always 16/9. No portrait mode.

## 5. Implementation Plan

1. Source/create wood plank texture, add to `assets/` or `textures/`
2. Rewrite `.cabin` background to use texture image
3. Update beam colors, sizes, and corner joinery in CSS
4. Add muntin markup (2 divs: `.muntin-h`, `.muntin-v`) and CSS
5. Update window-wrapper sizing (40vw, 16/9, new max-width)
6. Add sill styling (thicker bottom beam with highlight)
7. Add ambient glow pseudo-element
8. Update responsive breakpoints
9. Verify typography contrast against new wall
10. Visual review at all 3 breakpoints
