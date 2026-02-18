// js/cabin-home.js — Sanctuary scroll-driven homepage
// GSAP + Lenis smooth scroll, SplitText hero animation, ScrollTrigger card reveals
// Ambient dust particles, Ken Burns, scroll depth

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

// --- Lenis smooth scroll ---
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  touchMultiplier: 1.5,
});

// Sync Lenis with GSAP ticker (single RAF loop)
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// --- Hero entrance animation ---
function animateHero() {
  const title = document.querySelector('.hero-title');
  const tagline = document.querySelector('.hero-tagline');
  const scrollHint = document.querySelector('.scroll-indicator');

  if (!title) return;

  // Set elements visible before animating (CSS starts them hidden to prevent FOUC)
  gsap.set(title, { visibility: 'visible' });
  if (tagline) gsap.set(tagline, { visibility: 'visible' });
  if (scrollHint) gsap.set(scrollHint, { visibility: 'visible' });

  const split = new SplitText(title, { type: 'chars' });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from(split.chars, {
    y: 40,
    autoAlpha: 0,
    duration: 0.8,
    stagger: 0.04,
  });

  if (tagline) {
    tl.from(tagline, {
      autoAlpha: 0,
      y: 20,
      duration: 0.7,
    }, '-=0.3');
  }

  if (scrollHint) {
    tl.from(scrollHint, {
      autoAlpha: 0,
      duration: 0.6,
    }, '-=0.2');
  }

  // Ken Burns — gentle slow zoom + drift after entrance
  const heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    tl.to(heroBg, {
      scale: 1.06,
      xPercent: -1.5,
      yPercent: -1,
      duration: 30,
      ease: 'none',
      repeat: -1,
      yoyo: true,
    }, '-=0.5');
  }
}

// --- Scroll indicator fade-out ---
function setupScrollIndicator() {
  const scrollHint = document.querySelector('.scroll-indicator');
  if (!scrollHint) return;

  gsap.to(scrollHint, {
    autoAlpha: 0,
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: '15% top',
      scrub: true,
    },
  });
}


// --- Card reveal animations ---
function setupCardReveals() {
  const cards = document.querySelectorAll('.nav-card');
  if (!cards.length) return;

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

// --- Canvas dust particles ---
function setupDustParticles() {
  // Skip if user prefers reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('dust-particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const isMobile = window.innerWidth < 768;
  const count = isMobile ? 30 : 40;

  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  resize();
  window.addEventListener('resize', resize);

  // Create particles — upper 60% of viewport
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight * 0.6,
      r: 1 + Math.random() * 1.5,
      opacity: 0.1 + Math.random() * 0.2,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -0.1 - Math.random() * 0.15,
      phase: Math.random() * Math.PI * 2,
      sineAmp: 0.3 + Math.random() * 0.5,
      sineSpeed: 0.5 + Math.random() * 0.5,
    });
  }

  let time = 0;
  function drawParticles() {
    time += 0.016; // ~60fps
    const w = window.innerWidth;
    const h = window.innerHeight;
    const maxY = h * 0.6;

    ctx.clearRect(0, 0, w, h);

    for (const p of particles) {
      // Sine-wave drift + upward float
      p.x += p.speedX + Math.sin(time * p.sineSpeed + p.phase) * p.sineAmp * 0.1;
      p.y += p.speedY;

      // Twinkle opacity
      const twinkle = 0.7 + Math.sin(time * 2 + p.phase) * 0.3;

      // Wrap off-screen particles
      if (p.y < -5) { p.y = maxY; p.x = Math.random() * w; }
      if (p.x < -5) p.x = w + 5;
      if (p.x > w + 5) p.x = -5;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 248, 230, ${p.opacity * twinkle})`;
      ctx.fill();
    }

    requestAnimationFrame(drawParticles);
  }

  requestAnimationFrame(drawParticles);
}

// --- Init ---
function init() {
  animateHero();
  setupScrollIndicator();
  setupCardReveals();
  setupDustParticles();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
