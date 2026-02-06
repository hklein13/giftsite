// js/concepts/rain-glass.js — Rain on Glass Concept Demo (Polished)
// Fullscreen shader: render-to-texture blurred background with rainbow,
// procedural raindrops with lens-like refraction + chromatic aberration,
// condensation layer, warm cozy palette, pmndrs postprocessing

import * as THREE from 'three';
import { EffectComposer, RenderPass, EffectPass, BloomEffect, VignetteEffect, NoiseEffect, BlendFunction } from 'postprocessing';

// ---------- GLSL helpers ----------
const NOISE_GLSL = /* glsl */`
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

// ---------- Background generation shader (rendered once to texture) ----------
const BG_FRAGMENT = /* glsl */`
  ${NOISE_GLSL}

  uniform vec2 uResolution;
  varying vec2 vUv;

  // Spectral rainbow color from angle
  vec3 rainbow(float t) {
    // t in [0,1] across the rainbow band
    vec3 c;
    if (t < 0.167)      c = mix(vec3(0.58, 0.0, 0.83), vec3(0.0, 0.0, 0.9), t / 0.167);           // violet -> blue
    else if (t < 0.333) c = mix(vec3(0.0, 0.0, 0.9),  vec3(0.0, 0.7, 0.2), (t - 0.167) / 0.167);  // blue -> green
    else if (t < 0.5)   c = mix(vec3(0.0, 0.7, 0.2),  vec3(0.95, 0.9, 0.1), (t - 0.333) / 0.167); // green -> yellow
    else if (t < 0.667) c = mix(vec3(0.95, 0.9, 0.1), vec3(1.0, 0.55, 0.0), (t - 0.5) / 0.167);   // yellow -> orange
    else                 c = mix(vec3(1.0, 0.55, 0.0), vec3(0.9, 0.1, 0.1), (t - 0.667) / 0.333);   // orange -> red
    return c;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;

    // --- Sky and ground structure ---
    // Horizon at ~40% from bottom
    float horizon = 0.40;

    // Sky colors — warm, bright, inviting
    vec3 skyTop     = vec3(0.50, 0.65, 0.88);  // soft blue
    vec3 skyMid     = vec3(0.72, 0.80, 0.92);  // lighter blue
    vec3 skyHorizon = vec3(0.88, 0.86, 0.82);  // warm haze at horizon
    vec3 warmGold   = vec3(0.95, 0.88, 0.60);  // sunlit patches
    vec3 warmWhite  = vec3(0.96, 0.94, 0.90);  // bright clouds

    // Ground colors — foliage
    vec3 darkGreen  = vec3(0.30, 0.48, 0.28);  // deep foliage
    vec3 midGreen   = vec3(0.45, 0.62, 0.38);  // mid foliage
    vec3 lightGreen = vec3(0.58, 0.72, 0.45);  // bright foliage
    vec3 earthBrown = vec3(0.50, 0.42, 0.32);  // ground/bark

    vec3 color;

    if (uv.y > horizon) {
      // Sky
      float skyT = (uv.y - horizon) / (1.0 - horizon);
      color = mix(skyHorizon, skyMid, smoothstep(0.0, 0.4, skyT));
      color = mix(color, skyTop, smoothstep(0.4, 1.0, skyT));

      // Soft cloud shapes in sky
      float cn1 = snoise2(uv * vec2(2.0 * aspect, 2.0) + vec2(10.0, 5.0)) * 0.5 + 0.5;
      float cn2 = snoise2(uv * vec2(3.5 * aspect, 3.0) + vec2(30.0, 20.0)) * 0.5 + 0.5;
      color = mix(color, warmWhite, smoothstep(0.4, 0.7, cn1) * 0.35);
      color = mix(color, warmWhite, smoothstep(0.5, 0.8, cn2) * 0.20);

      // Warm sunlit glow — upper right area
      vec2 sunPos = vec2(0.65, 0.82);
      float sunGlow = 1.0 - smoothstep(0.0, 0.5, distance(uv, sunPos));
      sunGlow = pow(sunGlow, 2.0);
      color = mix(color, warmGold, sunGlow * 0.30);

    } else {
      // Ground — foliage and trees
      float groundT = uv.y / horizon;

      // Base: dark green at bottom, lighter green near horizon
      color = mix(darkGreen, midGreen, smoothstep(0.0, 0.7, groundT));
      color = mix(color, lightGreen, smoothstep(0.6, 1.0, groundT));

      // Foliage shapes — large blobs
      float fn1 = snoise2(uv * vec2(3.0 * aspect, 4.0) + vec2(0.0, 0.0)) * 0.5 + 0.5;
      float fn2 = snoise2(uv * vec2(5.0 * aspect, 6.0) + vec2(50.0, 30.0)) * 0.5 + 0.5;
      float fn3 = snoise2(uv * vec2(2.0 * aspect, 2.5) + vec2(80.0, 10.0)) * 0.5 + 0.5;

      color = mix(color, darkGreen, smoothstep(0.3, 0.6, fn1) * 0.30);
      color = mix(color, lightGreen, smoothstep(0.4, 0.7, fn2) * 0.25);

      // Sunlit patches filtering through trees
      float sunlit = smoothstep(0.5, 0.8, fn3) * smoothstep(0.4, 0.9, groundT);
      color = mix(color, warmGold, sunlit * 0.25);

      // Earth/bark hint at very bottom
      color = mix(color, earthBrown, smoothstep(0.2, 0.0, groundT) * 0.3);
    }

    // --- Subtle rainbow arc ---
    // Rainbow center opposite the sun — lower-left area
    vec2 rainbowCenter = vec2(0.35, -0.15);
    float rainbowDist = distance(uv * vec2(aspect, 1.0), rainbowCenter * vec2(aspect, 1.0));

    // Rainbow band: arc radius ~0.75, width ~0.08
    float innerR = 0.70;
    float outerR = 0.78;
    float bandT = smoothstep(innerR, innerR + 0.02, rainbowDist)
                * smoothstep(outerR + 0.02, outerR, rainbowDist);

    // Only show in sky portion, fade at edges
    float rainbowMask = bandT * smoothstep(horizon - 0.05, horizon + 0.15, uv.y);
    rainbowMask *= smoothstep(0.0, 0.15, uv.x) * smoothstep(1.0, 0.7, uv.x);

    // Spectral color based on position in band
    float bandPos = (rainbowDist - innerR) / (outerR - innerR);
    vec3 rainbowColor = rainbow(clamp(bandPos, 0.0, 1.0));
    color = mix(color, rainbowColor, rainbowMask * 0.18);

    // --- Soft overall blur effect (we blur in JS, this adds a slight haze) ---
    // Slight warmth added everywhere
    color = mix(color, vec3(0.92, 0.88, 0.82), 0.05);

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ---------- Rain fragment shader (samples background texture) ----------
const RAIN_FRAGMENT = /* glsl */`
  uniform float uTime;
  uniform vec2 uResolution;
  uniform sampler2D uBackground;
  uniform vec2 uBurstCenter;
  uniform float uBurstStrength;
  uniform float uReducedMotion;
  uniform float uIntro;  // 0->1 entrance animation
  varying vec2 vUv;

  // Hash functions
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
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

    // Stop-start behavior: drops pause, then slide with acceleration
    float rawProgress = fract(-t * speed * timeScale * anim + phase);

    // Create stop-start: use smoothstep to make drops linger near top, accelerate toward bottom
    float pauseDuration = 0.15 + n3 * 0.2; // each drop pauses differently
    float dropProgress;
    if (rawProgress < pauseDuration) {
      // Paused near top
      dropProgress = 0.0;
    } else {
      // Sliding — ease in (accelerate)
      float slideT = (rawProgress - pauseDuration) / (1.0 - pauseDuration);
      dropProgress = slideT * slideT; // quadratic ease-in
    }

    float dropY = dropProgress * 1.8 - 0.9;

    // Slight horizontal wobble during descent
    float wobble = sin(rawProgress * 12.0 + phase) * 0.02 * anim;
    float dropX = (n2 - 0.5) * 0.45 + wobble;

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

    // Lens-like refraction: stronger at edges, magnification at center
    float normalizedDist = dist / dropSize;
    float lensStrength = smoothstep(0.0, 0.8, normalizedDist) * drop;
    vec2 refract = toD * lensStrength * 0.85 + toD * drop * 0.15;

    // Edge highlight: thin bright rim at drop edge (fresnel-like)
    float edge = smoothstep(dropSize * 0.35, dropSize * 0.9, dist) * drop;
    // Tiny bright specular on upper-left (light direction)
    float spec = smoothstep(dropSize * 0.5, dropSize * 0.15, length(toD - vec2(-0.03, 0.04))) * drop;

    return vec4(refract, edge * 0.22 + spec * 0.14, mask);
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

    vec2 dropCenter = vec2((n - 0.5) * 0.6, (n2 - 0.5) * 0.6);
    vec2 toD = lv - dropCenter;
    float dist = length(toD);

    float dropSize = 0.05 + n2 * 0.07;
    float drop = smoothstep(dropSize, dropSize * 0.1, dist);

    // Lens refraction for small beads too
    float normalizedDist = dist / dropSize;
    float lensStrength = smoothstep(0.0, 0.7, normalizedDist) * drop;
    vec2 refract = toD * lensStrength * 0.45 + toD * drop * 0.1;

    float edge = smoothstep(dropSize * 0.3, dropSize * 0.8, dist) * drop;

    return vec4(refract, edge * 0.1, drop);
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime;

    // Accumulate refraction offset + highlight from all layers
    vec2 totalRefract = vec2(0.0);
    float totalHighlight = 0.0;

    // Scale drops by intro (appear gradually)
    float dropScale = smoothstep(0.0, 1.0, uIntro);

    // Layer 1: Large trailing drops (foreground)
    vec4 L1 = trailingDropLayer(uv, 5.0, 0.10, t, 0.0);
    totalRefract += L1.xy * dropScale;
    totalHighlight += L1.z * dropScale;

    // Layer 2: Medium trailing drops
    vec4 L2 = trailingDropLayer(uv, 9.0, 0.08, t + 10.0, 50.0);
    totalRefract += L2.xy * 0.6 * dropScale;
    totalHighlight += L2.z * 0.7 * dropScale;

    // Layer 3: Small trailing drops (background)
    vec4 L3 = trailingDropLayer(uv, 16.0, 0.06, t + 20.0, 100.0);
    totalRefract += L3.xy * 0.3 * dropScale;
    totalHighlight += L3.z * 0.4 * dropScale;

    // Layer 4: Stationary micro-drops
    vec4 S1 = stationaryDropLayer(uv, 12.0, 200.0);
    totalRefract += S1.xy * 0.25 * dropScale;
    totalHighlight += S1.z * 0.3 * dropScale;

    vec4 S2 = stationaryDropLayer(uv, 20.0, 300.0);
    totalRefract += S2.xy * 0.15 * dropScale;
    totalHighlight += S2.z * 0.2 * dropScale;

    // --- Chromatic aberration through drops ---
    // Sample R, G, B at slightly different offsets for spectral fringing
    float caStrength = 0.003;
    vec2 refractR = uv + totalRefract * (1.0 + caStrength);
    vec2 refractG = uv + totalRefract;
    vec2 refractB = uv + totalRefract * (1.0 - caStrength);

    float r = texture2D(uBackground, refractR).r;
    float g = texture2D(uBackground, refractG).g;
    float b = texture2D(uBackground, refractB).b;
    vec3 color = vec3(r, g, b);

    // --- Warm condensation layer ---
    // Subtle fog across glass — thicker at edges, warm tint
    float condensation = smoothstep(0.3, 0.85, length(vUv - 0.5)) * 0.05;
    vec3 condensationColor = vec3(0.94, 0.91, 0.86); // warm cream
    color = mix(color, condensationColor, condensation * dropScale);

    // Very subtle edge highlight (simulates light catching drop edges)
    vec3 highlightColor = vec3(1.0, 0.98, 0.93);
    color += highlightColor * totalHighlight;

    // Glass surface: very slight darkening where water sits
    float totalMask = L1.w + L2.w * 0.7 + L3.w * 0.4 + S1.w * 0.3 + S2.w * 0.2;
    color *= 1.0 - clamp(totalMask, 0.0, 1.0) * 0.03;

    // Touch burst ripple
    vec2 burstUV = vUv * 2.0 - 1.0;
    float burstDist = distance(burstUV, uBurstCenter);
    float ripple = smoothstep(0.04, 0.0, abs(burstDist - fract(t * 0.8) * 1.5) - 0.015) * uBurstStrength;
    color += highlightColor * ripple * 0.12;

    // Entrance fade
    color = mix(vec3(0.94, 0.91, 0.86), color, smoothstep(0.0, 0.6, uIntro));

    gl_FragColor = vec4(color, 1.0);
  }
`;

// ---------- Simple blur shader for background texture ----------
const BLUR_FRAGMENT = /* glsl */`
  uniform sampler2D tDiffuse;
  uniform vec2 uDirection;
  uniform vec2 uResolution;
  varying vec2 vUv;

  void main() {
    vec2 texelSize = 1.0 / uResolution;
    vec3 result = vec3(0.0);

    // 9-tap Gaussian blur
    float weights[5];
    weights[0] = 0.227027;
    weights[1] = 0.194594;
    weights[2] = 0.121622;
    weights[3] = 0.054054;
    weights[4] = 0.016216;

    result += texture2D(tDiffuse, vUv).rgb * weights[0];
    for (int i = 1; i < 5; i++) {
      vec2 offset = uDirection * texelSize * float(i) * 3.0;
      result += texture2D(tDiffuse, vUv + offset).rgb * weights[i];
      result += texture2D(tDiffuse, vUv - offset).rgb * weights[i];
    }

    gl_FragColor = vec4(result, 1.0);
  }
`;

const SIMPLE_VERTEX = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

// ---------- Main scene class ----------
class RainGlassScene {
  constructor() {
    this.canvas = document.getElementById('rain-glass-canvas');
    if (!this.canvas) return;

    this.isMobile = window.innerWidth < 768;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.time = 0;
    this.introProgress = 0;
    this.lastTimestamp = 0;

    // Touch burst state
    this.burstCenter = new THREE.Vector2(0, 0);
    this.burstStrength = 0;

    // Renderer with ACES tone mapping
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: false,
      antialias: false
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    const maxPixelRatio = this.isMobile ? 2 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 0, 30);

    this.createBackgroundTexture();
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

  // --- Render background to texture (once, with blur) ---
  createBackgroundTexture() {
    const w = Math.min(window.innerWidth, 1024);
    const h = Math.min(window.innerHeight, 1024);

    // Render target for the sharp background
    const rtSharp = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });

    // Blur targets (ping-pong)
    this.bgTarget = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });
    const rtBlurTemp = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat
    });

    // Background scene
    const bgScene = new THREE.Scene();
    const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const bgGeo = new THREE.PlaneGeometry(2, 2);

    // Render the background
    const bgMat = new THREE.ShaderMaterial({
      uniforms: {
        uResolution: { value: new THREE.Vector2(w, h) }
      },
      vertexShader: SIMPLE_VERTEX,
      fragmentShader: BG_FRAGMENT,
      depthWrite: false,
      depthTest: false
    });
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    bgScene.add(bgMesh);
    this.renderer.setRenderTarget(rtSharp);
    this.renderer.render(bgScene, bgCamera);

    // Blur pass (horizontal then vertical, multiple iterations for strong blur)
    const blurMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        uDirection: { value: new THREE.Vector2(1, 0) },
        uResolution: { value: new THREE.Vector2(w, h) }
      },
      vertexShader: SIMPLE_VERTEX,
      fragmentShader: BLUR_FRAGMENT,
      depthWrite: false,
      depthTest: false
    });

    bgScene.remove(bgMesh);
    const blurMesh = new THREE.Mesh(bgGeo, blurMat);
    bgScene.add(blurMesh);

    // 3 blur iterations for a nice out-of-focus look
    let readTarget = rtSharp;
    for (let i = 0; i < 3; i++) {
      // Horizontal
      blurMat.uniforms.tDiffuse.value = readTarget.texture;
      blurMat.uniforms.uDirection.value.set(1, 0);
      this.renderer.setRenderTarget(rtBlurTemp);
      this.renderer.render(bgScene, bgCamera);

      // Vertical
      blurMat.uniforms.tDiffuse.value = rtBlurTemp.texture;
      blurMat.uniforms.uDirection.value.set(0, 1);
      this.renderer.setRenderTarget(this.bgTarget);
      this.renderer.render(bgScene, bgCamera);

      readTarget = this.bgTarget;
    }

    this.renderer.setRenderTarget(null);

    // Cleanup temp targets
    rtSharp.dispose();
    rtBlurTemp.dispose();
    bgMat.dispose();
    blurMat.dispose();
    bgGeo.dispose();
  }

  createRainShader() {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uBackground: { value: this.bgTarget.texture },
        uBurstCenter: { value: new THREE.Vector2(0, 0) },
        uBurstStrength: { value: 0 },
        uReducedMotion: { value: this.prefersReducedMotion ? 1.0 : 0.0 },
        uIntro: { value: 0 }
      },
      vertexShader: SIMPLE_VERTEX,
      fragmentShader: RAIN_FRAGMENT,
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
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    // Combine bloom + vignette + noise into a single EffectPass
    const bloom = new BloomEffect({
      intensity: 0.2,
      luminanceThreshold: 0.9,
      luminanceSmoothing: 0.4,
      mipmapBlur: true
    });

    const vignette = new VignetteEffect({
      offset: 0.35,
      darkness: 0.35
    });

    const noise = new NoiseEffect({
      blendFunction: BlendFunction.OVERLAY,
      premultiply: false
    });
    noise.blendMode.opacity.value = 0.08;

    this.composer.addPass(new EffectPass(this.camera, bloom, vignette, noise));
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

    this.rainMaterial.uniforms.uResolution.value.set(w, h);

    // Re-render background texture on resize
    this.createBackgroundTexture();
    this.rainMaterial.uniforms.uBackground.value = this.bgTarget.texture;
  }

  animate(timestamp = 0) {
    requestAnimationFrame((t) => this.animate(t));

    if (this.lastTimestamp === 0) this.lastTimestamp = timestamp;
    const delta = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;
    this.time += delta;

    // Entrance animation (0 -> 1 over ~2 seconds)
    if (this.introProgress < 1) {
      this.introProgress = Math.min(1, this.introProgress + delta * 0.5);
    }

    // Decay touch burst
    this.burstStrength *= 0.94;
    if (this.burstStrength < 0.001) this.burstStrength = 0;

    // Update uniforms
    this.rainMaterial.uniforms.uTime.value = this.time;
    this.rainMaterial.uniforms.uBurstCenter.value.copy(this.burstCenter);
    this.rainMaterial.uniforms.uBurstStrength.value = this.burstStrength;
    this.rainMaterial.uniforms.uIntro.value = this.introProgress;

    this.composer.render(delta);
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
