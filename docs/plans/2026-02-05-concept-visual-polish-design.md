# Concept Demo Visual Polish — Design Document

**Date:** 2026-02-05
**Scope:** Rain Glass + Cloud Ascent visual/shader polish
**Goal:** Elevate both scenes from tech demos to welcoming, happy, positively-oriented experiences ready for client presentation.

---

## Shared Upgrades (Both Scenes)

### S1. Switch to pmndrs postprocessing
Replace Three.js built-in EffectComposer with `postprocessing` (pmndrs). Benefits:
- Fewer full-screen passes (combines effects into single pass)
- Better bloom quality
- Built-in tone mapping, vignette, noise effects
- Net performance improvement

### S2. ACES Filmic Tone Mapping
Enable `ACESFilmicToneMapping` on the renderer. Gives a warmer, more cinematic look with better highlight rolloff. Zero additional cost.

### S3. Entrance Animation
Both scenes fade in over 1.5-2 seconds. Prevents the jarring "pop in" when WebGL initializes.
- Rain Glass: drops appear gradually, background fades from soft white
- Cloud Ascent: starts in denser fog, light breakthrough intensifies as clouds thin

---

## Rain Glass — Visual Polish

### Current State
- 472 lines, fullscreen fragment shader
- 5 drop layers (3 trailing, 2 stationary) with refraction
- Procedural noise background (6 noise samples per pixel per frame)
- Touch ripple interaction
- Bug: drops move bottom-to-top (inverted)

### R1. Fix Drop Direction
Negate the time term in `trailingDropLayer` so drops fall top-to-bottom.
- `float dropY = fract(-t * speed * timeScale * anim + phase);`
- Zero performance cost

### R2. Render-to-Texture Background
Replace the per-frame procedural background with a pre-rendered texture:
1. At init, render the background scene to an offscreen `WebGLRenderTarget`
2. Apply a blur pass to simulate out-of-focus view through window
3. Use the resulting texture in the rain shader (single texture lookup vs. 6 noise calls)
4. Update the texture slowly (every few seconds) for subtle animation

Background content — a warm, inviting, out-of-focus outdoor scene:
- Clear horizon line at ~40% height
- Bright warm sky above with soft cloud shapes
- Green foliage below with scattered golden sunlight patches
- Warm ambient glow from upper area
- Rainbow arc in the mid-to-lower sky (opposite the light source)

**Performance: net win** — texture lookup replaces 6 per-pixel noise calls per frame.

### R3. Rainbow
A subtle, atmospheric rainbow arc in the background behind the glass:
- Positioned in mid-to-lower portion (opposite the warm light source in upper sky)
- Soft spectral colors with natural falloff — not a hard stripe
- Partially obscured by foliage shapes
- Rendered into the background texture, so it refracts naturally through drops
- Key: subtlety. It should be discovered, not shouted.

### R4. Stop-Start Drop Physics
Add the signature rain-on-glass behavior:
- Drops pause briefly at random intervals, then slide with gentle acceleration
- Slight horizontal wobble during descent
- Variable speed: some drops fast, some slow, some nearly stationary
- Implementation: replace linear `fract(t * speed)` with a stepped easing function using the hash-based randomness already in place

### R5. Improved Refraction Model
Make drops act as real lenses:
- Stronger distortion at drop edges, subtle magnification at center
- Implementation: replace linear `toD * drop * 0.75` with a curved falloff based on distance from center
- Chromatic aberration: sample R, G, B channels at slightly different UV offsets through drops. Creates subtle rainbow fringing at drop edges — physically accurate and beautiful.
- Cost: 3 texture lookups per drop pixel instead of 1, but since background is now a texture (R2), this is 3 texture lookups vs. the old 6 noise calls. Net improvement.

### R6. Warm Condensation Layer
A very subtle noise-based opacity layer across the entire glass surface:
- Slightly softens/warms the background everywhere
- Thicker at edges, thinner at center (like real window condensation)
- Warm tint (slight amber/cream)
- Low opacity (0.03-0.06) — atmosphere, not obstruction
- One additional noise sample per pixel

### R7. Warmer Color Temperature
- Shift vignette from neutral gray to warm amber
- Background scene emphasizes golden/warm tones
- Overall palette: cozy, inviting, like watching rain from a warm café

---

## Cloud Ascent — Visual Polish

### Current State
- 583 lines
- 3 cloud layers at different Z depths with FBM noise
- Gold edge-lighting on cloud boundaries
- 80 moisture particles (barely visible)
- Mouse/gyro parallax
- Light breakthrough is a faint radial gradient (0.13 mix)
- Touch ripple distortion

### C1. God Rays
Warm golden light shafts radiating from upper-center through cloud gaps:
- Soft, diffused — morning sunlight through clouds, not theatrical
- Implementation: radial blur pass sampling toward the light source, applied additively
- Rays shift and animate as clouds drift and reshape
- With pmndrs postprocessing: use built-in GodRays effect if available, otherwise custom ShaderPass with radial sampling
- Color: warm gold (#E8C878 to #FFF5E0), not white

### C2. Cloud Presence and Shape
Make clouds feel substantial but soft and pillowy:
- Increase middle layer opacity: 0.22 → 0.40
- Add 2 more cloud layers (5 total) for depth
- Increase FBM octaves from 3 to 5 for more complex, billow-like edges
- Add domain warping: feed FBM output back into the coordinate for the next layer, creating more organic, cumulus-like shapes
- Overall feel: clouds you could sink into, not fog patches

### C3. Stronger Light Breakthrough
The emotional anchor of the scene:
- Increase mix factor from 0.13 to 0.30-0.40
- Expand radius for a larger warm glow
- Add subtle pulse/breathing (0.3-0.5 Hz) that feels organic
- Color: warm white-gold, brighter than current
- Clouds nearest the light source should have stronger gold edge-lighting

### C4. More Visible Particles
Luminous mist catching the light:
- Increase count: 80 → 200
- Tighten volume: 60x40x40 → 40x25x25 (more concentrated near camera)
- Increase opacity: 0.08-0.25 → 0.12-0.35
- Particles near light source should glow warmer (gold tint based on Y position)
- Slight upward drift to reinforce "ascent" feeling

### C5. Warm Color Progression
Shift palette toward warmth near the light:
- Keep the cool blue at bottom/edges
- Transition to warm gold near the light source
- Creates a natural "blue morning → golden breakthrough" gradient
- Background colors shift: pale blue base → warm white-gold near light center

### C6. Entrance Animation
"Emerging into clarity" over 2-3 seconds:
- Start with clouds at higher opacity (denser fog)
- Light breakthrough starts dim, intensifies
- Particles fade in
- Cloud opacity eases down to final values
- Implementation: a `introProgress` uniform (0→1) that scales cloud opacity, light intensity, particle alpha

---

## Implementation Order

Phase 1 — Shared infrastructure:
1. Install pmndrs `postprocessing` package
2. Set up ACES tone mapping on both renderers
3. Add entrance animation system to both scenes

Phase 2 — Rain Glass:
4. Fix drop direction (R1)
5. Render-to-texture background with rainbow (R2, R3)
6. Stop-start drop physics (R4)
7. Improved refraction + chromatic aberration (R5)
8. Condensation layer (R6)
9. Warm color temperature (R7)

Phase 3 — Cloud Ascent:
10. Cloud presence and shape improvements (C2)
11. Stronger light breakthrough (C3)
12. God rays (C1)
13. More visible particles (C4)
14. Warm color progression (C5)
15. Entrance animation (C6)

Phase 4 — Final polish:
16. Test both on mobile (iPhone 12+)
17. Verify performance (target 60fps on mobile)
18. Verify `prefers-reduced-motion` still works
19. Visual QA pass on both

---

## Dependencies

New:
- `postprocessing` (pmndrs) — modern post-processing for Three.js

Unchanged:
- three ^0.182.0
- All other existing deps

## Performance Expectations

Both scenes should run **equal or faster** than current:
- Rain Glass: render-to-texture replaces per-frame noise computation
- Cloud Ascent: pmndrs combines post-processing into fewer passes
- ACES tone mapping: zero additional cost
- Chromatic aberration: 3 texture lookups replaces 6 noise calls (net win)
- God rays: one additional pass, offset by pmndrs efficiency gains
- Additional cloud layers: moderate cost, mitigated by pmndrs
