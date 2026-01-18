# Homepage Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Gift Site homepage into an immersive, cinematic scroll experience with royal blue palette, Three.js ambient backgrounds, and GSAP-powered animations while preserving all existing content.

**Architecture:** Pure HTML/CSS/JS with external script files. Three.js canvas as persistent background layer. GSAP + ScrollTrigger for content animations. Lenis for smooth scrolling. No build process.

**Tech Stack:** HTML5, CSS3 (variables), GSAP 3.x, ScrollTrigger, Lenis, Three.js

---

## Phase 1: Foundation

### Task 1: Create Project Structure

**Files:**
- Create: `js/ambient.js`
- Create: `js/animations.js`
- Create: `css/main.css`

**Step 1: Create js directory and empty files**

```bash
mkdir -p js css
touch js/ambient.js js/animations.js css/main.css
```

**Step 2: Verify files exist**

```bash
ls -la js/ css/
```

Expected: Three files created

**Step 3: Commit scaffold**

```bash
git add js/ css/
git commit -m "chore: add js and css directory structure"
```

---

### Task 2: Set Up CSS Variables and Base Styles

**Files:**
- Modify: `css/main.css`

**Step 1: Write CSS variables and base reset**

```css
/* css/main.css - Gift Site Redesign */

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

  /* Typography */
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Outfit', -apple-system, sans-serif;

  /* Spacing */
  --section-padding: 0;
  --content-max-width: 1200px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: auto; /* Lenis handles this */
}

body {
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.75;
  background: var(--deep-navy);
  color: var(--off-white);
  overflow-x: hidden;
}

::selection {
  background: var(--blush);
  color: var(--deep-navy);
}

/* Smooth scroll container for Lenis */
html.lenis, html.lenis body {
  height: auto;
}

.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}

.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}

.lenis.lenis-stopped {
  overflow: hidden;
}

/* WebGL Canvas Layer */
#webgl-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

/* Content sits above canvas */
.content-wrapper {
  position: relative;
  z-index: 1;
}

/* Full viewport sections */
.section {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 6rem 3rem;
  position: relative;
}

/* Section tag styling */
.section-tag {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--blush);
  margin-bottom: 2rem;
}

.section-tag::before,
.section-tag::after {
  content: '';
  width: 40px;
  height: 1px;
  background: var(--blush);
  opacity: 0.5;
}

/* Typography */
h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 400;
  line-height: 1.1;
}

h1 {
  font-size: clamp(3rem, 8vw, 5.5rem);
}

h2 {
  font-size: clamp(2rem, 5vw, 3.5rem);
}

h3 {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
}

/* Accent text */
.accent {
  color: var(--blush);
}

.accent-italic {
  color: var(--blush);
  font-style: italic;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: var(--blush);
  color: var(--deep-navy);
}

.btn-primary:hover {
  background: var(--cream);
  transform: translateY(-2px);
  box-shadow: 0 10px 40px rgba(232, 196, 184, 0.2);
}

.btn-ghost {
  background: transparent;
  color: var(--off-white);
  border: 1.5px solid var(--soft-gray);
}

.btn-ghost:hover {
  border-color: var(--blush);
  color: var(--blush);
}

/* Navigation */
nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 1.5rem 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  transition: all 0.4s ease;
}

nav.scrolled {
  background: rgba(13, 25, 41, 0.9);
  backdrop-filter: blur(20px);
}

.logo {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 500;
  color: var(--off-white);
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-mark {
  width: 36px;
  height: 36px;
  background: var(--blush);
  border-radius: 50%;
  position: relative;
}

.logo-mark::before {
  content: '';
  position: absolute;
  inset: 6px;
  border: 2px solid var(--deep-navy);
  border-radius: 50%;
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
}

.nav-links a {
  font-size: 0.9rem;
  color: var(--soft-gray);
  text-decoration: none;
  padding: 0.5rem 0;
  position: relative;
  transition: color 0.3s ease;
}

.nav-links a::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--blush);
  transition: width 0.3s ease;
}

.nav-links a:hover {
  color: var(--off-white);
}

.nav-links a:hover::after {
  width: 100%;
}

/* Scroll indicator */
.scroll-indicator {
  position: absolute;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--soft-gray);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.scroll-line {
  width: 1px;
  height: 60px;
  background: linear-gradient(to bottom, var(--blush), transparent);
  animation: scrollPulse 2s ease-in-out infinite;
}

@keyframes scrollPulse {
  0%, 100% { opacity: 1; transform: scaleY(1); }
  50% { opacity: 0.5; transform: scaleY(0.8); }
}

/* Cards */
.card {
  background: rgba(26, 42, 74, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(232, 196, 184, 0.1);
  border-radius: 20px;
  padding: 2.5rem;
  transition: all 0.4s ease;
}

.card:hover {
  transform: translateY(-8px);
  border-color: rgba(232, 196, 184, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* Footer */
footer {
  background: var(--midnight);
  padding: 4rem 3rem 2rem;
  border-top: 1px solid rgba(232, 196, 184, 0.1);
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 3rem;
  max-width: var(--content-max-width);
  margin: 0 auto;
}

.footer-brand p {
  color: var(--soft-gray);
  font-size: 0.95rem;
  max-width: 300px;
  margin-top: 1rem;
}

.footer-col h4 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 1.25rem;
  color: var(--off-white);
}

.footer-col ul {
  list-style: none;
}

.footer-col li {
  margin-bottom: 0.5rem;
}

.footer-col a {
  color: var(--soft-gray);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.footer-col a:hover {
  color: var(--blush);
}

.footer-bottom {
  max-width: var(--content-max-width);
  margin: 3rem auto 0;
  padding-top: 2rem;
  border-top: 1px solid rgba(255,255,255,0.1);
  text-align: center;
  color: var(--soft-gray);
  font-size: 0.85rem;
}

/* Responsive */
@media (max-width: 900px) {
  nav {
    padding: 1rem 1.5rem;
  }

  .nav-links {
    display: none;
  }

  .section {
    padding: 4rem 1.5rem;
  }

  .footer-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
```

**Step 4: Commit CSS foundation**

```bash
git add css/main.css
git commit -m "feat: add CSS foundation with new color palette"
```

---

### Task 3: Create Three.js Ambient Background

**Files:**
- Modify: `js/ambient.js`

**Step 1: Write the Three.js gradient mesh and particle system**

```javascript
// js/ambient.js - Three.js Ambient Background
// Gradient mesh + particle field for immersive atmosphere

class AmbientBackground {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    if (!this.canvas) return;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true
    });

    this.mouse = { x: 0, y: 0 };
    this.scrollY = 0;
    this.time = 0;

    this.colors = {
      royalBlue: new THREE.Color(0x1a2a4a),
      deepNavy: new THREE.Color(0x0d1929),
      blush: new THREE.Color(0xe8c4b8),
      cream: new THREE.Color(0xf0ebe3)
    };

    this.init();
  }

  init() {
    // Renderer setup
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Camera position
    this.camera.position.z = 30;

    // Create elements
    this.createGradientMesh();
    this.createParticles();

    // Events
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // Start animation
    this.animate();
  }

  createGradientMesh() {
    // Create multiple gradient spheres for the mesh effect
    this.gradientMeshes = [];

    const meshConfigs = [
      { x: -15, y: 10, z: -20, scale: 25, color: this.colors.royalBlue, speed: 0.0003 },
      { x: 20, y: -5, z: -25, scale: 20, color: this.colors.blush, speed: 0.0004 },
      { x: 0, y: -15, z: -15, scale: 18, color: this.colors.deepNavy, speed: 0.0002 },
      { x: -10, y: 5, z: -30, scale: 30, color: this.colors.royalBlue, speed: 0.00025 }
    ];

    meshConfigs.forEach(config => {
      const geometry = new THREE.SphereGeometry(config.scale, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.3
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(config.x, config.y, config.z);
      mesh.userData = {
        originalX: config.x,
        originalY: config.y,
        speed: config.speed
      };

      this.scene.add(mesh);
      this.gradientMeshes.push(mesh);
    });
  }

  createParticles() {
    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50 - 10;
      sizes[i] = Math.random() * 2 + 0.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xfaf8f5,
      size: 0.5,
      transparent: true,
      opacity: 0.4,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(e) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }

  updateScroll(scrollY) {
    this.scrollY = scrollY;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.time += 0.01;

    // Animate gradient meshes
    this.gradientMeshes.forEach((mesh, i) => {
      const userData = mesh.userData;
      mesh.position.x = userData.originalX + Math.sin(this.time * userData.speed * 1000 + i) * 5;
      mesh.position.y = userData.originalY + Math.cos(this.time * userData.speed * 800 + i) * 3;

      // Mouse parallax
      mesh.position.x += this.mouse.x * 2;
      mesh.position.y += this.mouse.y * 2;

      // Scroll influence on opacity
      const scrollInfluence = Math.min(this.scrollY / 1000, 1);
      mesh.material.opacity = 0.3 - scrollInfluence * 0.1;
    });

    // Animate particles
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 3) {
        // Float upward
        positions[i + 1] += 0.02;

        // Reset when too high
        if (positions[i + 1] > 50) {
          positions[i + 1] = -50;
        }

        // Subtle horizontal drift
        positions[i] += Math.sin(this.time + i) * 0.005;
      }

      this.particles.geometry.attributes.position.needsUpdate = true;

      // Mouse parallax on particles
      this.particles.rotation.x = this.mouse.y * 0.1;
      this.particles.rotation.y = this.mouse.x * 0.1;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.ambientBg = new AmbientBackground();
});

// Export for Lenis integration
if (typeof module !== 'undefined') {
  module.exports = AmbientBackground;
}
```

**Step 2: Commit ambient background**

```bash
git add js/ambient.js
git commit -m "feat: add Three.js ambient background with gradient mesh and particles"
```

---

### Task 4: Create GSAP Animation System

**Files:**
- Modify: `js/animations.js`

**Step 1: Write the GSAP animation controller**

```javascript
// js/animations.js - GSAP Animation System
// Handles all scroll-triggered animations and interactions

class AnimationController {
  constructor() {
    this.init();
  }

  init() {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis smooth scroll
    this.initLenis();

    // Set up animations after a brief delay to ensure DOM is ready
    setTimeout(() => {
      this.initNavigation();
      this.initHeroAnimations();
      this.initScrollAnimations();
      this.initMagneticButtons();
    }, 100);
  }

  initLenis() {
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true
    });

    // Connect Lenis to GSAP ticker
    this.lenis.on('scroll', (e) => {
      ScrollTrigger.update();

      // Update Three.js background
      if (window.ambientBg) {
        window.ambientBg.updateScroll(e.scroll);
      }
    });

    gsap.ticker.add((time) => {
      this.lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  initNavigation() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    ScrollTrigger.create({
      start: 'top -100',
      onUpdate: (self) => {
        if (self.scroll() > 100) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      }
    });
  }

  initHeroAnimations() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Section tag
    tl.from('.hero .section-tag', {
      opacity: 0,
      y: 20,
      duration: 0.8
    });

    // Split headline into characters
    const headline = hero.querySelector('h1');
    if (headline) {
      const text = headline.innerHTML;
      const words = text.split(' ');
      headline.innerHTML = words.map(word => {
        if (word.includes('class=')) {
          return word;
        }
        return `<span class="word">${word}</span>`;
      }).join(' ');

      tl.from('.hero h1 .word, .hero h1 .accent-italic', {
        opacity: 0,
        y: 40,
        rotateX: -90,
        stagger: 0.05,
        duration: 0.8
      }, '-=0.4');
    }

    // Subtitle
    tl.from('.hero .subtitle', {
      opacity: 0,
      y: 20,
      duration: 0.6
    }, '-=0.3');

    // Buttons
    tl.from('.hero .btn', {
      opacity: 0,
      y: 20,
      stagger: 0.1,
      duration: 0.5
    }, '-=0.2');

    // Scroll indicator
    tl.from('.scroll-indicator', {
      opacity: 0,
      y: -20,
      duration: 0.5
    }, '-=0.2');

    // Hide scroll indicator on scroll
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      onUpdate: (self) => {
        const indicator = document.querySelector('.scroll-indicator');
        if (indicator) {
          indicator.style.opacity = 1 - self.progress * 2;
        }
      }
    });
  }

  initScrollAnimations() {
    // Problem/Why section - text reveal
    this.animateProblemSection();

    // Process section - card entrance
    this.animateProcessSection();

    // Quote section - scale and fade
    this.animateQuoteSection();

    // Audiences section - card scatter to grid
    this.animateAudiencesSection();

    // CTA section - final reveal
    this.animateCTASection();
  }

  animateProblemSection() {
    const section = document.querySelector('.problem-section');
    if (!section) return;

    const lines = section.querySelectorAll('.reveal-line');

    lines.forEach((line, i) => {
      gsap.from(line, {
        scrollTrigger: {
          trigger: line,
          start: 'top 80%',
          end: 'top 50%',
          scrub: 1
        },
        opacity: 0,
        y: 30
      });
    });

    // Shift text - warm phase
    const shiftText = section.querySelector('.shift-text');
    if (shiftText) {
      gsap.from(shiftText, {
        scrollTrigger: {
          trigger: shiftText,
          start: 'top 80%',
          end: 'top 40%',
          scrub: 1
        },
        opacity: 0,
        scale: 0.95
      });
    }
  }

  animateProcessSection() {
    const section = document.querySelector('.process-section');
    if (!section) return;

    // Header
    gsap.from('.process-section .section-header', {
      scrollTrigger: {
        trigger: '.process-section',
        start: 'top 70%'
      },
      opacity: 0,
      y: 30,
      duration: 0.8
    });

    // Progress line
    const progressLine = section.querySelector('.progress-line');
    if (progressLine) {
      gsap.from(progressLine, {
        scrollTrigger: {
          trigger: section,
          start: 'top 60%',
          end: 'bottom 60%',
          scrub: 1
        },
        scaleY: 0,
        transformOrigin: 'top'
      });
    }

    // Cards staggered entrance
    const cards = section.querySelectorAll('.process-card');
    cards.forEach((card, i) => {
      gsap.from(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top 80%'
        },
        opacity: 0,
        y: 50,
        duration: 0.6,
        delay: i * 0.15
      });

      // Animate inner elements
      gsap.from(card.querySelector('.process-num'), {
        scrollTrigger: {
          trigger: card,
          start: 'top 80%'
        },
        scale: 0,
        duration: 0.4,
        delay: i * 0.15 + 0.2
      });
    });
  }

  animateQuoteSection() {
    const section = document.querySelector('.quote-section');
    if (!section) return;

    gsap.from(section.querySelector('blockquote'), {
      scrollTrigger: {
        trigger: section,
        start: 'top 70%',
        end: 'top 30%',
        scrub: 1
      },
      opacity: 0,
      scale: 0.9
    });

    // Underline animation on emphasized word
    const underline = section.querySelector('.underline-animate');
    if (underline) {
      gsap.from(underline, {
        scrollTrigger: {
          trigger: section,
          start: 'top 50%'
        },
        width: 0,
        duration: 0.8,
        ease: 'power2.out'
      });
    }
  }

  animateAudiencesSection() {
    const section = document.querySelector('.audiences-section');
    if (!section) return;

    // Header
    gsap.from('.audiences-section .section-header', {
      scrollTrigger: {
        trigger: '.audiences-section',
        start: 'top 70%'
      },
      opacity: 0,
      y: 30,
      duration: 0.8
    });

    // Cards with scatter-to-grid effect
    const cards = section.querySelectorAll('.audience-card');
    cards.forEach((card, i) => {
      const randomRotate = (Math.random() - 0.5) * 10;
      const randomX = (Math.random() - 0.5) * 50;

      gsap.from(card, {
        scrollTrigger: {
          trigger: section,
          start: 'top 60%'
        },
        opacity: 0,
        y: 60,
        x: randomX,
        rotation: randomRotate,
        duration: 0.8,
        delay: i * 0.1,
        ease: 'power3.out'
      });
    });
  }

  animateCTASection() {
    const section = document.querySelector('.cta-section');
    if (!section) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 70%'
      }
    });

    tl.from(section.querySelector('h2'), {
      opacity: 0,
      y: 30,
      duration: 0.6
    });

    tl.from(section.querySelector('p'), {
      opacity: 0,
      y: 20,
      duration: 0.5
    }, '-=0.3');

    tl.from(section.querySelector('.btn'), {
      opacity: 0,
      scale: 0.9,
      duration: 0.5,
      ease: 'back.out(1.7)'
    }, '-=0.2');
  }

  initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn-magnetic');

    buttons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, {
          x: x * 0.3,
          y: y * 0.3,
          duration: 0.3,
          ease: 'power2.out'
        });
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.5)'
        });
      });
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.animationController = new AnimationController();
});
```

**Step 2: Commit animation system**

```bash
git add js/animations.js
git commit -m "feat: add GSAP animation controller with scroll triggers and Lenis"
```

---

### Task 5: Build Hero Section HTML

**Files:**
- Modify: `index.html`

**Step 1: Create the new index.html with hero section**

Replace entire index.html with new structure. Content preserved from original.

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

  <!-- Three.js -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>

  <!-- GSAP + Plugins -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>

  <!-- Lenis Smooth Scroll -->
  <script src="https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js"></script>
</head>
<body>
  <!-- WebGL Background -->
  <canvas id="webgl-canvas"></canvas>

  <!-- Content Wrapper -->
  <div class="content-wrapper">

    <!-- Navigation -->
    <nav>
      <a href="index.html" class="logo">
        <div class="logo-mark"></div>
        The Gift Site
      </a>
      <ul class="nav-links">
        <li><a href="why.html">Why We Exist</a></li>
        <li><a href="discover.html">Discover</a></li>
        <li><a href="process.html">The Process</a></li>
        <li><a href="facilitate.html">Facilitate</a></li>
        <li><a href="companion.html">Companion</a></li>
      </ul>
    </nav>

    <!-- Hero Section -->
    <section class="section hero">
      <span class="section-tag">Welcome</span>
      <h1>Uncover Your <span class="accent-italic">Gift</span></h1>
      <p class="subtitle">A gentle guide that supports reflection — and deepens interpersonal connection.</p>
      <div class="hero-actions">
        <a href="process.html" class="btn btn-primary btn-magnetic">Explore the Process</a>
        <a href="why.html" class="btn btn-ghost">Why This Matters</a>
      </div>
      <div class="scroll-indicator">
        <span>Scroll</span>
        <div class="scroll-line"></div>
      </div>
    </section>

    <!-- Problem/Why Section -->
    <section class="section problem-section">
      <div class="problem-content">
        <p class="reveal-line large">Every person carries within them a unique Gift.</p>
        <p class="reveal-line large">Yet many of us move through life without ever naming it.</p>
        <p class="reveal-line">We sense it in moments of flow, in the gratitude of others, in the quiet satisfaction of work that feels meaningful.</p>
        <p class="reveal-line muted">But we haven't found the words.</p>
      </div>
      <div class="shift-text">
        <p class="accent large">The Gift Site exists to help you discover and articulate what has always been true about you.</p>
      </div>
    </section>

    <!-- Process Section -->
    <section class="section process-section">
      <div class="section-header">
        <span class="section-tag">The Process</span>
        <h2>How Discovery Unfolds</h2>
        <p class="section-subtitle">This isn't a personality test. It's a process of reflection, dialogue, and mutual recognition.</p>
      </div>
      <div class="process-grid">
        <div class="progress-line"></div>
        <div class="process-card card">
          <span class="process-num">01</span>
          <h3>Reflect</h3>
          <p>Begin by looking inward. Consider the moments when you've felt most alive, most useful, most yourself.</p>
        </div>
        <div class="process-card card">
          <span class="process-num">02</span>
          <h3>Dialogue</h3>
          <p>Share your reflections with people who know you well. Listen as they affirm and refine what you've sensed about yourself.</p>
        </div>
        <div class="process-card card">
          <span class="process-num">03</span>
          <h3>Clarify</h3>
          <p>Name your Gift. Not as a label, but as a compass — something you can return to when making decisions.</p>
        </div>
      </div>
      <a href="process.html" class="btn btn-ghost process-cta">Explore the full process →</a>
    </section>

    <!-- Quote Section -->
    <section class="section quote-section">
      <div class="quote-mark">"</div>
      <blockquote>
        The real power of this work lives inside of <em class="underline-animate">dialogue</em> — hearing affirming reflections from others, face to face.
      </blockquote>
      <cite>— The heart of the Gift Process</cite>
    </section>

    <!-- Audiences Section -->
    <section class="section audiences-section">
      <div class="section-header">
        <span class="section-tag">Who It's For</span>
        <h2>Discover Together</h2>
      </div>
      <div class="audience-grid">
        <div class="audience-card card">
          <span class="audience-emoji">🌿</span>
          <h3>For Families</h3>
          <p>The Gift Process helps family members reflect on their own Gifts and appreciate the Gifts of one another.</p>
          <ul class="audience-list">
            <li>Prepare for family conversations</li>
            <li>Find words for what you sense but haven't expressed</li>
            <li>Listen more deeply to one another</li>
          </ul>
        </div>
        <div class="audience-card card">
          <span class="audience-emoji">🤝</span>
          <h3>For Teams</h3>
          <p>For teams, the Gift Process supports reflection and shared understanding before conversations take place.</p>
          <ul class="audience-list">
            <li>Clarify how you naturally contribute</li>
            <li>Recognize the Gifts you bring to group efforts</li>
            <li>Prepare for more meaningful dialogue</li>
          </ul>
        </div>
      </div>
      <a href="audiences.html" class="btn btn-ghost">Learn more about who this is for →</a>
    </section>

    <!-- CTA Section -->
    <section class="section cta-section">
      <h2>Ready to begin?</h2>
      <p>The Gift Process is designed to guide you through reflection, dialogue, and discovery.</p>
      <a href="discover.html" class="btn btn-primary btn-magnetic btn-large">Discover Your Gift</a>
    </section>

    <!-- Footer -->
    <footer>
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="logo">
            <div class="logo-mark"></div>
            The Gift Site
          </a>
          <p>A gentle guide that supports reflection — and deepens interpersonal connection.</p>
        </div>
        <div class="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><a href="why.html">Why We Exist</a></li>
            <li><a href="discover.html">Discover</a></li>
            <li><a href="process.html">The Process</a></li>
            <li><a href="facilitate.html">Facilitate</a></li>
            <li><a href="companion.html">Companion</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Connect</h4>
          <ul>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 The Gift Site. All Rights Reserved.</p>
      </div>
    </footer>

  </div>

  <!-- Scripts -->
  <script src="js/ambient.js"></script>
  <script src="js/animations.js"></script>
</body>
</html>
```

**Step 2: Add section-specific styles to main.css**

Append these section styles to `css/main.css`:

```css

/* ===================== */
/* SECTION-SPECIFIC STYLES */
/* ===================== */

/* Hero Section */
.hero {
  text-align: center;
  min-height: 100vh;
}

.hero h1 {
  max-width: 800px;
  margin-bottom: 1.5rem;
}

.hero .subtitle {
  font-size: 1.25rem;
  color: var(--soft-gray);
  max-width: 500px;
  margin-bottom: 2.5rem;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
}

/* Problem Section */
.problem-section {
  text-align: center;
  padding: 10rem 3rem;
}

.problem-content {
  max-width: 700px;
  margin-bottom: 4rem;
}

.problem-content .reveal-line {
  margin-bottom: 1.5rem;
  color: var(--soft-gray);
}

.problem-content .reveal-line.large {
  font-family: var(--font-display);
  font-size: 1.8rem;
  color: var(--off-white);
  line-height: 1.4;
}

.problem-content .reveal-line.muted {
  opacity: 0.6;
}

.shift-text {
  max-width: 600px;
}

.shift-text .large {
  font-family: var(--font-display);
  font-size: 1.6rem;
  line-height: 1.5;
}

/* Process Section */
.process-section {
  padding: 8rem 3rem;
}

.process-section .section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.process-section .section-subtitle {
  color: var(--soft-gray);
  font-size: 1.1rem;
  max-width: 600px;
  margin: 1rem auto 0;
}

.process-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  max-width: 1100px;
  margin: 0 auto 3rem;
  position: relative;
}

.progress-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--blush), transparent);
  transform: translateX(-50%);
  display: none; /* Hidden on desktop, show on mobile */
}

.process-card {
  text-align: left;
}

.process-num {
  font-family: var(--font-display);
  font-size: 3rem;
  color: var(--blush);
  opacity: 0.3;
  line-height: 1;
  margin-bottom: 1rem;
}

.process-card h3 {
  margin-bottom: 1rem;
  color: var(--off-white);
}

.process-card p {
  color: var(--soft-gray);
  font-size: 0.95rem;
  line-height: 1.7;
}

.process-cta {
  display: block;
  text-align: center;
  margin-top: 2rem;
}

/* Quote Section */
.quote-section {
  padding: 10rem 3rem;
  text-align: center;
  position: relative;
}

.quote-mark {
  position: absolute;
  top: 15%;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-display);
  font-size: 15rem;
  color: var(--blush);
  opacity: 0.05;
  line-height: 1;
  pointer-events: none;
}

.quote-section blockquote {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  font-style: italic;
  max-width: 800px;
  margin: 0 auto 2rem;
  line-height: 1.4;
  position: relative;
}

.quote-section blockquote em {
  font-style: normal;
  color: var(--blush);
  position: relative;
}

.quote-section blockquote em::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--blush);
}

.quote-section cite {
  font-family: var(--font-body);
  font-size: 1rem;
  font-style: normal;
  color: var(--soft-gray);
}

/* Audiences Section */
.audiences-section {
  padding: 8rem 3rem;
}

.audiences-section .section-header {
  text-align: center;
  margin-bottom: 4rem;
}

.audience-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto 3rem;
}

.audience-card {
  text-align: left;
}

.audience-emoji {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  display: block;
}

.audience-card h3 {
  margin-bottom: 1rem;
  color: var(--off-white);
}

.audience-card > p {
  color: var(--soft-gray);
  margin-bottom: 1.5rem;
}

.audience-list {
  list-style: none;
  margin-bottom: 1rem;
}

.audience-list li {
  padding: 0.4rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: var(--off-white);
  font-size: 0.95rem;
}

.audience-list li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: var(--blush);
}

.audiences-section > .btn {
  display: block;
  text-align: center;
  max-width: fit-content;
  margin: 0 auto;
}

/* CTA Section */
.cta-section {
  text-align: center;
  padding: 10rem 3rem;
  position: relative;
}

.cta-section h2 {
  margin-bottom: 1rem;
}

.cta-section p {
  color: var(--soft-gray);
  font-size: 1.2rem;
  max-width: 500px;
  margin: 0 auto 2.5rem;
}

.btn-large {
  padding: 1.25rem 3rem;
  font-size: 1.1rem;
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .process-grid {
    grid-template-columns: 1fr;
    max-width: 500px;
  }

  .progress-line {
    display: block;
    left: 2rem;
  }

  .process-card {
    padding-left: 2rem;
  }

  .audience-grid {
    grid-template-columns: 1fr;
  }

  .problem-content .reveal-line.large {
    font-size: 1.4rem;
  }

  .shift-text .large {
    font-size: 1.3rem;
  }
}
```

**Step 3: Verify the page loads in browser**

Open `index.html` in browser, check:
- WebGL background visible
- Animations trigger on scroll
- All sections display correctly

**Step 4: Commit Phase 1 completion**

```bash
git add index.html css/main.css
git commit -m "feat: implement complete homepage redesign with all sections"
```

---

## Phase 2: Testing and Polish

### Task 6: Test and Refine Animations

**Files:**
- Modify: `js/animations.js` (if needed)
- Modify: `css/main.css` (if needed)

**Step 1: Test in browser**

Open index.html and verify:
- [ ] Hero section animations play on load
- [ ] Scroll indicator appears and fades on scroll
- [ ] Problem section text reveals on scroll
- [ ] Process cards animate in staggered
- [ ] Quote scales and fades correctly
- [ ] Audience cards scatter-to-grid effect works
- [ ] CTA section animates
- [ ] Magnetic buttons work on hover
- [ ] Three.js background responds to mouse
- [ ] Navigation gets background on scroll

**Step 2: Test responsive**

Resize browser to mobile width:
- [ ] Single column layouts
- [ ] Readable text sizes
- [ ] Touch-friendly buttons

**Step 3: Commit any fixes**

```bash
git add .
git commit -m "fix: polish animations and responsive behavior"
```

---

### Task 7: Push and Create PR

**Step 1: Push all changes**

```bash
git push origin homepage-redesign
```

**Step 2: Verify deployment preview (if available)**

Check GitHub Pages preview or local testing.

**Step 3: Create PR when ready**

```bash
gh pr create --title "Homepage Redesign: Immersive Blue Theme" --body "$(cat <<'EOF'
## Summary
- Complete visual overhaul of homepage with royal blue + blush palette
- Three.js ambient background with gradient mesh and particles
- GSAP scroll-triggered animations throughout
- Lenis smooth scrolling
- Six full-viewport sections with cinematic reveals

## Changes
- New CSS architecture with CSS variables
- Three.js canvas layer (js/ambient.js)
- GSAP animation controller (js/animations.js)
- Restructured index.html with new sections

## Test Plan
- [ ] Open in Chrome, Firefox, Safari
- [ ] Test scroll animations
- [ ] Test responsive layouts
- [ ] Verify Three.js performance
- [ ] Check navigation links

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Execution Checklist

- [ ] Task 1: Create project structure
- [ ] Task 2: Set up CSS variables and base styles
- [ ] Task 3: Create Three.js ambient background
- [ ] Task 4: Create GSAP animation system
- [ ] Task 5: Build complete HTML structure
- [ ] Task 6: Test and refine
- [ ] Task 7: Push and create PR
