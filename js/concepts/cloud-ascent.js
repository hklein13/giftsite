// js/concepts/cloud-ascent.js — Cloud Ascent Concept Demo (Polished)
// Layered clouds with domain warping, god rays, warm gold breakthrough,
// luminous particles, entrance animation, pmndrs postprocessing

import * as THREE from 'three';
import { Effect, EffectComposer, RenderPass, EffectPass, BloomEffect, VignetteEffect, NoiseEffect, BlendFunction } from 'postprocessing';
import { Uniform, Vector2 } from 'three';

// --- Custom God Rays Effect (radial light sampling) ---
const godRaysFragment = /* glsl */`
  uniform vec2 uLightPos;
  uniform float uRayIntensity;
  uniform float uDecay;
  uniform float uRayDensity;
  uniform float uRayWeight;
  uniform float uRayIntro;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 texCoord = uv;
    vec2 deltaCoord = (texCoord - uLightPos) * (1.0 / 32.0) * uRayDensity;

    float illuminationDecay = 1.0;
    vec3 rays = vec3(0.0);

    for (int i = 0; i < 32; i++) {
      texCoord -= deltaCoord;
      vec4 s = texture2D(inputBuffer, texCoord);
      float brightness = dot(s.rgb, vec3(0.299, 0.587, 0.114));
      rays += s.rgb * brightness * illuminationDecay * uRayWeight;
      illuminationDecay *= uDecay;
    }

    // Warm gold tint on rays, fade in during intro
    vec3 rayColor = rays * uRayIntensity * vec3(1.0, 0.93, 0.78) * smoothstep(0.4, 1.0, uRayIntro);

    outputColor = vec4(inputColor.rgb + rayColor, inputColor.a);
  }
`;

class GodRaysEffect extends Effect {
  constructor() {
    super('GodRaysEffect', godRaysFragment, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map([
        ['uLightPos', new Uniform(new Vector2(0.5, 0.72))],
        ['uRayIntensity', new Uniform(0.22)],
        ['uDecay', new Uniform(0.97)],
        ['uRayDensity', new Uniform(0.9)],
        ['uRayWeight', new Uniform(0.5)],
        ['uRayIntro', new Uniform(0)]
      ])
    });
  }
}

// --- Shared GLSL: 2D simplex noise + FBM ---
const SIMPLEX_2D_GLSL = /* glsl */`
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

  // 4-octave FBM — enough detail for soft cumulus shapes without fine ripples
  float fbm5(vec2 p) {
    float f = 0.0;
    f += 0.5000 * snoise2(p); p *= 2.01;
    f += 0.2500 * snoise2(p); p *= 2.02;
    f += 0.1250 * snoise2(p); p *= 2.03;
    f += 0.0625 * snoise2(p);
    return f;
  }

  // Single-pass domain warping: one extra fbm lookup for organic distortion
  // Gentle warp for cumulus-like shapes without water-ripple artifacts
  float warpedFbm(vec2 p, float t) {
    vec2 warp = vec2(
      fbm5(p + vec2(1.7, 9.2) + t * 0.03),
      fbm5(p + vec2(8.3, 2.8) + t * 0.04)
    );
    return fbm5(p + warp * 0.6);
  }
`;

class CloudAscentScene {
  constructor() {
    this.canvas = document.getElementById('cloud-ascent-canvas');
    if (!this.canvas) return;

    this.isMobile = window.innerWidth < 768;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.time = 0;
    this.introProgress = 0;
    this.lastTimestamp = 0;

    // Parallax state
    this.parallax = { x: 0, y: 0 };
    this.targetParallax = { x: 0, y: 0 };
    this.gyroAvailable = false;

    // Touch burst state
    this.burstCenter = new THREE.Vector2(0, 0);
    this.burstStrength = 0;

    // Renderer with ACES tone mapping
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: false,
      antialias: false
    });
    this.renderer.toneMapping = THREE.NoToneMapping;
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

  // --- Background gradient + strong light breakthrough ---
  createBackground() {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uParallax: { value: new THREE.Vector2(0, 0) },
        uIntro: { value: 0 },
        uColorTop: { value: new THREE.Color(0x3878A8) },    // Strong sky blue
        uColorMid: { value: new THREE.Color(0x2868A0) },    // Deep blue
        uColorBot: { value: new THREE.Color(0x5090C0) }     // Horizon blue
      },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.9999, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime;
        uniform vec2 uParallax;
        uniform float uIntro;
        uniform vec3 uColorTop;
        uniform vec3 uColorMid;
        uniform vec3 uColorBot;
        varying vec2 vUv;

        void main() {
          float t = vUv.y;

          // Breathing animation
          float breath = sin(uTime * 0.3) * 0.015;
          t += breath;

          // Blue dominates top, warmer toward light source
          vec3 color;
          if (t > 0.4) {
            color = mix(uColorMid, uColorTop, smoothstep(0.4, 1.0, t));
          } else {
            color = mix(uColorBot, uColorMid, smoothstep(0.0, 0.4, t));
          }

          // Subtle light breakthrough — warm spot, not dominant
          vec2 lightCenter = vec2(0.5 + uParallax.x * 0.05, 0.72 + uParallax.y * 0.03);
          float distToLight = distance(vUv, lightCenter);

          float lightGlow = 1.0 - smoothstep(0.0, 0.35, distToLight);
          lightGlow = pow(lightGlow, 3.0);

          float lightPulse = 1.0 + sin(uTime * 0.4) * 0.04;

          vec3 lightColor = vec3(1.0, 0.96, 0.88);
          float lightIntensity = lightGlow * 0.20 * lightPulse;
          lightIntensity *= smoothstep(0.3, 1.0, uIntro);

          color = mix(color, lightColor, lightIntensity);

          // Warm shift — very subtle
          vec3 warmShift = vec3(1.0, 0.93, 0.80);
          float warmAmount = lightGlow * 0.08 * smoothstep(0.3, 1.0, uIntro);
          color = mix(color, warmShift, warmAmount);

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

  // --- Cloud layers with domain warping ---
  createCloudLayers() {
    this.cloudMaterials = [];

    // 5 layers: 2 far background + 2 mid + 1 close foreground
    const layers = [
      { z: 3,  w: 110, h: 35, drift: 0.015, opacity: 0.10, scale: 2.0,  goldStrength: 0.3 },
      { z: 12, w: 90,  h: 28, drift: 0.030, opacity: 0.18, scale: 2.8,  goldStrength: 0.6 },
      { z: 21, w: 70,  h: 20, drift: 0.050, opacity: 0.12, scale: 3.5,  goldStrength: 0.4 }
    ];

    for (const cfg of layers) {
      const geo = new THREE.PlaneGeometry(cfg.w, cfg.h);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uDriftSpeed: { value: cfg.drift },
          uOpacity: { value: cfg.opacity },
          uNoiseScale: { value: cfg.scale },
          uGoldStrength: { value: cfg.goldStrength },
          uBurstCenter: { value: new THREE.Vector2(0, 0) },
          uBurstStrength: { value: 0 },
          uReducedMotion: { value: this.prefersReducedMotion ? 1.0 : 0.0 },
          uIntro: { value: 0 },
          uGoldColor: { value: new THREE.Color(0xF0D080) } // Warmer gold
        },
        vertexShader: /* glsl */`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */`
          ${SIMPLEX_2D_GLSL}

          uniform float uTime;
          uniform float uDriftSpeed;
          uniform float uOpacity;
          uniform float uNoiseScale;
          uniform float uGoldStrength;
          uniform vec2 uBurstCenter;
          uniform float uBurstStrength;
          uniform float uReducedMotion;
          uniform float uIntro;
          uniform vec3 uGoldColor;
          varying vec2 vUv;

          void main() {
            vec2 uv = vUv;
            float anim = (1.0 - uReducedMotion);

            // Touch burst: ripple distortion
            vec2 burstUV = vUv * 2.0 - 1.0;
            float burstDist = distance(burstUV, uBurstCenter);
            float ripple = sin(burstDist * 12.0 - uTime * 4.0) * uBurstStrength * 0.03;
            uv += ripple;

            float t = uTime * anim;
            // Natural cloud coordinates — slight horizontal stretch looks like real cloud banks
            vec2 noiseCoord = uv * uNoiseScale;
            noiseCoord.x += t * uDriftSpeed * 0.3;

            // Domain-warped FBM for organic billow-like shapes
            float density = warpedFbm(noiseCoord, t * uDriftSpeed * 1.5);

            // Cloud shapes — tight threshold for defined shapes with sky gaps
            // warpedFbm returns roughly [-0.8, 0.8], remap to [0, 1]
            float remapped = density * 0.5 + 0.5;
            float cloud = smoothstep(0.38, 0.58, remapped);

            // Edge fade at plane boundaries
            float edgeX = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
            float edgeY = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
            cloud *= edgeX * edgeY;

            // Warm gold edge-lighting — visible golden rims on cloud edges
            float edgeThin = smoothstep(0.58, 0.42, remapped) * cloud;
            float upperBias = smoothstep(0.15, 0.65, vUv.y);
            float goldEdge = edgeThin * upperBias * uGoldStrength;

            // Light proximity boost — clouds near light source glow warmer
            vec2 lightPos = vec2(0.5, 0.72);
            float lightProximity = 1.0 - smoothstep(0.0, 0.55, distance(vUv, lightPos));
            goldEdge += cloud * lightProximity * 0.35 * uGoldStrength;

            // Base cloud color: warm white
            vec3 cloudColor = vec3(1.0, 0.99, 0.96);
            // Mix in gold at lit edges and near light source
            cloudColor = mix(cloudColor, uGoldColor, goldEdge * 0.7);

            // Intro: fade in from transparent
            float introOpacity = uOpacity * smoothstep(0.0, 1.0, uIntro);

            float alpha = cloud * introOpacity;

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
      mesh.renderOrder = cfg.z;
      this.cloudMaterials.push(mat);
      this.scene.add(mesh);
    }
  }

  // --- Luminous particles (moisture/mist) ---
  createParticles() {
    const count = 200;
    const positions = new Float32Array(count * 3);
    const aSize = new Float32Array(count);
    const aSpeed = new Float32Array(count);
    const aPhase = new Float32Array(count);
    const aOpacity = new Float32Array(count);
    const aWarmth = new Float32Array(count); // gold tint factor

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      aSize[i] = 0.3 + Math.random() * 1.0;
      aSpeed[i] = 0.3 + Math.random() * 0.7;
      aPhase[i] = Math.random() * Math.PI * 2;
      aOpacity[i] = 0.12 + Math.random() * 0.23;

      // Particles in upper portion are warmer (nearer to light)
      const yNorm = (positions[i * 3 + 1] + 12.5) / 25.0;
      aWarmth[i] = 0.1 + yNorm * 0.6;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
    geometry.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1));
    geometry.setAttribute('aOpacity', new THREE.BufferAttribute(aOpacity, 1));
    geometry.setAttribute('aWarmth', new THREE.BufferAttribute(aWarmth, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uParallax: { value: new THREE.Vector2(0, 0) },
        uBurstCenter: { value: new THREE.Vector2(0, 0) },
        uBurstStrength: { value: 0 },
        uReducedMotion: { value: this.prefersReducedMotion ? 1.0 : 0.0 },
        uIntro: { value: 0 }
      },
      vertexShader: /* glsl */`
        attribute float aSize;
        attribute float aSpeed;
        attribute float aPhase;
        attribute float aOpacity;
        attribute float aWarmth;

        uniform float uTime;
        uniform vec2 uParallax;
        uniform vec2 uBurstCenter;
        uniform float uBurstStrength;
        uniform float uReducedMotion;
        uniform float uIntro;

        varying float vOpacity;
        varying float vWarmth;

        void main() {
          vec3 pos = position;
          float drift = (1.0 - uReducedMotion);

          // Gentle oscillation + slight upward drift (ascent feeling)
          pos.x += sin(uTime * aSpeed * 0.4 + aPhase) * 2.0 * drift;
          pos.y += sin(uTime * aSpeed * 0.3 + aPhase * 1.3) * 1.5 * drift;
          pos.y += uTime * 0.05 * drift; // subtle upward drift
          pos.z += cos(uTime * aSpeed * 0.25 + aPhase * 0.7) * 1.0 * drift;

          // Wrap Y position to keep particles in view
          pos.y = mod(pos.y + 12.5, 25.0) - 12.5;

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

          // Fade in particles during intro
          vOpacity = aOpacity * smoothstep(0.4, 1.0, uIntro);
          vWarmth = aWarmth;
        }
      `,
      fragmentShader: /* glsl */`
        varying float vOpacity;
        varying float vWarmth;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = smoothstep(0.5, 0.15, dist) * vOpacity;

          // Cool white -> warm gold based on warmth attribute
          vec3 coolColor = vec3(0.95, 0.97, 1.0);
          vec3 warmColor = vec3(1.0, 0.94, 0.78);
          vec3 color = mix(coolColor, warmColor, vWarmth);

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

  // --- Post-processing: bloom + god rays + vignette + noise ---
  setupPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // God rays — custom effect (radial light sampling)
    this.godRays = new GodRaysEffect();

    // Bloom — warmer and more present
    const bloom = new BloomEffect({
      intensity: 0.3,
      luminanceThreshold: 0.9,
      luminanceSmoothing: 0.3,
      mipmapBlur: true
    });

    const vignette = new VignetteEffect({
      offset: 0.3,
      darkness: 0.3
    });

    const noise = new NoiseEffect({
      blendFunction: BlendFunction.OVERLAY,
      premultiply: false
    });
    noise.blendMode.opacity.value = 0.06;

    // All effects in one pass for optimal performance
    this.composer.addPass(new EffectPass(this.camera, this.godRays, bloom, vignette, noise));
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
  }

  // --- Animation loop ---
  animate(timestamp = 0) {
    requestAnimationFrame((t) => this.animate(t));

    if (this.lastTimestamp === 0) this.lastTimestamp = timestamp;
    const delta = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;
    this.time += delta;

    // Entrance animation (0 -> 1 over ~2.5 seconds)
    if (this.introProgress < 1) {
      this.introProgress = Math.min(1, this.introProgress + delta * 0.4);
    }

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
    this.bgMaterial.uniforms.uIntro.value = this.introProgress;

    // Update cloud layers
    for (const mat of this.cloudMaterials) {
      mat.uniforms.uTime.value = this.time;
      mat.uniforms.uBurstCenter.value.copy(this.burstCenter);
      mat.uniforms.uBurstStrength.value = this.burstStrength;
      mat.uniforms.uIntro.value = this.introProgress;
    }

    // Update particles
    this.particleMaterial.uniforms.uTime.value = this.time;
    this.particleMaterial.uniforms.uParallax.value.set(this.parallax.x, this.parallax.y);
    this.particleMaterial.uniforms.uBurstCenter.value.copy(this.burstCenter);
    this.particleMaterial.uniforms.uBurstStrength.value = this.burstStrength;
    this.particleMaterial.uniforms.uIntro.value = this.introProgress;

    // Update god rays
    if (this.godRays) {
      this.godRays.uniforms.get('uRayIntro').value = this.introProgress;
    }

    this.composer.render(delta);
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
