// js/solar-system.js - Solar System Navigation Scene
// Main scene with planets, sun, camera path, and navigation

export class SolarSystemScene {
  // Debounce utility
  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  constructor() {
    this.canvas = document.getElementById('solar-system-canvas');
    if (!this.canvas) return;

    // Three.js basics
    this.scene = new THREE.Scene();
    // Use wider FOV on mobile so planets appear smaller/more distant
    const isMobile = window.innerWidth < 768;
    const baseFOV = isMobile ? 85 : 60;
    this.camera = new THREE.PerspectiveCamera(baseFOV, window.innerWidth / window.innerHeight, 0.1, 2000);
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
    this.starFrameCounter = 0;

    // Theatre.js animation objects (will be set up after sheet is ready)
    this.theatreObjects = {};

    // Planet configurations - LINEAR PATH into the distance
    // Planets arranged along z-axis with slight x/y offsets for visual interest
    this.planetConfigs = {
      why: {
        position: new THREE.Vector3(15, 5, -150),
        radius: 14,
        color: 0x1a2a5a,
        glowColor: 0x3a6aee
      },
      discover: {
        position: new THREE.Vector3(-20, -8, -300),
        radius: 16,
        color: 0x2a4a7a,
        glowColor: 0x5abaff
      },
      process: {
        position: new THREE.Vector3(25, 10, -450),
        radius: 12,
        color: 0x3a3a6a,
        glowColor: 0x7a6aee
      },
      facilitate: {
        position: new THREE.Vector3(-15, -5, -600),
        radius: 13,
        color: 0x2a4a5a,
        glowColor: 0x4abaaa
      }
    };

    // Camera path stops - LINEAR FORWARD journey
    // Start at hero, then travel forward to each planet
    this.cameraStops = [
      { pos: new THREE.Vector3(0, 0, 80), lookAt: new THREE.Vector3(0, 0, -200) },       // Hero (overview)
      { pos: new THREE.Vector3(15, 5, -100), lookAt: new THREE.Vector3(15, 5, -150) },   // Why
      { pos: new THREE.Vector3(-20, -8, -250), lookAt: new THREE.Vector3(-20, -8, -300) }, // Discover
      { pos: new THREE.Vector3(25, 10, -400), lookAt: new THREE.Vector3(25, 10, -450) }, // Process
      { pos: new THREE.Vector3(-15, -5, -550), lookAt: new THREE.Vector3(-15, -5, -600) } // Facilitate
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
    window.addEventListener('resize', this.debounce(() => this.onResize(), 200));
    this.setupScrollListener();
    this.setupClickListeners();

    // Theatre.js controls (with delay to ensure sheet is ready)
    setTimeout(() => this.setupTheatreControls(), 500);

    // Start render loop
    this.animate();
  }

  createSun() {
    const sunGroup = new THREE.Group();

    // Sun core - subtle warm glow in background
    const sunGeometry = new THREE.SphereGeometry(40, 64, 64);
    const sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xffe4c4,
      transparent: true,
      opacity: 0.4
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sunGroup.add(sun);

    // Sun glow layers - softer, more diffuse
    for (let i = 1; i <= 4; i++) {
      const glowGeometry = new THREE.SphereGeometry(40 * (1 + i * 0.3), 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffcc88,
        transparent: true,
        opacity: 0.04 / i,
        side: THREE.BackSide
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      sunGroup.add(glow);
    }

    // Position sun far in the background (end of journey)
    sunGroup.position.set(0, 0, -900);
    this.sun = sunGroup;
    this.scene.add(sunGroup);
  }

  createPlanets() {
    // Planet shader for surface detail
    const planetVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const planetFragmentShader = `
      uniform vec3 baseColor;
      uniform vec3 glowColor;
      uniform float time;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;

      // Simplex noise functions
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(
                  i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }

      void main() {
        // Multi-layered noise for surface detail
        float n1 = snoise(vPosition * 0.15 + time * 0.02) * 0.5 + 0.5;
        float n2 = snoise(vPosition * 0.4 + time * 0.01) * 0.5 + 0.5;
        float n3 = snoise(vPosition * 0.8) * 0.5 + 0.5;
        float detail = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

        // Fresnel rim lighting
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);

        // Combine base color with detail and rim
        vec3 surfaceColor = mix(baseColor * 0.7, baseColor * 1.3, detail);
        vec3 finalColor = mix(surfaceColor, glowColor, fresnel * 0.6);

        gl_FragColor = vec4(finalColor, 0.95);
      }
    `;

    Object.entries(this.planetConfigs).forEach(([name, config]) => {
      const planetGroup = new THREE.Group();

      // Planet core with shader material
      const geometry = new THREE.SphereGeometry(config.radius, 64, 64);
      const material = new THREE.ShaderMaterial({
        uniforms: {
          baseColor: { value: new THREE.Color(config.color) },
          glowColor: { value: new THREE.Color(config.glowColor) },
          time: { value: 0 }
        },
        vertexShader: planetVertexShader,
        fragmentShader: planetFragmentShader,
        transparent: true
      });
      const planet = new THREE.Mesh(geometry, material);
      planet.userData.material = material;
      planetGroup.add(planet);

      // Inner atmosphere glow
      for (let i = 1; i <= 3; i++) {
        const glowGeometry = new THREE.SphereGeometry(config.radius * (1 + i * 0.08), 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
          color: config.glowColor,
          transparent: true,
          opacity: 0.15 / i,
          side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        planetGroup.add(glow);
      }

      // Add rings to 'process' and 'discover' planets
      if (name === 'process' || name === 'discover') {
        const ringGeometry = new THREE.RingGeometry(
          config.radius * 1.4,
          config.radius * 2.0,
          64
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: config.glowColor,
          transparent: true,
          opacity: 0.25,
          side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI * 0.4;
        ring.rotation.y = Math.PI * 0.1;
        planetGroup.add(ring);
      }

      // Add moons to 'why' and 'facilitate'
      if (name === 'why' || name === 'facilitate') {
        const moonGeometry = new THREE.SphereGeometry(config.radius * 0.2, 16, 16);
        const moonMaterial = new THREE.MeshBasicMaterial({
          color: 0xaaaaaa,
          transparent: true,
          opacity: 0.8
        });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.position.set(config.radius * 1.8, config.radius * 0.5, 0);
        moon.userData.orbitRadius = config.radius * 1.8;
        moon.userData.orbitSpeed = 0.3;
        planetGroup.add(moon);
        planetGroup.userData.moon = moon;
      }

      // Position planet
      planetGroup.position.copy(config.position);
      planetGroup.userData = { ...planetGroup.userData, name, config, baseY: config.position.y };

      this.planets[name] = planetGroup;
      this.scene.add(planetGroup);
    });
  }

  createOrbitalPaths() {
    // Create nebula clouds between planets
    this.createNebulae();
    // Create floating dust particles
    this.createDustParticles();
  }

  createNebulae() {
    // Nebula positions between planet stops
    const nebulaPositions = [
      { pos: new THREE.Vector3(-30, 20, -80), color: 0x3a6aee, scale: 60 },
      { pos: new THREE.Vector3(40, -15, -220), color: 0x5abaff, scale: 80 },
      { pos: new THREE.Vector3(-50, 25, -380), color: 0x7a6aee, scale: 70 },
      { pos: new THREE.Vector3(35, -20, -520), color: 0x4abaaa, scale: 65 }
    ];

    this.nebulae = [];

    nebulaPositions.forEach(nebula => {
      const nebulaGroup = new THREE.Group();

      // Multiple layered sprites for depth
      for (let i = 0; i < 5; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Create radial gradient for nebula cloud
        const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
        const color = new THREE.Color(nebula.color);
        gradient.addColorStop(0, `rgba(${Math.floor(color.r*255)}, ${Math.floor(color.g*255)}, ${Math.floor(color.b*255)}, 0.15)`);
        gradient.addColorStop(0.4, `rgba(${Math.floor(color.r*255)}, ${Math.floor(color.g*255)}, ${Math.floor(color.b*255)}, 0.08)`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          blending: THREE.AdditiveBlending
        });
        const sprite = new THREE.Sprite(spriteMaterial);

        // Random offset and scale for each layer
        sprite.position.set(
          (Math.random() - 0.5) * nebula.scale * 0.5,
          (Math.random() - 0.5) * nebula.scale * 0.5,
          (Math.random() - 0.5) * nebula.scale * 0.3
        );
        sprite.scale.set(
          nebula.scale * (0.8 + Math.random() * 0.4),
          nebula.scale * (0.8 + Math.random() * 0.4),
          1
        );

        nebulaGroup.add(sprite);
      }

      nebulaGroup.position.copy(nebula.pos);
      this.nebulae.push(nebulaGroup);
      this.scene.add(nebulaGroup);
    });
  }

  createDustParticles() {
    // Floating dust/particle field throughout space
    const dustCount = 500;
    const positions = new Float32Array(dustCount * 3);
    const sizes = new Float32Array(dustCount);
    const colors = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 300;
      positions[i * 3 + 2] = Math.random() * -1000 + 50;

      sizes[i] = Math.random() * 2 + 0.5;

      // Slight color variation
      const brightness = 0.3 + Math.random() * 0.4;
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness * 0.9;
      colors[i * 3 + 2] = brightness * 1.1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const dustMaterial = new THREE.PointsMaterial({
      size: 1.5,
      transparent: true,
      opacity: 0.4,
      vertexColors: true,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    this.dust = new THREE.Points(geometry, dustMaterial);
    this.scene.add(this.dust);
  }

  createStarfield() {
    // Create star texture with glow
    const starTexture = this.createStarTexture();

    // Multi-layered starfield with varying sizes, speeds, and brightness
    const starLayers = [
      { count: 600, size: 3, opacity: 0.5, spread: 500, speed: 0.02 },    // Distant dim stars
      { count: 300, size: 5, opacity: 0.7, spread: 400, speed: 0.035 },   // Medium stars
      { count: 80, size: 8, opacity: 0.9, spread: 300, speed: 0.05 }      // Bright nearby stars
    ];

    this.starGroups = [];
    this.starData = []; // Store animation data for each layer

    starLayers.forEach((layer, layerIndex) => {
      const positions = new Float32Array(layer.count * 3);
      const colors = new Float32Array(layer.count * 3);
      const sizes = new Float32Array(layer.count);
      const twinklePhases = new Float32Array(layer.count);
      const twinkleSpeeds = new Float32Array(layer.count);
      const driftOffsets = new Float32Array(layer.count * 3);

      for (let i = 0; i < layer.count; i++) {
        // Initial positions
        positions[i * 3] = (Math.random() - 0.5) * layer.spread;
        positions[i * 3 + 1] = (Math.random() - 0.5) * layer.spread;
        positions[i * 3 + 2] = Math.random() * -1200 + 100;

        // Size variation
        sizes[i] = layer.size * (0.5 + Math.random() * 0.8);

        // Twinkle animation data
        twinklePhases[i] = Math.random() * Math.PI * 2;
        twinkleSpeeds[i] = 0.5 + Math.random() * 2;

        // Drift direction (normalized)
        driftOffsets[i * 3] = (Math.random() - 0.5) * layer.speed;
        driftOffsets[i * 3 + 1] = (Math.random() - 0.5) * layer.speed;
        driftOffsets[i * 3 + 2] = (Math.random() - 0.5) * layer.speed * 0.5;

        // Star color variation (white, blue, yellow, pink)
        const colorVariation = Math.random();
        if (colorVariation < 0.25) {
          // Cool blue
          colors[i * 3] = 0.7;
          colors[i * 3 + 1] = 0.85;
          colors[i * 3 + 2] = 1.0;
        } else if (colorVariation < 0.4) {
          // Warm yellow
          colors[i * 3] = 1.0;
          colors[i * 3 + 1] = 0.92;
          colors[i * 3 + 2] = 0.7;
        } else if (colorVariation < 0.5) {
          // Soft pink
          colors[i * 3] = 1.0;
          colors[i * 3 + 1] = 0.8;
          colors[i * 3 + 2] = 0.9;
        } else {
          // Pure white
          colors[i * 3] = 1.0;
          colors[i * 3 + 1] = 1.0;
          colors[i * 3 + 2] = 1.0;
        }
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      // Custom shader material for better star rendering
      const material = new THREE.ShaderMaterial({
        uniforms: {
          starTexture: { value: starTexture },
          time: { value: 0 }
        },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          varying float vSize;
          void main() {
            vColor = color;
            vSize = size;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
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

      const stars = new THREE.Points(geometry, material);
      this.starGroups.push(stars);
      this.scene.add(stars);

      // Store animation data
      this.starData.push({
        positions: positions,
        originalPositions: positions.slice(),
        twinklePhases,
        twinkleSpeeds,
        driftOffsets,
        sizes,
        originalSizes: sizes.slice(),
        layer
      });
    });

    // Keep reference to first layer as this.stars for compatibility
    this.stars = this.starGroups[0];
  }

  createStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Create radial gradient for soft glow
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    // Add cross flare for brighter appearance
    ctx.globalCompositeOperation = 'lighter';
    const flareGradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 28);
    flareGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    flareGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    // Horizontal flare
    ctx.fillStyle = flareGradient;
    ctx.fillRect(4, 28, 56, 8);

    // Vertical flare
    ctx.fillRect(28, 4, 8, 56);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  animateStars() {
    if (!this.starData) return;

    this.starData.forEach((data, layerIndex) => {
      const geometry = this.starGroups[layerIndex].geometry;
      const positions = geometry.attributes.position.array;
      const sizes = geometry.attributes.size.array;

      for (let i = 0; i < data.layer.count; i++) {
        // Drift movement
        positions[i * 3] = data.originalPositions[i * 3] +
          Math.sin(this.time * 0.1 + i) * data.driftOffsets[i * 3] * 50;
        positions[i * 3 + 1] = data.originalPositions[i * 3 + 1] +
          Math.cos(this.time * 0.15 + i * 0.5) * data.driftOffsets[i * 3 + 1] * 50;
        positions[i * 3 + 2] = data.originalPositions[i * 3 + 2] +
          Math.sin(this.time * 0.08 + i * 0.3) * data.driftOffsets[i * 3 + 2] * 30;

        // Twinkle effect on size
        const twinkle = Math.sin(this.time * data.twinkleSpeeds[i] + data.twinklePhases[i]);
        sizes[i] = data.originalSizes[i] * (0.7 + twinkle * 0.3);
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.size.needsUpdate = true;

      // Update shader time uniform
      this.starGroups[layerIndex].material.uniforms.time.value = this.time;
    });
  }

  setupPostProcessing() {
    this.composer = new window.EffectComposer(this.renderer);

    // Render pass
    const renderPass = new window.RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Bloom pass
    this.bloomPass = new window.UnrealBloomPass(
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

    this.atmospherePass = new window.ShaderPass(atmosphereShader);
    this.composer.addPass(this.atmospherePass);
  }

  setupScrollListener() {
    // Snap stop state
    this.currentStopIndex = 0;
    this.isSnapped = true;
    this.scrollAccumulator = 0;
    this.scrollThreshold = 80; // Pixels of scroll needed to move to next stop
    this.isTransitioning = false;

    // Listen to wheel events directly for snap behavior
    window.addEventListener('wheel', (e) => {
      if (this.isTransitioning) {
        return; // Just ignore during transition, no need to preventDefault
      }

      // Accumulate scroll
      this.scrollAccumulator += e.deltaY;

      // Check if we've scrolled enough to move to next/prev stop
      if (this.scrollAccumulator > this.scrollThreshold) {
        // Move to next stop
        if (this.currentStopIndex < this.cameraStops.length - 1) {
          this.currentStopIndex++;
          this.transitionToStop(this.currentStopIndex);
        }
        this.scrollAccumulator = 0;
      } else if (this.scrollAccumulator < -this.scrollThreshold) {
        // Move to previous stop
        if (this.currentStopIndex > 0) {
          this.currentStopIndex--;
          this.transitionToStop(this.currentStopIndex);
        }
        this.scrollAccumulator = 0;
      }
    }, { passive: true });

    // Touch support for mobile
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isTransitioning) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      this.scrollAccumulator += deltaY * 1.0;
      touchStartY = touchY;

      if (this.scrollAccumulator > this.scrollThreshold) {
        if (this.currentStopIndex < this.cameraStops.length - 1) {
          this.currentStopIndex++;
          this.transitionToStop(this.currentStopIndex);
        }
        this.scrollAccumulator = 0;
      } else if (this.scrollAccumulator < -this.scrollThreshold) {
        if (this.currentStopIndex > 0) {
          this.currentStopIndex--;
          this.transitionToStop(this.currentStopIndex);
        }
        this.scrollAccumulator = 0;
      }
    }, { passive: true });
  }

  transitionToStop(index) {
    this.isTransitioning = true;
    this.targetProgress = index / (this.cameraStops.length - 1);

    // Hide click prompt during transition
    const clickPrompt = document.getElementById('planet-click-prompt');
    if (clickPrompt) {
      clickPrompt.classList.remove('visible');
    }

    // Update current planet state
    const planetNames = ['overview', 'why', 'discover', 'process', 'facilitate'];
    this.currentPlanet = planetNames[index];
    this.updateUI(false); // Don't show click prompt yet

    // Show click prompt after animation completes
    setTimeout(() => {
      this.isTransitioning = false;
      this.showClickPrompt();
    }, 800);
  }

  showClickPrompt() {
    const clickPrompt = document.getElementById('planet-click-prompt');
    if (clickPrompt && this.currentPlanetLink) {
      clickPrompt.classList.add('visible');
    }
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

    // Click on planet visit prompt
    const clickPrompt = document.getElementById('planet-click-prompt');
    if (clickPrompt) {
      clickPrompt.addEventListener('click', () => {
        if (this.currentPlanetLink) {
          window.location.href = this.currentPlanetLink;
        }
      });
    }
  }

  jumpToPlanet(planetName) {
    const planetNames = ['overview', 'why', 'discover', 'process', 'facilitate'];
    const index = planetNames.indexOf(planetName);
    if (index !== -1) {
      this.jumpToStop(index);
    }
  }

  jumpToStop(index) {
    if (index < 0 || index >= this.cameraStops.length) return;
    this.currentStopIndex = index;
    this.transitionToStop(index);
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
    // Smooth interpolation toward target (higher value = faster snap)
    const easeStrength = 0.04;
    this.scrollProgress += (this.targetProgress - this.scrollProgress) * easeStrength;

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

  updateUI(showClickPrompt = true) {
    // Planet content data
    const planetContent = {
      why: {
        title: 'Why We Exist',
        description: 'Discover the purpose behind the Gift — a journey into what makes you uniquely valuable.',
        link: 'why.html'
      },
      discover: {
        title: 'Discover',
        description: 'Begin uncovering your unique Gift through guided reflection and meaningful questions.',
        link: 'discover.html'
      },
      process: {
        title: 'The Process',
        description: 'A method of reflection and dialogue designed to reveal what has always been true about you.',
        link: 'process.html'
      },
      facilitate: {
        title: 'Facilitate',
        description: 'Guide others on their journey of discovery. Learn to help others find their Gift.',
        link: 'facilitate.html'
      }
    };

    // Update hero section visibility
    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
      if (this.currentPlanet === 'overview') {
        heroSection.classList.remove('hidden');
      } else {
        heroSection.classList.add('hidden');
      }
    }

    // Update caption bar
    const captionBar = document.getElementById('caption-bar');
    const content = planetContent[this.currentPlanet];

    if (captionBar) {
      if (content) {
        captionBar.querySelector('.caption-title').textContent = content.title;
        captionBar.querySelector('.caption-description').textContent = content.description;
        captionBar.classList.add('visible');
      } else {
        captionBar.classList.remove('visible');
      }
    }

    // Store current link for click handler
    if (content) {
      this.currentPlanetLink = content.link;
    } else {
      this.currentPlanetLink = null;
    }

    // Update click prompt visibility (only if showClickPrompt is true)
    if (showClickPrompt) {
      const clickPrompt = document.getElementById('planet-click-prompt');
      if (clickPrompt) {
        if (content) {
          clickPrompt.classList.add('visible');
        } else {
          clickPrompt.classList.remove('visible');
        }
      }
    }

    // Update dots
    const allStops = ['overview', 'why', 'discover', 'process', 'facilitate'];
    document.querySelectorAll('.planet-dots .dot').forEach((dot, index) => {
      dot.classList.toggle('active', allStops[index] === this.currentPlanet);
    });
  }

  onResize() {
    // Adjust FOV for mobile
    const isMobile = window.innerWidth < 768;
    this.camera.fov = isMobile ? 85 : 60;
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

      // Update planet shader time uniform
      const core = planet.children[0];
      if (core && core.userData.material) {
        core.userData.material.uniforms.time.value = this.time;
      }

      // Animate moons
      if (planet.userData.moon) {
        const moon = planet.userData.moon;
        const orbitRadius = moon.userData.orbitRadius;
        const orbitSpeed = moon.userData.orbitSpeed;
        moon.position.x = Math.cos(this.time * orbitSpeed) * orbitRadius;
        moon.position.z = Math.sin(this.time * orbitSpeed) * orbitRadius;
      }
    });

    // Animate sun
    if (this.sun) {
      const pulse = 1 + Math.sin(this.time * config.sun.pulseSpeed) * config.sun.pulseAmount;
      this.sun.scale.set(pulse, pulse, pulse);
    }

    // Subtle nebula movement
    if (this.nebulae) {
      this.nebulae.forEach((nebula, i) => {
        nebula.rotation.z = Math.sin(this.time * 0.1 + i) * 0.02;
      });
    }

    // Animate stars (drift and twinkle) - throttled to every 3rd frame
    this.starFrameCounter++;
    if (this.starFrameCounter % 3 === 0) {
      this.animateStars();
    }

    // Update shader uniforms
    if (this.atmospherePass) {
      this.atmospherePass.uniforms.time.value = this.time;
    }

    // Render with post-processing
    this.composer.render();
  }
}
