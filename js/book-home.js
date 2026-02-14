// js/book-home.js — Golden Book scroll-driven homepage
// GSAP + Lenis smooth scroll, SplitText cover animation, scroll-driven page flips

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

// --- Cover entrance animation ---
function animateCover() {
  const title = document.querySelector('.cover-title');
  const tagline = document.querySelector('.cover-tagline');
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
      trigger: '.scroll-spacer[data-section="cover"]',
      start: 'top top',
      end: '30% top',
      scrub: true,
    },
  });
}

// --- Page flip animations (scroll-driven) ---
function setupPageFlips() {
  const pages = document.querySelectorAll('.page');
  const flipSections = document.querySelectorAll('.scroll-spacer[data-section^="flip"]');

  flipSections.forEach((section, i) => {
    const page = pages[i];
    if (!page || !section) return;

    const shadow = page.querySelector('.flip-shadow');

    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      pin: document.querySelector('.book-scene'),
      scrub: 0.5,
      onUpdate: (self) => {
        const angle = self.progress * -180;
        gsap.set(page, { rotateY: angle });

        if (shadow) {
          // Shadow peaks at mid-flip (90°), zero at start and end
          const shadowOpacity = Math.sin(self.progress * Math.PI) * 0.15;
          gsap.set(shadow, { opacity: shadowOpacity });
        }
      },
    });
  });
}

// --- Welcome text reveal ---
function setupWelcomeReveal() {
  const welcomeText = document.querySelector('.welcome-text');
  if (!welcomeText) return;

  gsap.from(welcomeText, {
    autoAlpha: 0,
    y: 30,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.scroll-spacer[data-section="welcome"]',
      start: 'top 60%',
      once: true,
    },
  });
}

// --- TOC chapter stagger reveal ---
function setupTocReveals() {
  const chapters = document.querySelectorAll('.toc-chapter');
  if (!chapters.length) return;

  gsap.from(chapters, {
    autoAlpha: 0,
    y: 40,
    duration: 0.6,
    stagger: 0.12,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: '.scroll-spacer[data-section="toc"]',
      start: 'top 70%',
      once: true,
    },
  });
}

// --- Init ---
function init() {
  animateCover();
  setupScrollIndicator();
  setupPageFlips();
  setupWelcomeReveal();
  setupTocReveals();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
