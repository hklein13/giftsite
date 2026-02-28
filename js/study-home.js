// js/study-home.js — The Study homepage
// GSAP + Lenis smooth scroll, frame-scroller canvas playback, ScrollTrigger card reveals

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { createFrameScroller } from './frame-scroller.js';

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

// --- Frame scroller setup ---
function setupFrameScroller() {
  const canvas = document.getElementById('frame-canvas');
  if (!canvas) return;

  createFrameScroller({
    canvas,
    frameCount: 192,
    desktopPath: '../study-frames/desktop',
    mobilePath: '../study-frames/mobile',
    trigger: '#scroll-runway',
    scrub: 0.5,
    focalPoint: [0.475, 0.5],
  });
}

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
}

// --- Title + overlay fade out on scroll (first 5% of runway) ---
function setupHeroFade() {
  const heroContent = document.querySelector('.hero-content');
  const heroOverlay = document.querySelector('.hero-overlay');
  const heroGlow = document.querySelector('.hero-glow');

  if (!heroContent) return;

  gsap.to(heroContent, {
    autoAlpha: 0,
    scrollTrigger: {
      trigger: '#scroll-runway',
      start: 'top top',
      end: '5% top',
      scrub: true,
    },
  });

  if (heroOverlay) {
    gsap.to(heroOverlay, {
      autoAlpha: 0,
      scrollTrigger: {
        trigger: '#scroll-runway',
        start: 'top top',
        end: '8% top',
        scrub: true,
      },
    });
  }

  if (heroGlow) {
    gsap.to(heroGlow, {
      autoAlpha: 0,
      scrollTrigger: {
        trigger: '#scroll-runway',
        start: 'top top',
        end: '8% top',
        scrub: true,
      },
    });
  }
}

// --- Scroll indicator fade-out (faster than Discovery — 3%) ---
function setupScrollIndicator() {
  const scrollHint = document.querySelector('.scroll-indicator');
  if (!scrollHint) return;

  gsap.to(scrollHint, {
    autoAlpha: 0,
    scrollTrigger: {
      trigger: '#scroll-runway',
      start: 'top top',
      end: '3% top',
      scrub: true,
    },
  });
}

// --- Cards overlay — fades in during last 25% of scroll runway ---
function setupCardsOverlay() {
  const overlay = document.querySelector('.cards-overlay');
  const overlayBg = document.querySelector('.cards-overlay-bg');
  const heading = document.querySelector('.cards-overlay .section-heading');
  const cards = document.querySelectorAll('.nav-card');
  if (!overlay || !cards.length) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#scroll-runway',
      start: '60% top',
      end: '85% top',
      scrub: true,
      onEnter: () => overlay.classList.add('active'),
      onLeaveBack: () => overlay.classList.remove('active'),
    },
  });

  // Soft warm background fades in first
  tl.to(overlayBg, { autoAlpha: 1, duration: 0.25 }, 0);
  tl.to(overlay, { autoAlpha: 1, duration: 0.25 }, 0);

  // Heading appears
  tl.to(heading, { autoAlpha: 1, y: 0, duration: 0.15 }, 0.1);
  gsap.set(heading, { y: 20 });

  // Cards stagger in
  cards.forEach((card, i) => {
    gsap.set(card, { y: 30 });
    tl.to(card, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.2 + i * 0.06);
  });
}

// --- Init ---
function init() {
  setupFrameScroller();
  animateHero();
  setupHeroFade();
  setupScrollIndicator();
  setupCardsOverlay();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
