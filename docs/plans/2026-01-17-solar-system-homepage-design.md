# Solar System Homepage Design

## Overview

Reimagine the Gift Site homepage as an immersive solar system navigation hub. Users navigate between four planets representing core site sections via scroll or click, with preview content appearing at each stop.

## User Experience

### The Journey

1. User lands on homepage
2. Sees solar system: Sun (center) + 4 orbiting planets
3. Scroll or click to travel between planets
4. At each planet: Preview card appears with "Visit [Section]" button
5. Click "Visit" → Navigate to full page

### Navigation Model

- **Scroll**: Moves camera along orbital path, planet-to-planet
- **Click planet**: Jumps camera directly to that planet
- **Nav bar**: Always available for direct page links (accessibility)
- **"Visit" button**: Appears at each planet stop, links to full page

## The Four Planets

| Planet | Page | Color Variation | Orbit Position |
|--------|------|-----------------|----------------|
| Why | why.html | Deep navy (#1a2a5a → #3a6aee) | Inner |
| Discover | discover.html | Cyan-blue (#2a4a7a → #5abaff) | Second |
| Process | process.html | Blue-violet (#3a3a6a → #7a6aee) | Third |
| Facilitate | facilitate.html | Blue-teal (#2a4a5a → #4abaaa) | Outer |

### Future Addition
- **Companion** planet will be added when that section is ready

## Technical Architecture

### Scene Structure

```
Scene
├── Sun (center)
│   └── Logo/brand mark with warm glow
│
├── Orbital Paths (subtle visual rings)
│
├── Planets (4)
│   ├── Planet: "Why"
│   │   ├── Sphere + atmosphere glow layers
│   │   └── Preview content anchor point
│   ├── Planet: "Discover"
│   ├── Planet: "Process"
│   └── Planet: "Facilitate"
│
├── Orbital Bodies (ambient asteroids/moons)
├── Starfield (layered, with blue accent stars)
└── Nebula clouds (subtle blue atmosphere)
```

### Camera System

```javascript
// Camera follows curved path through system
const cameraPath = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 150),    // Start: overview
  new THREE.Vector3(40, 10, 80),   // Stop 1: Why
  new THREE.Vector3(-50, -5, 60),  // Stop 2: Discover
  new THREE.Vector3(60, -20, 40),  // Stop 3: Process
  new THREE.Vector3(-40, 15, 20),  // Stop 4: Facilitate
]);

// Scroll progress (0-1) maps to path position
// Scroll 0% = overview, 25% = Why, 50% = Discover, etc.
```

### File Structure

```
js/
  solar-system.js   (new - main scene, planets, camera)
  ambient.js        (modified - starfield, nebula, post-processing)
  animations.js     (modified - Theatre.js integration)
  vfx.js           (new - text effects)
  theatre-state.json (animation state)

index.html          (restructured)
css/main.css        (updated for preview cards)
package.json        (new - dependencies)
```

## Preview Cards

HTML elements positioned in 3D space via CSS transforms. Keeps text crisp and accessible.

### Card Content

| Planet | Title | Preview Text | Button |
|--------|-------|--------------|--------|
| Why | Why We Exist | "Every person carries within them a unique Gift..." | Visit Why We Exist |
| Discover | Discover Your Gift | Invitation to begin the journey | Visit Discover |
| Process | The Process | Brief description of the method | Visit The Process |
| Facilitate | Facilitate | For those guiding others | Visit Facilitate |

### Card Behavior

- Fades in when camera reaches planet's stop zone
- Fades out when camera moves away
- Subtle float animation (gentle bob)
- VFX-JS applies gentle wave distortion on reveal, settles to static

## Shader & Post-Processing

### Pipeline

```
Render Scene
    ↓
Pass 1: Bloom (planet glows, sun)
    ↓
Pass 2: Depth-of-field (distant blur)
    ↓
Pass 3: Noise distortion (subtle heat haze)
    ↓
Pass 4: Film grain + vignette
    ↓
Final output
```

### Planet Shaders

Each planet has layered atmosphere:
- Core sphere (solid color)
- Fresnel rim glow (bright edge)
- Atmosphere shells (2-3 transparent layers)
- Blend mode: screen (colors add, don't muddy)

### Section-Reactive Background

As camera approaches each planet, background nebula subtly shifts to complement that planet's hue (5-10% tint shift).

## Animation Control

### Theatre.js Structure

```
Project: "GiftSite"
└── Sheet: "SolarSystem"
    ├── Sequence: "intro" (time-based, initial reveal)
    ├── Sequence: "cameraFlight" (scroll-linked)
    ├── Sequence: "planetWhy" (card timing)
    ├── Sequence: "planetDiscover" (card timing)
    ├── Sequence: "planetProcess" (card timing)
    └── Sequence: "planetFacilitate" (card timing)
```

### Editable Parameters

- Camera flight duration between planets
- Ease curves (snappy vs floaty)
- Card fade-in thresholds
- Text stagger timing
- Planet glow pulse rhythms

### Studio Access

- Keyboard shortcut (Ctrl+\) opens Theatre.js overlay
- Changes auto-save to theatre-state.json
- Removable later: export values, remove studio dependency

## VFX-JS Text Effects

### Application

```javascript
VFX.add('.planet-card h2', {
  shader: 'wave',
  amplitude: 12,      // Starting distortion
  frequency: 0.5,     // Smooth wave
  decay: 1.5,         // Seconds to settle
  trigger: 'visible'
});
```

### Scope

- Applied to: Preview card headlines only
- Not applied to: Body text, navigation, buttons, footer
- Fallback: Text renders normally if WebGL unavailable

## Accessibility

- Preview cards are real DOM elements (screen reader friendly)
- Keyboard navigation works (Tab through buttons)
- Nav bar always available as traditional fallback
- Reduced motion: Detect `prefers-reduced-motion`, simplify animations

## Mobile Considerations

- Swipe gestures work via Lenis
- Planets tappable
- Reduced orbit distances for smaller screens
- Potentially simplified effects for performance

## Technical Stack

- **Three.js**: 3D scene, planets, camera path
- **GSAP + Lenis**: Scroll handling, DOM animations
- **Theatre.js**: Visual animation tuning (dev tool, removable)
- **VFX-JS**: Text distortion effects
- **Custom shaders**: Bloom, DOF, noise, blend modes

## Dependencies (package.json)

```json
{
  "dependencies": {
    "@theatre/core": "^0.7.0",
    "@theatre/studio": "^0.7.0",
    "vfx-js": "^0.3.0"
  }
}
```

Note: Three.js, GSAP, Lenis remain as CDN scripts for simplicity.

## Success Criteria

1. Smooth 60fps navigation on mid-range devices
2. Clear visual wayfinding (users know where they are)
3. Preview content is readable and inviting
4. "Visit" actions are obvious and accessible
5. Theatre.js studio enables rapid iteration with client feedback
6. System extensible for Companion planet addition
