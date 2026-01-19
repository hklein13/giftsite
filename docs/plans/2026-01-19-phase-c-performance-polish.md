# Phase C: Performance & Quick Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply targeted performance micro-optimizations (10-20% CPU reduction) and subtle visual polish refinements that create an unmistakable "premium feel" without adding complexity.

**Architecture:** All changes are isolated modifications to `js/solar-system.js` and one fog line in `init()`. No new files, no new dependencies. Each fix is independent and can be verified in isolation.

**Tech Stack:** Three.js (Vector3 reuse, FogExp2), vanilla JavaScript (delta time, config caching)

---

## Phase C1: Performance Micro-Optimizations

### Task C1.1: Cache Config Object

**Files:**
- Modify: `js/solar-system.js:35` (constructor properties)
- Modify: `js/solar-system.js:1313` (animate method)

**Problem:** `getConfig()` is called every frame (line 1313) but the config object never changes at runtime. This creates unnecessary function call overhead and object property access 60 times per second.

**Step 1: Add cached config in constructor**

Find (around line 35-36):
```javascript
    this.time = 0;
    this.starFrameCounter = 0;
```

Add after:
```javascript
    this.time = 0;
    this.starFrameCounter = 0;
    this.config = this.getConfig(); // Cache config - never changes at runtime
```

**Step 2: Use cached config in animate()**

Find (line 1313):
```javascript
    const config = this.getConfig();
```

Replace with:
```javascript
    const config = this.config;
```

**Step 3: Verify**

Run: `npm run dev` (should already be running)
- Scroll through planets
- Expected: No visual change, same behavior

**Step 4: Commit**

```bash
git add js/solar-system.js
git commit -m "perf: cache config object to avoid per-frame function calls

getConfig() was called 60x/second but config never changes at runtime.
Now cached in constructor, eliminating unnecessary overhead."
```

---

### Task C1.2: Reuse Vector3 for lookAt

**Files:**
- Modify: `js/solar-system.js:35` (constructor properties)
- Modify: `js/solar-system.js:1193-1194` (updateCamera method)

**Problem:** A new `THREE.Vector3()` is allocated every frame in `updateCamera()` (line 1193). This creates garbage collection pressure - 60 allocations/second that must be cleaned up.

**Step 1: Add reusable Vector3 in constructor**

Find (around line 36-37):
```javascript
    this.config = this.getConfig(); // Cache config - never changes at runtime
```

Add after:
```javascript
    this.config = this.getConfig(); // Cache config - never changes at runtime
    this._lookAtTarget = new THREE.Vector3(); // Reusable vector for camera lookAt
```

**Step 2: Reuse the vector in updateCamera()**

Find (lines 1193-1194):
```javascript
    const lookAtTarget = new THREE.Vector3().lerpVectors(currentStop.lookAt, nextStop.lookAt, stopProgress);
    this.camera.lookAt(lookAtTarget);
```

Replace with:
```javascript
    this._lookAtTarget.lerpVectors(currentStop.lookAt, nextStop.lookAt, stopProgress);
    this.camera.lookAt(this._lookAtTarget);
```

**Step 3: Verify**

- Scroll through planets
- Expected: Identical camera movement, no visual change

**Step 4: Commit**

```bash
git add js/solar-system.js
git commit -m "perf: reuse Vector3 for camera lookAt to reduce GC pressure

Previously allocated new Vector3 every frame (60x/second).
Now reuses cached vector, eliminating garbage collection overhead."
```

---

### Task C1.3: Use Delta Time for Frame-Rate Independence

**Files:**
- Modify: `js/solar-system.js:35` (constructor properties)
- Modify: `js/solar-system.js:143` (init method - animate call)
- Modify: `js/solar-system.js:1301-1304` (animate method signature and time update)

**Problem:** The fixed `0.016` timestep (line 1304) assumes 60fps. On 120Hz displays (iPhone Pro, iPad Pro, gaming monitors), animations run at 2x speed. On throttled devices, they slow down.

**Step 1: Add lastTimestamp in constructor**

Find (around line 37):
```javascript
    this._lookAtTarget = new THREE.Vector3(); // Reusable vector for camera lookAt
```

Add after:
```javascript
    this._lookAtTarget = new THREE.Vector3(); // Reusable vector for camera lookAt
    this.lastTimestamp = 0; // For delta time calculation
```

**Step 2: Update init() to pass timestamp**

Find (line 143):
```javascript
    this.animate();
```

Replace with:
```javascript
    requestAnimationFrame((t) => this.animate(t));
```

**Step 3: Update animate() method signature and time calculation**

Find (lines 1301-1304):
```javascript
  animate() {
    requestAnimationFrame(() => this.animate());

    this.time += 0.016;
```

Replace with:
```javascript
  animate(timestamp = 0) {
    requestAnimationFrame((t) => this.animate(t));

    // Delta time: frame-rate independent, capped at 100ms to handle tab switches
    const delta = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;
    this.time += delta;
```

**Step 4: Verify**

- Scroll through planets on various devices if available
- Expected: Same animation speed regardless of display refresh rate
- Star twinkle, planet bob, nebula movement should feel identical to before

**Step 5: Commit**

```bash
git add js/solar-system.js
git commit -m "perf: use delta time for frame-rate independent animations

Fixed 0.016 timestep broke on 120Hz displays (2x speed) and lagged on
throttled devices. Now calculates actual time between frames, capped at
100ms to handle tab switches gracefully."
```

---

### Task C1.4: Half-Resolution Atmosphere Pass

**Files:**
- Modify: `js/solar-system.js:908` (after atmospherePass creation)
- Modify: `js/solar-system.js:1298` (onResize method)

**Problem:** The atmosphere post-processing shader runs at full resolution with 3 texture lookups per pixel (main + chromatic aberration R/B). At 1920x1080, that's 6.2 million texture samples per frame. Half resolution reduces this by 75%.

**Step 1: Set initial half resolution after atmospherePass creation**

Find (line 908):
```javascript
    this.atmospherePass = new window.ShaderPass(atmosphereShader);
    this.composer.addPass(this.atmospherePass);
```

Add after:
```javascript
    this.atmospherePass = new window.ShaderPass(atmosphereShader);
    this.atmospherePass.setSize(window.innerWidth / 2, window.innerHeight / 2);
    this.composer.addPass(this.atmospherePass);
```

**Step 2: Update resolution on resize**

Find (line 1298):
```javascript
    // Update bloom pass to maintain half-resolution optimization
    this.bloomPass.resolution.set(window.innerWidth / 2, window.innerHeight / 2);
```

Add after:
```javascript
    // Update bloom pass to maintain half-resolution optimization
    this.bloomPass.resolution.set(window.innerWidth / 2, window.innerHeight / 2);
    // Update atmosphere pass to maintain half-resolution optimization
    if (this.atmospherePass && this.atmospherePass.setSize) {
      this.atmospherePass.setSize(window.innerWidth / 2, window.innerHeight / 2);
    }
```

**Step 3: Verify**

- Resize browser window
- Expected: Film grain and vignette still visible, slightly softer (intended)
- Performance should improve, especially on mobile

**Step 4: Commit**

```bash
git add js/solar-system.js
git commit -m "perf: run atmosphere pass at half resolution

Atmosphere shader has 3 texture lookups per pixel (main + chromatic R/B).
Half resolution reduces texture samples by 75%. Film grain and vignette
remain effective at lower resolution - actually looks more filmic."
```

---

## Phase C2: Quick Visual Polish

### Task C2.1: Add Distance Fog

**Files:**
- Modify: `js/solar-system.js:121` (init method, after createBackgroundGradient)

**Problem:** Objects in the far distance appear as sharp as nearby objects, which flattens the sense of depth. Subtle exponential fog creates atmospheric perspective.

**Step 1: Add fog to scene**

Find (line 121):
```javascript
    this.createBackgroundGradient();
    this.setupPostProcessing();
```

Add between:
```javascript
    this.createBackgroundGradient();

    // Subtle distance fog for atmospheric depth
    this.scene.fog = new THREE.FogExp2(0x0d1929, 0.0008);

    this.setupPostProcessing();
```

**Step 2: Verify**

- Scroll to view distant planets
- Expected: Subtle fade toward dark blue-gray in the far background
- Planets should still be clearly visible, just with atmospheric haze at distance

**Step 3: Commit**

```bash
git add js/solar-system.js
git commit -m "style: add subtle distance fog for atmospheric depth

Exponential fog (0x0d1929 at 0.0008 density) creates atmospheric
perspective - distant objects subtly fade, adding depth perception
without obscuring the visual elements."
```

---

### Task C2.2: Reduce Planet Bob Amount

**Files:**
- Modify: `js/solar-system.js:1061` (getConfig method)

**Problem:** Planets bob up/down with `bobAmount: 0.5`, which feels slightly toy-like. Reducing to 0.15 creates a more subtle, premium "breathing" motion.

**Step 1: Reduce bobAmount in getConfig()**

Find (line 1061):
```javascript
      planets: { glowIntensity: 0.2, bobAmount: 0.5, rotationSpeed: 0.002 },
```

Replace with:
```javascript
      planets: { glowIntensity: 0.2, bobAmount: 0.15, rotationSpeed: 0.002 },
```

**Step 2: Verify**

- Watch planet motion
- Expected: Subtle, almost imperceptible vertical drift - "breathing" not "bouncing"

**Step 3: Commit**

```bash
git add js/solar-system.js
git commit -m "style: reduce planet bob for subtler motion

Reduced bobAmount from 0.5 to 0.15. Creates gentle 'breathing' feel
instead of noticeable bouncing. Hallmark of polish: motion you feel
but can't quite explain."
```

---

### Task C2.3: Enhanced Camera Easing (Distance-Adaptive)

**Files:**
- Modify: `js/solar-system.js:1175-1177` (updateCamera method)

**Problem:** Fixed `easeStrength: 0.04` creates uniform camera movement regardless of distance. Distance-adaptive easing accelerates over longer jumps and decelerates smoothly at arrival.

**Step 1: Replace fixed easing with distance-adaptive easing**

Find (lines 1175-1177):
```javascript
    // Smooth interpolation toward target (higher value = faster snap)
    const easeStrength = 0.04;
    this.scrollProgress += (this.targetProgress - this.scrollProgress) * easeStrength;
```

Replace with:
```javascript
    // Distance-adaptive easing: faster for larger jumps, smoother arrival
    const distance = Math.abs(this.targetProgress - this.scrollProgress);
    const easeStrength = 0.03 + distance * 0.05;
    this.scrollProgress += (this.targetProgress - this.scrollProgress) * easeStrength;
```

**Step 2: Verify**

- Click dots to jump multiple planets
- Expected: Longer jumps feel faster in the middle, all arrivals feel smooth
- Short transitions should feel similar to before

**Step 3: Commit**

```bash
git add js/solar-system.js
git commit -m "style: distance-adaptive camera easing for premium feel

Base ease 0.03 + distance * 0.05 means longer jumps accelerate more,
while short hops stay gentle. All arrivals smooth - the 'weight' you
feel in premium UI transitions."
```

---

### Task C2.4: Camera-Based Star Parallax

**Files:**
- Modify: `js/solar-system.js:1352-1358` (animate method, star parallax section)

**Problem:** Current star parallax only responds to mouse position. Adding camera-position-based parallax creates depth as you scroll through the scene - stars at different distances move at different rates.

**Step 1: Add camera position parallax to stars**

Find (lines 1352-1358):
```javascript
    // Update star parallax uniforms (desktop only)
    if (!this.isMobile && this.starGroups) {
      this.starGroups.forEach((stars) => {
        stars.material.uniforms.uMousePosition.value.set(this.mousePosition.x, this.mousePosition.y);
        stars.material.uniforms.uParallaxStrength.value = this.motionSettings.mouseParallaxStrength;
      });
    }
```

Replace with:
```javascript
    // Update star parallax - camera position creates depth as you scroll
    if (this.starGroups) {
      this.starGroups.forEach((stars, i) => {
        // Layer-specific parallax factor (far stars move less)
        const parallaxFactor = [0.05, 0.1, 0.15][i] || 0.05;
        stars.position.x = -this.camera.position.x * parallaxFactor;
        stars.position.y = -this.camera.position.y * parallaxFactor;

        // Mouse parallax (desktop only) - still works on top of camera parallax
        if (!this.isMobile) {
          stars.material.uniforms.uMousePosition.value.set(this.mousePosition.x, this.mousePosition.y);
          stars.material.uniforms.uParallaxStrength.value = this.motionSettings.mouseParallaxStrength;
        }
      });
    }
```

**Step 2: Verify**

- Scroll through planets
- Expected: Stars at different layers drift at different rates
- Creates subtle 3D depth perception as camera moves through space

**Step 3: Commit**

```bash
git add js/solar-system.js
git commit -m "style: add camera-based star parallax for depth perception

Star layers now move inversely to camera position with different
parallax factors (0.05, 0.1, 0.15). Creates dimensional depth as
you scroll - far stars drift less than near stars."
```

---

## Verification Checklist

After all tasks complete:

**Performance verification:**
- [ ] DevTools Performance tab: frame times consistent (no spikes)
- [ ] Mobile test: scroll feels responsive
- [ ] No console errors

**Visual verification:**
- [ ] Fog visible in far background (subtle blue haze)
- [ ] Planet motion is gentle, not bouncy
- [ ] Camera transitions feel weighted, smooth arrivals
- [ ] Star layers create depth perception when scrolling
- [ ] Film grain/vignette still visible (slightly softer from half-res)

**Functional verification:**
- [ ] All planet stops work
- [ ] Visit buttons navigate correctly
- [ ] Dot navigation works
- [ ] Touch scroll works on mobile
- [ ] Mouse scroll works on desktop

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `js/solar-system.js` | Cache config (constructor + animate), reuse Vector3 (constructor + updateCamera), delta time (constructor + init + animate), half-res atmosphere (setupPostProcessing + onResize), fog (init), reduce bob (getConfig), adaptive easing (updateCamera), camera parallax (animate) |

---

## Rollback Plan

All changes are isolated. If issues occur:
1. `git log --oneline -8` to see commits
2. `git revert <commit-sha>` for specific fix
3. Or `git reset --soft HEAD~N` to undo last N commits

Each commit is atomic and independent - no cascading dependencies.
