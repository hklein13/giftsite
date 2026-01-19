# Cosmic Dawn Visual Polish - Design Document

> **Status:** Approved for implementation
> **Date:** 2026-01-18
> **Goal:** Transform the site from "deep space void" to "cosmic dawn" - brighter, more luminous, while keeping blue-dominated style

---

## Summary

Client feedback: site needs to be brighter. Solution: bold transformation to a "cosmic dawn" aesthetic with:
- Lighter steel-blue backgrounds (#3a4a6a range)
- Significantly more particles (stars, nebulae, dust)
- Homepage gets full treatment, content pages stay slightly muted for readability
- Theatre.js controls for real-time tuning
- Integrated parallax/depth effects from the start

---

## Color Palette Transformation

### Background Colors

| Element | Current | New |
|---------|---------|-----|
| Deep space | `#0d1929` | `#1a2a4a` |
| Mid space | `#060d18` | `#2a3a5a` |
| Horizon hint | (none) | `#3a4a6a` gradient at edges |

### Approach
- Three.js scene background shifts from near-black to rich twilight blue
- Subtle radial gradient: lighter at center (sun location), darker at edges
- Creates depth - looking into illuminated space, not a void

### Planet & Glow Adjustments
- Planet base colors stay similar (need contrast against brighter background)
- Glow intensities increase ~40% to maintain pop
- Sun warm glow becomes more prominent as scene's light source

### CSS Variables (Content Pages)
```css
--deep-navy: #1a2a4a;    /* Was #0d1929 - lifted */
--midnight: #0d1929;      /* Was #060d18 - lifted */
--royal-blue: #2a3a5a;    /* Was #1a2a4a - lifted */
```

Content pages get modest lift (one step lighter) while homepage goes further in shader.

---

## Particle System

### Density Changes

| Layer | Current | New | Purpose |
|-------|---------|-----|---------|
| Background stars | ~400 | ~800 | Distant pinpoints, minimal movement |
| Mid stars | ~400 | ~600 | Medium brightness, subtle parallax |
| Foreground stars | ~180 | ~400 | Brightest, most parallax movement |
| Nebula clouds | 4 | 8-10 | More coverage, varied opacity |
| **Dust motes** | 0 | ~200 | Tiny particles that catch light, slow drift |

### Brightness Distribution
- Stars get wider brightness range (0.3 - 1.0 instead of 0.5 - 1.0)
- More stars in "bright" tier for dense, luminous sky feel
- Dust motes very dim (0.1-0.3) but add atmospheric density

### Parallax-Ready Structure
Each layer stored separately with:
- Depth value (parallax multiplier)
- Scroll velocity response
- Mouse parallax sensitivity

Foreground stars streak more than background during fast scroll.

### Performance Budget
- ~2000 total particles (up from ~980)
- GPU instancing keeps draw calls minimal
- Star animation stays throttled (every 3rd frame)

---

## Theatre.js Integration

### Controllable Properties

| Category | Property | Range | Default |
|----------|----------|-------|---------|
| **Background** | `bgBrightness` | 0.0 - 1.0 | 0.7 |
| | `bgGradientStrength` | 0.0 - 1.0 | 0.4 |
| | `horizonTint` | color picker | `#3a4a6a` |
| **Stars** | `starDensityMultiplier` | 0.5 - 2.0 | 1.0 |
| | `starBrightnessMin` | 0.1 - 0.5 | 0.3 |
| | `starBrightnessMax` | 0.6 - 1.0 | 1.0 |
| | `twinkleIntensity` | 0.0 - 1.0 | 0.6 |
| **Nebulae** | `nebulaOpacity` | 0.0 - 0.3 | 0.15 |
| | `nebulaCount` | 4 - 12 | 8 |
| **Dust** | `dustOpacity` | 0.0 - 0.4 | 0.2 |
| | `dustDriftSpeed` | 0.0 - 1.0 | 0.3 |
| **Bloom** | `bloomStrength` | 0.4 - 1.5 | 0.9 |
| | `bloomThreshold` | 0.4 - 0.8 | 0.6 |
| **Parallax** | `mouseParallaxStrength` | 0.0 - 1.0 | 0.5 |
| | `scrollVelocityEffect` | 0.0 - 1.0 | 0.6 |

### Architecture
```
Theatre.js Sheet ("Solar System")
  └─ Object: "Atmosphere"
       ├─ bgBrightness, bgGradientStrength, horizonTint
       └─ bloomStrength, bloomThreshold
  └─ Object: "Particles"
       ├─ starDensityMultiplier, starBrightness*, twinkleIntensity
       ├─ nebulaOpacity, nebulaCount
       └─ dustOpacity, dustDriftSpeed
  └─ Object: "Motion"
       ├─ mouseParallaxStrength
       └─ scrollVelocityEffect
```

### Workflow
1. `npm run dev` → Ctrl+\ opens Theatre.js studio
2. Adjust sliders, see changes instantly
3. Export values → update defaults in code for production

---

## Detail Elevation Strategy

### Visual Hierarchy

| Element | Role | Detail Level |
|---------|------|--------------|
| **Planets** | Hero objects, navigation targets | **High** |
| **Sun** | Light source, scene anchor | **High** |
| **Foreground stars** | Depth cues, parallax | **Medium** |
| **Nebulae** | Atmosphere, mood | **Low** (soft blobs) |
| **Dust motes** | Density, ambient light | **Minimal** |

### Planet Improvements
- Surface noise: more octaves for richer texture
- Fresnel rim: sharpened for crisp silhouettes
- Color variation across surface (not flat tone)
- Atmosphere glow: fewer layers, more intentional

### Sun Improvements
- Corona rays (subtle, not cartoon)
- Core brightness falloff feels physical
- Warm light tints nearby space slightly

### Star Improvements
- Color temperature variation (warm and cool blue, not all white)
- Brightness correlates with size
- Foreground stars get subtle 4-point diffraction spikes

### What Stays Soft
- Nebulae remain painterly blobs (they're gas clouds)
- Dust motes stay tiny and indistinct
- Background stars stay as simple points

---

## Implementation Plan

### Phase A: Foundation (Background + Theatre.js Setup)

| Task | Description | Tools |
|------|-------------|-------|
| A1 | Set up Theatre.js sheet structure | Context7 |
| A2 | Create background gradient shader | Context7 (Three.js) |
| A3 | Wire background to Theatre.js | - |
| A4 | Update CSS variables for content pages | - |
| A5 | Playwright screenshot verification | Playwright MCP |
| A6 | **Code-simplifier review** | code-simplifier skill |

### Phase B: Star System Overhaul

| Task | Description | Tools |
|------|-------------|-------|
| B1 | Refactor stars into 3 layer groups | - |
| B2 | Increase counts (800/600/400) | - |
| B3 | Add color temperature variation | Context7 (Three.js Color) |
| B4 | Add diffraction spikes to foreground | Custom shader |
| B5 | Wire star properties to Theatre.js | - |
| B6 | Implement parallax (mouse + scroll) | Context7 |
| B7 | **Code-simplifier review** | code-simplifier skill |

### Phase C: Nebulae & Dust

| Task | Description | Tools |
|------|-------------|-------|
| C1 | Expand nebula system (8-10 clouds) | - |
| C2 | Add dust mote particle layer (~200) | - |
| C3 | Wire to Theatre.js controls | - |
| C4 | Performance test | Playwright + DevTools |
| C5 | **Code-simplifier review** | code-simplifier skill |

### Phase D: Detail Elevation

| Task | Description | Tools |
|------|-------------|-------|
| D1 | Enhance planet shader | Context7 (GLSL) |
| D2 | Sharpen fresnel rim | - |
| D3 | Refine sun corona | - |
| D4 | Adjust bloom for brighter scene | - |
| D5 | Full visual QA | Playwright screenshots |
| D6 | **Code-simplifier review** | code-simplifier skill |

### Phase E: Polish & Export

| Task | Description | Tools |
|------|-------------|-------|
| E1 | Tune Theatre.js values | Theatre.js studio |
| E2 | Export final values to code | - |
| E3 | Test reduced-motion fallback | - |
| E4 | Performance verification (60fps) | Playwright |
| E5 | Mobile testing | Playwright viewports |
| E6 | **Final code-simplifier review** | code-simplifier skill |

---

## Workflow Requirements

### Tools
- **Context7 MCP** - Up-to-date docs for Three.js, GSAP, Theatre.js
- **Playwright MCP** - Visual testing, screenshots, performance checks
- **Superpowers skills** - Planning, execution, debugging, verification
- **Code-simplifier** - End of each phase to catch redundancy/over-engineering

### Git Workflow
- Create feature branch from main
- Commit after each phase
- PR for review before merge
- Never push directly to main

---

## File Changes

| File | Change Scope |
|------|--------------|
| `js/solar-system.js` | Major - shaders, particles, Theatre.js |
| `js/main.js` | Minor - Theatre.js initialization |
| `css/main.css` | Minor - CSS variable updates |

---

## Success Criteria

1. Site feels noticeably brighter and more luminous
2. Blue-dominated palette maintained
3. Key elements (planets, sun) have refined detail
4. Theatre.js controls work for all brightness/particle properties
5. Parallax depth effects integrated and functional
6. 60fps performance maintained
7. Mobile experience uncompromised
