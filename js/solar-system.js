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

    // Theatre.js animation objects (will be set up after sheet is ready)
    this.theatreObjects = {};

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

    // Theatre.js controls (with delay to ensure sheet is ready)
    setTimeout(() => this.setupTheatreControls(), 500);

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

  setupTheatreControls() {
    if (!window.theatreSheet) {
      console.log('Theatre.js sheet not ready - using default values');
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

    console.log('Theatre.js controls connected');
  }

  updateCamera() {
    // Get Theatre.js values (with fallbacks)
    const cameraValues = this.theatreObjects.camera?.value || { easeStrength: 0.05 };

    // Smooth interpolation toward target
    this.scrollProgress += (this.targetProgress - this.scrollProgress) * cameraValues.easeStrength;

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

    // Get Theatre.js values (with fallbacks)
    const planetValues = this.theatreObjects.planets?.value || {
      glowIntensity: 0.2, bobAmount: 0.5, rotationSpeed: 0.002
    };
    const sunValues = this.theatreObjects.sun?.value || {
      pulseAmount: 0.02, pulseSpeed: 1
    };

    // Update camera based on scroll
    this.updateCamera();

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

    // Render with post-processing
    this.composer.render();
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.solarSystem = new SolarSystemScene();
});
