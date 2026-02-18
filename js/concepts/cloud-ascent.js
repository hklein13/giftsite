// js/concepts/cloud-ascent.js — Cloud Ascent (Redesigned)
// Layered clouds with domain warping, god rays, warm gold breakthrough,
// luminous particles, zone-based scroll journey, accumulator-driven navigation
//
// 6 zones: Hero + 5 subpage cards (Why We Exist, Discover, The Process, Facilitate, Gift Companion)
// Each zone shifts sky color, cloud density, and gold warmth via smoothstep interpolation

import * as THREE from 'three';
import { Effect, EffectComposer, RenderPass, EffectPass, BloomEffect, VignetteEffect, NoiseEffect, BlendFunction } from 'postprocessing';
import { Uniform, Vector2 } from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

// --- Zone Configuration ---
// 6 zones: hero (100vh) + 5 content zones (130vh each) = 750vh total
// Boundaries as fractions of total scroll distance
const ZONE_BOUNDARIES = [0, 100/750, 230/750, 360/750, 490/750, 620/750];

const ZONE_CONFIGS = [
  { // 0: Hero — Clear morning blue
    skyTop: new THREE.Color(0x3878A8),
    skyMid: new THREE.Color(0x2868A0),
    skyBot: new THREE.Color(0x5090C0),
    cloudDensity: 1.0,
    goldTint: 0.3,
    noiseScale: 1.0,
    driftSpeed: 1.0,
  },
  { // 1: Why We Exist — Deep twilight (dramatic darkening)
    skyTop: new THREE.Color(0x1E3860),
    skyMid: new THREE.Color(0x152850),
    skyBot: new THREE.Color(0x2E5078),
    cloudDensity: 1.5,
    goldTint: 0.5,
    noiseScale: 1.15,
    driftSpeed: 0.6,
  },
  { // 2: Discover — Bright open sky (wide clearing)
    skyTop: new THREE.Color(0x60A8D8),
    skyMid: new THREE.Color(0x5098D0),
    skyBot: new THREE.Color(0x78B8E0),
    cloudDensity: 0.35,
    goldTint: 0.15,
    noiseScale: 0.8,
    driftSpeed: 1.4,
  },
  { // 3: The Process — Dusky lavender (structured, contemplative)
    skyTop: new THREE.Color(0x384878),
    skyMid: new THREE.Color(0x2D3D6D),
    skyBot: new THREE.Color(0x506090),
    cloudDensity: 1.3,
    goldTint: 0.55,
    noiseScale: 1.1,
    driftSpeed: 0.7,
  },
  { // 4: Facilitate — Warm golden hour (distinctly warm)
    skyTop: new THREE.Color(0x5888A0),
    skyMid: new THREE.Color(0x507898),
    skyBot: new THREE.Color(0x7098A8),
    cloudDensity: 0.8,
    goldTint: 0.8,
    noiseScale: 0.9,
    driftSpeed: 1.0,
  },
  { // 5: Gift Companion — Bright dawn (hopeful, airy)
    skyTop: new THREE.Color(0x58A0D0),
    skyMid: new THREE.Color(0x4890C0),
    skyBot: new THREE.Color(0x70B0D8),
    cloudDensity: 0.4,
    goldTint: 0.25,
    noiseScale: 0.75,
    driftSpeed: 1.5,
  },
];

// Reusable result object (avoids GC pressure in animate loop)
const _zoneResult = {
  skyTop: new THREE.Color(),
  skyMid: new THREE.Color(),
  skyBot: new THREE.Color(),
  cloudDensity: 1.0,
  goldTint: 0.3,
  noiseScale: 1.0,
  driftSpeed: 1.0,
};

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getZoneParams(scrollProgress) {
  // Find current zone
  let zoneIndex = 0;
  for (let i = ZONE_BOUNDARIES.length - 1; i >= 0; i--) {
    if (scrollProgress >= ZONE_BOUNDARIES[i]) {
      zoneIndex = i;
      break;
    }
  }

  const nextIndex = Math.min(zoneIndex + 1, ZONE_CONFIGS.length - 1);
  const a = ZONE_CONFIGS[zoneIndex];
  const b = ZONE_CONFIGS[nextIndex];

  if (zoneIndex === nextIndex) {
    _zoneResult.skyTop.copy(a.skyTop);
    _zoneResult.skyMid.copy(a.skyMid);
    _zoneResult.skyBot.copy(a.skyBot);
    _zoneResult.cloudDensity = a.cloudDensity;
    _zoneResult.goldTint = a.goldTint;
    _zoneResult.noiseScale = a.noiseScale;
    _zoneResult.driftSpeed = a.driftSpeed;
    return _zoneResult;
  }

  // Transition across the last 50% of the current zone
  const zoneStart = ZONE_BOUNDARIES[zoneIndex];
  const zoneEnd = nextIndex < ZONE_BOUNDARIES.length ? ZONE_BOUNDARIES[nextIndex] : 1.0;
  const zoneWidth = zoneEnd - zoneStart;
  const transitionStart = zoneStart + zoneWidth * 0.5;
  const t = smoothstep(transitionStart, zoneEnd, scrollProgress);

  _zoneResult.skyTop.copy(a.skyTop).lerp(b.skyTop, t);
  _zoneResult.skyMid.copy(a.skyMid).lerp(b.skyMid, t);
  _zoneResult.skyBot.copy(a.skyBot).lerp(b.skyBot, t);
  _zoneResult.cloudDensity = lerp(a.cloudDensity, b.cloudDensity, t);
  _zoneResult.goldTint = lerp(a.goldTint, b.goldTint, t);
  _zoneResult.noiseScale = lerp(a.noiseScale, b.noiseScale, t);
  _zoneResult.driftSpeed = lerp(a.driftSpeed, b.driftSpeed, t);
  return _zoneResult;
}

// --- Custom God Rays Effect (radial light sampling) ---
function makeGodRaysFragment(highQuality) {
  const samples = highQuality ? 32 : 24;
  const step = `(1.0 / ${samples}.0)`;

  const sampleCode = `vec4 s = texture2D(inputBuffer, texCoord);`;

  return /* glsl */`
    uniform vec2 uLightPos;
    uniform float uRayIntensity;
    uniform float uDecay;
    uniform float uRayDensity;
    uniform float uRayWeight;
    uniform float uRayIntro;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
      vec2 texCoord = uv;
      vec2 deltaCoord = (texCoord - uLightPos) * ${step} * uRayDensity;

      float illuminationDecay = 1.0;
      vec3 rays = vec3(0.0);

      for (int i = 0; i < ${samples}; i++) {
        texCoord -= deltaCoord;
        ${sampleCode}
        float brightness = dot(s.rgb, vec3(0.299, 0.587, 0.114));
        rays += s.rgb * brightness * illuminationDecay * uRayWeight;
        illuminationDecay *= uDecay;
      }

      vec3 rayColor = rays * uRayIntensity * vec3(1.0, 0.93, 0.78) * smoothstep(0.4, 1.0, uRayIntro);

      outputColor = vec4(inputColor.rgb + rayColor, inputColor.a);
    }
  `;
}

class GodRaysEffect extends Effect {
  constructor(isMobile = false) {
    super('GodRaysEffect', makeGodRaysFragment(!isMobile), {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map([
        ['uLightPos', new Uniform(new Vector2(0.5, 0.72))],
        ['uRayIntensity', new Uniform(0.18)],   // flattened from 0.32
        ['uDecay', new Uniform(0.97)],           // from 0.98
        ['uRayDensity', new Uniform(0.9)],
        ['uRayWeight', new Uniform(0.55)],
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

  // 3-octave FBM — enough detail for soft cumulus shapes, minimal GPU cost
  float fbm3(vec2 p) {
    float f = 0.0;
    f += 0.5000 * snoise2(p); p *= 2.01;
    f += 0.2500 * snoise2(p); p *= 2.02;
    f += 0.1250 * snoise2(p);
    return f;
  }

  // Single-pass domain warping: one fbm lookup, second component derived cheaply
  float warpedFbm(vec2 p, float t) {
    float w = fbm3(p + vec2(1.7, 9.2) + t * 0.03);
    vec2 warp = vec2(w, w * 0.7 + sin(w * 3.5) * 0.3);
    return fbm3(p + warp * 0.6);
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

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: false,
      antialias: false
    });
    this.renderer.toneMapping = THREE.NoToneMapping;
    const maxPixelRatio = this.isMobile ? 1.25 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 0, 30);

    // Scroll progress (0 = ground, 1 = end)
    this.scrollProgress = 0;
    this.currentZoneIndex = 0;

    // Eased zone state — drifts toward target (solar system methodology)
    // At 0.025/frame @ 60fps: ~1.7s to reach 95% of target
    this.easedZone = {
      skyTop: new THREE.Color(0x3878A8),
      skyMid: new THREE.Color(0x2868A0),
      skyBot: new THREE.Color(0x5090C0),
      cloudDensity: 1.0,
      goldTint: 0.3,
      noiseScale: 1.0,
      driftSpeed: 1.0,
    };

    this.createBackground();
    this.createCloudLayers();
    this.createParticles();
    this.setupPostProcessing();
    this.setupInteraction();
    this.setupScrollAscent();

    // Resize
    this._onResize = this._debounce(() => this.onResize(), 200);
    window.addEventListener('resize', this._onResize);
    this.onResize();

    // Start
    requestAnimationFrame((t) => this.animate(t));
  }

  // --- Background gradient + subtle light breakthrough ---
  createBackground() {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uParallax: { value: new THREE.Vector2(0, 0) },
        uIntro: { value: 0 },
        uColorTop: { value: new THREE.Color(0x3878A8) },
        uColorMid: { value: new THREE.Color(0x2868A0) },
        uColorBot: { value: new THREE.Color(0x5090C0) }
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

          // Subtle light breakthrough — halved glow
          vec2 lightCenter = vec2(0.5 + uParallax.x * 0.05, 0.72 + uParallax.y * 0.03);
          float distToLight = distance(vUv, lightCenter);

          float lightGlow = 1.0 - smoothstep(0.0, 0.35, distToLight);
          lightGlow = pow(lightGlow, 2.0);

          float lightPulse = 1.0 + sin(uTime * 0.4) * 0.02;

          vec3 lightColor = vec3(1.0, 0.96, 0.88);
          float lightIntensity = lightGlow * 0.10 * lightPulse;
          lightIntensity *= smoothstep(0.3, 1.0, uIntro);

          color = mix(color, lightColor, lightIntensity);

          // Warm shift — very subtle
          vec3 warmShift = vec3(1.0, 0.93, 0.80);
          float warmAmount = lightGlow * 0.04 * smoothstep(0.3, 1.0, uIntro);
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
          uGoldColor: { value: new THREE.Color(0xF0D080) }
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
            vec2 noiseCoord = uv * uNoiseScale;
            noiseCoord.x += t * uDriftSpeed * 0.3;

            float density = warpedFbm(noiseCoord, t * uDriftSpeed * 1.5);

            float remapped = density * 0.5 + 0.5;
            float cloud = smoothstep(0.28, 0.65, remapped);

            // Edge fade at plane boundaries
            float edgeX = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);
            float edgeY = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
            cloud *= edgeX * edgeY;

            // Warm gold edge-lighting
            float edgeThin = smoothstep(0.58, 0.42, remapped) * cloud;
            float upperBias = smoothstep(0.15, 0.65, vUv.y);
            float goldEdge = edgeThin * upperBias * uGoldStrength;

            // Light proximity boost
            vec2 lightPos = vec2(0.5, 0.72);
            float lightProximity = 1.0 - smoothstep(0.0, 0.55, distance(vUv, lightPos));
            goldEdge += cloud * lightProximity * 0.35 * uGoldStrength;

            vec3 cloudColor = vec3(1.0, 0.99, 0.96);
            cloudColor = mix(cloudColor, uGoldColor, goldEdge * 0.7);

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

      // Store base values for zone-driven modulation
      mat.userData = {
        baseOpacity: cfg.opacity,
        baseNoiseScale: cfg.scale,
        baseDriftSpeed: cfg.drift,
      };

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = cfg.z;
      mesh.renderOrder = cfg.z;
      this.cloudMaterials.push(mat);
      this.scene.add(mesh);
    }
  }

  // --- Luminous particles (moisture/mist) ---
  createParticles() {
    const count = 80;
    const positions = new Float32Array(count * 3);
    const aSize = new Float32Array(count);
    const aSpeed = new Float32Array(count);
    const aPhase = new Float32Array(count);
    const aOpacity = new Float32Array(count);
    const aWarmth = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      aSize[i] = 0.2 + Math.random() * 0.6;
      aSpeed[i] = 0.3 + Math.random() * 0.7;
      aPhase[i] = Math.random() * Math.PI * 2;
      aOpacity[i] = 0.04 + Math.random() * 0.08;

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

          pos.x += sin(uTime * aSpeed * 0.4 + aPhase) * 2.0 * drift;
          pos.y += sin(uTime * aSpeed * 0.3 + aPhase * 1.3) * 1.5 * drift;
          pos.y += uTime * 0.05 * drift;
          pos.z += cos(uTime * aSpeed * 0.25 + aPhase * 0.7) * 1.0 * drift;

          pos.y = mod(pos.y + 12.5, 25.0) - 12.5;

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

    this.godRays = new GodRaysEffect(this.isMobile);

    const bloom = new BloomEffect({
      intensity: 0.2,               // flattened from 0.4
      luminanceThreshold: 0.8,      // raised from 0.7
      luminanceSmoothing: 0.35,
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
    noise.blendMode.opacity.value = 0.03;

    this.composer.addPass(new EffectPass(this.camera, this.godRays, bloom, vignette, noise));
  }

  // --- Interaction: mouse, gyro, click ---
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
    });

    if (this.isMobile) {
      this._setupGyroscope();
    }
  }

  // --- Accumulator-driven scroll navigation (solar system pattern) ---
  // Wheel/touch input → accumulator → full animated transition to next zone.
  // No free-scrolling. Each gesture = one complete stop-to-stop move.
  setupScrollAscent() {
    // Cache zone scroll targets (recalculated on resize)
    this._cacheZoneTargets();
    this.isTransitioning = false;
    this.scrollAccumulator = 0;
    const threshold = 50;

    gsap.ticker.lagSmoothing(0);

    // ScrollTrigger tracks scroll position for scene params + card reveals
    ScrollTrigger.create({
      trigger: '.scroll-content',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        this.scrollProgress = self.progress;
      }
    });

    // --- Wheel accumulator ---
    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.isTransitioning) return;

      this.scrollAccumulator += e.deltaY;

      if (this.scrollAccumulator > threshold) {
        this._advanceZone(1);
        this.scrollAccumulator = 0;
      } else if (this.scrollAccumulator < -threshold) {
        this._advanceZone(-1);
        this.scrollAccumulator = 0;
      }
    }, { passive: false });

    // --- Touch accumulator ---
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      this.scrollAccumulator = 0;
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isTransitioning) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      this.scrollAccumulator += deltaY;
      touchStartY = touchY;

      if (Math.abs(this.scrollAccumulator) > 15) {
        e.preventDefault();
      }

      if (this.scrollAccumulator > threshold) {
        this._advanceZone(1);
        this.scrollAccumulator = 0;
      } else if (this.scrollAccumulator < -threshold) {
        this._advanceZone(-1);
        this.scrollAccumulator = 0;
      }
    }, { passive: false });

    // --- Hero animations ---
    const heroTitle = document.querySelector('.cloud-hero-title');
    const heroTagline = document.querySelector('.cloud-hero-tagline');
    const scrollHint = document.querySelector('.scroll-hint');

    if (heroTitle) {
      gsap.set(heroTitle, { visibility: 'visible' });
      const split = new SplitText(heroTitle, { type: 'words,chars' });

      gsap.from(split.chars, {
        y: 40,
        autoAlpha: 0,
        duration: 0.8,
        stagger: 0.04,
        ease: 'power3.out',
        delay: 0.3,
      });
    }

    if (heroTagline) {
      gsap.set(heroTagline, { visibility: 'visible' });
      gsap.from(heroTagline, {
        autoAlpha: 0,
        y: 20,
        duration: 0.7,
        ease: 'power3.out',
        delay: 1.0,
      });
    }

    // Scroll hint fade-out
    if (scrollHint) {
      gsap.to(scrollHint, {
        autoAlpha: 0,
        scrollTrigger: {
          trigger: '.scroll-content',
          start: 'top top',
          end: '10% top',
          scrub: true,
        },
      });
    }

    // Card reveal animations
    const cards = document.querySelectorAll('.cloud-card');
    cards.forEach((card) => {
      gsap.from(card, {
        y: 60,
        autoAlpha: 0,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          once: true,
        },
      });
    });
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

  // --- Zone navigation helpers ---
  _cacheZoneTargets() {
    const sections = document.querySelectorAll('.cloud-hero, .cloud-zone');
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    this.zoneTargets = Array.from(sections).map(section => {
      const target = section.offsetTop + section.offsetHeight / 2 - window.innerHeight / 2;
      return Math.max(0, Math.min(target, maxScroll));
    });
    this.zoneCount = sections.length;
  }

  _advanceZone(direction) {
    const nextIndex = this.currentZoneIndex + direction;
    if (nextIndex < 0 || nextIndex >= this.zoneCount) return;

    this.currentZoneIndex = nextIndex;
    this._transitionToZone(nextIndex);
  }

  _transitionToZone(index) {
    const target = this.zoneTargets[index];
    const start = window.scrollY;
    const distance = target - start;

    if (Math.abs(distance) < 5) {
      this.isTransitioning = false;
      return;
    }

    this.isTransitioning = true;
    // Transition state — ticked from the main animate() loop (single RAF)
    this._transition = {
      start,
      distance,
      duration: 1500,
      startTime: performance.now(),
    };
  }

  // --- Resize ---
  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);

    // Recalculate zone positions after viewport change
    if (this.zoneTargets) this._cacheZoneTargets();
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

    // Zone-based scene parameters — temporal easing (solar system methodology)
    // Target params update instantly from scroll; eased params drift toward target
    const targetZone = getZoneParams(this.scrollProgress);
    const ease = 0.025; // ~1.7s to reach 95% of target at 60fps

    this.easedZone.skyTop.lerp(targetZone.skyTop, ease);
    this.easedZone.skyMid.lerp(targetZone.skyMid, ease);
    this.easedZone.skyBot.lerp(targetZone.skyBot, ease);
    this.easedZone.cloudDensity += (targetZone.cloudDensity - this.easedZone.cloudDensity) * ease;
    this.easedZone.goldTint += (targetZone.goldTint - this.easedZone.goldTint) * ease;
    this.easedZone.noiseScale += (targetZone.noiseScale - this.easedZone.noiseScale) * ease;
    this.easedZone.driftSpeed += (targetZone.driftSpeed - this.easedZone.driftSpeed) * ease;

    // Apply eased sky colors to background
    this.bgMaterial.uniforms.uColorTop.value.copy(this.easedZone.skyTop);
    this.bgMaterial.uniforms.uColorMid.value.copy(this.easedZone.skyMid);
    this.bgMaterial.uniforms.uColorBot.value.copy(this.easedZone.skyBot);

    // Update cloud layers with eased zone modulation
    for (const mat of this.cloudMaterials) {
      mat.uniforms.uTime.value = this.time;
      mat.uniforms.uBurstCenter.value.copy(this.burstCenter);
      mat.uniforms.uBurstStrength.value = this.burstStrength;
      mat.uniforms.uIntro.value = this.introProgress;

      // Eased zone-driven parameters
      mat.uniforms.uOpacity.value = mat.userData.baseOpacity * this.easedZone.cloudDensity;
      mat.uniforms.uGoldStrength.value = this.easedZone.goldTint;
      mat.uniforms.uNoiseScale.value = mat.userData.baseNoiseScale * this.easedZone.noiseScale;
      mat.uniforms.uDriftSpeed.value = mat.userData.baseDriftSpeed * this.easedZone.driftSpeed;
    }

    // Update particles
    this.particleMaterial.uniforms.uTime.value = this.time;
    this.particleMaterial.uniforms.uParallax.value.set(this.parallax.x, this.parallax.y);
    this.particleMaterial.uniforms.uBurstCenter.value.copy(this.burstCenter);
    this.particleMaterial.uniforms.uBurstStrength.value = this.burstStrength;
    this.particleMaterial.uniforms.uIntro.value = this.introProgress;

    // Drive zone transition from main loop (single RAF — no layout thrashing)
    if (this._transition) {
      const tr = this._transition;
      const elapsed = timestamp - tr.startTime;
      const progress = Math.min(elapsed / tr.duration, 1);
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo(0, tr.start + tr.distance * eased);

      if (progress >= 1) {
        this._transition = null;
        this.isTransitioning = false;
        this.scrollAccumulator = 0;
      }
    }

    // Update god rays — flat intensity (no scroll boost)
    if (this.godRays) {
      const lx = 0.5 + this.parallax.x * 0.05;
      const ly = 0.72 + this.parallax.y * 0.03;
      this.godRays.uniforms.get('uLightPos').value.set(lx, ly);
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
