// js/concepts/rain-glass.js — Rain on Glass Concept Demo
// Fullscreen shader: bright blurred background + procedural raindrops with refraction

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// --- Shared GLSL noise ---
const NOISE_GLSL = `
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
`;

// --- Rain fragment shader ---
const RAIN_FRAGMENT_SHADER = `
  ${NOISE_GLSL}

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uBurstCenter;
  uniform float uBurstStrength;
  uniform float uReducedMotion;
  varying vec2 vUv;

  // Hash functions
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // --- Bright warm background (procedural, no texture) ---
  // Key: needs HIGH local contrast so refraction distortion is visible
  vec3 background(vec2 uv, float t) {
    float anim = 1.0 - uReducedMotion;

    // Base: out-of-focus outdoor scene — tree canopy, sky, buildings
    vec3 skyBlue    = vec3(0.55, 0.68, 0.85);   // blue sky patches
    vec3 leafGreen  = vec3(0.45, 0.62, 0.40);   // dark foliage
    vec3 lightGreen = vec3(0.65, 0.80, 0.55);   // bright foliage
    vec3 warmGold   = vec3(0.92, 0.82, 0.50);   // sunlit patches
    vec3 softGray   = vec3(0.78, 0.76, 0.74);   // neutral (buildings/overcast)
    vec3 warmWhite  = vec3(0.92, 0.90, 0.85);   // bright sky/clouds

    // Vertical structure: sky above, foliage in middle, lighter at bottom
    vec3 bg = mix(lightGreen, skyBlue, smoothstep(0.3, 0.8, uv.y));
    bg = mix(bg, warmWhite, smoothstep(0.75, 1.0, uv.y) * 0.5);

    // Large blurred shapes — like out-of-focus trees, sky gaps
    float n1 = snoise2(uv * 1.5 + vec2(0.0, t * 0.008 * anim)) * 0.5 + 0.5;
    float n2 = snoise2(uv * 2.5 + vec2(50.0, 30.0) + t * 0.006 * anim) * 0.5 + 0.5;
    float n3 = snoise2(uv * 0.9 + vec2(100.0, 60.0)) * 0.5 + 0.5;
    float n4 = snoise2(uv * 3.5 + vec2(80.0, 10.0) + t * 0.01 * anim) * 0.5 + 0.5;
    float n5 = snoise2(uv * 1.8 + vec2(20.0, 90.0)) * 0.5 + 0.5;
    float n6 = snoise2(uv * 4.0 + vec2(60.0, 40.0)) * 0.5 + 0.5;

    // Bold color patches — stronger blending for more contrast
    bg = mix(bg, leafGreen, smoothstep(0.25, 0.65, n1) * 0.40);
    bg = mix(bg, warmGold, smoothstep(0.45, 0.75, n2) * 0.35);
    bg = mix(bg, skyBlue, smoothstep(0.3, 0.6, n3) * 0.35);
    bg = mix(bg, softGray, smoothstep(0.4, 0.7, n4) * 0.20);
    bg = mix(bg, warmWhite, smoothstep(0.5, 0.8, n5) * 0.30);
    bg = mix(bg, lightGreen, smoothstep(0.3, 0.6, n6) * 0.25);

    // Bright diffused daylight from upper area
    vec2 lightPos = vec2(0.5, 0.75);
    float glow = 1.0 - smoothstep(0.0, 0.6, distance(uv, lightPos));
    glow = pow(glow, 2.5);
    bg = mix(bg, warmWhite, glow * 0.25);

    return bg;
  }

  // --- Trailing raindrop layer (drops that slide down) ---
  // Returns vec4: xy = refraction offset, z = edge highlight, w = drop mask
  vec4 trailingDropLayer(vec2 uv, float gridScale, float timeScale, float t, float seed) {
    float anim = 1.0 - uReducedMotion;
    float aspect = uResolution.x / uResolution.y;
    vec2 st = uv * vec2(gridScale * aspect, gridScale);

    vec2 id = floor(st);
    vec2 lv = fract(st) - 0.5;

    float n = hash21(id + seed);
    float n2 = hash21(id + seed + 100.0);
    float n3 = hash21(id + seed + 200.0);

    // ~40% of cells have trailing drops
    if (n > 0.40) return vec4(0.0);

    float speed = 0.15 + n * 0.45;
    float phase = n2 * 6.283;

    // Drop slides down
    float dropY = fract(t * speed * timeScale * anim + phase);
    dropY = dropY * 1.8 - 0.9;

    float dropX = (n2 - 0.5) * 0.45;

    vec2 dropCenter = vec2(dropX, dropY);
    vec2 toD = lv - dropCenter;

    // Elongate vertically (teardrops are taller than wide)
    vec2 toDScaled = toD * vec2(1.3, 0.75);
    float dist = length(toDScaled);

    float dropSize = 0.11 + n * 0.10;

    // Soft drop shape
    float drop = smoothstep(dropSize, dropSize * 0.15, dist);

    // Heavier at bottom (teardrop shape)
    float bulge = smoothstep(0.0, -dropSize * 0.5, toD.y) * drop * 0.3;
    drop = clamp(drop + bulge, 0.0, 1.0);

    // --- Trail above the drop ---
    float trailWidth = 0.02 + n3 * 0.015;
    float trail = smoothstep(trailWidth, 0.0, abs(lv.x - dropX));
    trail *= smoothstep(dropCenter.y, dropCenter.y + 0.25, lv.y);
    trail *= smoothstep(dropCenter.y + 0.45, dropCenter.y + 0.08, lv.y);
    float trailBreak = smoothstep(0.3, 0.6, hash21(id + floor(lv.y * 6.0) + seed));
    trail *= trailBreak * 0.5;

    float mask = clamp(drop + trail, 0.0, 1.0);

    // Refraction: UV offset pushes toward drop center (lens magnification)
    vec2 refract = toD * drop * 0.75; // strong distortion — THIS is the main visual

    // Edge highlight: thin bright rim at drop edge (fresnel-like)
    float edge = smoothstep(dropSize * 0.35, dropSize * 0.9, dist) * drop;
    // Tiny bright specular on upper-left (light direction)
    float spec = smoothstep(dropSize * 0.5, dropSize * 0.15, length(toD - vec2(-0.03, 0.04))) * drop;

    return vec4(refract, edge * 0.20 + spec * 0.12, mask);
  }

  // --- Stationary drops (small beads sitting on glass) ---
  vec4 stationaryDropLayer(vec2 uv, float gridScale, float seed) {
    float aspect = uResolution.x / uResolution.y;
    vec2 st = uv * vec2(gridScale * aspect, gridScale);

    vec2 id = floor(st);
    vec2 lv = fract(st) - 0.5;

    float n = hash21(id + seed);
    float n2 = hash21(id + seed + 77.0);

    // ~30% of cells have stationary drops
    if (n > 0.30) return vec4(0.0);

    // Fixed position, slight jitter
    vec2 dropCenter = vec2((n - 0.5) * 0.6, (n2 - 0.5) * 0.6);
    vec2 toD = lv - dropCenter;
    float dist = length(toD);

    // Small round drops
    float dropSize = 0.05 + n2 * 0.07;
    float drop = smoothstep(dropSize, dropSize * 0.1, dist);

    // Refraction — smaller but still visible
    vec2 refract = toD * drop * 0.4;

    // Tiny highlight
    float edge = smoothstep(dropSize * 0.3, dropSize * 0.8, dist) * drop;

    return vec4(refract, edge * 0.1, drop);
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime;

    // Accumulate refraction offset + highlight from all layers
    vec2 totalRefract = vec2(0.0);
    float totalHighlight = 0.0;

    // Layer 1: Large trailing drops (foreground)
    vec4 L1 = trailingDropLayer(uv, 5.0, 0.10, t, 0.0);
    totalRefract += L1.xy;
    totalHighlight += L1.z;

    // Layer 2: Medium trailing drops
    vec4 L2 = trailingDropLayer(uv, 9.0, 0.08, t + 10.0, 50.0);
    totalRefract += L2.xy * 0.6;
    totalHighlight += L2.z * 0.7;

    // Layer 3: Small trailing drops (background)
    vec4 L3 = trailingDropLayer(uv, 16.0, 0.06, t + 20.0, 100.0);
    totalRefract += L3.xy * 0.3;
    totalHighlight += L3.z * 0.4;

    // Layer 4: Stationary micro-drops (beads sitting on glass)
    vec4 S1 = stationaryDropLayer(uv, 12.0, 200.0);
    totalRefract += S1.xy * 0.25;
    totalHighlight += S1.z * 0.3;

    vec4 S2 = stationaryDropLayer(uv, 20.0, 300.0);
    totalRefract += S2.xy * 0.15;
    totalHighlight += S2.z * 0.2;

    // Apply refraction to background UV — THIS is the main visual effect
    // Drops are lenses that distort/magnify the scene behind the glass
    vec2 refractedUV = uv + totalRefract;
    vec3 color = background(refractedUV, t);

    // Very subtle edge highlight (simulates light catching drop edges)
    vec3 highlightColor = vec3(1.0, 0.98, 0.94);
    color += highlightColor * totalHighlight;

    // Glass surface: very slight overall darkening where water sits
    float totalMask = L1.w + L2.w * 0.7 + L3.w * 0.4 + S1.w * 0.3 + S2.w * 0.2;
    color *= 1.0 - clamp(totalMask, 0.0, 1.0) * 0.03;

    // Touch burst ripple
    vec2 burstUV = vUv * 2.0 - 1.0;
    float burstDist = distance(burstUV, uBurstCenter);
    float ripple = smoothstep(0.04, 0.0, abs(burstDist - fract(t * 0.8) * 1.5) - 0.015) * uBurstStrength;
    color += highlightColor * ripple * 0.12;

    // Subtle vignette
    vec2 vc = vUv - 0.5;
    float vDist = length(vc);
    float vignette = smoothstep(0.85, 0.35, vDist);
    color *= 0.92 + vignette * 0.08;

    gl_FragColor = vec4(color, 1.0);
  }
`;

class RainGlassScene {
  constructor() {
    this.canvas = document.getElementById('rain-glass-canvas');
    if (!this.canvas) return;

    this.isMobile = window.innerWidth < 768;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.time = 0;
    this.lastTimestamp = 0;

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

    this.createRainShader();
    this.setupPostProcessing();
    this.setupInteraction();

    // Resize
    this._onResize = this._debounce(() => this.onResize(), 200);
    window.addEventListener('resize', this._onResize);
    this.onResize();

    // Start
    requestAnimationFrame((t) => this.animate(t));
  }

  createRainShader() {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uBurstCenter: { value: new THREE.Vector2(0, 0) },
        uBurstStrength: { value: 0 },
        uReducedMotion: { value: this.prefersReducedMotion ? 1.0 : 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.9999, 1.0);
        }
      `,
      fragmentShader: RAIN_FRAGMENT_SHADER,
      depthWrite: false,
      depthTest: false
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1000;
    this.rainMaterial = mat;
    this.scene.add(mesh);
  }

  setupPostProcessing() {
    const halfW = Math.floor(window.innerWidth / 2);
    const halfH = Math.floor(window.innerHeight / 2);

    this.composer = new EffectComposer(this.renderer);

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // Bloom — very subtle, just softens the scene
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(halfW, halfH),
      0.15,   // strength — minimal
      0.6,    // radius
      0.95    // threshold — very high, only brightest spots
    );
    this.composer.addPass(this.bloomPass);

    // Composite: warm vignette + grain
    this.compositeShader = {
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uGrainIntensity: { value: 0.018 },
        uVignetteColor: { value: new THREE.Vector3(0.45, 0.42, 0.38) },
        uVignetteIntensity: { value: 0.15 }
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

          // Warm vignette
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

  setupInteraction() {
    this.canvas.addEventListener('click', (e) => {
      this.burstCenter.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      this.burstStrength = 1.0;

      const hint = document.getElementById('tap-hint');
      if (hint) hint.classList.add('hidden');
    });

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

    this.rainMaterial.uniforms.uResolution.value.set(w, h);
  }

  animate(timestamp = 0) {
    requestAnimationFrame((t) => this.animate(t));

    if (this.lastTimestamp === 0) this.lastTimestamp = timestamp;
    const delta = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;
    this.time += delta;

    // Decay touch burst
    this.burstStrength *= 0.94;
    if (this.burstStrength < 0.001) this.burstStrength = 0;

    // Update uniforms
    this.rainMaterial.uniforms.uTime.value = this.time;
    this.rainMaterial.uniforms.uBurstCenter.value.copy(this.burstCenter);
    this.rainMaterial.uniforms.uBurstStrength.value = this.burstStrength;

    this.compositePass.uniforms.uTime.value = this.time;

    this.composer.render();
  }

  _debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new RainGlassScene();
});
