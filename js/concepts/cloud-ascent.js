// js/concepts/cloud-ascent.js — Cloud Ascent Concept Demo
// Self-contained Three.js scene: cloud layers, warm gold edge-lighting, light breakthrough, bloom

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// --- Shared GLSL: 2D simplex noise ---
const SIMPLEX_2D_GLSL = `
  vec3 mod289_3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289_2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute3(vec3 x) { return mod289_3(((x * 34.0) + 1.0) * x); }

  float snoise2(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289_2(i);
    vec3 p = permute3(permute3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // 3-octave FBM
  float fbm(vec2 p) {
    float f = 0.0;
    f += 0.5000 * snoise2(p); p *= 2.01;
    f += 0.2500 * snoise2(p); p *= 2.02;
    f += 0.1250 * snoise2(p);
    return f;
  }
`;

class CloudAscentScene {
  constructor() {
    this.canvas = document.getElementById('cloud-ascent-canvas');
    if (!this.canvas) return;

    this.isMobile = window.innerWidth < 768;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.time = 0;
    this.lastTimestamp = 0;

    // Parallax state
    this.parallax = { x: 0, y: 0 };
    this.targetParallax = { x: 0, y: 0 };
    this.gyroAvailable = false;

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

    this.createBackground();
    this.createCloudLayers();
    this.createParticles();
    this.setupPostProcessing();
    this.setupInteraction();

    // Resize
    this._onResize = this._debounce(() => this.onResize(), 200);
    window.addEventListener('resize', this._onResize);
    this.onResize();

    // Start
    requestAnimationFrame((t) => this.animate(t));
  }

  // --- Background gradient + light breakthrough ---
  createBackground() {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uParallax: { value: new THREE.Vector2(0, 0) },
        uColorTop: { value: new THREE.Color(0xE8F4FD) },    // Pale blue-white
        uColorMid: { value: new THREE.Color(0xA8D4F0) },    // Soft blue
        uColorBot: { value: new THREE.Color(0xF0F5FA) }     // Misty white
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.9999, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uParallax;
        uniform vec3 uColorTop;
        uniform vec3 uColorMid;
        uniform vec3 uColorBot;
        varying vec2 vUv;

        void main() {
          float t = vUv.y;

          // Breathing animation
          float breath = sin(uTime * 0.3) * 0.015;
          t += breath;

          // Blue dominates top ~60%, misty white in bottom ~40%
          vec3 color;
          if (t > 0.4) {
            color = mix(uColorMid, uColorTop, smoothstep(0.4, 1.0, t));
          } else {
            color = mix(uColorBot, uColorMid, smoothstep(0.0, 0.4, t));
          }

          // Light breakthrough spot: upper-center, warm white-gold
          vec2 lightCenter = vec2(0.5 + uParallax.x * 0.05, 0.75 + uParallax.y * 0.03);
          float distToLight = distance(vUv, lightCenter);
          float lightGlow = 1.0 - smoothstep(0.0, 0.45, distToLight);
          lightGlow = pow(lightGlow, 2.5);

          vec3 lightColor = vec3(1.0, 0.96, 0.85);
          color = mix(color, lightColor, lightGlow * 0.35);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      depthWrite: false,
      depthTest: false
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1000;
    this.bgMaterial = mat;
    this.scene.add(mesh);
  }

  // --- Cloud layers ---
  createCloudLayers() {
    this.cloudMaterials = [];

    const layers = [
      { z: 2,  w: 120, h: 35, drift: 0.015, opacity: 0.12, parallax: 0.3, scale: 1.0 },
      { z: 7,  w: 100, h: 30, drift: 0.025, opacity: 0.22, parallax: 0.5, scale: 1.2 },
      { z: 12, w: 90,  h: 28, drift: 0.035, opacity: 0.35, parallax: 0.8, scale: 1.5 },
      { z: 17, w: 80,  h: 25, drift: 0.045, opacity: 0.28, parallax: 1.2, scale: 1.8 },
      { z: 22, w: 70,  h: 20, drift: 0.055, opacity: 0.18, parallax: 1.6, scale: 2.2 }
    ];

    for (const cfg of layers) {
      const geo = new THREE.PlaneGeometry(cfg.w, cfg.h);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uDriftSpeed: { value: cfg.drift },
          uOpacity: { value: cfg.opacity },
          uParallax: { value: new THREE.Vector2(0, 0) },
          uParallaxMult: { value: cfg.parallax },
          uNoiseScale: { value: cfg.scale },
          uBurstCenter: { value: new THREE.Vector2(0, 0) },
          uBurstStrength: { value: 0 },
          uReducedMotion: { value: this.prefersReducedMotion ? 1.0 : 0.0 },
          uGoldColor: { value: new THREE.Color(0xE8C878) }
        },
        vertexShader: `
          uniform vec2 uParallax;
          uniform float uParallaxMult;
          varying vec2 vUv;

          void main() {
            vUv = uv;
            vec3 pos = position;
            // Parallax shift
            pos.x += uParallax.x * uParallaxMult * 3.0;
            pos.y += uParallax.y * uParallaxMult * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          ${SIMPLEX_2D_GLSL}

          uniform float uTime;
          uniform float uDriftSpeed;
          uniform float uOpacity;
          uniform float uNoiseScale;
          uniform vec2 uBurstCenter;
          uniform float uBurstStrength;
          uniform float uReducedMotion;
          uniform vec3 uGoldColor;
          varying vec2 vUv;

          void main() {
            vec2 uv = vUv;

            // Horizontal drift (disabled if reduced motion)
            float drift = uTime * uDriftSpeed * (1.0 - uReducedMotion);
            uv.x += drift;

            // Touch burst: subtle ripple distortion
            vec2 burstUV = vUv * 2.0 - 1.0; // Map to -1..1
            float burstDist = distance(burstUV, uBurstCenter);
            float ripple = sin(burstDist * 12.0 - uTime * 4.0) * uBurstStrength * 0.03;
            uv += ripple;

            // Cloud density via 3-octave FBM
            float density = fbm(uv * uNoiseScale * 2.5);

            // Soft cloud shapes
            float cloud = smoothstep(0.35, 0.6, density * 0.5 + 0.5);

            // Edge fade at plane boundaries (prevent hard rectangle edges)
            float edgeX = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
            float edgeY = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
            cloud *= edgeX * edgeY;

            // Warm gold edge-lighting on upper cloud edges
            // Detect density gradient (higher density above = top of cloud)
            float densityAbove = fbm((uv + vec2(0.0, 0.01)) * uNoiseScale * 2.5);
            float gradient = (densityAbove - density) * 0.5 + 0.5;
            float goldEdge = smoothstep(0.45, 0.65, gradient) * cloud;

            // Base cloud color: white
            vec3 cloudColor = vec3(1.0);
            // Mix in gold at lit edges
            cloudColor = mix(cloudColor, uGoldColor, goldEdge * 0.5);

            // Final alpha
            float alpha = cloud * uOpacity;

            gl_FragColor = vec4(cloudColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.NormalBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = cfg.z;
      mesh.renderOrder = cfg.z; // Closer layers render on top
      this.cloudMaterials.push(mat);
      this.scene.add(mesh);
    }
  }

  // --- Moisture particles ---
  createParticles() {
    const count = 80;
    const positions = new Float32Array(count * 3);
    const aSize = new Float32Array(count);
    const aSpeed = new Float32Array(count);
    const aPhase = new Float32Array(count);
    const aOpacity = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;

      aSize[i] = 0.3 + Math.random() * 0.9;
      aSpeed[i] = 0.3 + Math.random() * 0.7;
      aPhase[i] = Math.random() * Math.PI * 2;
      aOpacity[i] = 0.08 + Math.random() * 0.17;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
    geometry.setAttribute('aOpacity', new THREE.BufferAttribute(aOpacity, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uParallax: { value: new THREE.Vector2(0, 0) },
        uBurstCenter: { value: new THREE.Vector2(0, 0) },
        uBurstStrength: { value: 0 },
        uReducedMotion: { value: this.prefersReducedMotion ? 1.0 : 0.0 }
      },
      vertexShader: `
        attribute float aSize;
        attribute float aSpeed;
        attribute float aPhase;
        attribute float aOpacity;

        uniform float uTime;
        uniform vec2 uParallax;
        uniform vec2 uBurstCenter;
        uniform float uBurstStrength;
        uniform float uReducedMotion;

        varying float vOpacity;

        void main() {
          vec3 pos = position;

          float drift = (1.0 - uReducedMotion);

          // Gentle oscillation (no directional drift)
          pos.x += sin(uTime * aSpeed * 0.4 + aPhase) * 2.0 * drift;
          pos.y += sin(uTime * aSpeed * 0.3 + aPhase * 1.3) * 1.5 * drift;
          pos.z += cos(uTime * aSpeed * 0.25 + aPhase * 0.7) * 1.0 * drift;

          // Parallax shift
          pos.x += uParallax.x * 3.0;
          pos.y += uParallax.y * 2.0;

          // Touch burst
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          vec2 screenPos = (projectionMatrix * mvPos).xy;
          vec2 toBurst = screenPos - uBurstCenter;
          float burstDist = length(toBurst);
          float burstEffect = uBurstStrength * smoothstep(0.8, 0.0, burstDist);
          pos.x += normalize(toBurst).x * burstEffect * 5.0;
          pos.y += normalize(toBurst).y * burstEffect * 5.0;

          vec4 finalMV = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = aSize * (300.0 / -finalMV.z);
          gl_Position = projectionMatrix * finalMV;

          vOpacity = aOpacity;
        }
      `,
      fragmentShader: `
        varying float vOpacity;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = smoothstep(0.5, 0.15, dist) * vOpacity;

          // Pale blue-white moisture color
          vec3 color = vec3(0.95, 0.97, 1.0);

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.particleMaterial = material;
    this.scene.add(this.particles);
  }

  // --- Post-processing: bloom + composite (no god-rays) ---
  setupPostProcessing() {
    const halfW = Math.floor(window.innerWidth / 2);
    const halfH = Math.floor(window.innerHeight / 2);

    this.composer = new EffectComposer(this.renderer);

    // 1. Render pass
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // 2. Bloom
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(halfW, halfH),
      0.4,   // strength
      1.2,   // radius
      0.9    // threshold
    );
    this.composer.addPass(this.bloomPass);

    // 3. Composite: pale blue vignette + grain
    this.compositeShader = {
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uGrainIntensity: { value: 0.02 },
        uVignetteColor: { value: new THREE.Vector3(0.56, 0.72, 0.82) },
        uVignetteIntensity: { value: 0.2 }
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

          // Pale blue vignette
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

  // --- Interaction: mouse, gyro, touch ---
  setupInteraction() {
    if (!this.isMobile) {
      window.addEventListener('mousemove', (e) => {
        this.targetParallax.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.targetParallax.y = -(e.clientY / window.innerHeight) * 2 + 1;
      });
    }

    this.canvas.addEventListener('click', (e) => {
      this.burstCenter.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      this.burstStrength = 1.0;

      const hint = document.getElementById('tap-hint');
      if (hint) hint.classList.add('hidden');
    });

    if (this.isMobile) {
      this._setupGyroscope();

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
  }

  _setupGyroscope() {
    const handleOrientation = (e) => {
      if (e.gamma !== null && e.beta !== null) {
        this.gyroAvailable = true;
        this.targetParallax.x = Math.max(-1, Math.min(1, e.gamma / 30));
        this.targetParallax.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      }
    };

    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      const requestGyro = () => {
        DeviceOrientationEvent.requestPermission()
          .then((state) => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          })
          .catch(() => {});
        window.removeEventListener('touchstart', requestGyro);
      };
      window.addEventListener('touchstart', requestGyro, { once: true });
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }

  // --- Resize ---
  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);

    const halfW = Math.floor(w / 2);
    const halfH = Math.floor(h / 2);
    this.bloomPass.resolution.set(halfW, halfH);
  }

  // --- Animation loop ---
  animate(timestamp = 0) {
    requestAnimationFrame((t) => this.animate(t));

    if (this.lastTimestamp === 0) this.lastTimestamp = timestamp;
    const delta = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;
    this.time += delta;

    // Smooth parallax
    this.parallax.x += (this.targetParallax.x - this.parallax.x) * 0.05;
    this.parallax.y += (this.targetParallax.y - this.parallax.y) * 0.05;

    // Auto-animation fallback
    if (!this.gyroAvailable && this.isMobile && !this.prefersReducedMotion) {
      this.targetParallax.x = Math.sin(this.time * 0.15) * 0.3;
      this.targetParallax.y = Math.cos(this.time * 0.1) * 0.2;
    }

    // Decay touch burst
    this.burstStrength *= 0.95;
    if (this.burstStrength < 0.001) this.burstStrength = 0;

    // Update background
    this.bgMaterial.uniforms.uTime.value = this.time;
    this.bgMaterial.uniforms.uParallax.value.set(this.parallax.x, this.parallax.y);

    // Update cloud layers
    for (const mat of this.cloudMaterials) {
      mat.uniforms.uTime.value = this.time;
      mat.uniforms.uParallax.value.set(this.parallax.x, this.parallax.y);
      mat.uniforms.uBurstCenter.value.copy(this.burstCenter);
      mat.uniforms.uBurstStrength.value = this.burstStrength;
    }

    // Update particles
    this.particleMaterial.uniforms.uTime.value = this.time;
    this.particleMaterial.uniforms.uParallax.value.set(this.parallax.x, this.parallax.y);
    this.particleMaterial.uniforms.uBurstCenter.value.copy(this.burstCenter);
    this.particleMaterial.uniforms.uBurstStrength.value = this.burstStrength;

    // Update post-processing
    this.compositePass.uniforms.uTime.value = this.time;

    this.composer.render();
  }

  // --- Utility ---
  _debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new CloudAscentScene();
});
