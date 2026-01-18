# Solar System Homepage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Gift Site homepage into an immersive solar system navigation hub with four planets, scroll/click navigation, preview cards, and premium visual effects.

**Architecture:** Three.js scene with camera path navigation, HTML overlay cards for content, Theatre.js for animation control, VFX-JS for text effects. Minimal npm setup (no bundler), libraries loaded via CDN + local node_modules.

**Tech Stack:** Three.js, GSAP, Lenis, Theatre.js, VFX-JS, custom GLSL shaders

---

## Phase 1: Project Setup

### Task 1: Initialize npm and Install Dependencies

**Files:**
- Create: `package.json`
- Modify: `.gitignore`

**Step 1: Initialize npm**

Run:
```bash
cd C:\Users\HarrisonKlein\Downloads\giftsite-main
npm init -y
```

**Step 2: Install dependencies**

Run:
```bash
npm install @theatre/core @theatre/studio vfx-js
```

**Step 3: Update .gitignore**

Add to `.gitignore`:
```
node_modules/
js/theatre-state.json
```

**Step 4: Verify installation**

Run:
```bash
ls node_modules/@theatre
ls node_modules/vfx-js
```
Expected: Directories exist

**Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: initialize npm, add Theatre.js and VFX-JS dependencies"
```

---

### Task 2: Create Base HTML Structure for Solar System

**Files:**
- Modify: `index.html`

**Step 1: Back up current index.html**

Run:
```bash
cp index.html index-backup.html
```

**Step 2: Rewrite index.html with solar system structure**

Replace contents of `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Gift Site — Discover Your Gift</title>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet">

  <!-- Styles -->
  <link rel="stylesheet" href="css/main.css">

  <!-- Three.js + Post-Processing -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/postprocessing/EffectComposer.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/postprocessing/RenderPass.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/postprocessing/UnrealBloomPass.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/postprocessing/ShaderPass.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/shaders/LuminosityHighPassShader.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.134.0/examples/js/shaders/CopyShader.js"></script>

  <!-- GSAP + Plugins -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>

  <!-- Lenis Smooth Scroll -->
  <script src="https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js"></script>
</head>
<body>
  <!-- WebGL Canvas -->
  <canvas id="solar-system-canvas"></canvas>

  <!-- Scroll Container (creates scroll height) -->
  <div id="scroll-container"></div>

  <!-- Navigation (always visible) -->
  <nav>
    <a href="index.html" class="logo">
      <div class="logo-mark"></div>
      The Gift Site
    </a>
    <ul class="nav-links">
      <li><a href="why.html" data-planet="why">Why We Exist</a></li>
      <li><a href="discover.html" data-planet="discover">Discover</a></li>
      <li><a href="process.html" data-planet="process">The Process</a></li>
      <li><a href="facilitate.html" data-planet="facilitate">Facilitate</a></li>
      <li><a href="companion.html">Companion</a></li>
    </ul>
  </nav>

  <!-- Planet Preview Cards -->
  <div class="planet-cards">
    <!-- Why Planet Card -->
    <div class="planet-card" id="card-why">
      <h2>Why We Exist</h2>
      <p>Every person carries within them a unique Gift. Yet many of us move through life without ever naming it.</p>
      <a href="why.html" class="btn btn-primary">Visit Why We Exist</a>
    </div>

    <!-- Discover Planet Card -->
    <div class="planet-card" id="card-discover">
      <h2>Discover Your Gift</h2>
      <p>Begin the journey of uncovering what has always been true about you.</p>
      <a href="discover.html" class="btn btn-primary">Visit Discover</a>
    </div>

    <!-- Process Planet Card -->
    <div class="planet-card" id="card-process">
      <h2>The Process</h2>
      <p>A method of reflection, dialogue, and mutual recognition that reveals your Gift.</p>
      <a href="process.html" class="btn btn-primary">Visit The Process</a>
    </div>

    <!-- Facilitate Planet Card -->
    <div class="planet-card" id="card-facilitate">
      <h2>Facilitate</h2>
      <p>For those called to guide others through their own Gift discovery journey.</p>
      <a href="facilitate.html" class="btn btn-primary">Visit Facilitate</a>
    </div>
  </div>

  <!-- Scroll Progress Indicator -->
  <div class="scroll-indicator">
    <div class="planet-dots">
      <span class="dot active" data-planet="overview"></span>
      <span class="dot" data-planet="why"></span>
      <span class="dot" data-planet="discover"></span>
      <span class="dot" data-planet="process"></span>
      <span class="dot" data-planet="facilitate"></span>
    </div>
  </div>

  <!-- Scripts -->
  <script src="js/ambient.js"></script>
  <script src="js/solar-system.js"></script>
  <script src="js/animations.js"></script>
</body>
</html>
```

**Step 3: Verify file saved**

Run:
```bash
head -50 index.html
```

**Step 4: Commit**

```bash
git add index.html index-backup.html
git commit -m "feat: restructure index.html for solar system navigation"
```

---

### Task 3: Update CSS for Solar System Layout

**Files:**
- Modify: `css/main.css`

**Step 1: Add solar system specific styles to end of main.css**

Append to `css/main.css`:

```css
/* ===================== */
/* SOLAR SYSTEM HOMEPAGE */
/* ===================== */

/* Canvas fills viewport */
#solar-system-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* Scroll container creates scrollable height */
#scroll-container {
  height: 500vh; /* 5x viewport for scroll travel */
  pointer-events: none;
}

/* Planet Preview Cards */
.planet-cards {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.planet-card {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(13, 25, 41, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(232, 196, 184, 0.15);
  border-radius: 24px;
  padding: 3rem;
  max-width: 420px;
  text-align: center;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.6s ease, visibility 0.6s ease;
}

.planet-card.active {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}

.planet-card h2 {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 400;
  margin-bottom: 1rem;
  color: var(--off-white);
}

.planet-card p {
  color: var(--soft-gray);
  font-size: 1.05rem;
  line-height: 1.7;
  margin-bottom: 2rem;
}

.planet-card .btn {
  pointer-events: auto;
}

/* Scroll Progress Indicator */
.scroll-indicator {
  position: fixed;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
}

.planet-dots {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.planet-dots .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.planet-dots .dot:hover {
  background: rgba(255, 255, 255, 0.6);
}

.planet-dots .dot.active {
  background: var(--blush);
  box-shadow: 0 0 10px var(--blush);
}

/* Navigation updates for solar system */
nav {
  background: transparent;
  backdrop-filter: none;
}

nav.scrolled {
  background: rgba(13, 25, 41, 0.9);
  backdrop-filter: blur(20px);
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .planet-card {
    max-width: 90%;
    padding: 2rem;
  }

  .planet-card h2 {
    font-size: 1.6rem;
  }

  .scroll-indicator {
    right: 1rem;
  }

  .planet-dots .dot {
    width: 8px;
    height: 8px;
  }

  #scroll-container {
    height: 400vh; /* Less scroll on mobile */
  }
}
```

**Step 2: Commit**

```bash
git add css/main.css
git commit -m "feat: add CSS styles for solar system layout and planet cards"
```

---

## Phase 2: Core Solar System Scene

### Task 4: Create Solar System Scene File

**Files:**
- Create: `js/solar-system.js`

**Step 1: Create the solar system scene**

Create `js/solar-system.js`:

```javascript
// js/solar-system.js - Solar System Navigation Scene
// Main scene with planets, sun, camera path, and navigation

class SolarSystemScene {
  constructor() {
    this.canvas = document.getElementById('solar-system-canvas');
    if (!this.canvas) return;

    // Three.js basics
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });

    // State
    this.scrollProgress = 0;
    this.targetProgress = 0;
    this.currentPlanet = 'overview';
    this.planets = {};
    this.time = 0;

    // Planet configurations
    this.planetConfigs = {
      why: {
        position: new THREE.Vector3(40, 10, 0),
        radius: 12,
        color: 0x1a2a5a,
        glowColor: 0x3a6aee,
        orbitRadius: 50
      },
      discover: {
        position: new THREE.Vector3(-50, -5, 20),
        radius: 14,
        color: 0x2a4a7a,
        glowColor: 0x5abaff,
        orbitRadius: 80
      },
      process: {
        position: new THREE.Vector3(60, -20, 40),
        radius: 10,
        color: 0x3a3a6a,
        glowColor: 0x7a6aee,
        orbitRadius: 110
      },
      facilitate: {
        position: new THREE.Vector3(-40, 15, 60),
        radius: 11,
        color: 0x2a4a5a,
        glowColor: 0x4abaaa,
        orbitRadius: 140
      }
    };

    // Camera path stops (0 = overview, then each planet)
    this.cameraStops = [
      { pos: new THREE.Vector3(0, 0, 180), lookAt: new THREE.Vector3(0, 0, 0) },      // Overview
      { pos: new THREE.Vector3(60, 20, 40), lookAt: new THREE.Vector3(40, 10, 0) },   // Why
      { pos: new THREE.Vector3(-70, 5, 60), lookAt: new THREE.Vector3(-50, -5, 20) }, // Discover
      { pos: new THREE.Vector3(80, -10, 80), lookAt: new THREE.Vector3(60, -20, 40) },// Process
      { pos: new THREE.Vector3(-60, 25, 100), lookAt: new THREE.Vector3(-40, 15, 60) }// Facilitate
    ];

    this.init();
  }

  init() {
    // Renderer setup
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Initial camera position
    this.camera.position.copy(this.cameraStops[0].pos);
    this.camera.lookAt(this.cameraStops[0].lookAt);

    // Build scene
    this.createSun();
    this.createPlanets();
    this.createOrbitalPaths();
    this.createStarfield();
    this.setupPostProcessing();

    // Event listeners
    window.addEventListener('resize', () => this.onResize());
    this.setupScrollListener();
    this.setupClickListeners();

    // Start render loop
    this.animate();
  }

  createSun() {
    const sunGroup = new THREE.Group();

    // Sun core
    const sunGeometry = new THREE.SphereGeometry(15, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xfff8e8,
      transparent: true,
      opacity: 0.95
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sun);

    // Sun glow layers
    for (let i = 1; i <= 4; i++) {
      const glowGeometry = new THREE.SphereGeometry(15 * (1 + i * 0.15), 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.15 / i,
        side: THREE.BackSide
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      sunGroup.add(glow);
    }

    sunGroup.position.set(0, 0, 0);
    this.sun = sunGroup;
    this.scene.add(sunGroup);
  }

  createPlanets() {
    Object.entries(this.planetConfigs).forEach(([name, config]) => {
      const planetGroup = new THREE.Group();

      // Planet core
      const geometry = new THREE.SphereGeometry(config.radius, 64, 64);
      const material = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.95
      });
      const planet = new THREE.Mesh(geometry, material);
      planetGroup.add(planet);

      // Atmosphere glow layers
      for (let i = 1; i <= 3; i++) {
        const glowGeometry = new THREE.SphereGeometry(config.radius * (1 + i * 0.12), 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: config.glowColor,
          transparent: true,
          opacity: 0.2 / i,
          side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        planetGroup.add(glow);
      }

      // Position planet
      planetGroup.position.copy(config.position);
      planetGroup.userData = { name, config, baseY: config.position.y };

      this.planets[name] = planetGroup;
      this.scene.add(planetGroup);
    });
  }

  createOrbitalPaths() {
    // Subtle orbital rings
    Object.values(this.planetConfigs).forEach(config => {
      const curve = new THREE.EllipseCurve(0, 0, config.orbitRadius, config.orbitRadius * 0.6);
      const points = curve.getPoints(100);
      const geometry = new THREE.BufferGeometry().setFromPoints(
        points.map(p => new THREE.Vector3(p.x, 0, p.y))
      );
      const material = new THREE.LineBasicMaterial({
        color: 0x4a6a8a,
        transparent: true,
        opacity: 0.15
      });
      const orbit = new THREE.Line(geometry, material);
      orbit.rotation.x = Math.PI / 2;
      this.scene.add(orbit);
    });
  }

  createStarfield() {
    const starCount = 500;
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 600;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 600;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 600;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });

    this.stars = new THREE.Points(geometry, material);
    this.scene.add(this.stars);
  }

  setupPostProcessing() {
    this.composer = new THREE.EffectComposer(this.renderer);

    const renderPass = new THREE.RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.0,
      0.8,
      0.6
    );
    this.composer.addPass(this.bloomPass);
  }

  setupScrollListener() {
    // Use Lenis for smooth scroll
    this.lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true
    });

    this.lenis.on('scroll', (e) => {
      const scrollContainer = document.getElementById('scroll-container');
      const maxScroll = scrollContainer.offsetHeight - window.innerHeight;
      this.targetProgress = Math.min(1, Math.max(0, e.scroll / maxScroll));
    });

    // Lenis RAF
    const raf = (time) => {
      this.lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  setupClickListeners() {
    // Click on nav links to jump to planets
    document.querySelectorAll('[data-planet]').forEach(el => {
      el.addEventListener('click', (e) => {
        const planet = el.dataset.planet;
        if (planet && this.planetConfigs[planet]) {
          e.preventDefault();
          this.jumpToPlanet(planet);
        }
      });
    });

    // Click on dots
    document.querySelectorAll('.planet-dots .dot').forEach((dot, index) => {
      dot.addEventListener('click', () => {
        this.jumpToStop(index);
      });
    });
  }

  jumpToPlanet(planetName) {
    const planetNames = ['overview', 'why', 'discover', 'process', 'facilitate'];
    const index = planetNames.indexOf(planetName);
    if (index !== -1) {
      this.jumpToStop(index);
    }
  }

  jumpToStop(index) {
    const targetProgress = index / (this.cameraStops.length - 1);
    this.targetProgress = targetProgress;

    // Update scroll position to match
    const scrollContainer = document.getElementById('scroll-container');
    const maxScroll = scrollContainer.offsetHeight - window.innerHeight;
    const targetScroll = targetProgress * maxScroll;
    this.lenis.scrollTo(targetScroll, { duration: 1.5 });
  }

  updateCamera() {
    // Smooth interpolation toward target
    this.scrollProgress += (this.targetProgress - this.scrollProgress) * 0.05;

    // Determine which stop we're at or between
    const numStops = this.cameraStops.length;
    const exactStop = this.scrollProgress * (numStops - 1);
    const stopIndex = Math.floor(exactStop);
    const stopProgress = exactStop - stopIndex;

    // Get current and next stop
    const currentStop = this.cameraStops[Math.min(stopIndex, numStops - 1)];
    const nextStop = this.cameraStops[Math.min(stopIndex + 1, numStops - 1)];

    // Interpolate camera position
    this.camera.position.lerpVectors(currentStop.pos, nextStop.pos, stopProgress);

    // Interpolate look-at target
    const lookAtTarget = new THREE.Vector3().lerpVectors(currentStop.lookAt, nextStop.lookAt, stopProgress);
    this.camera.lookAt(lookAtTarget);

    // Update current planet state
    this.updateCurrentPlanet(exactStop);
  }

  updateCurrentPlanet(exactStop) {
    const planetNames = ['overview', 'why', 'discover', 'process', 'facilitate'];
    const threshold = 0.3; // How close to stop to trigger

    let newPlanet = 'overview';
    const roundedStop = Math.round(exactStop);

    if (Math.abs(exactStop - roundedStop) < threshold) {
      newPlanet = planetNames[roundedStop] || 'overview';
    }

    if (newPlanet !== this.currentPlanet) {
      this.currentPlanet = newPlanet;
      this.updateUI();
    }
  }

  updateUI() {
    // Update planet cards
    document.querySelectorAll('.planet-card').forEach(card => {
      card.classList.remove('active');
    });
    if (this.currentPlanet !== 'overview') {
      const activeCard = document.getElementById(`card-${this.currentPlanet}`);
      if (activeCard) activeCard.classList.add('active');
    }

    // Update dots
    const planetNames = ['overview', 'why', 'discover', 'process', 'facilitate'];
    document.querySelectorAll('.planet-dots .dot').forEach((dot, index) => {
      dot.classList.toggle('active', planetNames[index] === this.currentPlanet);
    });
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.time += 0.016;

    // Update camera based on scroll
    this.updateCamera();

    // Animate planets (gentle bob)
    Object.values(this.planets).forEach((planet, i) => {
      planet.position.y = planet.userData.baseY + Math.sin(this.time * 0.5 + i) * 0.5;
      planet.rotation.y += 0.002;
    });

    // Animate sun pulse
    if (this.sun) {
      const pulse = 1 + Math.sin(this.time) * 0.02;
      this.sun.scale.set(pulse, pulse, pulse);
    }

    // Render with post-processing
    this.composer.render();
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.solarSystem = new SolarSystemScene();
});
```

**Step 2: Verify file created**

Run:
```bash
wc -l js/solar-system.js
```
Expected: ~280 lines

**Step 3: Commit**

```bash
git add js/solar-system.js
git commit -m "feat: create core solar system scene with planets, sun, and camera navigation"
```

---

### Task 5: Update Ambient.js for Background Elements

**Files:**
- Modify: `js/ambient.js`

**Step 1: Simplify ambient.js to only handle background elements**

The solar system scene now handles planets. Ambient.js becomes a support file for nebula and additional atmosphere. For now, we can disable it to avoid conflicts.

Create simplified `js/ambient.js`:

```javascript
// js/ambient.js - Background atmosphere support
// Nebula and additional atmospheric effects (integrated with solar-system.js)

// Currently disabled - solar-system.js handles all scene elements
// This file reserved for future nebula/atmosphere enhancements

console.log('ambient.js loaded - reserved for atmosphere enhancements');
```

**Step 2: Commit**

```bash
git add js/ambient.js
git commit -m "refactor: simplify ambient.js, scene now handled by solar-system.js"
```

---

### Task 6: Update Animations.js for Basic Functionality

**Files:**
- Modify: `js/animations.js`

**Step 1: Simplify animations.js for solar system context**

Replace `js/animations.js`:

```javascript
// js/animations.js - GSAP Animations for Solar System Homepage
// Handles nav state and basic UI animations

class AnimationController {
  constructor() {
    this.init();
  }

  init() {
    gsap.registerPlugin(ScrollTrigger);

    setTimeout(() => {
      this.initNavigation();
      this.initIntroAnimation();
    }, 100);
  }

  initNavigation() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    // Nav background on scroll
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }

  initIntroAnimation() {
    // Fade in nav and UI elements on load
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.from('nav', {
      opacity: 0,
      y: -20,
      duration: 1,
      delay: 0.5
    });

    tl.from('.scroll-indicator', {
      opacity: 0,
      x: 20,
      duration: 0.8
    }, '-=0.5');
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.animationController = new AnimationController();
});
```

**Step 2: Commit**

```bash
git add js/animations.js
git commit -m "refactor: simplify animations.js for solar system context"
```

---

## Phase 3: Theatre.js Integration

### Task 7: Add Theatre.js to the Project

**Files:**
- Modify: `index.html`
- Create: `js/theatre-setup.js`

**Step 1: Add Theatre.js script tags to index.html**

Add before closing `</body>` tag, before other scripts:

```html
  <!-- Theatre.js -->
  <script src="node_modules/@theatre/core/dist/index.js"></script>
  <script src="node_modules/@theatre/studio/dist/index.js"></script>
  <script src="js/theatre-setup.js"></script>

  <!-- Other Scripts -->
  <script src="js/ambient.js"></script>
```

**Step 2: Create Theatre.js setup file**

Create `js/theatre-setup.js`:

```javascript
// js/theatre-setup.js - Theatre.js Studio Setup
// Visual animation control for the solar system

// Initialize Theatre.js Studio
TheatreStudio.initialize();

// Create project
const project = TheatreCore.getProject('GiftSite');

// Create sheet for solar system
const solarSystemSheet = project.sheet('SolarSystem');

// Export for use in other files
window.theatreProject = project;
window.theatreSheet = solarSystemSheet;

// Keyboard shortcut to toggle studio (Ctrl + \)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === '\\') {
    TheatreStudio.ui.isHidden ? TheatreStudio.ui.restore() : TheatreStudio.ui.hide();
  }
});

console.log('Theatre.js initialized. Press Ctrl+\\ to toggle studio.');
```

**Step 3: Commit**

```bash
git add index.html js/theatre-setup.js
git commit -m "feat: add Theatre.js studio integration"
```

---

### Task 8: Connect Theatre.js to Camera Animation

**Files:**
- Modify: `js/solar-system.js`

**Step 1: Add Theatre.js animation objects to solar-system.js**

Add after the class definition starts (inside constructor, after state variables):

```javascript
    // Theatre.js animation objects (will be set up after sheet is ready)
    this.theatreObjects = {};
```

Add new method to the class:

```javascript
  setupTheatreControls() {
    if (!window.theatreSheet) {
      console.warn('Theatre.js sheet not ready');
      return;
    }

    const sheet = window.theatreSheet;

    // Camera flight controls
    this.theatreObjects.camera = sheet.object('Camera', {
      transitionDuration: TheatreCore.types.number(1.5, { range: [0.5, 4] }),
      easeStrength: TheatreCore.types.number(0.05, { range: [0.01, 0.2] })
    });

    // Planet glow controls
    this.theatreObjects.planets = sheet.object('Planets', {
      glowIntensity: TheatreCore.types.number(0.2, { range: [0.05, 0.5] }),
      bobAmount: TheatreCore.types.number(0.5, { range: [0, 2] }),
      rotationSpeed: TheatreCore.types.number(0.002, { range: [0, 0.01] })
    });

    // Sun controls
    this.theatreObjects.sun = sheet.object('Sun', {
      pulseAmount: TheatreCore.types.number(0.02, { range: [0, 0.1] }),
      pulseSpeed: TheatreCore.types.number(1, { range: [0.5, 3] })
    });
  }
```

Call this method in `init()` after scene is built:

```javascript
    // After setupClickListeners()
    setTimeout(() => this.setupTheatreControls(), 500);
```

Update the `animate()` method to use Theatre.js values:

```javascript
  animate() {
    requestAnimationFrame(() => this.animate());

    this.time += 0.016;

    // Get Theatre.js values (with fallbacks)
    const planetValues = this.theatreObjects.planets?.value || {
      glowIntensity: 0.2, bobAmount: 0.5, rotationSpeed: 0.002
    };
    const sunValues = this.theatreObjects.sun?.value || {
      pulseAmount: 0.02, pulseSpeed: 1
    };
    const cameraValues = this.theatreObjects.camera?.value || {
      easeStrength: 0.05
    };

    // Update camera with Theatre.js ease value
    this.scrollProgress += (this.targetProgress - this.scrollProgress) * cameraValues.easeStrength;

    // ... rest of updateCamera logic ...

    // Animate planets with Theatre.js values
    Object.values(this.planets).forEach((planet, i) => {
      planet.position.y = planet.userData.baseY + Math.sin(this.time * 0.5 + i) * planetValues.bobAmount;
      planet.rotation.y += planetValues.rotationSpeed;
    });

    // Animate sun with Theatre.js values
    if (this.sun) {
      const pulse = 1 + Math.sin(this.time * sunValues.pulseSpeed) * sunValues.pulseAmount;
      this.sun.scale.set(pulse, pulse, pulse);
    }

    this.composer.render();
  }
```

**Step 2: Commit**

```bash
git add js/solar-system.js
git commit -m "feat: connect Theatre.js controls to camera and planet animations"
```

---

## Phase 4: VFX-JS Text Effects

### Task 9: Add VFX-JS for Text Distortion

**Files:**
- Modify: `index.html`
- Create: `js/vfx.js`

**Step 1: Add VFX-JS script to index.html**

Add after Theatre.js scripts:

```html
  <!-- VFX-JS -->
  <script src="node_modules/vfx-js/dist/vfx.js"></script>
  <script src="js/vfx.js"></script>
```

**Step 2: Create VFX.js setup file**

Create `js/vfx.js`:

```javascript
// js/vfx.js - VFX-JS Text Effects
// Gentle distortion on reveal for planet card headlines

class TextEffects {
  constructor() {
    this.vfx = null;
    this.init();
  }

  init() {
    // Wait for VFX-JS to be available
    if (typeof VFX === 'undefined') {
      console.warn('VFX-JS not loaded');
      return;
    }

    this.vfx = new VFX();
    this.setupCardEffects();
    this.observeCards();
  }

  setupCardEffects() {
    // Apply wave shader to all planet card headlines
    document.querySelectorAll('.planet-card h2').forEach(headline => {
      this.vfx.add(headline, {
        shader: 'rgbShift',
        overflow: 50,
        amplitude: 0.02,
        speed: 2
      });
    });
  }

  observeCards() {
    // Watch for card visibility changes to trigger/reset effects
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const card = mutation.target;
          const headline = card.querySelector('h2');

          if (card.classList.contains('active') && headline) {
            // Card became visible - effect is already running via VFX-JS
            this.triggerRevealEffect(headline);
          }
        }
      });
    });

    document.querySelectorAll('.planet-card').forEach(card => {
      observer.observe(card, { attributes: true });
    });
  }

  triggerRevealEffect(headline) {
    // Add a temporary intensity boost, then settle
    // This creates the "reveal then settle" effect
    gsap.fromTo(headline,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out'
      }
    );
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Small delay to ensure VFX-JS is loaded
  setTimeout(() => {
    window.textEffects = new TextEffects();
  }, 100);
});
```

**Step 3: Commit**

```bash
git add index.html js/vfx.js
git commit -m "feat: add VFX-JS text effects for planet card headlines"
```

---

## Phase 5: Enhanced Post-Processing

### Task 10: Add Advanced Shader Effects

**Files:**
- Modify: `js/solar-system.js`

**Step 1: Enhance the post-processing pipeline**

Update the `setupPostProcessing()` method in `js/solar-system.js`:

```javascript
  setupPostProcessing() {
    this.composer = new THREE.EffectComposer(this.renderer);

    // Render pass
    const renderPass = new THREE.RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Bloom pass
    this.bloomPass = new THREE.UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.0,   // strength
      0.8,   // radius
      0.6    // threshold
    );
    this.composer.addPass(this.bloomPass);

    // Custom film grain + vignette + noise distortion shader
    const atmosphereShader = {
      uniforms: {
        tDiffuse: { value: null },
        time: { value: 0 },
        grainIntensity: { value: 0.06 },
        vignetteIntensity: { value: 0.35 },
        noiseDistortion: { value: 0.001 },
        tintColor: { value: new THREE.Vector3(0.1, 0.15, 0.25) },
        tintIntensity: { value: 0.1 }
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
        uniform float time;
        uniform float grainIntensity;
        uniform float vignetteIntensity;
        uniform float noiseDistortion;
        uniform vec3 tintColor;
        uniform float tintIntensity;
        varying vec2 vUv;

        // Noise function
        float random(vec2 co) {
          return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
        }

        // Simplex-ish noise for distortion
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = random(i);
          float b = random(i + vec2(1.0, 0.0));
          float c = random(i + vec2(0.0, 1.0));
          float d = random(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main() {
          // Subtle noise-based UV distortion
          vec2 distortedUv = vUv;
          distortedUv.x += noise(vUv * 10.0 + time * 0.1) * noiseDistortion;
          distortedUv.y += noise(vUv * 10.0 + time * 0.1 + 100.0) * noiseDistortion;

          vec4 color = texture2D(tDiffuse, distortedUv);

          // Film grain
          float grain = random(vUv + time * 0.01) * grainIntensity;
          color.rgb += grain - grainIntensity * 0.5;

          // Vignette
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float vignette = smoothstep(0.7, 0.3, dist);
          vignette = mix(1.0 - vignetteIntensity, 1.0, vignette);
          color.rgb *= vignette;

          // Subtle blue tint
          color.rgb = mix(color.rgb, color.rgb + tintColor, tintIntensity);

          // Subtle chromatic aberration at edges
          float aberration = dist * 0.002;
          color.r = texture2D(tDiffuse, distortedUv + vec2(aberration, 0.0)).r;
          color.b = texture2D(tDiffuse, distortedUv - vec2(aberration, 0.0)).b;

          gl_FragColor = color;
        }
      `
    };

    this.atmospherePass = new THREE.ShaderPass(atmosphereShader);
    this.composer.addPass(this.atmospherePass);
  }
```

**Step 2: Update animate() to pass time uniform**

Add to the animate method:

```javascript
    // Update shader uniforms
    if (this.atmospherePass) {
      this.atmospherePass.uniforms.time.value = this.time;
    }
```

**Step 3: Commit**

```bash
git add js/solar-system.js
git commit -m "feat: add enhanced post-processing with noise distortion and atmosphere"
```

---

## Phase 6: Testing and Polish

### Task 11: Test the Implementation

**Step 1: Start local server**

Run:
```bash
cd C:\Users\HarrisonKlein\Downloads\giftsite-main
npx serve .
```

**Step 2: Open in browser**

Navigate to `http://localhost:3000`

**Step 3: Test checklist**

- [ ] Solar system scene renders with sun and 4 planets
- [ ] Scrolling moves camera between planets smoothly
- [ ] Clicking dots jumps to correct planet
- [ ] Planet cards appear/disappear at correct positions
- [ ] Nav links work (both data-planet and regular href)
- [ ] Theatre.js studio opens with Ctrl+\
- [ ] Post-processing effects visible (bloom, grain, vignette)
- [ ] No console errors

**Step 4: Document any issues**

Create issues list if needed for follow-up tasks.

---

### Task 12: Final Commit and Summary

**Step 1: Check git status**

Run:
```bash
git status
```

**Step 2: Commit any remaining changes**

```bash
git add .
git commit -m "feat: complete solar system homepage implementation"
```

**Step 3: Summary**

Implementation complete. The solar system homepage includes:
- Central sun with 4 orbiting planets (Why, Discover, Process, Facilitate)
- Scroll and click navigation between planets
- Preview cards with "Visit" buttons at each stop
- Theatre.js studio for visual animation tuning (Ctrl+\)
- VFX-JS text effects on headlines
- Enhanced post-processing (bloom, grain, vignette, noise distortion)

---

## Verification Checklist

1. [ ] npm packages installed (@theatre/core, @theatre/studio, vfx-js)
2. [ ] Solar system renders with sun + 4 planets
3. [ ] Camera smoothly navigates between stops on scroll
4. [ ] Click navigation works (dots and nav links)
5. [ ] Planet cards fade in/out correctly
6. [ ] Theatre.js studio accessible via Ctrl+\
7. [ ] VFX-JS effects on card headlines
8. [ ] Post-processing visible (bloom on sun/planets, grain, vignette)
9. [ ] Mobile-responsive (cards resize, scroll works)
10. [ ] All pages still accessible via Visit buttons
