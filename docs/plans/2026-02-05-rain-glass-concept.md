# Rain on Glass Concept Demo — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the garden concept with a "rain on glass" demo — bright daytime rain viewed through a window, with procedural raindrops that refract a warm blurred background.

**Architecture:** Single fullscreen fragment shader (same as Golden Hour / Cloud Ascent) that renders a warm, bright blurred background and overlays procedural raindrops with refraction. No parallax, no particles — the shader handles everything. Touch burst creates a splash/ripple. Post-processing adds subtle bloom, grain, and vignette.

**Tech Stack:** Three.js, custom GLSL fragment shaders, EffectComposer (RenderPass, UnrealBloomPass, ShaderPass)

---

## Task 1: Scaffolding — HTML + Vite Config

**Files:**
- Create: `concepts/rain-glass.html`
- Modify: `vite.config.js:14` (change `garden` entry)
- Delete: `concepts/garden.html`, `js/concepts/garden.js`

**Step 1: Create `concepts/rain-glass.html`**

Clone from `concepts/cloud-ascent.html` with these changes:
- Title: `Rain Glass — The Gift Site`
- Canvas ID: `rain-glass-canvas`
- Body background: `#D4DDE6` (soft cool gray — the "bright overcast" fallback before canvas loads)
- Text color: `#3A4555` (slate blue-gray) for h1, subtitle, back button, tap hint
- Back button bg: `rgba(58, 69, 85, 0.12)`, border: `rgba(58, 69, 85, 0.15)`
- Script src: `../js/concepts/rain-glass.js`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Rain Glass — The Gift Site</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet">

  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      background: #D4DDE6;
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      font-family: 'Outfit', sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    canvas#rain-glass-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: block;
    }

    .overlay {
      position: fixed;
      top: 0; left: 0;
      width: 100%; height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      pointer-events: none;
      z-index: 10;
    }

    .overlay h1 {
      font-family: 'Fraunces', serif;
      font-size: clamp(2.5rem, 8vw, 5rem);
      font-weight: 400;
      color: #3A4555;
      text-shadow: 0 2px 20px rgba(255, 255, 255, 0.4);
      letter-spacing: -0.02em;
      text-align: center;
      line-height: 1.2;
      padding: 0 1rem;
    }

    .overlay h1 .accent-italic {
      font-style: italic;
      font-weight: 500;
    }

    .overlay .subtitle {
      font-family: 'Outfit', sans-serif;
      font-size: clamp(0.9rem, 2.5vw, 1.15rem);
      font-weight: 300;
      color: rgba(58, 69, 85, 0.7);
      margin-top: 1rem;
      text-shadow: 0 1px 10px rgba(255, 255, 255, 0.3);
      letter-spacing: 0.03em;
    }

    .back-button {
      position: fixed;
      top: max(1rem, env(safe-area-inset-top, 1rem));
      left: max(1rem, env(safe-area-inset-left, 1rem));
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 44px;
      min-height: 44px;
      padding: 0.5rem 1rem;
      background: rgba(58, 69, 85, 0.12);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(58, 69, 85, 0.15);
      border-radius: 2rem;
      color: #3A4555;
      font-family: 'Outfit', sans-serif;
      font-size: 0.9rem;
      font-weight: 400;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    .back-button:hover { background: rgba(58, 69, 85, 0.2); }

    .back-button svg {
      width: 16px; height: 16px;
      fill: none; stroke: currentColor;
      stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
    }

    .tap-hint {
      position: fixed;
      bottom: max(2rem, env(safe-area-inset-bottom, 2rem));
      left: 50%;
      transform: translateX(-50%);
      z-index: 20;
      font-family: 'Outfit', sans-serif;
      font-size: 0.8rem;
      font-weight: 300;
      color: rgba(58, 69, 85, 0.45);
      letter-spacing: 0.05em;
      text-align: center;
      pointer-events: none;
      opacity: 1;
      transition: opacity 0.6s ease;
    }

    .tap-hint.hidden { opacity: 0; }

    @media (prefers-reduced-motion: reduce) {
      .tap-hint { display: none; }
    }
  </style>
</head>
<body>
  <canvas id="rain-glass-canvas"></canvas>

  <a class="back-button" href="../index.html">
    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>
    Back
  </a>

  <div class="overlay">
    <h1>Uncover Your <span class="accent-italic">Gift</span></h1>
    <p class="subtitle">A journey of discovery awaits</p>
  </div>

  <div class="tap-hint" id="tap-hint">Tap anywhere to interact</div>

  <script type="module" src="../js/concepts/rain-glass.js"></script>
</body>
</html>
```

**Step 2: Update `vite.config.js`**

Change line 14 from:
```js
garden: resolve(__dirname, 'concepts/garden.html')
```
to:
```js
rainGlass: resolve(__dirname, 'concepts/rain-glass.html')
```

**Step 3: Delete old garden files**

```bash
git rm concepts/garden.html js/concepts/garden.js
```

**Step 4: Verify**

Run: `npm run dev`
Expected: Server starts, no build errors. `http://localhost:5173/giftsite/concepts/rain-glass.html` loads (blank canvas until JS is written).

**Step 5: Commit**

```bash
git add concepts/rain-glass.html vite.config.js
git commit -m "feat: scaffold rain-glass concept page, replace garden"
```

---

## Task 2: RainGlassScene Class Skeleton

**Files:**
- Create: `js/concepts/rain-glass.js`

**Step 1: Create the scene class skeleton**

Follow the exact same pattern as `CloudAscentScene` in `js/concepts/cloud-ascent.js` but simplified (no parallax, no particles):

```js
// js/concepts/rain-glass.js — Rain on Glass Concept Demo
// Fullscreen shader: bright blurred background + procedural raindrops with refraction

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

class RainGlassScene {
  constructor() {
    this.canvas = document.getElementById('rain-glass-canvas');
    if (!this.canvas) return;

    this.isMobile = window.innerWidth < 768;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.time = 0;
    this.lastTimestamp = 0;

    // Touch burst state
    this.burstCenter = new THREE.Vector2(0, 0);
    this.burstStrength = 0;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: false,
      antialias: false
    });
    const maxPixelRatio = this.isMobile ? 2 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 0, 30);

    this.createRainShader();
    this.setupPostProcessing();
    this.setupInteraction();

    // Resize
    this._onResize = this._debounce(() => this.onResize(), 200);
    window.addEventListener('resize', this._onResize);
    this.onResize();

    // Start
    requestAnimationFrame((t) => this.animate(t));
  }

  createRainShader() {
    // TODO: Task 3 — background + drops shader
  }

  setupPostProcessing() {
    // TODO: Task 5 — bloom + composite
  }

  setupInteraction() {
    // TODO: Task 4 — touch burst only
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    if (this.composer) {
      this.composer.setSize(w, h);
      const halfW = Math.floor(w / 2);
      const halfH = Math.floor(h / 2);
      this.bloomPass.resolution.set(halfW, halfH);
    }
    if (this.rainMaterial) {
      this.rainMaterial.uniforms.uResolution.value.set(w, h);
    }
  }

  animate(timestamp = 0) {
    requestAnimationFrame((t) => this.animate(t));

    if (this.lastTimestamp === 0) this.lastTimestamp = timestamp;
    const delta = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;
    this.time += delta;

    // Decay touch burst
    this.burstStrength *= 0.94;
    if (this.burstStrength < 0.001) this.burstStrength = 0;

    // Update uniforms
    if (this.rainMaterial) {
      this.rainMaterial.uniforms.uTime.value = this.time;
      this.rainMaterial.uniforms.uBurstCenter.value.copy(this.burstCenter);
      this.rainMaterial.uniforms.uBurstStrength.value = this.burstStrength;
    }
    if (this.compositePass) {
      this.compositePass.uniforms.uTime.value = this.time;
    }

    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  _debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RainGlassScene();
});
```

**Step 2: Verify**

Run: `npm run dev`
Navigate to rain-glass page.
Expected: Page loads with blank/black canvas (shader not yet written), no JS errors in console.

**Step 3: Commit**

```bash
git add js/concepts/rain-glass.js
git commit -m "feat: add RainGlassScene class skeleton"
```

---

## Task 3: Rain Shader — Background + Drops + Refraction

**Files:**
- Modify: `js/concepts/rain-glass.js` — implement `createRainShader()`

This is the core task. The shader does everything in one fullscreen quad:
1. Renders a bright, warm blurred background (procedural — no texture needed)
2. Overlays multiple layers of procedural raindrops
3. Each drop refracts/distorts the background

### Rain Drop Algorithm

The approach (adapted from BigWIngs/Heartfelt technique):

**Grid-based drop placement:**
- Divide UV space into a grid (e.g., 10x6 cells)
- Each cell gets a random offset for its drop center (hash function)
- Each cell gets random: size, speed, phase, existence probability

**Individual drop shape:**
- SDF: `smoothstep` on distance from drop center
- Elongated vertically (drops are taller than wide)
- Slight bulge at bottom (gravity)

**Trailing drops:**
- A trail segment extends above the drop
- Trail thins as it goes up
- Trail fades over time (intermittent)

**Refraction:**
- Calculate a 2D "normal" vector pointing from fragment toward drop center
- Use this to offset the UV coordinates when sampling the background
- Creates a magnifying-lens distortion effect

**Multiple layers:**
- 2-3 layers at different grid scales for depth
- Smaller drops = further away = less refraction

### Shader Implementation

**Step 1: Implement `createRainShader()`**

```js
createRainShader() {
  const geo = new THREE.PlaneGeometry(2, 2);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uBurstCenter: { value: new THREE.Vector2(0, 0) },
      uBurstStrength: { value: 0 },
      uReducedMotion: { value: this.prefersReducedMotion ? 1.0 : 0.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.9999, 1.0);
      }
    `,
    fragmentShader: RAIN_FRAGMENT_SHADER,
    depthWrite: false,
    depthTest: false
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  this.rainMaterial = mat;
  this.scene.add(mesh);
}
```

The fragment shader (defined as a const string above the class):

```glsl
// --- Hash functions for randomness ---
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 hash22(vec2 p) {
  float n = hash21(p);
  return vec2(n, hash21(p + n));
}

// --- Simplex noise (same as other concepts) ---
// [Include NOISE_GLSL same as cloud-ascent.js]

// --- Single raindrop layer ---
// Returns vec3: xy = refraction offset, z = drop mask (for highlights)
vec3 rainLayer(vec2 uv, float gridScale, float timeScale, float t) {
  float anim = 1.0 - uReducedMotion;

  // Scale UV to create grid
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 st = uv * gridScale * aspect;

  // Cell ID and local UV
  vec2 id = floor(st);
  vec2 lv = fract(st) - 0.5; // -0.5 to 0.5

  // Per-cell randomness
  float n = hash21(id);
  float n2 = hash21(id + 100.0);

  // Only ~60% of cells have drops
  if (n > 0.6) return vec3(0.0);

  // Drop fall speed + phase
  float speed = 0.4 + n * 0.6;
  float phase = n2 * 6.283;

  // Drop Y position: falls down over time, wraps via fract
  float dropY = fract(t * speed * timeScale * anim + phase) * 2.0 - 1.0;

  // Random X offset within cell
  float dropX = (n2 - 0.5) * 0.6;

  // Drop center in local coords
  vec2 dropCenter = vec2(dropX, dropY);

  // Distance to drop (elongated: wider X, taller Y)
  vec2 toD = lv - dropCenter;
  toD.x *= 1.4; // Make drops wider relative to height
  float dist = length(toD);

  // Drop size (varies per cell)
  float dropSize = 0.04 + n * 0.04;

  // Main drop shape
  float drop = smoothstep(dropSize, dropSize * 0.5, dist);

  // Trail above the drop
  float trail = smoothstep(0.02, 0.0, abs(lv.x - dropX)); // thin vertical line
  trail *= smoothstep(dropCenter.y, dropCenter.y + 0.4, lv.y); // above drop only
  trail *= smoothstep(dropCenter.y + 0.4, dropCenter.y + 0.1, lv.y); // fade out
  trail *= 0.3; // subtle

  float mask = max(drop, trail);

  // Refraction: vector from fragment toward drop center, scaled by drop intensity
  vec2 refract = normalize(toD) * drop * 0.012;

  return vec3(refract, mask);
}

// --- Background: bright warm blurred scene ---
vec3 background(vec2 uv, float t) {
  // Warm, bright, slightly shifting colors — like out-of-focus daylight
  // Base: soft warm cream/blue gradient
  vec3 warmLight = vec3(0.95, 0.92, 0.85);   // warm cream
  vec3 coolLight = vec3(0.82, 0.88, 0.95);   // cool blue-white
  vec3 softGold = vec3(0.96, 0.93, 0.80);    // pale gold

  // Vertical gradient: warmer at top (light source), cooler at bottom
  vec3 bg = mix(coolLight, warmLight, smoothstep(0.0, 1.0, uv.y));

  // Soft blurred color patches (suggests out-of-focus scene)
  float n1 = snoise2(uv * 2.0 + t * 0.03) * 0.5 + 0.5;
  float n2 = snoise2(uv * 3.0 + vec2(50.0) + t * 0.02) * 0.5 + 0.5;

  bg = mix(bg, softGold, smoothstep(0.4, 0.7, n1) * 0.15);
  bg = mix(bg, coolLight, smoothstep(0.4, 0.7, n2) * 0.10);

  // Bright center glow (window light)
  vec2 center = vec2(0.5, 0.55);
  float glow = 1.0 - smoothstep(0.0, 0.6, distance(uv, center));
  glow = pow(glow, 2.0);
  bg = mix(bg, vec3(1.0, 0.98, 0.94), glow * 0.12);

  return bg;
}

// --- Main ---
void main() {
  vec2 uv = vUv;
  float t = uTime;

  // Sample background at refracted UV
  vec3 totalRefract = vec3(0.0);

  // Layer 1: Large drops (foreground)
  vec3 layer1 = rainLayer(uv, 8.0, 0.15, t);
  totalRefract += layer1;

  // Layer 2: Medium drops
  vec3 layer2 = rainLayer(uv + 0.5, 14.0, 0.12, t + 10.0);
  totalRefract += layer2 * 0.6;

  // Layer 3: Small drops (background, subtle)
  vec3 layer3 = rainLayer(uv + 0.25, 24.0, 0.08, t + 20.0);
  totalRefract += layer3 * 0.3;

  // Apply refraction to background UV
  vec2 refractedUV = uv + totalRefract.xy;
  vec3 color = background(refractedUV, t);

  // Highlight on drops (catch light)
  float highlight = totalRefract.z;
  color += vec3(1.0, 0.98, 0.95) * highlight * 0.3;

  // Touch burst ripple
  vec2 burstUV = vUv * 2.0 - 1.0;
  float burstDist = distance(burstUV, uBurstCenter);
  float ripple = smoothstep(0.04, 0.0, abs(burstDist - fract(t * 0.8) * 1.5) - 0.015) * uBurstStrength;
  color += vec3(1.0, 0.98, 0.94) * ripple * 0.15;

  // Subtle vignette
  vec2 vc = vUv - 0.5;
  float vDist = length(vc);
  float vignette = smoothstep(0.85, 0.35, vDist);
  color *= 0.90 + vignette * 0.10;

  gl_FragColor = vec4(color, 1.0);
}
```

**Key design decisions:**
- Background is **procedural** (no texture) — bright warm gradient + noise patches suggest an out-of-focus outdoor scene
- 3 drop layers at different scales for depth
- Each drop refracts the background by offsetting UV coordinates
- Drops have highlights where they "catch" light
- Trail streaks above each falling drop
- `prefers-reduced-motion`: drops stay in place, no falling animation

**Step 2: Verify**

Run: `npm run dev`, navigate to page.
Expected: Bright warm background with raindrops visible, drops fall down, refraction distorts background.

**Step 3: Tune and iterate**

This is where visual tuning happens. Key parameters to adjust:
- `gridScale` per layer (8, 14, 24) — controls drop density
- `dropSize` range — how big drops appear
- `speed` range — how fast drops fall
- Refraction strength (`0.012`) — how much distortion
- Background colors — brightness and warmth
- Trail opacity and width

**Step 4: Commit**

```bash
git add js/concepts/rain-glass.js
git commit -m "feat: implement rain shader with drops, refraction, and bright background"
```

---

## Task 4: Touch Interaction

**Files:**
- Modify: `js/concepts/rain-glass.js` — implement `setupInteraction()`

**Step 1: Implement touch burst (no parallax)**

```js
setupInteraction() {
  this.canvas.addEventListener('click', (e) => {
    this.burstCenter.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    this.burstStrength = 1.0;

    const hint = document.getElementById('tap-hint');
    if (hint) hint.classList.add('hidden');
  });

  this.canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.burstCenter.set(
        (touch.clientX / window.innerWidth) * 2 - 1,
        -(touch.clientY / window.innerHeight) * 2 + 1
      );
      this.burstStrength = 1.0;

      const hint = document.getElementById('tap-hint');
      if (hint) hint.classList.add('hidden');
    }
  }, { passive: true });
}
```

**Step 2: Verify**

Tap/click on the page.
Expected: Warm ripple expands from tap point.

**Step 3: Commit**

```bash
git add js/concepts/rain-glass.js
git commit -m "feat: add touch burst interaction for rain glass"
```

---

## Task 5: Post-Processing

**Files:**
- Modify: `js/concepts/rain-glass.js` — implement `setupPostProcessing()`

**Step 1: Add bloom + composite pass**

```js
setupPostProcessing() {
  const halfW = Math.floor(window.innerWidth / 2);
  const halfH = Math.floor(window.innerHeight / 2);

  this.composer = new EffectComposer(this.renderer);

  const renderPass = new RenderPass(this.scene, this.camera);
  this.composer.addPass(renderPass);

  // Bloom — gentle, catches drop highlights
  this.bloomPass = new UnrealBloomPass(
    new THREE.Vector2(halfW, halfH),
    0.3,    // strength — subtle
    0.8,    // radius
    0.88    // threshold — catches bright drop highlights
  );
  this.composer.addPass(this.bloomPass);

  // Composite: warm vignette + grain
  this.compositeShader = {
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uGrainIntensity: { value: 0.018 },
      uVignetteColor: { value: new THREE.Vector3(0.45, 0.42, 0.38) },
      uVignetteIntensity: { value: 0.15 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float uTime;
      uniform float uGrainIntensity;
      uniform vec3 uVignetteColor;
      uniform float uVignetteIntensity;
      varying vec2 vUv;

      float random(vec2 co) {
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);

        // Film grain
        float grain = random(vUv + uTime * 0.01) * uGrainIntensity;
        color.rgb += grain - uGrainIntensity * 0.5;

        // Warm vignette
        vec2 center = vUv - 0.5;
        float dist = length(center);
        float vignette = smoothstep(0.7, 0.3, dist);
        float vignetteEdge = 1.0 - vignette;
        color.rgb = mix(color.rgb, color.rgb * (1.0 - uVignetteIntensity) + uVignetteColor * uVignetteIntensity * 0.3, vignetteEdge);
        color.rgb *= mix(1.0 - uVignetteIntensity * 0.5, 1.0, vignette);

        gl_FragColor = color;
      }
    `
  };
  this.compositePass = new ShaderPass(this.compositeShader);
  this.composer.addPass(this.compositePass);
}
```

**Step 2: Verify**

Expected: Subtle bloom glow on drop highlights, warm vignette around edges, fine grain.

**Step 3: Commit**

```bash
git add js/concepts/rain-glass.js
git commit -m "feat: add post-processing (bloom, grain, vignette) to rain glass"
```

---

## Task 6: Polish + Verify

**Files:**
- Possibly tweak: `js/concepts/rain-glass.js`, `concepts/rain-glass.html`

**Step 1: Visual check on desktop**

- Background is bright and warm (not dark/moody)
- Drops are clearly visible with refraction distortion
- Drops trail down smoothly
- 3 depth layers are distinguishable
- Bloom catches highlights without blowing out
- Touch burst creates visible ripple

**Step 2: Mobile viewport check**

Resize to 375x812 (iPhone viewport).
- Canvas fills screen
- Touch interaction works
- Performance is smooth (no jank)
- Back button and text are readable
- Safe area insets respected

**Step 3: `prefers-reduced-motion` check**

- Drops should be visible but static (no falling animation)
- Background color patches don't shift

**Step 4: Build check**

Run: `npm run build`
Expected: Build succeeds, no errors.

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete rain-glass concept demo"
```

---

## Performance Budget

- Background: pure math (gradient + 2 noise samples) — very cheap
- Rain layers: 3 layers, each does grid math + hash + smoothstep — no texture lookups, moderate cost
- Post-processing: bloom at half-res + composite — same as other concepts
- **Total draw calls:** 1 (fullscreen quad) + 2 post-processing passes = 3
- **No noise functions in rain layers** — just hash + sin + smoothstep
- **Lightest of all concepts** if we keep to 3 rain layers

## Key Risk

The rain drop algorithm is the main unknown. The plan above provides a solid starting point based on proven techniques, but the exact parameters (grid scale, drop shape, refraction amount, trail behavior) will need visual tuning. The background is simple and should work immediately — all iteration will be on the drops.

## Reference Files
- `js/concepts/cloud-ascent.js` — class pattern template
- `concepts/cloud-ascent.html` — HTML template
- `vite.config.js` — build entry point

## Sources
- [Shadertoy Rain Drops Analysis](https://greentec.github.io/rain-drops-en/)
- [Rain Animation with WebGL in Three.js](https://dev.to/nordicbeaver/making-rain-animation-with-webgl-shaders-in-threejs-4ic5)
- [BigWIngs Heartfelt Shader](https://www.shadertoy.com/view/ltffzl)
