# Phase B: Star System Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance the starfield with increased density, parallax depth effects, and Theatre.js integration for the cosmic dawn aesthetic.

**Architecture:** Refactor existing 3-layer star system to support ~1800 stars with mouse/scroll parallax. Add dust motes as new particle layer. Wire all particle properties to Theatre.js controls. Keep CPU-side animation but add parallax uniforms to shaders.

**Tech Stack:** Three.js (Points, ShaderMaterial), Theatre.js controls, GLSL shaders

**Reference:** [Three.js Instancing Guide](https://velasquezdaniel.com/blog/rendering-100k-spheres-instantianing-and-draw-calls/)

---

## Task 1: Increase Star Counts

**Files:**
- Modify: `js/solar-system.js:507-511` (starLayers array)

**Step 1: Update star layer configuration**

Find the starLayers array (around line 507):
```javascript
    const starLayers = [
      { count: 600, size: 3, opacity: 0.5, spread: 500, speed: 0.02 },    // Distant dim stars
      { count: 300, size: 5, opacity: 0.7, spread: 400, speed: 0.035 },   // Medium stars
      { count: 80, size: 8, opacity: 0.9, spread: 300, speed: 0.05 }      // Bright nearby stars
    ];
```

Replace with:
```javascript
    const starLayers = [
      { count: 800, size: 2.5, opacity: 0.4, spread: 600, speed: 0.015, parallaxFactor: 0.2 },  // Background - minimal parallax
      { count: 600, size: 4, opacity: 0.6, spread: 450, speed: 0.025, parallaxFactor: 0.5 },   // Mid layer - medium parallax
      { count: 400, size: 7, opacity: 0.85, spread: 350, speed: 0.04, parallaxFactor: 1.0 }    // Foreground - full parallax
    ];
```

**Step 2: Verify build passes**

Run: `npm run build`
Expected: Build succeeds, ~1800 stars now rendered

**Step 3: Commit**

```bash
git add js/solar-system.js
git commit -m "feat: increase star density to ~1800 particles

- Background: 600 → 800 stars
- Mid layer: 300 → 600 stars
- Foreground: 80 → 400 stars
- Added parallaxFactor property for depth effect prep

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Add Mouse Parallax Tracking

**Files:**
- Modify: `js/solar-system.js` (constructor, init, new method)

**Step 1: Add mouse position state to constructor**

Find the constructor (around line 14) and add after `this.motionSettings`:
```javascript
    // Mouse position for parallax (normalized -1 to 1)
    this.mousePosition = { x: 0, y: 0 };
    this.targetMousePosition = { x: 0, y: 0 };
```

**Step 2: Add mouse tracking in init()**

Find the event listeners section in init() (around line 107) and add:
```javascript
    // Mouse tracking for parallax
    window.addEventListener('mousemove', (e) => {
      this.targetMousePosition.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.targetMousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
```

**Step 3: Add mouse smoothing to animate loop**

Find the animate() method and add near the beginning (after time update):
```javascript
    // Smooth mouse position for parallax
    this.mousePosition.x += (this.targetMousePosition.x - this.mousePosition.x) * 0.05;
    this.mousePosition.y += (this.targetMousePosition.y - this.mousePosition.y) * 0.05;
```

**Step 4: Verify build passes**

Run: `npm run build`

**Step 5: Commit**

```bash
git add js/solar-system.js
git commit -m "feat: add mouse position tracking for parallax

- Track normalized mouse position (-1 to 1)
- Smooth interpolation for fluid parallax movement

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Add Parallax Uniforms to Star Shader

**Files:**
- Modify: `js/solar-system.js:573-603` (star shader material)

**Step 1: Update star shader uniforms**

Find the ShaderMaterial creation (around line 573) and update:
```javascript
      const material = new THREE.ShaderMaterial({
        uniforms: {
          starTexture: { value: starTexture },
          time: { value: 0 },
          uMousePosition: { value: new THREE.Vector2(0, 0) },
          uParallaxStrength: { value: 0.5 },
          uParallaxFactor: { value: layer.parallaxFactor || 1.0 }
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          uniform vec2 uMousePosition;
          uniform float uParallaxStrength;
          uniform float uParallaxFactor;
          varying vec3 vColor;
          varying float vSize;
          void main() {
            vColor = color;
            vSize = size;

            // Apply parallax offset based on mouse position
            vec3 parallaxOffset = vec3(
              uMousePosition.x * 20.0 * uParallaxStrength * uParallaxFactor,
              uMousePosition.y * 20.0 * uParallaxStrength * uParallaxFactor,
              0.0
            );

            vec4 mvPosition = modelViewMatrix * vec4(position + parallaxOffset, 1.0);
            gl_PointSize = size * (300.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D starTexture;
          varying vec3 vColor;
          varying float vSize;
          void main() {
            vec4 texColor = texture2D(starTexture, gl_PointCoord);
            gl_FragColor = vec4(vColor, 1.0) * texColor;
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
```

**Step 2: Update uniforms in animate loop**

Find where animateStars is called and add uniform updates for each star group:
```javascript
    // Update star parallax uniforms
    this.starGroups.forEach((stars, i) => {
      stars.material.uniforms.uMousePosition.value.set(this.mousePosition.x, this.mousePosition.y);
      stars.material.uniforms.uParallaxStrength.value = this.motionSettings.mouseParallaxStrength;
    });
```

**Step 3: Visual verification**

Run: `npm run dev`
- Move mouse around the screen
- Expected: Stars shift subtly with cursor movement
- Foreground stars should move more than background stars

**Step 4: Commit**

```bash
git add js/solar-system.js
git commit -m "feat: implement mouse parallax on star layers

- Add parallax uniforms to star shader
- Foreground stars move more than background (parallaxFactor)
- Controlled by Theatre.js mouseParallaxStrength

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Wire Stars to Theatre.js Particles Controls

**Files:**
- Modify: `js/solar-system.js` (animateStars method)

**Step 1: Create updateParticles method**

Add after updateAtmosphere method:
```javascript
  updateParticles() {
    // Update star brightness based on Theatre.js settings
    if (!this.starGroups) return;

    this.starData.forEach((data, layerIndex) => {
      const geometry = this.starGroups[layerIndex].geometry;
      const sizes = geometry.attributes.size.array;

      for (let i = 0; i < data.layer.count; i++) {
        // Apply brightness multiplier from Theatre.js
        const baseBrightness = data.originalSizes[i];
        const minBright = this.particleSettings.starBrightnessMin;
        const maxBright = this.particleSettings.starBrightnessMax;

        // Scale size based on brightness range
        sizes[i] = baseBrightness * (minBright + (maxBright - minBright) * (data.layer.opacity));
      }

      geometry.attributes.size.needsUpdate = true;
    });
  }
```

**Step 2: Update Theatre.js subscription to call updateParticles**

Find the particles onValuesChange subscription (around line 977) and update:
```javascript
    this.theatreObjects.particles.onValuesChange((values) => {
      this.particleSettings = values;
      this.updateParticles();
    });
```

**Step 3: Update twinkle intensity in animateStars**

Find the twinkle calculation in animateStars (around line 679) and update:
```javascript
        // Twinkle effect on size - controlled by Theatre.js
        const twinkle = Math.sin(this.time * data.twinkleSpeeds[i] + data.twinklePhases[i]);
        const twinkleAmount = twinkle * 0.3 * this.particleSettings.twinkleIntensity;
        sizes[i] = data.originalSizes[i] * (1 + twinkleAmount);
```

**Step 4: Verify Theatre.js controls work**

Run: `npm run dev`
- Open Theatre.js studio (Ctrl+\)
- Adjust starBrightnessMin, starBrightnessMax, twinkleIntensity
- Expected: Stars respond to slider changes in real-time

**Step 5: Commit**

```bash
git add js/solar-system.js
git commit -m "feat: wire star system to Theatre.js Particles controls

- starBrightnessMin/Max affect star sizes
- twinkleIntensity controls twinkle amount
- Real-time updates via Theatre.js studio

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Add Dust Motes Layer

**Files:**
- Modify: `js/solar-system.js` (new method, init call)

**Step 1: Add createDustMotes method**

Add after createStarfield method:
```javascript
  createDustMotes() {
    const dustCount = 200;
    const positions = new Float32Array(dustCount * 3);
    const sizes = new Float32Array(dustCount);
    const driftPhases = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      // Spread dust throughout the scene
      positions[i * 3] = (Math.random() - 0.5) * 800;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 400;
      positions[i * 3 + 2] = Math.random() * -1000;

      // Very small particles
      sizes[i] = 1 + Math.random() * 2;

      // Random drift phase for organic movement
      driftPhases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0.2 },
        uMousePosition: { value: new THREE.Vector2(0, 0) },
        uParallaxStrength: { value: 0.5 }
      },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        uniform vec2 uMousePosition;
        uniform float uParallaxStrength;
        varying float vOpacity;

        void main() {
          // Gentle curl-noise-like drift
          vec3 pos = position;
          float drift = sin(uTime * 0.3 + position.x * 0.01) * 5.0;
          pos.y += drift;
          pos.x += cos(uTime * 0.2 + position.y * 0.01) * 3.0;

          // Parallax offset
          pos.x += uMousePosition.x * 30.0 * uParallaxStrength;
          pos.y += uMousePosition.y * 30.0 * uParallaxStrength;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          // Fade based on distance
          vOpacity = smoothstep(1000.0, 200.0, -mvPosition.z);
        }
      `,
      fragmentShader: `
        uniform float uOpacity;
        varying float vOpacity;

        void main() {
          // Soft circular particle
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = smoothstep(0.5, 0.2, dist) * uOpacity * vOpacity;

          // Warm dust color
          gl_FragColor = vec4(0.9, 0.85, 0.8, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.dustMotes = new THREE.Points(geometry, material);
    this.scene.add(this.dustMotes);

    this.dustData = { positions, originalPositions: positions.slice(), driftPhases };
  }
```

**Step 2: Call createDustMotes in init**

Find where createStarfield is called (around line 114) and add after it:
```javascript
    this.createDustMotes();
```

**Step 3: Update dust in animate loop**

Add to the animate method (where star uniforms are updated):
```javascript
    // Update dust motes
    if (this.dustMotes) {
      this.dustMotes.material.uniforms.uTime.value = this.time;
      this.dustMotes.material.uniforms.uOpacity.value = this.particleSettings.dustOpacity;
      this.dustMotes.material.uniforms.uMousePosition.value.set(this.mousePosition.x, this.mousePosition.y);
      this.dustMotes.material.uniforms.uParallaxStrength.value = this.motionSettings.mouseParallaxStrength;
    }
```

**Step 4: Visual verification**

Run: `npm run dev`
- Look for subtle floating dust particles
- Move mouse - dust should have strong parallax (foreground feel)
- Adjust dustOpacity in Theatre.js - particles should fade in/out

**Step 5: Commit**

```bash
git add js/solar-system.js
git commit -m "feat: add dust motes particle layer

- 200 tiny particles with gentle drift
- Warm color tone for atmospheric depth
- Strong parallax for foreground presence
- Opacity controlled via Theatre.js

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Expand Nebula System

**Files:**
- Modify: `js/solar-system.js` (nebula creation, around line 321)

**Step 1: Update nebula configuration**

Find the nebulaConfigs array and expand:
```javascript
    const nebulaConfigs = [
      { pos: new THREE.Vector3(-30, 20, -80), color: 0x3a6aee, scale: 60 },
      { pos: new THREE.Vector3(40, -15, -220), color: 0x5abaff, scale: 80 },
      { pos: new THREE.Vector3(-50, 25, -380), color: 0x7a6aee, scale: 70 },
      { pos: new THREE.Vector3(35, -20, -520), color: 0x4abaaa, scale: 65 },
      // New nebulae for cosmic dawn density
      { pos: new THREE.Vector3(60, 30, -150), color: 0x4a7aee, scale: 55 },
      { pos: new THREE.Vector3(-40, -25, -280), color: 0x6aaaff, scale: 75 },
      { pos: new THREE.Vector3(20, 35, -420), color: 0x5a5aee, scale: 60 },
      { pos: new THREE.Vector3(-55, 10, -580), color: 0x5ababa, scale: 70 }
    ];
```

**Step 2: Wire nebula opacity to Theatre.js**

Find where nebulae are created and store reference, then update in animate:
```javascript
    // Update nebula opacity
    if (this.nebulae) {
      this.nebulae.forEach(nebula => {
        nebula.material.opacity = this.particleSettings.nebulaOpacity;
      });
    }
```

**Step 3: Verify nebula changes**

Run: `npm run dev`
- More nebula clouds should be visible throughout the scene
- Adjust nebulaOpacity in Theatre.js
- Expected: All nebulae fade together

**Step 4: Commit**

```bash
git add js/solar-system.js
git commit -m "feat: expand nebula system to 8 clouds

- Added 4 additional nebula positions
- Nebula opacity controlled via Theatre.js
- More atmospheric density for cosmic dawn

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Performance Verification

**Files:**
- None (testing only)

**Step 1: Run production build**

```bash
npm run build
npm run preview
```

**Step 2: Performance checklist**

Open DevTools → Performance tab, record while:
- [ ] Idle on homepage - CPU should be <15%
- [ ] Move mouse around - smooth parallax, no jank
- [ ] Scroll between planets - 60fps maintained
- [ ] Theatre.js adjustments - real-time response

**Step 3: If performance issues found**

- Reduce dust count from 200 to 150
- Increase star animation throttle from 3 to 4 frames
- Reduce nebula count to 6

---

## Task 8: Code-Simplifier Review

**Step 1: Run code-simplifier**

Use code-simplifier agent to review Phase B changes for:
- Redundant calculations in animate loop
- Over-engineered shader code
- Opportunities to consolidate uniform updates

**Step 2: Apply any simplifications**

**Step 3: Final commit if changes made**

```bash
git commit -m "refactor: simplify Phase B implementation

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Verification Checklist

- [ ] ~1800 stars rendering (800 + 600 + 400)
- [ ] Mouse parallax working (foreground moves more)
- [ ] Theatre.js starBrightnessMin/Max affects stars
- [ ] Theatre.js twinkleIntensity adjusts twinkle
- [ ] Dust motes visible and drifting
- [ ] Dust responds to dustOpacity control
- [ ] 8 nebulae rendering
- [ ] Nebula opacity controllable
- [ ] 60fps maintained
- [ ] Build passes

---

## Files Modified

| File | Changes |
|------|---------|
| `js/solar-system.js` | Star counts, parallax shader, dust motes, nebula expansion, Theatre.js wiring |
