# Phase D: Detail Elevation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Elevate visual detail on hero elements (planets, sun) while maintaining performance. Add richer surface textures, sharper silhouettes, and subtle corona rays without over-engineering.

**Architecture:** All changes are shader modifications within existing `createPlanets()` and `createSun()` methods. No new files, no new dependencies. KISS principle applies - enhance what exists rather than rebuild.

**Tech Stack:** GLSL shaders (noise octaves, fresnel), Three.js MeshBasicMaterial + ShaderMaterial

---

## Task D1: Enhance Planet Shader - More Noise Octaves

**Files:**
- Modify: `js/solar-system.js:322-327` (planet fragment shader main function)

**Problem:** Current shader uses 3 noise octaves. Adding 2 more octaves at higher frequencies creates richer, more varied surface detail without significant GPU cost.

**Step 1: Add two more noise octaves**

Find in planetFragmentShader main() (around lines 322-327):
```glsl
      void main() {
        // Multi-layered noise for surface detail
        float n1 = snoise(vPosition * 0.15 + time * 0.02) * 0.5 + 0.5;
        float n2 = snoise(vPosition * 0.4 + time * 0.01) * 0.5 + 0.5;
        float n3 = snoise(vPosition * 0.8) * 0.5 + 0.5;
        float detail = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
```

Replace with:
```glsl
      void main() {
        // Multi-layered noise for surface detail (5 octaves for richer texture)
        float n1 = snoise(vPosition * 0.15 + time * 0.02) * 0.5 + 0.5;
        float n2 = snoise(vPosition * 0.4 + time * 0.01) * 0.5 + 0.5;
        float n3 = snoise(vPosition * 0.8) * 0.5 + 0.5;
        float n4 = snoise(vPosition * 1.6) * 0.5 + 0.5;
        float n5 = snoise(vPosition * 3.2) * 0.5 + 0.5;
        float detail = n1 * 0.35 + n2 * 0.25 + n3 * 0.2 + n4 * 0.12 + n5 * 0.08;
```

**Why these weights:** Lower octaves (large features) get more weight. Higher octaves (fine detail) get less weight but add texture richness. Total still sums to 1.0.

**Step 2: Commit**

```bash
git add js/solar-system.js
git commit -m "style: add 2 more noise octaves for richer planet surfaces

Expanded from 3 to 5 octaves with frequencies 0.15, 0.4, 0.8, 1.6, 3.2.
Weights adjusted (0.35, 0.25, 0.2, 0.12, 0.08) so large features dominate
while fine detail adds texture richness."
```

---

## Task D2: Sharpen Fresnel Rim

**Files:**
- Modify: `js/solar-system.js:329-330` (planet fragment shader fresnel)

**Problem:** Current fresnel power of 2.5 creates a soft rim. Increasing to 3.5 creates a crisper silhouette that makes planets "pop" against the starfield.

**Step 1: Increase fresnel power and intensity**

Find (around lines 329-330):
```glsl
        // Fresnel rim lighting
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
```

Replace with:
```glsl
        // Fresnel rim lighting - sharpened for crisp silhouettes
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.5);
```

**Step 2: Increase fresnel contribution**

Find (around line 334):
```glsl
        vec3 finalColor = mix(surfaceColor, glowColor, fresnel * 0.6);
```

Replace with:
```glsl
        vec3 finalColor = mix(surfaceColor, glowColor, fresnel * 0.7);
```

**Step 3: Commit**

```bash
git add js/solar-system.js
git commit -m "style: sharpen planet fresnel rim for crisp silhouettes

Increased fresnel power from 2.5 to 3.5 (tighter falloff) and
contribution from 0.6 to 0.7 (brighter rim). Planets now 'pop'
against the starfield with defined edges."
```

---

## Task D3: Add Planet Surface Color Variation

**Files:**
- Modify: `js/solar-system.js:332-334` (planet fragment shader color mixing)

**Problem:** Current shader applies uniform color variation. Adding position-based hue shift creates more organic, planetary surfaces with visible "terrain" variation.

**Step 1: Add color variation based on position**

Find (around lines 332-334):
```glsl
        // Combine base color with detail and rim
        vec3 surfaceColor = mix(baseColor * 0.7, baseColor * 1.3, detail);
        vec3 finalColor = mix(surfaceColor, glowColor, fresnel * 0.7);
```

Replace with:
```glsl
        // Add subtle hue variation based on position for terrain-like appearance
        float hueShift = snoise(vPosition * 0.3) * 0.1;
        vec3 variedBase = baseColor + vec3(hueShift, hueShift * 0.5, -hueShift * 0.3);

        // Combine varied base with detail and rim
        vec3 surfaceColor = mix(variedBase * 0.7, variedBase * 1.3, detail);
        vec3 finalColor = mix(surfaceColor, glowColor, fresnel * 0.7);
```

**Why this approach:** The hue shift adds slight warm/cool variation across the surface. The asymmetric RGB shift (1.0, 0.5, -0.3) creates subtle color temperature changes without going off-palette.

**Step 2: Commit**

```bash
git add js/solar-system.js
git commit -m "style: add subtle color variation across planet surfaces

Position-based hue shift creates terrain-like appearance with warm/cool
zones. Asymmetric RGB shift maintains blue palette while adding organic
visual interest."
```

---

## Task D4: Refine Sun with Corona Rays

**Files:**
- Modify: `js/solar-system.js:153-183` (createSun method)

**Problem:** Current sun is just layered spheres. Adding subtle radial corona rays makes it feel like an actual light source.

**Step 1: Create corona ray shader**

Find the createSun() method (lines 153-183). Replace the entire method with:

```javascript
  createSun() {
    const sunGroup = new THREE.Group();

    // Sun core - warm glow
    const sunGeometry = new THREE.SphereGeometry(40, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffe4c4,
      transparent: true,
      opacity: 0.5
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sun);

    // Sun glow layers - softer, more diffuse
    for (let i = 1; i <= 4; i++) {
      const glowGeometry = new THREE.SphereGeometry(40 * (1 + i * 0.3), 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffcc88,
        transparent: true,
        opacity: 0.05 / i,
        side: THREE.BackSide
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      sunGroup.add(glow);
    }

    // Corona rays - subtle radial glow
    const coronaGeometry = new THREE.PlaneGeometry(200, 200);
    const coronaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float angle = atan(center.y, center.x);

          // Radial rays with slight animation
          float rays = sin(angle * 8.0 + uTime * 0.2) * 0.5 + 0.5;
          rays = pow(rays, 3.0); // Sharpen rays

          // Falloff from center
          float falloff = 1.0 - smoothstep(0.0, 0.5, dist);
          falloff = pow(falloff, 2.0);

          // Combine
          float alpha = rays * falloff * 0.15;
          vec3 color = vec3(1.0, 0.9, 0.7); // Warm corona color

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    corona.userData.material = coronaMaterial; // Store reference for animation
    sunGroup.add(corona);
    this.sunCorona = corona; // Store reference

    // Position sun far in the background (end of journey)
    sunGroup.position.set(0, 0, -900);
    this.sun = sunGroup;
    this.scene.add(sunGroup);
  }
```

**Step 2: Animate corona in animate() method**

Find in animate() where sun is animated (around line 1355):
```javascript
    // Animate sun
    if (this.sun) {
      const pulse = 1 + Math.sin(this.time * config.sun.pulseSpeed) * config.sun.pulseAmount;
      this.sun.scale.set(pulse, pulse, pulse);
    }
```

Add after:
```javascript
    // Animate sun
    if (this.sun) {
      const pulse = 1 + Math.sin(this.time * config.sun.pulseSpeed) * config.sun.pulseAmount;
      this.sun.scale.set(pulse, pulse, pulse);
    }

    // Animate corona rays
    if (this.sunCorona && this.sunCorona.userData.material) {
      this.sunCorona.userData.material.uniforms.uTime.value = this.time;
    }
```

**Step 3: Commit**

```bash
git add js/solar-system.js
git commit -m "style: add subtle corona rays to sun

8-ray corona pattern with animated rotation. Radial falloff keeps rays
subtle and physically-inspired. Additive blending creates natural glow.
Stored reference for per-frame animation."
```

---

## Task D5: Adjust Bloom for Enhanced Scene

**Files:**
- Modify: `js/solar-system.js` (bloom settings in setupPostProcessing)

**Problem:** With brighter planet rims and sun corona, bloom threshold may need slight adjustment to avoid over-glow while maintaining luminosity.

**Step 1: Fine-tune bloom settings**

Find in setupPostProcessing() (around lines 830-835):
```javascript
    this.bloomPass = new window.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
      0.8,   // strength
      0.8,   // radius
      0.65   // threshold
    );
```

Adjust threshold slightly higher to prevent over-bloom on enhanced elements:
```javascript
    this.bloomPass = new window.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
      0.85,  // strength (slightly increased for corona visibility)
      0.8,   // radius
      0.7    // threshold (raised to prevent over-bloom on bright rims)
    );
```

**Step 2: Commit**

```bash
git add js/solar-system.js
git commit -m "style: fine-tune bloom for enhanced planet rims and corona

Strength 0.8→0.85 for corona visibility, threshold 0.65→0.7 to prevent
over-bloom on sharper planet rims. Maintains luminous feel without
washing out detail."
```

---

## Task D6: Code Simplifier Review

**Files:**
- Review: `js/solar-system.js`

**Step 1: Run code-simplifier agent**

Use the code-simplifier skill to review `js/solar-system.js` for:
- Redundant code introduced in Phase D
- Over-engineering in shader code
- Opportunities to simplify without losing functionality

**Step 2: Apply any suggested simplifications**

If the code-simplifier finds issues, fix them and commit:

```bash
git add js/solar-system.js
git commit -m "refactor: simplify Phase D code per code-simplifier review"
```

---

## Verification Checklist

After all tasks complete:

**Visual verification:**
- [ ] Planet surfaces have richer, more varied texture
- [ ] Planet silhouettes are crisp against starfield
- [ ] Planets show subtle color variation (not flat tone)
- [ ] Sun has visible but subtle corona rays
- [ ] Corona rays animate slowly
- [ ] Bloom doesn't wash out detail

**Performance verification:**
- [ ] DevTools Performance tab: frame times still consistent
- [ ] No shader compilation warnings in console
- [ ] Mobile performance unchanged

**Functional verification:**
- [ ] All planet stops work
- [ ] Scroll navigation unchanged
- [ ] No visual glitches during transitions

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `js/solar-system.js` | Planet shader (noise octaves, fresnel, color variation), createSun (corona rays), animate (corona animation), bloom settings |

---

## Rollback Plan

If shader issues occur:
1. Planet shader changes are isolated to `planetFragmentShader` string
2. Sun changes are isolated to `createSun()` method
3. Each commit is atomic - `git revert <sha>` for specific fix
