// js/solar-system.js - Solar System Navigation Scene
// Main scene with planets, sun, camera path, and navigation

export class SolarSystemScene {
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
        tintIntensity: { value: 0.08 }
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

  getConfig() {
    // Use window.animationConfig if available, otherwise defaults
    return window.animationConfig || {
      camera: { easeStrength: 0.05, transitionDuration: 1.5 },
      planets: { glowIntensity: 0.2, bobAmount: 0.5, rotationSpeed: 0.002 },
      sun: { pulseAmount: 0.02, pulseSpeed: 1 }
    };
  }

  setupTheatreControls() {
    // Animation config now handled by window.animationConfig
    // Theatre.js will be added when bundler is introduced
    console.log('Animation config loaded from window.animationConfig');
  }

  updateCamera() {
    // Get config values
    const config = this.getConfig();

    // Smooth interpolation toward target
    this.scrollProgress += (this.targetProgress - this.scrollProgress) * config.camera.easeStrength;

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

    // Get config values
    const config = this.getConfig();

    // Update camera based on scroll
    this.updateCamera();

    // Animate planets
    Object.values(this.planets).forEach((planet, i) => {
      planet.position.y = planet.userData.baseY + Math.sin(this.time * 0.5 + i) * config.planets.bobAmount;
      planet.rotation.y += config.planets.rotationSpeed;
    });

    // Animate sun
    if (this.sun) {
      const pulse = 1 + Math.sin(this.time * config.sun.pulseSpeed) * config.sun.pulseAmount;
      this.sun.scale.set(pulse, pulse, pulse);
    }

    // Update shader uniforms
    if (this.atmospherePass) {
      this.atmospherePass.uniforms.time.value = this.time;
    }

    // Render with post-processing
    this.composer.render();
  }
}
