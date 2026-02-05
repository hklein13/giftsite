// js/concepts/golden-hour.js — Golden Hour Concept Demo
// Self-contained Three.js scene: warm atmosphere, golden particles, god-rays, bloom

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

class GoldenHourScene {
  constructor() {
    this.canvas = document.getElementById('golden-hour-canvas');
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
      antialias: false // We have bloom, no need for MSAA
    });
    const maxPixelRatio = this.isMobile ? 2 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Single scene for everything (bg quad + particles go through composer together)
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 0, 30);

    this.createBackground();
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

  // --- Background gradient shader ---
  createBackground() {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uParallax: { value: new THREE.Vector2(0, 0) },
        uColorTop: { value: new THREE.Color(0x4A90C4) },    // Rich sky blue
        uColorMid: { value: new THREE.Color(0x87CEEB) },    // Light sky blue
        uColorBot: { value: new THREE.Color(0xF0C850) }     // Bright true gold (horizon)
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
          // 3-color vertical gradient: blue sky dominates, golden warmth at horizon
          float t = vUv.y;

          // Breathing animation: subtle vertical shift
          float breath = sin(uTime * 0.3) * 0.015;
          t += breath;

          // Blue covers top ~60%, warm gold in bottom ~40%
          vec3 color;
          if (t > 0.4) {
            // Upper 60%: rich blue to light sky blue
            color = mix(uColorMid, uColorTop, smoothstep(0.4, 1.0, t));
          } else {
            // Lower 40%: warm gold to light sky blue
            color = mix(uColorBot, uColorMid, smoothstep(0.0, 0.4, t));
          }

          // Radial warm glow from bottom-center (the "sun" below viewport)
          vec2 sunCenter = vec2(0.5 + uParallax.x * 0.05, -0.15 + uParallax.y * 0.03);
          float distToSun = distance(vUv, sunCenter);
          float sunGlow = 1.0 - smoothstep(0.0, 0.8, distToSun);
          sunGlow = pow(sunGlow, 2.2);

          // Blend sun warmth into horizon
          vec3 sunColor = vec3(1.0, 0.9, 0.65);
          color = mix(color, sunColor, sunGlow * 0.3);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      depthWrite: false,
      depthTest: false
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1000; // Always render behind particles
    this.bgMaterial = mat;
    this.scene.add(mesh);
  }

  // --- Golden floating particles ---
  createParticles() {
    const count = 150;
    const positions = new Float32Array(count * 3);
    const aSize = new Float32Array(count);
    const aSpeed = new Float32Array(count);
    const aPhase = new Float32Array(count);
    const aOpacity = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread in a wide box in front of camera
      positions[i * 3]     = (Math.random() - 0.5) * 60;  // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;  // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40;  // z

      aSize[i] = 0.5 + Math.random() * 1.5;
      aSpeed[i] = 0.3 + Math.random() * 0.7;
      aPhase[i] = Math.random() * Math.PI * 2;
      aOpacity[i] = 0.15 + Math.random() * 0.4;
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

          // Drift animation (disabled if reduced motion)
          float drift = (1.0 - uReducedMotion);

          // Upward drift with wrap-around
          float yOffset = mod(uTime * aSpeed * 2.0 * drift + aPhase * 10.0, 40.0) - 20.0;
          pos.y = position.y + yOffset;

          // Gentle sine wave horizontal sway
          pos.x += sin(uTime * aSpeed * 0.5 + aPhase) * 2.0 * drift;
          pos.z += cos(uTime * aSpeed * 0.3 + aPhase * 1.5) * 1.5 * drift;

          // Parallax shift
          pos.x += uParallax.x * 3.0;
          pos.y += uParallax.y * 2.0;

          // Touch burst: push particles outward from burst point
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
          // Soft circular falloff
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          float alpha = smoothstep(0.5, 0.15, dist) * vOpacity;

          // Warm golden color
          vec3 color = vec3(1.0, 0.88, 0.55);

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

  // --- Post-processing chain ---
  setupPostProcessing() {
    const halfW = Math.floor(window.innerWidth / 2);
    const halfH = Math.floor(window.innerHeight / 2);

    this.composer = new EffectComposer(this.renderer);

    // 1. Render pass (bg quad + particles in one scene)
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    // 2. Bloom
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(halfW, halfH),
      0.5,   // strength
      1.0,   // radius
      0.85   // threshold — raised so bright sky gradient doesn't trigger bloom
    );
    this.composer.addPass(this.bloomPass);

    // 3. God-rays (radial blur from sun position)
    const godRaySamples = this.isMobile ? 30 : 60;
    this.godRayShader = {
      uniforms: {
        tDiffuse: { value: null },
        uSunPos: { value: new THREE.Vector2(0.5, 0.0) }, // Bottom center in UV
        uIntensity: { value: 0.25 },
        uDecay: { value: 0.97 },
        uSamples: { value: godRaySamples },
        uTime: { value: 0 },
        uReducedMotion: { value: this.prefersReducedMotion ? 1.0 : 0.0 }
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
        uniform vec2 uSunPos;
        uniform float uIntensity;
        uniform float uDecay;
        uniform float uSamples;
        uniform float uTime;
        uniform float uReducedMotion;
        varying vec2 vUv;

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);

          // Direction from pixel toward the sun
          vec2 toSun = uSunPos - vUv;
          float dist = length(toSun);
          vec2 dir = toSun / uSamples;

          // Accumulate light along ray toward sun
          float illumination = 1.0;
          vec2 sampleUv = vUv;
          vec4 rays = vec4(0.0);

          for (float i = 0.0; i < 60.0; i++) {
            if (i >= uSamples) break;
            sampleUv += dir;
            vec4 s = texture2D(tDiffuse, sampleUv);
            s *= illumination;
            rays += s;
            illumination *= uDecay;
          }
          rays /= uSamples;

          // Gentle warm tint for god-rays
          rays.rgb *= vec3(1.0, 0.95, 0.85);

          // Fade god-rays near edges of screen
          float edgeFade = smoothstep(0.0, 0.3, vUv.y) * smoothstep(0.0, 0.15, min(vUv.x, 1.0 - vUv.x));

          // Animate intensity subtly
          float anim = 1.0 - uReducedMotion * 0.5;
          float pulse = 1.0 + sin(uTime * 0.5) * 0.1 * anim;

          color += rays * uIntensity * edgeFade * pulse;

          gl_FragColor = color;
        }
      `
    };
    this.godRayPass = new ShaderPass(this.godRayShader);
    this.godRayPass.setSize(halfW, halfH);
    this.composer.addPass(this.godRayPass);

    // 4. Final composite: warm amber vignette + subtle grain
    this.compositeShader = {
      uniforms: {
        tDiffuse: { value: null },
        uTime: { value: 0 },
        uGrainIntensity: { value: 0.03 },
        uVignetteColor: { value: new THREE.Vector3(0.8, 0.5, 0.2) }, // Warm amber
        uVignetteIntensity: { value: 0.3 }
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

          // Warm amber vignette
          vec2 center = vUv - 0.5;
          float dist = length(center);
          float vignette = smoothstep(0.7, 0.3, dist);
          // Mix in warm color at edges
          float vignetteEdge = 1.0 - vignette;
          color.rgb = mix(color.rgb, color.rgb * (1.0 - uVignetteIntensity) + uVignetteColor * uVignetteIntensity * 0.3, vignetteEdge);
          // Darken edges
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
    // Desktop: mouse parallax
    if (!this.isMobile) {
      window.addEventListener('mousemove', (e) => {
        this.targetParallax.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.targetParallax.y = -(e.clientY / window.innerHeight) * 2 + 1;
      });
    }

    // Touch burst
    this.canvas.addEventListener('click', (e) => {
      // Normalize to -1..1 clip space
      this.burstCenter.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
      this.burstStrength = 1.0;

      // Hide tap hint after first interaction
      const hint = document.getElementById('tap-hint');
      if (hint) hint.classList.add('hidden');
    });

    // Mobile: gyroscope
    if (this.isMobile) {
      this._setupGyroscope();

      // Also handle touch burst via touchstart
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
        // gamma: left/right tilt (-90..90), beta: front/back (−180..180)
        this.targetParallax.x = Math.max(-1, Math.min(1, e.gamma / 30));
        this.targetParallax.y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
      }
    };

    // iOS 13+ requires permission request
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      // Request on first tap
      const requestGyro = () => {
        DeviceOrientationEvent.requestPermission()
          .then((state) => {
            if (state === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          })
          .catch(() => {}); // Silently fail
        // Only try once
        window.removeEventListener('touchstart', requestGyro);
      };
      window.addEventListener('touchstart', requestGyro, { once: true });
    } else {
      // Android / older iOS: direct listener
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
    this.godRayPass.setSize(halfW, halfH);
  }

  // --- Animation loop ---
  animate(timestamp = 0) {
    requestAnimationFrame((t) => this.animate(t));

    // Delta time
    if (this.lastTimestamp === 0) this.lastTimestamp = timestamp;
    const delta = Math.min((timestamp - this.lastTimestamp) / 1000, 0.1);
    this.lastTimestamp = timestamp;
    this.time += delta;

    // Smooth parallax
    this.parallax.x += (this.targetParallax.x - this.parallax.x) * 0.05;
    this.parallax.y += (this.targetParallax.y - this.parallax.y) * 0.05;

    // Auto-animation fallback: gentle drift when no input
    if (!this.gyroAvailable && this.isMobile && !this.prefersReducedMotion) {
      this.targetParallax.x = Math.sin(this.time * 0.15) * 0.3;
      this.targetParallax.y = Math.cos(this.time * 0.1) * 0.2;
    }

    // Decay touch burst
    this.burstStrength *= 0.95;
    if (this.burstStrength < 0.001) this.burstStrength = 0;

    // Update background uniforms
    this.bgMaterial.uniforms.uTime.value = this.time;
    this.bgMaterial.uniforms.uParallax.value.set(this.parallax.x, this.parallax.y);

    // Update particle uniforms (only uTime, uParallax, burst — no buffer updates)
    this.particleMaterial.uniforms.uTime.value = this.time;
    this.particleMaterial.uniforms.uParallax.value.set(this.parallax.x, this.parallax.y);
    this.particleMaterial.uniforms.uBurstCenter.value.copy(this.burstCenter);
    this.particleMaterial.uniforms.uBurstStrength.value = this.burstStrength;

    // Update post-processing uniforms
    this.godRayPass.uniforms.uTime.value = this.time;
    this.compositePass.uniforms.uTime.value = this.time;

    // Render everything through composer (bg quad + particles + post-processing)
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
  new GoldenHourScene();
});
