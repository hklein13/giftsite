# Phase A: Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up Theatre.js controls and background gradient shader as foundation for cosmic dawn visual polish.

**Architecture:** Wire Theatre.js objects for real-time control of atmosphere settings. Replace CSS background with Three.js gradient shader for dynamic control. Update CSS variables for content pages.

**Tech Stack:** Three.js (ShaderMaterial), Theatre.js (@theatre/core), CSS custom properties

---

## Task 1: Wire Theatre.js Atmosphere Object

**Files:**
- Modify: `js/solar-system.js:850-854` (setupTheatreControls method)

**Step 1: Replace the stubbed setupTheatreControls method**

Find the current stub at line 850-854:
```javascript
  setupTheatreControls() {
    // Animation config now handled by window.animationConfig
    // Theatre.js will be added when bundler is introduced
    console.log('Animation config loaded from window.animationConfig');
  }
```

Replace with:
```javascript
  setupTheatreControls() {
    const sheet = window.theatreSheet;
    const types = window.theatreTypes;

    if (!sheet || !types) {
      console.warn('Theatre.js not ready, retrying...');
      setTimeout(() => this.setupTheatreControls(), 500);
      return;
    }

    // Atmosphere controls
    this.theatreObjects.atmosphere = sheet.object('Atmosphere', {
      bgBrightness: types.number(0.7, { range: [0, 1] }),
      bgGradientStrength: types.number(0.4, { range: [0, 1] }),
      bloomStrength: types.number(0.9, { range: [0.4, 1.5] }),
      bloomThreshold: types.number(0.6, { range: [0.4, 0.8] })
    });

    // Subscribe to atmosphere changes
    this.theatreObjects.atmosphere.onValuesChange((values) => {
      this.atmosphereSettings = values;
      this.updateAtmosphere();
    });

    // Initialize with current values
    this.atmosphereSettings = this.theatreObjects.atmosphere.value;

    console.log('Theatre.js controls initialized');
  }
```

**Step 2: Add atmosphereSettings property to constructor**

Find line 39 (`this.theatreObjects = {};`) and add after it:
```javascript
    this.atmosphereSettings = {
      bgBrightness: 0.7,
      bgGradientStrength: 0.4,
      bloomStrength: 0.9,
      bloomThreshold: 0.6
    };
```

**Step 3: Add updateAtmosphere method**

Add after setupTheatreControls method (around line 880):
```javascript
  updateAtmosphere() {
    // Update bloom settings
    if (this.bloomPass) {
      this.bloomPass.strength = this.atmosphereSettings.bloomStrength;
      this.bloomPass.threshold = this.atmosphereSettings.bloomThreshold;
    }

    // Background shader will be updated here after Task 2
  }
```

**Step 4: Verify Theatre.js controls appear**

Run: `npm run dev`
- Open http://localhost:5173 in browser
- Press Ctrl+\ to open Theatre.js studio
- Expected: "Atmosphere" object appears with bgBrightness, bgGradientStrength, bloomStrength, bloomThreshold sliders
- Adjust bloomStrength slider - bloom effect should change in real-time

**Step 5: Commit**

```bash
git add js/solar-system.js
git commit -m "feat: wire Theatre.js atmosphere controls

- Add Atmosphere object with brightness/gradient/bloom controls
- Subscribe to value changes for real-time updates
- Bloom strength/threshold now adjustable via Theatre.js studio

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create Background Gradient Shader

**Files:**
- Modify: `js/solar-system.js` (init method, add new method)

**Step 1: Add createBackgroundGradient method**

Add after the createSun method (around line 145):
```javascript
  createBackgroundGradient() {
    // Full-screen background plane with gradient shader
    const bgGeometry = new THREE.PlaneGeometry(2, 2);

    const bgMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uBrightness: { value: 0.7 },
        uGradientStrength: { value: 0.4 },
        uColorDark: { value: new THREE.Color(0x1a2a4a) },    // Steel blue dark
        uColorMid: { value: new THREE.Color(0x2a3a5a) },     // Steel blue mid
        uColorLight: { value: new THREE.Color(0x3a4a6a) },   // Steel blue light (horizon)
        uSunPosition: { value: new THREE.Vector2(0.5, 0.3) } // Sun glow center
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.9999, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uBrightness;
        uniform float uGradientStrength;
        uniform vec3 uColorDark;
        uniform vec3 uColorMid;
        uniform vec3 uColorLight;
        uniform vec2 uSunPosition;
        varying vec2 vUv;

        void main() {
          // Base vertical gradient (darker at top, lighter toward center)
          float vertGradient = 1.0 - abs(vUv.y - 0.4) * 1.5;
          vertGradient = clamp(vertGradient, 0.0, 1.0);

          // Radial gradient from sun position
          float distToSun = distance(vUv, uSunPosition);
          float sunGlow = 1.0 - smoothstep(0.0, 0.8, distToSun);
          sunGlow *= uGradientStrength;

          // Combine gradients
          float gradientMix = vertGradient * 0.5 + sunGlow * 0.5;

          // Three-color blend based on gradient
          vec3 color = mix(uColorDark, uColorMid, smoothstep(0.0, 0.5, gradientMix));
          color = mix(color, uColorLight, smoothstep(0.5, 1.0, gradientMix) * uGradientStrength);

          // Apply brightness
          color *= uBrightness + 0.3;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      depthWrite: false,
      depthTest: false
    });

    this.backgroundMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    this.backgroundMesh.frustumCulled = false;
    this.backgroundMesh.renderOrder = -1000;

    // Add to separate scene for background rendering
    this.bgScene = new THREE.Scene();
    this.bgScene.add(this.backgroundMesh);
    this.bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
```

**Step 2: Call createBackgroundGradient in init**

Find line 97 (`this.setupPostProcessing();`) and add BEFORE it:
```javascript
    this.createBackgroundGradient();
```

**Step 3: Update render loop to draw background**

Find the animate method and locate where `this.composer.render()` is called. Add background rendering BEFORE it:
```javascript
    // Render background gradient first
    if (this.bgScene && this.bgCamera) {
      this.renderer.autoClear = false;
      this.renderer.clear();
      this.renderer.render(this.bgScene, this.bgCamera);
    }
```

**Step 4: Wire background to Theatre.js in updateAtmosphere**

Update the updateAtmosphere method to include:
```javascript
  updateAtmosphere() {
    // Update bloom settings
    if (this.bloomPass) {
      this.bloomPass.strength = this.atmosphereSettings.bloomStrength;
      this.bloomPass.threshold = this.atmosphereSettings.bloomThreshold;
    }

    // Update background shader
    if (this.backgroundMesh) {
      this.backgroundMesh.material.uniforms.uBrightness.value = this.atmosphereSettings.bgBrightness;
      this.backgroundMesh.material.uniforms.uGradientStrength.value = this.atmosphereSettings.bgGradientStrength;
    }
  }
```

**Step 5: Disable CSS background on canvas**

The canvas currently shows through to CSS background. We need the Three.js background to show instead.

Find in `css/main.css` line 715 (`#solar-system-canvas`) and verify it doesn't have a background. The body background at line 37 should be overridden by our Three.js gradient.

**Step 6: Verify background gradient**

Run: `npm run dev`
- Open http://localhost:5173
- Expected: Background is now steel-blue gradient instead of near-black
- Press Ctrl+\ and adjust bgBrightness slider
- Expected: Background gets brighter/darker in real-time
- Adjust bgGradientStrength slider
- Expected: Sun glow area becomes more/less prominent

**Step 7: Commit**

```bash
git add js/solar-system.js
git commit -m "feat: add dynamic background gradient shader

- Full-screen shader with vertical + radial gradient
- Steel-blue palette (cosmic dawn aesthetic)
- Brightness and gradient strength controllable via Theatre.js
- Renders before main scene for proper layering

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update CSS Variables for Content Pages

**Files:**
- Modify: `css/main.css:3-12` (root variables)

**Step 1: Update color variables**

Find lines 3-12:
```css
:root {
  /* Color Palette: Royal Blue + Soft Warmth */
  --royal-blue: #1a2a4a;
  --deep-navy: #0d1929;
  --midnight: #060d18;
  --blush: #e8c4b8;
  --cream: #f0ebe3;
  --off-white: #faf8f5;
  --soft-gray: #b8c4d4;
  --gold: #d4a853;
```

Replace with:
```css
:root {
  /* Color Palette: Cosmic Dawn (brighter blue-dominated) */
  --royal-blue: #2a3a5a;    /* Was #1a2a4a - lifted for twilight feel */
  --deep-navy: #1a2a4a;     /* Was #0d1929 - lifted one step */
  --midnight: #0d1929;      /* Was #060d18 - lifted one step */
  --blush: #e8c4b8;
  --cream: #f0ebe3;
  --off-white: #faf8f5;
  --soft-gray: #c8d4e4;     /* Was #b8c4d4 - slightly brighter */
  --gold: #d4a853;
```

**Step 2: Verify content page appearance**

Run: `npm run dev`
- Navigate to /why.html, /discover.html, /process.html, /facilitate.html
- Expected: Background is noticeably lighter but still blue-dominated
- Text contrast should remain readable
- Blush/gold accents should still pop

**Step 3: Commit**

```bash
git add css/main.css
git commit -m "style: update CSS variables for cosmic dawn palette

- Lift all blue tones one step brighter
- Content pages now have twilight feel vs midnight
- Maintains readability and accent contrast

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Add Particles Theatre.js Object (Prep for Phase B)

**Files:**
- Modify: `js/solar-system.js` (setupTheatreControls method)

**Step 1: Add Particles object to Theatre.js**

In setupTheatreControls, add after the atmosphere object:
```javascript
    // Particles controls (prep for Phase B)
    this.theatreObjects.particles = sheet.object('Particles', {
      starDensityMultiplier: types.number(1.0, { range: [0.5, 2.0] }),
      starBrightnessMin: types.number(0.3, { range: [0.1, 0.5] }),
      starBrightnessMax: types.number(1.0, { range: [0.6, 1.0] }),
      twinkleIntensity: types.number(0.6, { range: [0, 1] }),
      nebulaOpacity: types.number(0.15, { range: [0, 0.3] }),
      dustOpacity: types.number(0.2, { range: [0, 0.4] })
    });

    // Subscribe to particles changes
    this.theatreObjects.particles.onValuesChange((values) => {
      this.particleSettings = values;
      // Phase B will implement updateParticles()
    });

    this.particleSettings = this.theatreObjects.particles.value;
```

**Step 2: Add particleSettings property to constructor**

Find atmosphereSettings (added in Task 1) and add after it:
```javascript
    this.particleSettings = {
      starDensityMultiplier: 1.0,
      starBrightnessMin: 0.3,
      starBrightnessMax: 1.0,
      twinkleIntensity: 0.6,
      nebulaOpacity: 0.15,
      dustOpacity: 0.2
    };
```

**Step 3: Add Motion object to Theatre.js**

In setupTheatreControls, add after the particles object:
```javascript
    // Motion controls (prep for Phase B parallax)
    this.theatreObjects.motion = sheet.object('Motion', {
      mouseParallaxStrength: types.number(0.5, { range: [0, 1] }),
      scrollVelocityEffect: types.number(0.6, { range: [0, 1] })
    });

    this.theatreObjects.motion.onValuesChange((values) => {
      this.motionSettings = values;
    });

    this.motionSettings = this.theatreObjects.motion.value;
```

**Step 4: Add motionSettings property to constructor**

Add after particleSettings:
```javascript
    this.motionSettings = {
      mouseParallaxStrength: 0.5,
      scrollVelocityEffect: 0.6
    };
```

**Step 5: Verify all Theatre.js objects**

Run: `npm run dev`
- Press Ctrl+\ to open Theatre.js studio
- Expected: Three objects visible: "Atmosphere", "Particles", "Motion"
- All sliders should be adjustable (Particles/Motion won't affect visuals yet - that's Phase B)

**Step 6: Commit**

```bash
git add js/solar-system.js
git commit -m "feat: add Particles and Motion Theatre.js objects

- Particles: density, brightness, twinkle, nebula, dust controls
- Motion: parallax strength, scroll velocity controls
- Prepares control structure for Phase B implementation

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Visual Verification with Playwright

**Files:**
- None (testing only)

**Step 1: Take baseline screenshots**

Use Playwright to capture the current state:
- Homepage at hero position
- Homepage at each planet stop
- Content page (why.html)

**Step 2: Verify brightness improvement**

Compare screenshots to pre-change state:
- Background should be visibly lighter (steel-blue vs near-black)
- Planets and stars should still be clearly visible
- Text on content pages should remain readable

**Step 3: Verify Theatre.js functionality**

- Open Theatre.js studio (Ctrl+\)
- Screenshot with studio open showing all three objects
- Adjust bgBrightness to 0.5 and 1.0, screenshot each

---

## Task 6: Code-Simplifier Review

**Files:**
- All modified files

**Step 1: Run code-simplifier skill**

Use `code-simplifier:code-simplifier` agent to review:
- `js/solar-system.js` changes
- `css/main.css` changes

**Step 2: Address any flagged issues**

- Remove any redundant code
- Simplify any over-engineered patterns
- Ensure no performance regressions

**Step 3: Final commit if changes made**

```bash
git add .
git commit -m "refactor: simplify Phase A implementation

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Verification Checklist

- [ ] Theatre.js studio opens with Ctrl+\
- [ ] Atmosphere object has 4 working sliders
- [ ] Particles object has 6 sliders (visual effect in Phase B)
- [ ] Motion object has 2 sliders (visual effect in Phase B)
- [ ] Background shows steel-blue gradient (not near-black)
- [ ] bgBrightness slider changes background brightness
- [ ] bgGradientStrength slider changes sun glow intensity
- [ ] bloomStrength/bloomThreshold affect glow in real-time
- [ ] Content pages have lighter background
- [ ] Text remains readable on content pages
- [ ] Build passes (`npm run build`)
- [ ] Code-simplifier review complete

---

## Files Modified

| File | Changes |
|------|---------|
| `js/solar-system.js` | Theatre.js wiring, background shader, settings objects |
| `css/main.css` | CSS variable updates for brighter palette |
