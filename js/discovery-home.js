// js/discovery-home.js — The Discovery homepage
// GSAP + Lenis smooth scroll, SplitText hero animation, ScrollTrigger card reveals

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


// --- Scroll parallax on hero image ---
function setupScrollParallax() {
  const heroBg = document.querySelector('.hero-bg');
  if (!heroBg) return;

  gsap.to(heroBg, {
    yPercent: -8,
    scale: 0.97,
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
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

// --- Init ---
function init() {
  animateHero();
  setupScrollIndicator();
  setupScrollParallax();
  setupCardReveals();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
